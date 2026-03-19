import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { communityPosts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

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
