import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { exercises } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const db = getDb();
    const { id } = await params;

    const [row] = await db
      .select()
      .from(exercises)
      .where(eq(exercises.id, id))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: 'Exercise not found' },
        { status: 404 },
      );
    }

    const instructions = parseInstructions(row.description, row.howTo);

    return NextResponse.json({
      data: {
        id: row.id,
        name: row.name,
        description: row.description,
        howTo: row.howTo,
        instructions,
        category: row.category,
        primaryMuscles: row.primaryMuscles ?? [],
        secondaryMuscles: row.secondaryMuscles ?? [],
        equipment: row.equipment ?? [],
        measurementType: row.measurementType,
        imageUrl: row.imageUrl,
        images: row.images ?? [],
        source: row.source,
        sourceId: row.sourceId,
      },
    });
  } catch (err) {
    console.error('GET /api/exercises/[id] error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch exercise', message: String(err) },
      { status: 500 },
    );
  }
}

function parseInstructions(
  description: string | null,
  howTo: string | null,
): string[] {
  const source = howTo || description;
  if (!source || source.trim().length === 0) return [];

  const lines = source
    .split(/(?:\r?\n){2,}|(?:\.)\s+(?=[A-Z])/)
    .map((s) => s.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter((s) => s.length > 5);

  if (lines.length > 1) return lines;

  return source
    .split(/\.\s+/)
    .map((s) => s.trim().replace(/\.$/, ''))
    .filter((s) => s.length > 5);
}
