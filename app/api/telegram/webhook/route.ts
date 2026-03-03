import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const WEBAPP_URL = process.env.NEXTREP_WEBAPP_URL ?? '';

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface TelegramChat {
  id: number;
}

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
}

interface TelegramMessage {
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup?: object,
): Promise<void> {
  const body: Record<string, unknown> = { chat_id: chatId, text };
  if (replyMarkup) body.reply_markup = replyMarkup;

  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[telegram] sendMessage failed: ${res.status} ${err}`);
  }
}

// GET – health check so you can confirm the route is deployed
export async function GET() {
  return NextResponse.json({
    ok: true,
    configured: {
      TELEGRAM_BOT_TOKEN: BOT_TOKEN.length > 0,
      NEXTREP_WEBAPP_URL: WEBAPP_URL.length > 0,
    },
  });
}

// POST – Telegram webhook entry point
export async function POST(req: NextRequest) {
  // Fail fast if env vars are missing
  if (!BOT_TOKEN || !WEBAPP_URL) {
    console.error('[telegram] BOT_TOKEN or NEXTREP_WEBAPP_URL not set');
    return new NextResponse('configuration error', { status: 200 }); // 200 to prevent Telegram retries
  }

  let update: TelegramUpdate;
  try {
    update = (await req.json()) as TelegramUpdate;
  } catch {
    console.error('[telegram] invalid JSON body');
    return new NextResponse('bad request', { status: 200 });
  }

  console.log(`[telegram] update ${update.update_id}`);

  // Ignore non-message updates (callback_query, edited_message, etc.)
  const message = update.message;
  if (!message) {
    return new NextResponse('ok', { status: 200 });
  }

  const chatId = message.chat.id;
  const text = (message.text ?? '').trim();
  const firstName = message.from?.first_name ?? 'there';

  if (text.startsWith('/start')) {
    const welcomeText =
      `Hello, ${firstName}! 👋\n\n` +
      `Welcome to NextRep — your smart workout tracker and personal training assistant.\n\n` +
      `Track your workouts, build presets, monitor your progress, and stay consistent.\n\n` +
      `Tap the button below to open the app and start your next session.`;

    const replyMarkup = {
      inline_keyboard: [
        [{ text: 'Open NextRep', web_app: { url: WEBAPP_URL } }],
      ],
    };

    await sendMessage(chatId, welcomeText, replyMarkup);
  } else {
    await sendMessage(chatId, 'Type /start to open NextRep.');
  }

  return new NextResponse('ok', { status: 200 });
}
