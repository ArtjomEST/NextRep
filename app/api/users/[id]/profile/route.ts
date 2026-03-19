import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  users,
  follows,
  workouts,
} from '@/lib/db/schema';
import { eq, and, isNotNull, desc, count as drizzleCount, sql } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { displayUserName } from '@/lib/users/display';

export async function GET(
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

    const { id: profileUserId } = await params;

    const [user] = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, profileUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [followersRow] = await db
      .select({ c: drizzleCount() })
      .from(follows)
      .where(eq(follows.followingId, profileUserId));

    const [followingRow] = await db
      .select({ c: drizzleCount() })
      .from(follows)
      .where(eq(follows.followerId, profileUserId));

    const [isFollowingRow] = await db
      .select({ id: follows.id })
      .from(follows)
      .where(
        and(
          eq(follows.followerId, auth.userId),
          eq(follows.followingId, profileUserId),
        ),
      )
      .limit(1);

    const [statsRow] = await db
      .select({
        workoutCount: drizzleCount(),
        totalVolume: sql<string>`coalesce(sum((${workouts.totalVolume})::numeric), 0)`,
      })
      .from(workouts)
      .where(
        and(
          eq(workouts.userId, profileUserId),
          eq(workouts.isPublic, true),
          isNotNull(workouts.endedAt),
        ),
      );

    const publicWorkouts = await db
      .select({
        id: workouts.id,
        name: workouts.name,
        endedAt: workouts.endedAt,
        durationSec: workouts.durationSec,
        totalVolume: workouts.totalVolume,
        totalSets: workouts.totalSets,
        photoUrl: workouts.photoUrl,
      })
      .from(workouts)
      .where(
        and(
          eq(workouts.userId, profileUserId),
          eq(workouts.isPublic, true),
          isNotNull(workouts.endedAt),
        ),
      )
      .orderBy(desc(workouts.endedAt))
      .limit(60);

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          name: displayUserName(user),
          avatarUrl: user.avatarUrl,
        },
        followerCount: Number(followersRow?.c ?? 0),
        followingCount: Number(followingRow?.c ?? 0),
        isFollowing: !!isFollowingRow,
        isSelf: profileUserId === auth.userId,
        totalWorkouts: Number(statsRow?.workoutCount ?? 0),
        totalVolume: Number(statsRow?.totalVolume ?? 0),
        publicWorkouts: publicWorkouts.map((w) => ({
          id: w.id,
          name: w.name,
          endedAt: w.endedAt!.toISOString(),
          durationSec: w.durationSec,
          totalVolume: Number(w.totalVolume ?? 0),
          totalSets: w.totalSets ?? 0,
          photoUrl: w.photoUrl,
        })),
      },
    });
  } catch (err) {
    console.error('GET /api/users/[id]/profile:', err);
    return NextResponse.json(
      { error: 'Failed to load profile', message: String(err) },
      { status: 500 },
    );
  }
}
