import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { workoutPresets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

// ─── DELETE /api/presets/[id] ─────────────────────────────────

export async function DELETE(
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

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Preset ID required' },
        { status: 400 },
      );
    }

    const db = getDb();
    const deleted = await db
      .delete(workoutPresets)
      .where(and(eq(workoutPresets.id, id), eq(workoutPresets.userId, auth.userId)))
      .returning({ id: workoutPresets.id });

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Preset not found or access denied' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/presets/[id] error:', err);
    return NextResponse.json(
      { error: 'Failed to delete preset' },
      { status: 500 },
    );
  }
}
