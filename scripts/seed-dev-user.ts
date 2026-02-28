import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users } from '../lib/db/schema/users';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1); }

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

async function main() {
  const existing = await db.select().from(users).limit(1);
  if (existing.length > 0) {
    console.log(`Dev user already exists: ${existing[0].id}`);
    console.log(`Add to .env.local:  NEXT_PUBLIC_DEV_USER_ID=${existing[0].id}`);
    return;
  }

  const [user] = await db.insert(users).values({
    username: 'dev_user',
    firstName: 'Alex',
    lastName: 'Dev',
    telegramUserId: 'dev_000000',
  }).returning();

  console.log(`Created dev user: ${user.id}`);
  console.log(`Add to .env.local:  NEXT_PUBLIC_DEV_USER_ID=${user.id}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
