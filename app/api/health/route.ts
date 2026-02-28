import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { exercises } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const result = await db.select({ count: sql<number>`count(*)` }).from(exercises);
    const count = Number(result[0]?.count ?? 0);
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      exerciseCount: count,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { status: 'error', db: 'disconnected', message: String(err) },
      { status: 500 },
    );
  }
}
