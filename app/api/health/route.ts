import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users, exercises } from '@/lib/db/schema';
import { workouts } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      TELEGRAM_BOT_TOKEN: !!process.env.TELEGRAM_BOT_TOKEN,
      NEXT_PUBLIC_DEV_USER_ID: process.env.NEXT_PUBLIC_DEV_USER_ID ?? null,
      NODE_ENV: process.env.NODE_ENV,
    },
  };

  try {
    const db = getDb();
    checks.dbInit = 'ok';

    const tableChecks: Record<string, { exists: boolean; count?: number; error?: string }> = {};

    for (const [name, table] of [
      ['users', users],
      ['exercises', exercises],
      ['workouts', workouts],
    ] as const) {
      try {
        const result = await db.select({ count: sql<number>`count(*)` }).from(table);
        tableChecks[name] = { exists: true, count: Number(result[0]?.count ?? 0) };
      } catch (err) {
        tableChecks[name] = { exists: false, error: String(err) };
      }
    }

    checks.tables = tableChecks;

    const allOk =
      checks.dbInit === 'ok' &&
      Object.values(tableChecks).every((t) => t.exists);

    return NextResponse.json({
      status: allOk ? 'ok' : 'degraded',
      ...checks,
    });
  } catch (err) {
    return NextResponse.json(
      {
        status: 'error',
        dbInit: 'failed',
        dbError: String(err),
        ...checks,
      },
      { status: 500 },
    );
  }
}
