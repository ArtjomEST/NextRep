import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { aiMessages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';

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
      .select({
        id: aiMessages.id,
        role: aiMessages.role,
        content: aiMessages.content,
        createdAt: aiMessages.createdAt,
      })
      .from(aiMessages)
      .where(eq(aiMessages.userId, auth.userId))
      .orderBy(desc(aiMessages.createdAt))
      .limit(20);

    const chronological = [...rows].reverse();

    return NextResponse.json({
      data: {
        messages: chronological.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt:
            m.createdAt instanceof Date
              ? m.createdAt.toISOString()
              : String(m.createdAt),
        })),
      },
    });
  } catch (err) {
    console.error('GET /api/ai/chat/history error:', err);
    return NextResponse.json(
      { error: 'Failed to load chat history', message: String(err) },
      { status: 500 },
    );
  }
}
