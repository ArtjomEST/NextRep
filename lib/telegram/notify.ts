const TELEGRAM_API = (token: string) =>
  `https://api.telegram.org/bot${token}/sendMessage`;

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
