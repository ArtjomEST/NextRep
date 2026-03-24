import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { workoutPresets } from '@/lib/db/schema';
import { authenticateRequest } from '@/lib/auth/helpers';
import { fetchPresetExercisePreviewsByIds } from '@/lib/community/preset-exercise-preview';

type RouteContext = { params: Promise<{ presetId: string }> };

/** GET /api/community/presets/[presetId] — exercise list for any preset (community preview / lazy fill). */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest(_req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { presetId } = await params;
    if (!presetId) {
      return NextResponse.json({ error: 'Preset ID required' }, { status: 400 });
    }

    const db = getDb();
    const [row] = await db
      .select({
        id: workoutPresets.id,
        exerciseIds: workoutPresets.exerciseIds,
      })
      .from(workoutPresets)
      .where(eq(workoutPresets.id, presetId))
      .limit(1);

    if (!row) {
      return NextResponse.json({ error: 'Preset not found' }, { status: 404 });
    }

    const orderedIds = Array.isArray(row.exerciseIds)
      ? (row.exerciseIds as string[]).filter((x) => typeof x === 'string')
      : [];

    const exercises = await fetchPresetExercisePreviewsByIds(db, orderedIds);

    return NextResponse.json({
      data: {
        presetId: row.id,
        exercises,
      },
    });
  } catch (err) {
    console.error('GET /api/community/presets/[presetId] error:', err);
    return NextResponse.json(
      { error: 'Failed to load preset exercises' },
      { status: 500 },
    );
  }
}
