import {
  eq,
  and,
  asc,
  desc,
  inArray,
  isNotNull,
  count as drizzleCount,
} from 'drizzle-orm';
import type { Database } from '@/lib/db';
import {
  workouts,
  users,
  follows,
  workoutExercises,
  workoutSets,
  exercises,
  workoutLikes,
  workoutComments,
  communityPosts,
  postLikes,
  postComments,
  workoutPresets,
} from '@/lib/db/schema';
import { displayUserName } from '@/lib/users/display';
import { workoutHasPersonalRecord } from '@/lib/community/workoutPr';
import {
  aggregateMusclesFromExercises,
  type ExerciseMuscleInput,
} from '@/lib/utils/muscleAggregator';
import { buildPresetExercisePreviewsFromRows } from '@/lib/community/preset-exercise-preview';

export type MergeTimelineRow = { kind: 'workout' | 'post'; id: string };

export async function fetchMergedTimelinePage(
  db: Database,
  userId: string,
  followingOnly: boolean,
  limit: number,
  offset: number,
): Promise<{ page: MergeTimelineRow[]; total: number }> {
  const sql = db.$client;

  const pageRows = followingOnly
    ? await sql`
        SELECT kind, item_id FROM (
          SELECT 'workout'::text AS kind, w.id::text AS item_id, COALESCE(w.ended_at, w.created_at) AS sort_at
          FROM workouts w
          INNER JOIN follows f ON f.following_id = w.user_id AND f.follower_id = ${userId}
          WHERE w.is_public = true AND w.ended_at IS NOT NULL
          UNION ALL
          SELECT 'post'::text AS kind, p.id::text AS item_id, p.created_at AS sort_at
          FROM community_posts p
          INNER JOIN follows f2 ON f2.following_id = p.user_id AND f2.follower_id = ${userId}
        ) sub
        ORDER BY sub.sort_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    : await sql`
        SELECT kind, item_id FROM (
          SELECT 'workout'::text AS kind, w.id::text AS item_id, COALESCE(w.ended_at, w.created_at) AS sort_at
          FROM workouts w
          WHERE w.is_public = true AND w.ended_at IS NOT NULL
          UNION ALL
          SELECT 'post'::text AS kind, p.id::text AS item_id, p.created_at AS sort_at
          FROM community_posts p
        ) sub
        ORDER BY sub.sort_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

  const countRows = followingOnly
    ? await sql`
        SELECT (
          (SELECT COUNT(*)::int FROM workouts w
            INNER JOIN follows f ON f.following_id = w.user_id AND f.follower_id = ${userId}
            WHERE w.is_public = true AND w.ended_at IS NOT NULL)
          +
          (SELECT COUNT(*)::int FROM community_posts p
            INNER JOIN follows f2 ON f2.following_id = p.user_id AND f2.follower_id = ${userId})
        ) AS total
      `
    : await sql`
        SELECT (
          (SELECT COUNT(*)::int FROM workouts w WHERE w.is_public = true AND w.ended_at IS NOT NULL)
          +
          (SELECT COUNT(*)::int FROM community_posts p)
        ) AS total
      `;

  const rows = pageRows as unknown as { kind: string; item_id: string }[];
  const page: MergeTimelineRow[] = rows.map((r) => ({
    kind: r.kind === 'post' ? 'post' : 'workout',
    id: r.item_id,
  }));

  const totalRow = countRows as unknown as { total: number }[];
  const total = Number(totalRow[0]?.total ?? 0);

  return { page, total };
}

function exerciseNamesFromIds(
  orderedIds: string[],
  nameById: Map<string, string>,
  max = 3,
): string[] {
  const out: string[] = [];
  for (const id of orderedIds) {
    if (out.length >= max) break;
    const n = nameById.get(id);
    if (n) out.push(n);
  }
  return out;
}

