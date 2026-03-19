import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth/helpers';
import {
  buildPostFeedItems,
  buildWorkoutFeedItems,
  fetchMergedTimelinePage,
  fetchPostFeedPage,
  fetchWorkoutFeedPage,
} from '@/lib/community/feed-queries';

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { searchParams } = req.nextUrl;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);
    const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0);
    const filter = searchParams.get('filter') ?? 'all';
    const followingOnly = filter === 'following';
    const contentType = searchParams.get('type') ?? 'all';
    const type =
      contentType === 'workout' || contentType === 'post' ? contentType : 'all';

    if (type === 'workout') {
      const { workoutIds, total } = await fetchWorkoutFeedPage(
        db,
        auth.userId,
        auth.userId,
        followingOnly,
        limit,
        offset,
      );
      if (workoutIds.length === 0) {
        return NextResponse.json({
          data: [],
          total,
          limit,
          offset,
        });
      }
      const map = await buildWorkoutFeedItems(db, auth.userId, workoutIds);
      const data = workoutIds.map((id) => map.get(id)).filter(Boolean);
      return NextResponse.json({
        data,
        total,
        limit,
        offset,
      });
    }

    if (type === 'post') {
      const { postIds, total } = await fetchPostFeedPage(
        db,
        auth.userId,
        followingOnly,
        limit,
        offset,
      );
      if (postIds.length === 0) {
        return NextResponse.json({
          data: [],
          total,
          limit,
          offset,
        });
      }
      const map = await buildPostFeedItems(db, auth.userId, postIds);
      const data = postIds.map((id) => map.get(id)).filter(Boolean);
      return NextResponse.json({
        data,
        total,
        limit,
        offset,
      });
    }

    const { page, total } = await fetchMergedTimelinePage(
      db,
      auth.userId,
      followingOnly,
      limit,
      offset,
    );

    if (page.length === 0) {
      return NextResponse.json({
        data: [],
        total,
        limit,
        offset,
      });
    }

    const workoutIds = page.filter((p) => p.kind === 'workout').map((p) => p.id);
    const postIds = page.filter((p) => p.kind === 'post').map((p) => p.id);

    const [workoutMap, postMap] = await Promise.all([
      buildWorkoutFeedItems(db, auth.userId, workoutIds),
      buildPostFeedItems(db, auth.userId, postIds),
    ]);

    const data = page
      .map((p) =>
        p.kind === 'workout'
          ? workoutMap.get(p.id)
          : postMap.get(p.id),
      )
      .filter(Boolean);

    return NextResponse.json({
      data,
      total,
      limit,
      offset,
    });
  } catch (err) {
    console.error('GET /api/feed error:', err);
    return NextResponse.json(
      { error: 'Failed to load feed', message: String(err) },
      { status: 500 },
    );
  }
}
