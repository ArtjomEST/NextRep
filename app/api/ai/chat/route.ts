import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { aiMessages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { buildCoachContextBlock } from '@/lib/ai/coachContext';
import { openaiChatCompletion } from '@/lib/ai/openai';

const HISTORY_LIMIT = 40;

export async function POST(req: NextRequest) {
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

    // TODO: Pro gate
    // const profile = await getUserProfile(userId)
    // if (!profile.isPro) check weekly message count, return 429 if exceeded

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const msg =
      body &&
      typeof body === 'object' &&
      typeof (body as { message?: unknown }).message === 'string'
        ? String((body as { message: string }).message).trim()
        : '';

    if (!msg) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const db = getDb();
    const coachContext = await buildCoachContextBlock(db, auth.userId);

    const systemPrompt = `You are Alex, a personal fitness coach in the NextRep app.
Always respond in English. Be concise, motivating, and specific.

${coachContext}`;

    const prior = await db
      .select({
        role: aiMessages.role,
        content: aiMessages.content,
      })
      .from(aiMessages)
      .where(eq(aiMessages.userId, auth.userId))
      .orderBy(desc(aiMessages.createdAt))
      .limit(HISTORY_LIMIT);

    const chronological = [...prior].reverse();

    const apiMessages: {
      role: 'system' | 'user' | 'assistant';
      content: string;
    }[] = [
      { role: 'system', content: systemPrompt },
      ...chronological
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
      { role: 'user', content: msg },
    ];

    const reply = await openaiChatCompletion({ messages: apiMessages });

    await db.insert(aiMessages).values({
      userId: auth.userId,
      role: 'user',
      content: msg,
    });

    await db.insert(aiMessages).values({
      userId: auth.userId,
      role: 'assistant',
      content: reply,
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
