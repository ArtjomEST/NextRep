const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

const TELEGRAM_API = (token: string) =>
  `https://api.telegram.org/bot${token}/sendMessage`;

export async function sendRestEndedMessage(telegramUserId: string): Promise<number | null> {
  const res = await fetch(`${BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramUserId,
      text: '⏱ Rest time is up!\n\nTime to get back to your workout 💪',
    }),
  });
  const data = await res.json();
  if (data.ok) return data.result.message_id as number;
  console.error('sendMessage failed:', data);
  return null;
}

export async function deleteMessage(telegramUserId: string, messageId: number): Promise<void> {
  await fetch(`${BASE}/deleteMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramUserId,
      message_id: messageId,
    }),
  });
}

function truncateCommentPreview(text: string): string {
  const t = text.trim();
  return t.length <= 60 ? t : `${t.slice(0, 60)}...`;
}

/**
 * Fire-and-forget Telegram DM. Requires numeric chat_id (= telegram user id).
 */
function sendTelegramMessage(
  telegramUserId: string | null | undefined,
  text: string,
): void {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token || !telegramUserId || telegramUserId.startsWith('dev_')) return;

    const chatId = parseInt(telegramUserId, 10);
    if (Number.isNaN(chatId)) return;

    void fetch(TELEGRAM_API(token), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    }).catch((err) => console.error('[telegram notify]', err));
  } catch (err) {
    console.error('[telegram notify]', err);
  }
}

export function notifyWorkoutLiked(args: {
  actorId: string;
  recipientId: string;
  recipientTelegramUserId: string | null | undefined;
  firstName: string | null | undefined;
  workoutName: string;
}): void {
  if (args.actorId === args.recipientId) return;
  const firstName = args.firstName?.trim() ?? '';
  sendTelegramMessage(
    args.recipientTelegramUserId,
    `💪 ${firstName} liked your workout "${args.workoutName}"`,
  );
}

export function notifyWorkoutCommented(args: {
  actorId: string;
  recipientId: string;
  recipientTelegramUserId: string | null | undefined;
  firstName: string | null | undefined;
  workoutName: string;
  commentText: string;
}): void {
  if (args.actorId === args.recipientId) return;
  const firstName = args.firstName?.trim() ?? '';
  const preview = truncateCommentPreview(args.commentText);
  sendTelegramMessage(
    args.recipientTelegramUserId,
    `💬 ${firstName} commented on your workout "${args.workoutName}":\n"${preview}"`,
  );
}

export function notifyNewFollower(args: {
  actorId: string;
  recipientId: string;
  recipientTelegramUserId: string | null | undefined;
  firstName: string | null | undefined;
}): void {
  if (args.actorId === args.recipientId) return;
  const firstName = args.firstName?.trim() ?? '';
  sendTelegramMessage(
    args.recipientTelegramUserId,
    `➕ ${firstName} started following you`,
  );
}

export function notifyPostLiked(args: {
  actorId: string;
  recipientId: string;
  recipientTelegramUserId: string | null | undefined;
  firstName: string | null | undefined;
}): void {
  if (args.actorId === args.recipientId) return;
  const firstName = args.firstName?.trim() ?? '';
  sendTelegramMessage(
    args.recipientTelegramUserId,
    `💪 ${firstName} liked your post`,
  );
}

export function notifyTrialActivated(
  telegramUserId: string | null,
  trialEndsAt: Date,
): void {
  sendTelegramMessage(
    telegramUserId,
    `🎉 Your 7-day NextRep PRO trial is now active!\n\nEnjoy full access to AI analysis, Muscle Map, AI Coach, and unlimited presets.\n\nTrial ends: ${trialEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`,
  );
}

export function notifyPostCommented(args: {
  actorId: string;
  recipientId: string;
  recipientTelegramUserId: string | null | undefined;
  firstName: string | null | undefined;
  commentText: string;
}): void {
  if (args.actorId === args.recipientId) return;
  const firstName = args.firstName?.trim() ?? '';
  const preview = truncateCommentPreview(args.commentText);
  sendTelegramMessage(
    args.recipientTelegramUserId,
    `💬 ${firstName} commented: ${preview}`,
  );
}

/**
 * Sends weekly report message to a free user with a PRO upsell inline button.
 * Returns true on success.
 */
export async function sendWeeklyReportFree(
  telegramUserId: string,
  text: string,
  miniAppUrl: string,
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || telegramUserId.startsWith('dev_')) return false;

  const res = await fetch(`${BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramUserId,
      text,
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [[
          {
            text: 'Unlock PRO →',
            web_app: { url: miniAppUrl },
          },
        ]],
      },
    }),
  });

  const data = await res.json() as { ok: boolean };
  if (!data.ok) console.error('[weekly-report] sendMessage failed for', telegramUserId, data);
  return data.ok;
}

/**
 * Sends weekly report to a PRO user as two messages:
 * 1. sendPhoto with a short caption (≤200 chars)
 * 2. sendMessage with the full report text
 * Returns true if both succeed.
 */
export async function sendWeeklyReportPro(
  telegramUserId: string,
  fullReportText: string,
  caption: string,
  pngBuffer: Buffer,
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || telegramUserId.startsWith('dev_')) return false;

  const shortCaption = caption;

  const form = new FormData();
  form.append('chat_id', telegramUserId);
  form.append('photo', new Blob([pngBuffer.buffer as ArrayBuffer], { type: 'image/png' }), 'muscle-map.png');
  form.append('caption', shortCaption);

  const photoRes = await fetch(`${BASE}/sendPhoto`, {
    method: 'POST',
    body: form,
  });
  const photoData = await photoRes.json() as { ok: boolean };
  if (!photoData.ok) {
    console.error('[weekly-report] sendPhoto failed for', telegramUserId, photoData);
    return false;
  }

  const msgRes = await fetch(`${BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramUserId,
      text: fullReportText,
      parse_mode: 'HTML',
    }),
  });
  const msgData = await msgRes.json() as { ok: boolean };
  if (!msgData.ok) console.error('[weekly-report] sendMessage failed for', telegramUserId, msgData);
  return msgData.ok;
}