/** Aggregate unique primary muscles from all preset exercises, then secondary (excluding primaries). */
function musclesForPresetPost(
  orderedIds: string[],
  meta: Map<string, { primaryMuscles: string[]; secondaryMuscles: string[] }>,
): { primary: string[]; secondary: string[] } {
  const seenP = new Set<string>();
  const primary: string[] = [];
  for (const id of orderedIds) {
    const ex = meta.get(id);
    if (!ex) continue;
    for (const m of ex.primaryMuscles) {
      if (m && !seenP.has(m)) {
        seenP.add(m);
        primary.push(m);
      }
    }
  }
  const primarySet = new Set(primary);
  const seenS = new Set<string>();
  const secondary: string[] = [];
  for (const id of orderedIds) {
    const ex = meta.get(id);
    if (!ex) continue;
    for (const m of ex.secondaryMuscles) {
      if (m && !primarySet.has(m) && !seenS.has(m)) {
        seenS.add(m);
        secondary.push(m);
      }
    }
  }
  return { primary, secondary };
}

export async function buildWorkoutFeedItems(
  db: Database,
  authUserId: string,
  workoutIds: string[],
): Promise<Map<string, Record<string, unknown>>> {
  const out = new Map<string, Record<string, unknown>>();
  if (workoutIds.length === 0) return out;

  const feedRows = await db
    .select({
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
    })
    .from(workouts)
    .innerJoin(users, eq(workouts.userId, users.id))
    .where(inArray(workouts.id, workoutIds));

  const rowById = new Map(feedRows.map((r) => [r.workoutId, r]));

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
          eq(workoutLikes.userId, authUserId),
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
      primaryMuscles: exercises.primaryMuscles,
      secondaryMuscles: exercises.secondaryMuscles,
    })
    .from(workoutExercises)
    .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
    .where(inArray(workoutExercises.workoutId, workoutIds))
    .orderBy(workoutExercises.workoutId, asc(workoutExercises.order));

  const muscleInputsByWorkout = new Map<string, ExerciseMuscleInput[]>();
  for (const r of weRows) {
    const arr = muscleInputsByWorkout.get(r.workoutId) ?? [];
    arr.push({
      primaryMuscles: Array.isArray(r.primaryMuscles) ? r.primaryMuscles : [],
      secondaryMuscles: Array.isArray(r.secondaryMuscles)
        ? r.secondaryMuscles
        : [],
    });
    muscleInputsByWorkout.set(r.workoutId, arr);
  }

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

  for (const id of workoutIds) {
    const r = rowById.get(id);
    if (!r) continue;
    const agg = aggregateMusclesFromExercises(
      muscleInputsByWorkout.get(r.workoutId) ?? [],
    );
    out.set(id, {
      type: 'workout',
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
      muscleSummary: {
        primary: agg.primaryMuscles,
        secondary: agg.secondaryMuscles,
      },
      likeCount: likeCountMap.get(r.workoutId) ?? 0,
      commentCount: commentCountMap.get(r.workoutId) ?? 0,
      likedByMe: likedSet.has(r.workoutId),
      log: logByWorkout.get(r.workoutId) ?? [],
      commentPreviews: previewsByWorkout.get(r.workoutId) ?? [],
    });
  }

  return out;
}

