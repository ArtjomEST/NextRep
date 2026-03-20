import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { communityPosts, workoutPresets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { buildPostFeedItems } from '@/lib/community/feed-queries';
import type { FeedPostPresetSummary } from '@/lib/api/types';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const db = getDb();
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
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

    const [existing] = await db
      .select({
        id: communityPosts.id,
        userId: communityPosts.userId,
        text: communityPosts.text,
        photoUrl: communityPosts.photoUrl,
        presetId: communityPosts.presetId,
      })
      .from(communityPosts)
      .where(eq(communityPosts.id, id))
      .limit(1);

    if (!existing || existing.userId !== auth.userId) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const patch: Partial<{
      text: string | null;
      photoUrl: string | null;
      presetId: string | null;
    }> = {};

    if ('text' in o) {
      if (o.text === null) {
        patch.text = null;
      } else if (typeof o.text === 'string') {
        const t = o.text.trim();
        patch.text = t.length > 0 ? t : null;
      } else {
        return NextResponse.json({ error: 'Invalid text' }, { status: 400 });
      }
    }

    if ('photoUrl' in o) {
      if (o.photoUrl === null) {
        patch.photoUrl = null;
      } else if (typeof o.photoUrl === 'string') {
        const u = o.photoUrl.trim();
        patch.photoUrl = u.length > 0 ? u : null;
      } else {
        return NextResponse.json(
          { error: 'Invalid photoUrl' },
          { status: 400 },
        );
      }
    }

    if ('presetId' in o) {
      if (o.presetId === null || o.presetId === '') {
        patch.presetId = null;
      } else if (typeof o.presetId === 'string') {
        const raw = o.presetId.trim();
        if (!raw) {
          patch.presetId = null;
        } else {
          const [preset] = await db
            .select({ id: workoutPresets.id })
            .from(workoutPresets)
            .where(
              and(
                eq(workoutPresets.id, raw),
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
          patch.presetId = preset.id;
        }
      } else {
        return NextResponse.json(
          { error: 'Invalid presetId' },
          { status: 400 },
        );
      }
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 },
      );
    }

    const mergedText = patch.text !== undefined ? patch.text : existing.text;
    const mergedPhoto =
      patch.photoUrl !== undefined ? patch.photoUrl : existing.photoUrl;
    const mergedPreset =
      patch.presetId !== undefined ? patch.presetId : existing.presetId;

    const hasContent =
      (mergedText != null && mergedText.length > 0) ||
      (mergedPhoto != null && mergedPhoto.length > 0) ||
      mergedPreset != null;

    if (!hasContent) {
      return NextResponse.json(
        {
          error:
            'Post must have at least one of text, photo, or attached preset',
        },
        { status: 400 },
      );
    }

    await db
      .update(communityPosts)
      .set(patch)
      .where(
        and(
          eq(communityPosts.id, id),
          eq(communityPosts.userId, auth.userId),
        ),
      );

    const rebuilt = await buildPostFeedItems(db, auth.userId, [id]);
    const feedItem = rebuilt.get(id);
    if (!feedItem) {
      return NextResponse.json(
        { error: 'Failed to load updated post' },
        { status: 500 },
      );
    }

    const preset = feedItem.preset as FeedPostPresetSummary | null | undefined;

    return NextResponse.json({
      data: {
        text: feedItem.text as string | null,
        photoUrl: feedItem.photoUrl as string | null,
        preset: preset ?? null,
        savedByMe: Boolean(feedItem.savedByMe),
      },
    });
  } catch (err) {
    console.error('PATCH /api/community/posts/[id]:', err);
    return NextResponse.json(
      { error: 'Failed to update post', message: String(err) },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const db = getDb();
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 });
    }

    const deleted = await db
      .delete(communityPosts)
      .where(
        and(
          eq(communityPosts.id, id),
          eq(communityPosts.userId, auth.userId),
        ),
      )
      .returning({ id: communityPosts.id });

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/community/posts/[id]:', err);
    return NextResponse.json(
      { error: 'Failed to delete post', message: String(err) },
      { status: 500 },
    );
  }
}
