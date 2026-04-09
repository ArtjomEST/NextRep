/**
 * Dev endpoint to find duplicate and near-duplicate exercises using OpenAI.
 *
 * Fetches all exercises, sends names to gpt-4o-mini in one prompt, returns
 * grouped duplicates and variants. Read-only — does not modify anything.
 *
 * Protected by x-dev-secret header matching DEV_SECRET env var.
 *
 * Usage:
 *   curl https://your-app.vercel.app/api/dev/duplicate-exercises \
 *     -H "x-dev-secret: <DEV_SECRET>"
 */

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { exercises } from '@/lib/db/schema';
import { openaiChatCompletion } from '@/lib/ai/openai';

const DEV_SECRET = process.env.DEV_SECRET;

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ExerciseRow {
  id: string;
  name: string;
  source: 'wger' | 'custom';
  hasMuscles: boolean;
}

interface AiExerciseRef {
  id: string;
  name: string;
}

interface AiDuplicateGroup {
  keep: AiExerciseRef;
  remove: AiExerciseRef[];
  reason: string;
}

interface AiVariantGroup {
  exercises: AiExerciseRef[];
  reason: string;
}

interface AiResponse {
  duplicates: AiDuplicateGroup[];
  variants: AiVariantGroup[];
}

// ─── Keep logic ────────────────────────────────────────────────────────────────

/**
 * Given a group of exercise IDs, pick the best one to keep.
 * Priority: wger source > has muscles > longer name.
 */
function pickKeep(ids: string[], rowMap: Map<string, ExerciseRow>): string {
  return ids.slice().sort((a, b) => {
    const ra = rowMap.get(a)!;
    const rb = rowMap.get(b)!;
    // 1. wger over custom
    if (ra.source !== rb.source) return ra.source === 'wger' ? -1 : 1;
    // 2. has muscles over missing
    if (ra.hasMuscles !== rb.hasMuscles) return ra.hasMuscles ? -1 : 1;
    // 3. longer name (more descriptive)
    return rb.name.length - ra.name.length;
  })[0];
}

// ─── Route ─────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  if (!DEV_SECRET) {
    return NextResponse.json({ error: 'DEV_SECRET env var not configured' }, { status: 500 });
  }
  if (req.headers.get('x-dev-secret') !== DEV_SECRET) {
    return NextResponse.json({ error: 'Invalid or missing x-dev-secret header' }, { status: 401 });
  }

  const db = getDb();

  // Fetch all exercises
  const rows = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      source: exercises.source,
      primaryMuscles: exercises.primaryMuscles,
    })
    .from(exercises);

  const rowMap = new Map<string, ExerciseRow>(
    rows.map((r) => [
      r.id,
      {
        id: r.id,
        name: r.name,
        source: r.source,
        hasMuscles: Array.isArray(r.primaryMuscles) && r.primaryMuscles.length > 0,
      },
    ])
  );

  // Build compact list for the prompt — just id + name
  const exerciseList = rows.map((r) => ({ id: r.id, name: r.name }));

  const systemPrompt = `You are a fitness database expert. You will receive a JSON array of exercises (id + name).
Your task: identify duplicate and near-duplicate exercises and group them.

Rules:
1. DUPLICATES: same exercise, same name with trivial differences (different casing, plural/singular, extra spaces, punctuation). Example: "Bicep Curl" vs "bicep curl" vs "Bicep Curls".
2. VARIANTS: same exercise concept but meaningfully different (different equipment, grip, angle, position). Example: "Seated Cable Row (Close Grip)" vs "Seated Cable Row (Wide Grip)". Do NOT mark these as duplicates.
3. For each duplicate group, pick ONE to keep and list the rest in "remove". The caller will override the keep choice based on data completeness, so just pick any — prefer the most common or clean name.
4. Only include groups with 2+ exercises. Skip all unique exercises entirely.
5. Be conservative — when unsure, use "variants" not "duplicates".

Return ONLY strict JSON in this exact shape, no markdown, no explanation:
{
  "duplicates": [
    {
      "keep": { "id": "...", "name": "..." },
      "remove": [{ "id": "...", "name": "..." }],
      "reason": "short reason"
    }
  ],
  "variants": [
    {
      "exercises": [{ "id": "...", "name": "..." }],
      "reason": "short reason"
    }
  ]
}`;

  const userMessage = JSON.stringify(exerciseList);

  let aiRaw: string;
  try {
    aiRaw = await openaiChatCompletion({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      responseFormatJsonObject: true,
      temperature: 0,
      maxTokens: 4096,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }

  let aiResult: AiResponse;
  try {
    aiResult = JSON.parse(aiRaw) as AiResponse;
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse AI response as JSON', raw: aiRaw },
      { status: 500 }
    );
  }

  // Post-process: override keep/remove using our data-completeness logic
  const duplicates = (aiResult.duplicates ?? []).map((group) => {
    const allIds = [group.keep, ...group.remove]
      .map((e) => e.id)
      .filter((id) => rowMap.has(id)); // guard against hallucinated IDs

    if (allIds.length < 2) return null;

    const keepId = pickKeep(allIds, rowMap);
    const keepRow = rowMap.get(keepId)!;
    const removeRows = allIds
      .filter((id) => id !== keepId)
      .map((id) => rowMap.get(id)!)
      .map(({ id, name }) => ({ id, name }));

    return {
      keep: { id: keepRow.id, name: keepRow.name },
      remove: removeRows,
      reason: group.reason,
    };
  }).filter(Boolean);

  const variants = (aiResult.variants ?? []).map((group) => {
    const validExercises = (group.exercises ?? [])
      .filter((e) => rowMap.has(e.id))
      .map((e) => ({ id: e.id, name: e.name }));

    if (validExercises.length < 2) return null;
    return { exercises: validExercises, reason: group.reason };
  }).filter(Boolean);

  return NextResponse.json({
    meta: {
      totalExercises: rows.length,
      duplicateGroups: duplicates.length,
      variantGroups: variants.length,
      exercisesToRemove: duplicates.reduce((sum, g) => sum + (g?.remove.length ?? 0), 0),
    },
    duplicates,
    variants,
  });
}
