const TELEGRAM_API = (token: string) =>
  `https://api.telegram.org/bot${token}/sendMessage`;

/**
 * Fire-and-forget Telegram DM. Requires numeric chat_id (= telegram user id).
 */
export function notifyTelegramUser(
  telegramUserId: string | null | undefined,
  text: string,
): void {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !telegramUserId || telegramUserId.startsWith('dev_')) return;

  const chatId = parseInt(telegramUserId, 10);
  if (Number.isNaN(chatId)) return;

  void fetch(TELEGRAM_API(token), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  }).catch((err) => console.error('[telegram notify]', err));
}
