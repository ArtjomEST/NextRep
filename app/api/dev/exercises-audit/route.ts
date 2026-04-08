import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { exercises } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  const db = getDb();

  const [totalRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(exercises);

  const [emptyPrimaryRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(exercises)
    .where(
      sql`primary_muscles IS NULL OR primary_muscles = '[]'::jsonb OR jsonb_array_length(primary_muscles) = 0`
    );

  const [emptySecondaryRow] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(exercises)
    .where(
      sql`secondary_muscles IS NULL OR secondary_muscles = '[]'::jsonb OR jsonb_array_length(secondary_muscles) = 0`
    );

  const examples = await db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .where(
      sql`primary_muscles IS NULL OR primary_muscles = '[]'::jsonb OR jsonb_array_length(primary_muscles) = 0`
    )
    .limit(10);

  return NextResponse.json({
    totalExercises: Number(totalRow.count),
    emptyPrimaryMuscles: Number(emptyPrimaryRow.count),
    emptySecondaryMuscles: Number(emptySecondaryRow.count),
    examplesWithEmptyPrimary: examples,
  });
}
