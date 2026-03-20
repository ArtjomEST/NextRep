import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { workoutPresets } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { id: sourcePresetId } = await params;
    if (!sourcePresetId) {
      return NextResponse.json(
        { error: 'Preset ID required' },
        { status: 400 },
      );
    }

    const db = getDb();
    const [source] = await db
      .select()
      .from(workoutPresets)
      .where(eq(workoutPresets.id, sourcePresetId))
      .limit(1);

    if (!source) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    if (source.userId === auth.userId) {
      return NextResponse.json(
        { error: 'Preset is already in your library' },
        { status: 400 },
      );
    }

    const [already] = await db
      .select({ id: workoutPresets.id })
      .from(workoutPresets)
      .where(
        and(
          eq(workoutPresets.userId, auth.userId),
          eq(workoutPresets.savedFromPresetId, sourcePresetId),
        ),
      )
      .limit(1);

    if (already) {
      return NextResponse.json({ error: 'Already saved' }, { status: 400 });
    }

    const exerciseIds = Array.isArray(source.exerciseIds)
      ? (source.exerciseIds as string[])
      : [];

    const [inserted] = await db
      .insert(workoutPresets)
      .values({
        userId: auth.userId,
        name: source.name,
        exerciseIds,
        savedFromPresetId: sourcePresetId,
      })
      .returning({ id: workoutPresets.id });

    if (!inserted) {
      return NextResponse.json(
        { error: 'Failed to save preset' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: { id: inserted.id },
    });
  } catch (err) {
    console.error('POST /api/presets/[id]/save:', err);
    return NextResponse.json(
      { error: 'Failed to save preset', message: String(err) },
      { status: 500 },
    );
  }
}
