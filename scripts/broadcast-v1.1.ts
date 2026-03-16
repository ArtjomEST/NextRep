import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users, userProfiles } from '../lib/db/schema/users';
import { eq, isNotNull } from 'drizzle-orm';

const DATABASE_URL = process.env.DATABASE_URL;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}
if (!BOT_TOKEN) {
  console.error('TELEGRAM_BOT_TOKEN is required');
  process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const DELAY_MS = 50;

const MESSAGE = `👋 Hey! This is the NextRep team.

Version 1.1 is out 🎉

Here's what's new:

📊 Home screen
— New Weekly Volume Chart replaces the old mini-calendar
— Stats redesigned: 3 cards in a row + full-width Personal Record card

🏋️ During workout
— "Last time" block shows your previous sets for each exercise
— Add or remove exercises during an active workout
— Fixed a bug where the rest timer fired when unchecking a set

Thanks for training with us 💪`;

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

async function sendMessage(chatId: number, text: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const data = (await res.json()) as { ok?: boolean; description?: string };
  if (!res.ok || !data.ok) {
    return { ok: false, error: data.description ?? res.statusText };
  }
  return { ok: true };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const rows = await db
    .select({ telegramUserId: users.telegramUserId })
    .from(userProfiles)
    .innerJoin(users, eq(userProfiles.userId, users.id))
    .where(isNotNull(users.telegramUserId));

  const telegramIds = rows
    .map((r) => r.telegramUserId)
    .filter((id): id is string => id != null && !id.startsWith('dev_'));

  console.log(`Found ${telegramIds.length} users with Telegram IDs (excluding dev).\n`);

  let ok = 0;
  let err = 0;

  for (let i = 0; i < telegramIds.length; i++) {
    const tid = telegramIds[i];
    const chatId = parseInt(tid, 10);
    if (Number.isNaN(chatId)) {
      console.log(`[SKIP] ${tid} (invalid number)`);
      err++;
      continue;
    }

    const result = await sendMessage(chatId, MESSAGE);
    if (result.ok) {
      console.log(`[OK] ${tid}`);
      ok++;
    } else {
      console.error(`[ERR] ${tid} — ${result.error ?? 'unknown'}`);
      err++;
    }

    if (i < telegramIds.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\nDone. Success: ${ok}, Errors: ${err}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
