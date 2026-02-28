import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateTelegramInitData, type TelegramUser } from './telegram';

export interface AuthResult {
  userId: string;
  telegramUser?: TelegramUser;
  mode: 'telegram' | 'dev';
}

/**
 * Authenticate an API request.
 *
 * 1. If x-telegram-init-data header is present and valid → upsert user, return userId.
 * 2. In development, fall back to NEXT_PUBLIC_DEV_USER_ID (verified against DB).
 * 3. In production with no valid initData → return null (caller should 401).
 */
export async function authenticateRequest(
  req: NextRequest,
): Promise<AuthResult | null> {
  const db = getDb();
  const initData = req.headers.get('x-telegram-init-data');

  if (initData) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[auth] TELEGRAM_BOT_TOKEN not set — skipping initData validation in dev');
      } else {
        console.error('[auth] TELEGRAM_BOT_TOKEN not configured in production');
        return null;
      }
    } else {
      const validated = validateTelegramInitData(initData, botToken);
      if (!validated) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[auth] Invalid Telegram initData');
        }
        return null;
      }

      const tgUser = validated.user;
      const telegramId = String(tgUser.id);

      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.telegramUserId, telegramId))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(users)
          .set({
            username: tgUser.username ?? null,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name ?? null,
          })
          .where(eq(users.id, existing[0].id));

        if (process.env.NODE_ENV !== 'production') {
          console.log(`[auth] Telegram auth OK → userId: ${existing[0].id}`);
        }
        return { userId: existing[0].id, telegramUser: tgUser, mode: 'telegram' };
      }

      const [newUser] = await db
        .insert(users)
        .values({
          telegramUserId: telegramId,
          username: tgUser.username ?? null,
          firstName: tgUser.first_name,
          lastName: tgUser.last_name ?? null,
        })
        .returning({ id: users.id });

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[auth] New Telegram user created → userId: ${newUser.id}`);
      }
      return { userId: newUser.id, telegramUser: tgUser, mode: 'telegram' };
    }
  }

  // Dev-only fallback
  if (process.env.NODE_ENV !== 'production') {
    const devUserId = process.env.NEXT_PUBLIC_DEV_USER_ID;
    if (!devUserId) {
      console.error(
        '[auth] NEXT_PUBLIC_DEV_USER_ID not set. Run: npm run seed:dev-user',
      );
      return null;
    }

    try {
      const [row] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, devUserId))
        .limit(1);

      if (!row) {
        console.error(
          `[auth] Dev user ${devUserId} not found in DB. Run: npm run seed:dev-user`,
        );
        return null;
      }
    } catch (err) {
      console.error(`[auth] Failed to verify dev user: ${err}`);
      return null;
    }

    console.log(`[auth] Dev fallback → userId: ${devUserId}`);
    return { userId: devUserId, mode: 'dev' };
  }

  return null;
}