export async function buildPostFeedItems(
  db: Database,
  authUserId: string,
  postIds: string[],
): Promise<Map<string, Record<string, unknown>>> {
  const out = new Map<string, Record<string, unknown>>();
  if (postIds.length === 0) return out;

  const postRows = await db
    .select({
      postId: communityPosts.id,
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      username: users.username,
      avatarUrl: users.avatarUrl,
      text: communityPosts.text,
      photoUrl: communityPosts.photoUrl,
      presetId: communityPosts.presetId,
      createdAt: communityPosts.createdAt,
      presetName: workoutPresets.name,
      presetExerciseIds: workoutPresets.exerciseIds,
    })
    .from(communityPosts)
    .innerJoin(users, eq(communityPosts.userId, users.id))
    .leftJoin(workoutPresets, eq(communityPosts.presetId, workoutPresets.id))
    .where(inArray(communityPosts.id, postIds));

  const rowById = new Map(postRows.map((r) => [r.postId, r]));

  const [likeAgg, commentAgg, myLikesRows] = await Promise.all([
    db
      .select({
        postId: postLikes.postId,
        c: drizzleCount(),
      })
      .from(postLikes)
      .where(inArray(postLikes.postId, postIds))
      .groupBy(postLikes.postId),
    db
      .select({
        postId: postComments.postId,
        c: drizzleCount(),
      })
      .from(postComments)
      .where(inArray(postComments.postId, postIds))
      .groupBy(postComments.postId),
    db
      .select({ postId: postLikes.postId })
      .from(postLikes)
      .where(
        and(
          eq(postLikes.userId, authUserId),
          inArray(postLikes.postId, postIds),
        ),
      ),
  ]);

  const likeCountMap = new Map(likeAgg.map((x) => [x.postId, Number(x.c)]));
  const commentCountMap = new Map(
    commentAgg.map((x) => [x.postId, Number(x.c)]),
  );
  const likedSet = new Set(myLikesRows.map((r) => r.postId));

  const commentRows = await db
    .select({
      id: postComments.id,
      postId: postComments.postId,
      text: postComments.text,
      createdAt: postComments.createdAt,
      authorId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      username: users.username,
      avatarUrl: users.avatarUrl,
    })
    .from(postComments)
    .innerJoin(users, eq(postComments.userId, users.id))
    .where(inArray(postComments.postId, postIds))
    .orderBy(postComments.postId, desc(postComments.createdAt));

  const previewsByPost = new Map<
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
    const arr = previewsByPost.get(c.postId) ?? [];
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
    previewsByPost.set(c.postId, arr);
  }

  const allExerciseIds = new Set<string>();
  for (const r of postRows) {
    if (!r.presetId || !Array.isArray(r.presetExerciseIds)) continue;
    for (const eid of r.presetExerciseIds as string[]) {
      if (typeof eid === 'string') allExerciseIds.add(eid);
    }
  }

  const exerciseIdList = [...allExerciseIds];
  const exRows =
    exerciseIdList.length > 0
      ? await db
          .select({
            id: exercises.id,
            name: exercises.name,
            imageUrl: exercises.imageUrl,
            primaryMuscles: exercises.primaryMuscles,
            secondaryMuscles: exercises.secondaryMuscles,
          })
          .from(exercises)
          .where(inArray(exercises.id, exerciseIdList))
      : [];
  const nameById = new Map(exRows.map((e) => [e.id, e.name]));
  const exerciseMetaById = new Map(
    exRows.map((e) => [
      e.id,
      {
        primaryMuscles: Array.isArray(e.primaryMuscles) ? e.primaryMuscles : [],
        secondaryMuscles: Array.isArray(e.secondaryMuscles)
          ? e.secondaryMuscles
          : [],
      },
    ]),
  );
  const exerciseRowById = new Map(
    exRows.map((e) => [
      e.id,
      {
        id: e.id,
        name: e.name,
        imageUrl: e.imageUrl,
        primaryMuscles: Array.isArray(e.primaryMuscles) ? e.primaryMuscles : [],
        secondaryMuscles: Array.isArray(e.secondaryMuscles)
          ? e.secondaryMuscles
          : [],
      },
    ]),
  );

  const sourcePresetIds = [
    ...new Set(
      postRows
        .map((r) => r.presetId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0),
    ),
  ];

  let savedPresetSources = new Set<string>();
  if (sourcePresetIds.length > 0) {
    const savedRows = await db
      .select({ sourceId: workoutPresets.savedFromPresetId })
      .from(workoutPresets)
      .where(
        and(
          eq(workoutPresets.userId, authUserId),
          inArray(workoutPresets.savedFromPresetId, sourcePresetIds),
        ),
      );
    savedPresetSources = new Set(
      savedRows
        .map((row) => row.sourceId)
        .filter((id): id is string => id != null),
    );
  }

  for (const id of postIds) {
    const r = rowById.get(id);
    if (!r) continue;

    const ids = Array.isArray(r.presetExerciseIds)
      ? (r.presetExerciseIds as string[]).filter((x) => typeof x === 'string')
      : [];

    const exercisesFull = buildPresetExercisePreviewsFromRows(ids, exerciseRowById);

    const presetPayload =
      r.presetId && r.presetName
        ? {
            id: r.presetId,
            name: r.presetName,
            exerciseCount: exercisesFull.length,
            exerciseNames: exerciseNamesFromIds(ids, nameById, 3),
            exercises: exercisesFull,
            muscleSummary: musclesForPresetPost(ids, exerciseMetaById),
          }
        : null;

    out.set(id, {
      type: 'post',
      postId: r.postId,
      user: {
        id: r.userId,
        name: displayUserName({
          firstName: r.firstName,
          lastName: r.lastName,
          username: r.username,
        }),
        avatarUrl: r.avatarUrl,
      },
      postedAt: r.createdAt.toISOString(),
      text: r.text,
      photoUrl: r.photoUrl,
      preset: presetPayload,
      savedByMe: Boolean(
        r.presetId && savedPresetSources.has(r.presetId),
      ),
      likeCount: likeCountMap.get(r.postId) ?? 0,
      commentCount: commentCountMap.get(r.postId) ?? 0,
      likedByMe: likedSet.has(r.postId),
      commentPreviews: previewsByPost.get(r.postId) ?? [],
    });
  }

  return out;
}

