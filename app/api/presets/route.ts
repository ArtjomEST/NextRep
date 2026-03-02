import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { workoutPresets } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

export interface PresetPayload {
  id: string;
  userId: string;
  name: string;
  exerciseIds: string[];
  createdAt: string;
}

// ─── GET /api/presets ───────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const db = getDb();
    const rows = await db
      .select()
      .from(workoutPresets)
      .where(eq(workoutPresets.userId, auth.userId))
      .orderBy(desc(workoutPresets.createdAt));

    const data: PresetPayload[] = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.name,
      exerciseIds: Array.isArray(r.exerciseIds) ? (r.exerciseIds as string[]) : [],
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/presets error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch presets' },
      { status: 500 },
    );
  }
}

// ─── POST /api/presets ───────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const exerciseIds = Array.isArray(body.exerciseIds)
      ? (body.exerciseIds as unknown[]).filter((id): id is string => typeof id === 'string')
      : [];

    if (!name) {
      return NextResponse.json(
        { error: 'Preset name is required' },
        { status: 400 },
      );
    }

    const db = getDb();
    const [inserted] = await db
      .insert(workoutPresets)
      .values({
        userId: auth.userId,
        name,
        exerciseIds,
      })
      .returning();

    if (!inserted) {
      return NextResponse.json(
        { error: 'Failed to create preset' },
        { status: 500 },
      );
    }

    const payload: PresetPayload = {
      id: inserted.id,
      userId: inserted.userId,
      name: inserted.name,
      exerciseIds: Array.isArray(inserted.exerciseIds) ? (inserted.exerciseIds as string[]) : [],
      createdAt:
        inserted.createdAt instanceof Date
          ? inserted.createdAt.toISOString()
          : String(inserted.createdAt),
    };

    return NextResponse.json({ data: payload });
  } catch (err) {
    console.error('POST /api/presets error:', err);
    return NextResponse.json(
      { error: 'Failed to create preset' },
      { status: 500 },
    );
  }
}
