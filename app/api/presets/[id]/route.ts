import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { workoutPresets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/presets/[id] ────────────────────────────────────

export async function GET(req: NextRequest, { params }: RouteContext) {
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
      return NextResponse.json({ error: 'Preset ID required' }, { status: 400 });
    }

    const db = getDb();
    const [row] = await db
      .select()
      .from(workoutPresets)
      .where(and(eq(workoutPresets.id, id), eq(workoutPresets.userId, auth.userId)))
      .limit(1);

    if (!row) {
      return NextResponse.json(
        { error: 'Preset not found or access denied' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        id: row.id,
        userId: row.userId,
        name: row.name,
        exerciseIds: Array.isArray(row.exerciseIds) ? (row.exerciseIds as string[]) : [],
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
      },
    });
  } catch (err) {
    console.error('GET /api/presets/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch preset' }, { status: 500 });
  }
}

// ─── PUT /api/presets/[id] ────────────────────────────────────

export async function PUT(req: NextRequest, { params }: RouteContext) {
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
      return NextResponse.json({ error: 'Preset ID required' }, { status: 400 });
    }

    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const exerciseIds = Array.isArray(body.exerciseIds)
      ? (body.exerciseIds as unknown[]).filter((eid): eid is string => typeof eid === 'string')
      : [];

    if (!name) {
      return NextResponse.json({ error: 'Preset name is required' }, { status: 400 });
    }

    const db = getDb();
    const [updated] = await db
      .update(workoutPresets)
      .set({ name, exerciseIds, updatedAt: new Date() })
      .where(and(eq(workoutPresets.id, id), eq(workoutPresets.userId, auth.userId)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: 'Preset not found or access denied' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        id: updated.id,
        userId: updated.userId,
        name: updated.name,
        exerciseIds: Array.isArray(updated.exerciseIds) ? (updated.exerciseIds as string[]) : [],
        createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
        updatedAt: updated.updatedAt instanceof Date ? updated.updatedAt.toISOString() : String(updated.updatedAt),
      },
    });
  } catch (err) {
    console.error('PUT /api/presets/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update preset' }, { status: 500 });
  }
}

// ─── DELETE /api/presets/[id] ─────────────────────────────────

export async function DELETE(req: NextRequest, { params }: RouteContext) {
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
      return NextResponse.json({ error: 'Preset ID required' }, { status: 400 });
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
    return NextResponse.json({ error: 'Failed to delete preset' }, { status: 500 });
  }
}
