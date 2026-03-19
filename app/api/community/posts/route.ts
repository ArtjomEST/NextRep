import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { communityPosts, workoutPresets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const o =
      body && typeof body === 'object'
        ? (body as Record<string, unknown>)
        : {};

    const text = typeof o.text === 'string' ? o.text.trim() : '';
    const photoUrl =
      typeof o.photoUrl === 'string' ? o.photoUrl.trim() : '';
    const presetIdRaw =
      typeof o.presetId === 'string' ? o.presetId.trim() : '';

    const hasContent =
      text.length > 0 || photoUrl.length > 0 || presetIdRaw.length > 0;
    if (!hasContent) {
      return NextResponse.json(
        {
          error:
            'At least one of text, photoUrl, or presetId is required',
        },
        { status: 400 },
      );
    }

    let presetId: string | null = null;
    if (presetIdRaw.length > 0) {
      const [preset] = await db
        .select({ id: workoutPresets.id })
        .from(workoutPresets)
        .where(
          and(
            eq(workoutPresets.id, presetIdRaw),
            eq(workoutPresets.userId, auth.userId),
          ),
        )
        .limit(1);
      if (!preset) {
        return NextResponse.json(
          { error: 'Preset not found or not yours' },
          { status: 400 },
        );
      }
      presetId = preset.id;
    }

    const [inserted] = await db
      .insert(communityPosts)
      .values({
        userId: auth.userId,
        text: text.length > 0 ? text : null,
        photoUrl: photoUrl.length > 0 ? photoUrl : null,
        presetId,
      })
      .returning({
        id: communityPosts.id,
        createdAt: communityPosts.createdAt,
      });

    if (!inserted) {
      return NextResponse.json(
        { error: 'Failed to create post' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: {
        id: inserted.id,
        createdAt: inserted.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('POST /api/community/posts:', err);
    return NextResponse.json(
      { error: 'Failed to create post', message: String(err) },
      { status: 500 },
    );
  }
}
