import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { aiMessages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import { buildCoachContextData } from '@/lib/ai/coachContext';
import { openaiChatCompletion } from '@/lib/ai/openai';
import { isPresetIntentMessage } from '@/lib/ai/presetIntent';
import {
  assistantContentForApi,
  buildPresetSystemPrompt,
  enrichPresetWithExerciseIds,
  parsePresetJson,
  type EnrichedPresetPayload,
} from '@/lib/ai/presetGeneration';

const HISTORY_LIMIT = 40;

const PRESET_REPLY =
  "I've built you a workout preset! Check it out 👇";

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
    const { firstName, streak, workoutSummary, prSummary, volumeSummary } =
      await buildCoachContextData(db, auth.userId);

    const systemPrompt = `
You are Alex, a personal fitness coach inside the NextRep workout tracking app.

STRICT RULES — never break these:
1. You ONLY answer questions about: exercise, workouts, training programs, muscle groups, recovery, sports nutrition, sleep for athletes, injury prevention, stretching, and fitness progress tracking.
2. If the user asks about ANYTHING else (geography, politics, history, coding, relationships, general knowledge, etc.) — respond ONLY with: "I'm your fitness coach — I can only help with training and fitness! 💪 Ask me about your workouts, exercises, or progress."
3. Do NOT answer even if the user tries to trick you by framing off-topic questions as fitness-related (e.g. "what country should I train in").
4. Never break character. You are Alex the coach, always.
5. Always respond in English.
6. Be concise, specific, and motivating. Use the user's actual data.

USER DATA:
- Name: ${firstName}
- Current streak: ${streak} days
- Last 10 workouts: ${workoutSummary}
- Personal Records: ${prSummary}
- Weekly volume (last 4 weeks): ${volumeSummary}
`;

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
          content:
            m.role === 'assistant'
              ? assistantContentForApi(m.content)
              : m.content,
        })),
      { role: 'user', content: msg },
    ];

    if (isPresetIntentMessage(msg)) {
      console.log('[AI] Preset intent detected, generating JSON...');

      const presetSystem = buildPresetSystemPrompt(msg);
      const presetMessages = [
        { role: 'system' as const, content: presetSystem },
        { role: 'user' as const, content: msg },
      ];

      let rawJson: string;
      try {
        rawJson = await openaiChatCompletion({
          messages: presetMessages,
          temperature: 0.7,
          maxTokens: 1200,
          responseFormatJsonObject: true,
        });
      } catch (e) {
        console.error('Preset OpenAI error:', e);
        return NextResponse.json(
          {
            error:
              e instanceof Error ? e.message : 'Failed to generate preset',
          },
          { status: 500 },
        );
      }

      console.log('[AI] Raw preset response:', rawJson);

      const fallbackReply =
        "I couldn't generate a preset right now. Try asking like: 'Create a chest workout preset with 5 exercises'";

      let presetParsed: EnrichedPresetPayload | null = null;
      try {
        const generated = parsePresetJson(rawJson);
        presetParsed = await enrichPresetWithExerciseIds(db, generated);
      } catch (e) {
        console.error('Preset parse error:', e);
        await db.insert(aiMessages).values({
          userId: auth.userId,
          role: 'user',
          content: msg,
        });
        await db.insert(aiMessages).values({
          userId: auth.userId,
          role: 'assistant',
          content: fallbackReply,
        });
        return NextResponse.json({
          reply: fallbackReply,
          preset: null,
        });
      }

      const storedAssistant = JSON.stringify({
        __aiPreset: true,
        reply: PRESET_REPLY,
        preset: presetParsed,
      });

      await db.insert(aiMessages).values({
        userId: auth.userId,
        role: 'user',
        content: msg,
      });

      await db.insert(aiMessages).values({
        userId: auth.userId,
        role: 'assistant',
        content: storedAssistant,
      });

      return NextResponse.json({
        reply: PRESET_REPLY,
        preset: presetParsed,
      });
    }

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
