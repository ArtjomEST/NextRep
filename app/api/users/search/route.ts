import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users, follows } from '@/lib/db/schema';
import { eq, and, sql, inArray, or, ilike } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { displayUserName } from '@/lib/users/display';

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

    const q = (req.nextUrl.searchParams.get('q') ?? '').trim();
    if (q.length < 2) {
      return NextResponse.json({ data: [] });
    }

    const pattern = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
    const limit = Math.min(
      parseInt(req.nextUrl.searchParams.get('limit') ?? '30', 10),
      50,
    );

    const nameConcat = sql<string>`trim(coalesce(${users.firstName}, '') || ' ' || coalesce(${users.lastName}, ''))`;

    const rows = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(
        or(
          ilike(nameConcat, pattern),
          ilike(users.username, pattern),
          ilike(users.firstName, pattern),
          ilike(users.lastName, pattern),
        ),
      )
      .limit(limit);

    const ids = rows.map((r) => r.id);
    const followingSet = new Set<string>();
    if (ids.length > 0) {
      const fl = await db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(
          and(
            eq(follows.followerId, auth.userId),
            inArray(follows.followingId, ids),
          ),
        );
      for (const f of fl) followingSet.add(f.followingId);
    }

    const data = rows.map((r) => ({
      id: r.id,
      name: displayUserName(r),
      avatarUrl: r.avatarUrl,
      isFollowing: followingSet.has(r.id),
      isSelf: r.id === auth.userId,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error('GET /api/users/search:', err);
    return NextResponse.json(
      { error: 'Search failed', message: String(err) },
      { status: 500 },
    );
  }
}
