import { ilike } from 'drizzle-orm';
import { exercises } from '@/lib/db/schema';
import type { Database } from '@/lib/db';

export interface GeneratedPresetExercise {
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
}

export interface GeneratedPresetPayload {
  name: string;
  exercises: GeneratedPresetExercise[];
  coachNote: string;
}

export interface EnrichedPresetExercise extends GeneratedPresetExercise {
  exerciseId: string | null;
}

export interface EnrichedPresetPayload {
  name: string;
  exercises: EnrichedPresetExercise[];
  coachNote: string;
}

export function buildPresetSystemPrompt(userMessage: string): string {
  return `
You are a fitness coach generating a workout preset for the NextRep app.
The user asked: "${userMessage.replace(/"/g, '\\"')}"

Return ONLY a valid JSON object (no markdown, no explanation) in this exact format:
{
  "name": "Chest + Triceps",
  "exercises": [
    { "name": "Bench Press", "sets": 4, "reps": 8, "restSeconds": 90 },
    { "name": "Incline Dumbbell Press", "sets": 3, "reps": 10, "restSeconds": 75 },
    { "name": "Cable Fly", "sets": 3, "reps": 12, "restSeconds": 60 },
    { "name": "Triceps Pushdown", "sets": 3, "reps": 12, "restSeconds": 60 },
    { "name": "Skull Crushers", "sets": 3, "reps": 10, "restSeconds": 60 }
  ],
  "coachNote": "This is a classic chest and triceps hypertrophy workout. Start heavy on bench press when fresh."
}

Use exercise names that exist in a standard gym. 4-6 exercises. Sets 3-4. Reps 8-15.
`.trim();
}

function stripCodeFence(text: string): string {
  let t = text.trim();
  if (t.startsWith('```')) {
    const lines = t.split('\n');
    if (lines[0]?.startsWith('```')) lines.shift();
    const last = lines[lines.length - 1]?.trim();
    if (last === '```') lines.pop();
    t = lines.join('\n');
  }
  return t.trim();
}

export function parsePresetJson(raw: string): GeneratedPresetPayload {
  const cleaned = stripCodeFence(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      parsed = JSON.parse(cleaned.slice(start, end + 1));
    } else {
      throw new Error('Invalid preset JSON');
    }
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid preset JSON');
  const o = parsed as Record<string, unknown>;
  const name = typeof o.name === 'string' ? o.name.trim() : '';
  const coachNote = typeof o.coachNote === 'string' ? o.coachNote.trim() : '';
  if (!name) throw new Error('Invalid preset JSON');
  const exRaw = o.exercises;
  if (!Array.isArray(exRaw)) throw new Error('Invalid preset JSON');
  const exercisesOut: GeneratedPresetExercise[] = [];
  for (const item of exRaw) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Record<string, unknown>;
    const n = typeof e.name === 'string' ? e.name.trim() : '';
    if (!n) continue;
    const sets = typeof e.sets === 'number' && Number.isFinite(e.sets) ? Math.round(e.sets) : 3;
    const reps = typeof e.reps === 'number' && Number.isFinite(e.reps) ? Math.round(e.reps) : 10;
    const restSeconds =
      typeof e.restSeconds === 'number' && Number.isFinite(e.restSeconds)
        ? Math.round(e.restSeconds)
        : 60;
    exercisesOut.push({
      name: n,
      sets: Math.min(8, Math.max(1, sets)),
      reps: Math.min(30, Math.max(1, reps)),
      restSeconds: Math.min(600, Math.max(0, restSeconds)),
    });
  }
  if (exercisesOut.length === 0) throw new Error('Invalid preset JSON');
  return { name, exercises: exercisesOut, coachNote };
}

async function findExerciseByName(
  db: Database,
  rawName: string,
): Promise<{ id: string; name: string } | null> {
  const trimmed = rawName.trim();
  if (!trimmed) return null;
  const escaped = trimmed.replace(/%/g, '\\%').replace(/_/g, '\\_');

  const [exact] = await db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .where(ilike(exercises.name, escaped))
    .limit(1);
  if (exact) return exact;

  const fuzzyPattern = `%${escaped}%`;
  const [fuzzy] = await db
    .select({ id: exercises.id, name: exercises.name })
    .from(exercises)
    .where(ilike(exercises.name, fuzzyPattern))
    .limit(1);
  return fuzzy ?? null;
}

export async function enrichPresetWithExerciseIds(
  db: Database,
  preset: GeneratedPresetPayload,
): Promise<EnrichedPresetPayload> {
  const enriched: EnrichedPresetExercise[] = [];
  for (const ex of preset.exercises) {
    const row = await findExerciseByName(db, ex.name);
    enriched.push({
      ...ex,
      exerciseId: row?.id ?? null,
    });
  }
  return {
    name: preset.name,
    coachNote: preset.coachNote,
    exercises: enriched,
  };
}

export function assistantContentForApi(raw: string): string {
  try {
    const j = JSON.parse(raw) as { __aiPreset?: boolean; reply?: string };
    if (j && typeof j === 'object' && j.__aiPreset && typeof j.reply === 'string') {
      return j.reply;
    }
  } catch {
    /* plain text */
  }
  return raw;
}

export function parseStoredAssistantMessage(raw: string): {
  content: string;
  preset: EnrichedPresetPayload | null;
} {
  try {
    const j = JSON.parse(raw) as {
      __aiPreset?: boolean;
      reply?: string;
      preset?: EnrichedPresetPayload;
    };
    if (j && typeof j === 'object' && j.__aiPreset && typeof j.reply === 'string') {
      return {
        content: j.reply,
        preset: j.preset && typeof j.preset === 'object' ? j.preset : null,
      };
    }
  } catch {
    /* plain text */
  }
  return { content: raw, preset: null };
}
