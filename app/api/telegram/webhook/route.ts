import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { userProfiles, starPayments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

interface PreCheckoutQuery {
  id: string;
  from: { id: number };
  currency: string;
  total_amount: number;
  invoice_payload: string;
}

interface SuccessfulPayment {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  telegram_payment_charge_id: string;
  provider_payment_charge_id: string;
}

interface TelegramUpdateExtended extends TelegramUpdate {
  pre_checkout_query?: PreCheckoutQuery;
  message?: TelegramMessage & { successful_payment?: SuccessfulPayment };
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

  let update: TelegramUpdateExtended;
  try {
    update = (await req.json()) as TelegramUpdateExtended;
  } catch {
    console.error('[telegram] invalid JSON body');
    return new NextResponse('bad request', { status: 200 });
  }

  console.log(`[telegram] update ${update.update_id}`);

  // Подтверждаем pre-checkout (всегда ok для Stars)
  if (update.pre_checkout_query) {
    const pcq = update.pre_checkout_query;
    await fetch(`${TELEGRAM_API}/answerPreCheckoutQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pre_checkout_query_id: pcq.id, ok: true }),
    });
    return new NextResponse('ok', { status: 200 });
  }

  // Ignore non-message updates (callback_query, edited_message, etc.)
  const message = update.message;
  if (!message) {
    return new NextResponse('ok', { status: 200 });
  }

  // Обработка успешной оплаты Stars
  if (message.successful_payment) {
    const sp = message.successful_payment;
    const userId = sp.invoice_payload;
    const telegramPaymentId = sp.telegram_payment_charge_id;

    try {
      const db = getDb();

      const [existing] = await db
        .select({ id: starPayments.id })
        .from(starPayments)
        .where(eq(starPayments.telegramPaymentId, telegramPaymentId))
        .limit(1);

      if (!existing) {
        await db.insert(starPayments).values({
          userId,
          telegramPaymentId,
          amount: sp.total_amount,
          status: 'completed',
          completedAt: new Date(),
        });

        const [profile] = await db
          .select({ proExpiresAt: userProfiles.proExpiresAt })
          .from(userProfiles)
          .where(eq(userProfiles.userId, userId))
          .limit(1);

        const baseDate = (profile?.proExpiresAt && profile.proExpiresAt > new Date())
          ? profile.proExpiresAt
          : new Date();

        const proExpiresAt = new Date(baseDate);
        proExpiresAt.setDate(proExpiresAt.getDate() + 30);

        await db.update(userProfiles).set({
          proExpiresAt,
          proSource: 'stars',
        }).where(eq(userProfiles.userId, userId));

        console.log(`[webhook] PRO activated for userId=${userId} until ${proExpiresAt.toISOString()}`);
      }
    } catch (err) {
      console.error('[webhook] successful_payment processing error:', err);
      // Возвращаем 200 в любом случае — Telegram не должен ретраить
    }

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
