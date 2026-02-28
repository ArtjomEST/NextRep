import { createHmac } from 'crypto';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

export interface ValidatedInitData {
  user: TelegramUser;
  authDate: number;
  hash: string;
}

/**
 * Validates Telegram WebApp initData using HMAC-SHA256.
 *
 * Algorithm (per Telegram docs):
 *   secret_key = HMAC-SHA256(key="WebAppData", data=bot_token)
 *   data_check_string = sorted key=value pairs (excluding hash) joined by '\n'
 *   expected = hex(HMAC-SHA256(key=secret_key, data=data_check_string))
 */
export function validateTelegramInitData(
  initData: string,
  botToken: string,
): ValidatedInitData | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return null;

    const entries: [string, string][] = [];
    for (const [key, value] of params.entries()) {
      if (key !== 'hash') entries.push([key, value]);
    }
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

    const secretKey = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const computedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash !== hash) return null;

    const userStr = params.get('user');
    if (!userStr) return null;

    const user = JSON.parse(userStr) as TelegramUser;
    const authDate = parseInt(params.get('auth_date') ?? '0', 10);

    return { user, authDate, hash };
  } catch {
    return null;
  }
}
