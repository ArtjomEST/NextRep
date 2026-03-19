import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  workouts,
  users,
  follows,
  workoutExercises,
  workoutSets,
  exercises,
  workoutLikes,
  workoutComments,
} from '@/lib/db/schema';
import {
  eq,
  and,
  asc,
  desc,
  inArray,
  isNotNull,
  count as drizzleCount,
} from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { displayUserName } from '@/lib/users/display';
import { workoutHasPersonalRecord } from '@/lib/community/workoutPr';

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

    const publicCompletedWhere = and(
      eq(workouts.isPublic, true),
      isNotNull(workouts.endedAt),
    );

    const feedSelect = {
      workoutId: workouts.id,
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      username: users.username,
      avatarUrl: users.avatarUrl,
      name: workouts.name,
      endedAt: workouts.endedAt,
      createdAt: workouts.createdAt,
      durationSec: workouts.durationSec,
      totalVolume: workouts.totalVolume,
      totalSets: workouts.totalSets,
      photoUrl: workouts.photoUrl,
    };

    const feedRows = followingOnly
      ? await db
          .select(feedSelect)
          .from(workouts)
          .innerJoin(users, eq(workouts.userId, users.id))
          .innerJoin(
            follows,
            and(
              eq(follows.followingId, workouts.userId),
              eq(follows.followerId, auth.userId),
            ),
          )
          .where(publicCompletedWhere)
          .orderBy(desc(workouts.endedAt))
          .limit(limit)
          .offset(offset)
      : await db
          .select(feedSelect)
          .from(workouts)
          .innerJoin(users, eq(workouts.userId, users.id))
          .where(publicCompletedWhere)
          .orderBy(desc(workouts.endedAt))
          .limit(limit)
          .offset(offset);

    const [exactTotal] = followingOnly
      ? await db
          .select({ c: drizzleCount() })
          .from(workouts)
          .innerJoin(
            follows,
            and(
              eq(follows.followingId, workouts.userId),
              eq(follows.followerId, auth.userId),
            ),
          )
          .where(publicCompletedWhere)
      : await db
          .select({ c: drizzleCount() })
          .from(workouts)
          .where(publicCompletedWhere);

    const totalCount = Number(exactTotal?.c ?? 0);

    const workoutIds = feedRows.map((r) => r.workoutId);

    if (workoutIds.length === 0) {
      return NextResponse.json({
        data: [],
        total: totalCount,
        limit,
        offset,
      });
    }

    const [likeAgg, commentAgg, myLikesRows] = await Promise.all([
      db
        .select({
          workoutId: workoutLikes.workoutId,
          c: drizzleCount(),
        })
        .from(workoutLikes)
        .where(inArray(workoutLikes.workoutId, workoutIds))
        .groupBy(workoutLikes.workoutId),
      db
        .select({
          workoutId: workoutComments.workoutId,
          c: drizzleCount(),
        })
        .from(workoutComments)
        .where(inArray(workoutComments.workoutId, workoutIds))
        .groupBy(workoutComments.workoutId),
      db
        .select({ workoutId: workoutLikes.workoutId })
        .from(workoutLikes)
        .where(
          and(
            eq(workoutLikes.userId, auth.userId),
            inArray(workoutLikes.workoutId, workoutIds),
          ),
        ),
    ]);

    const likeCountMap = new Map(likeAgg.map((x) => [x.workoutId, Number(x.c)]));
    const commentCountMap = new Map(
      commentAgg.map((x) => [x.workoutId, Number(x.c)]),
    );
    const likedSet = new Set(myLikesRows.map((r) => r.workoutId));

    const weRows = await db
      .select({
        workoutId: workoutExercises.workoutId,
        weId: workoutExercises.id,
        order: workoutExercises.order,
        exerciseName: exercises.name,
        imageUrl: exercises.imageUrl,
      })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(inArray(workoutExercises.workoutId, workoutIds))
      .orderBy(workoutExercises.workoutId, asc(workoutExercises.order));

    const weIds = weRows.map((r) => r.weId);
    const setRows =
      weIds.length > 0
        ? await db
            .select({
              workoutExerciseId: workoutSets.workoutExerciseId,
              completed: workoutSets.completed,
            })
            .from(workoutSets)
            .where(inArray(workoutSets.workoutExerciseId, weIds))
        : [];

    const completedByWe = new Map<string, number>();
    for (const s of setRows) {
      if (!s.completed) continue;
      completedByWe.set(
        s.workoutExerciseId,
        (completedByWe.get(s.workoutExerciseId) ?? 0) + 1,
      );
    }

    const logByWorkout = new Map<
      string,
      Array<{
        exerciseName: string;
        exerciseImageUrl: string | null;
        completedSets: number;
      }>
    >();
    for (const r of weRows) {
      const n = completedByWe.get(r.weId) ?? 0;
      if (n === 0) continue;
      const arr = logByWorkout.get(r.workoutId) ?? [];
      arr.push({
        exerciseName: r.exerciseName,
        exerciseImageUrl: r.imageUrl,
        completedSets: n,
      });
      logByWorkout.set(r.workoutId, arr);
    }

    const commentRows = await db
      .select({
        id: workoutComments.id,
        workoutId: workoutComments.workoutId,
        text: workoutComments.text,
        createdAt: workoutComments.createdAt,
        authorId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(workoutComments)
      .innerJoin(users, eq(workoutComments.userId, users.id))
      .where(inArray(workoutComments.workoutId, workoutIds))
      .orderBy(workoutComments.workoutId, desc(workoutComments.createdAt));

    const previewsByWorkout = new Map<
      string,
      Array<{
        id: string;
        userId: string;
        userName: string;
        userAvatarUrl: string | null;
        text: string;
        createdAt: string;
      }>
    >();
    for (const c of commentRows) {
      const arr = previewsByWorkout.get(c.workoutId) ?? [];
      if (arr.length >= 2) continue;
      arr.push({
        id: c.id,
        userId: c.authorId,
        userName: displayUserName({
          firstName: c.firstName,
          lastName: c.lastName,
          username: c.username,
        }),
        userAvatarUrl: c.avatarUrl,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
      });
      previewsByWorkout.set(c.workoutId, arr);
    }

    const hasPrByWorkout: Record<string, boolean> = {};
    await Promise.all(
      workoutIds.map(async (id) => {
        hasPrByWorkout[id] = await workoutHasPersonalRecord(db, id);
      }),
    );

    const data = feedRows.map((r) => ({
      workoutId: r.workoutId,
      user: {
        id: r.userId,
        name: displayUserName({
          firstName: r.firstName,
          lastName: r.lastName,
          username: r.username,
        }),
        avatarUrl: r.avatarUrl,
      },
      postedAt: (r.endedAt ?? r.createdAt).toISOString(),
      name: r.name,
      durationSec: r.durationSec,
      totalVolume: Number(r.totalVolume ?? 0),
      totalSets: r.totalSets ?? 0,
      hasPr: hasPrByWorkout[r.workoutId] ?? false,
      photoUrl: r.photoUrl,
      likeCount: likeCountMap.get(r.workoutId) ?? 0,
      commentCount: commentCountMap.get(r.workoutId) ?? 0,
      likedByMe: likedSet.has(r.workoutId),
      log: logByWorkout.get(r.workoutId) ?? [],
      commentPreviews: previewsByWorkout.get(r.workoutId) ?? [],
    }));

    return NextResponse.json({
      data,
      total: totalCount,
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
