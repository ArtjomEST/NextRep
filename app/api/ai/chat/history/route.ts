import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { aiMessages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { parseStoredAssistantMessage } from '@/lib/ai/presetGeneration';

export async function GET(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY is not configured' },
      { status: 503 },
    );
  }

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
      messages: chronological.map((m) => {
        if (m.role === 'assistant') {
          const { content, preset } = parseStoredAssistantMessage(m.content);
          return {
            id: m.id,
            role: m.role,
            content,
            ...(preset ? { preset } : {}),
            createdAt:
              m.createdAt instanceof Date
                ? m.createdAt.toISOString()
                : String(m.createdAt),
          };
        }
        return {
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt:
            m.createdAt instanceof Date
              ? m.createdAt.toISOString()
              : String(m.createdAt),
        };
      }),
    });
  } catch (err) {
    console.error('GET /api/ai/chat/history error:', err);
    return NextResponse.json({ messages: [] });
  }
}
