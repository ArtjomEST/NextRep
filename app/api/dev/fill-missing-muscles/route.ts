/**
 * One-time dev endpoint to fill missing primary/secondary muscles on exercises via OpenAI.
 *
 * Protected by x-dev-secret header matching DEV_SECRET env var.
 * Processes all exercises where primary_muscles OR secondary_muscles is null/empty.
 * Rules:
 *   - primary already set → only fills secondary
 *   - both empty         → fills both
 *   - validated against allowed muscle list; invalid values are dropped
 *
 * Usage:
 *   curl -X POST https://your-app.vercel.app/api/dev/fill-missing-muscles \
 *     -H "x-dev-secret: <DEV_SECRET>"
 */

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { exercises } from '@/lib/db/schema';
import { sql, or, isNull } from 'drizzle-orm';
import { openaiChatCompletion } from '@/lib/ai/openai';

const DEV_SECRET = process.env.DEV_SECRET;

const ALLOWED_MUSCLES = new Set([
  'chest', 'biceps', 'triceps', 'back', 'frontDelts', 'rearDelts', 'shoulders',
  'abs', 'obliques', 'lowerBack', 'traps', 'forearms', 'quads', 'hamstrings',
  'glutes', 'calves', 'adductors', 'abductors',
]);

const SYSTEM_PROMPT =
  'You are a fitness expert. Given an exercise name, return which muscle groups it trains. ' +
  'Use ONLY values from this list: chest, biceps, triceps, back, frontDelts, rearDelts, shoulders, ' +
  'abs, obliques, lowerBack, traps, forearms, quads, hamstrings, glutes, calves, adductors, abductors. ' +
  'Return strict JSON only: { primary_muscles: string[], secondary_muscles: string[] }. ' +
  'If an exercise truly has no secondary muscles, return empty array. ' +
  'For cardio/endurance exercises, return the muscles most involved. ' +
  'Never invent muscles outside the provided list.';

function isEmpty(arr: string[] | null | undefined): boolean {
  return !arr || arr.length === 0;
}

function validateMuscles(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((m): m is string => typeof m === 'string' && ALLOWED_MUSCLES.has(m));
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface LogEntry {
  id: string;
  name: string;
  status: 'updated' | 'failed' | 'skipped';
  before: { primary: string[] | null; secondary: string[] | null };
  after: { primary: string[] | null; secondary: string[] | null };
  error?: string;
}

export async function POST(req: Request) {
  if (!DEV_SECRET) {
    return NextResponse.json({ error: 'DEV_SECRET env var not configured' }, { status: 500 });
  }
  if (req.headers.get('x-dev-secret') !== DEV_SECRET) {
    return NextResponse.json({ error: 'Invalid or missing x-dev-secret header' }, { status: 401 });
  }

  const db = getDb();

  // Fetch all exercises with at least one empty muscle field
  const rows = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      primaryMuscles: exercises.primaryMuscles,
      secondaryMuscles: exercises.secondaryMuscles,
    })
    .from(exercises)
    .where(
      or(
        isNull(exercises.primaryMuscles),
        isNull(exercises.secondaryMuscles),
        sql`primary_muscles = '[]'::jsonb`,
        sql`secondary_muscles = '[]'::jsonb`,
        sql`jsonb_array_length(primary_muscles) = 0`,
        sql`jsonb_array_length(secondary_muscles) = 0`,
      )
    );

  const log: LogEntry[] = [];
  let updated = 0;
  let failed = 0;
  let skipped = 0;

  const BATCH_SIZE = 10;
  const BATCH_DELAY_MS = 500;

  for (let batchStart = 0; batchStart < rows.length; batchStart += BATCH_SIZE) {
    const batch = rows.slice(batchStart, batchStart + BATCH_SIZE);

    for (const row of batch) {
      const primaryEmpty = isEmpty(row.primaryMuscles);
      const secondaryEmpty = isEmpty(row.secondaryMuscles);

      if (!primaryEmpty && !secondaryEmpty) {
        skipped++;
        log.push({
          id: row.id, name: row.name, status: 'skipped',
          before: { primary: row.primaryMuscles ?? null, secondary: row.secondaryMuscles ?? null },
          after: { primary: row.primaryMuscles ?? null, secondary: row.secondaryMuscles ?? null },
        });
        continue;
      }

      try {
        const raw = await openaiChatCompletion({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: row.name },
          ],
          responseFormatJsonObject: true,
          temperature: 0,
          maxTokens: 200,
        });

        const parsed = JSON.parse(raw) as Record<string, unknown>;
        const aiPrimary = validateMuscles(parsed.primary_muscles);
        const aiSecondary = validateMuscles(parsed.secondary_muscles);

        const newPrimary = primaryEmpty ? aiPrimary : (row.primaryMuscles ?? []);
        const newSecondary = secondaryEmpty ? aiSecondary : (row.secondaryMuscles ?? []);

        await db
          .update(exercises)
          .set({ primaryMuscles: newPrimary, secondaryMuscles: newSecondary })
          .where(sql`id = ${row.id}`);

        updated++;
        log.push({
          id: row.id, name: row.name, status: 'updated',
          before: { primary: row.primaryMuscles ?? null, secondary: row.secondaryMuscles ?? null },
          after: { primary: newPrimary, secondary: newSecondary },
        });
      } catch (err) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        log.push({
          id: row.id, name: row.name, status: 'failed',
          before: { primary: row.primaryMuscles ?? null, secondary: row.secondaryMuscles ?? null },
          after: { primary: null, secondary: null },
          error: message,
        });
      }
    }

    if (batchStart + BATCH_SIZE < rows.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  return NextResponse.json({
    summary: {
      total: rows.length,
      updated,
      failed,
      skipped,
    },
    log,
  });
}