export async function countPublicWorkouts(
  db: Database,
  userId: string,
  followingOnly: boolean,
): Promise<number> {
  const publicCompletedWhere = and(
    eq(workouts.isPublic, true),
    isNotNull(workouts.endedAt),
  );

  const [exactTotal] = followingOnly
    ? await db
        .select({ c: drizzleCount() })
        .from(workouts)
        .innerJoin(
          follows,
          and(
            eq(follows.followingId, workouts.userId),
            eq(follows.followerId, userId),
          ),
        )
        .where(publicCompletedWhere)
    : await db
        .select({ c: drizzleCount() })
        .from(workouts)
        .where(publicCompletedWhere);

  return Number(exactTotal?.c ?? 0);
}

export async function countPosts(
  db: Database,
  userId: string,
  followingOnly: boolean,
): Promise<number> {
  const [exactTotal] = followingOnly
    ? await db
        .select({ c: drizzleCount() })
        .from(communityPosts)
        .innerJoin(
          follows,
          and(
            eq(follows.followingId, communityPosts.userId),
            eq(follows.followerId, userId),
          ),
        )
    : await db.select({ c: drizzleCount() }).from(communityPosts);

  return Number(exactTotal?.c ?? 0);
}

export async function fetchWorkoutFeedPage(
  db: Database,
  userId: string,
  authUserId: string,
  followingOnly: boolean,
  limit: number,
  offset: number,
): Promise<{ workoutIds: string[]; total: number }> {
  const publicCompletedWhere = and(
    eq(workouts.isPublic, true),
    isNotNull(workouts.endedAt),
  );

  const feedRows = followingOnly
    ? await db
        .select({ workoutId: workouts.id })
        .from(workouts)
        .innerJoin(
          follows,
          and(
            eq(follows.followingId, workouts.userId),
            eq(follows.followerId, userId),
          ),
        )
        .where(publicCompletedWhere)
        .orderBy(desc(workouts.endedAt))
        .limit(limit)
        .offset(offset)
    : await db
        .select({ workoutId: workouts.id })
        .from(workouts)
        .where(publicCompletedWhere)
        .orderBy(desc(workouts.endedAt))
        .limit(limit)
        .offset(offset);

  const total = await countPublicWorkouts(db, userId, followingOnly);

  return {
    workoutIds: feedRows.map((r) => r.workoutId),
    total,
  };
}

export async function fetchPostFeedPage(
  db: Database,
  userId: string,
  followingOnly: boolean,
  limit: number,
  offset: number,
): Promise<{ postIds: string[]; total: number }> {
  const rows = followingOnly
    ? await db
        .select({ postId: communityPosts.id })
        .from(communityPosts)
        .innerJoin(
          follows,
          and(
            eq(follows.followingId, communityPosts.userId),
            eq(follows.followerId, userId),
          ),
        )
        .orderBy(desc(communityPosts.createdAt))
        .limit(limit)
        .offset(offset)
    : await db
        .select({ postId: communityPosts.id })
        .from(communityPosts)
        .orderBy(desc(communityPosts.createdAt))
        .limit(limit)
        .offset(offset);

  const total = await countPosts(db, userId, followingOnly);

  return {
    postIds: rows.map((r) => r.postId),
    total,
  };
}
