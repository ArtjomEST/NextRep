import type { SaveWorkoutRequest } from './types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateSaveWorkout(
  body: unknown,
): { data: SaveWorkoutRequest; error: null } | { data: null; error: string } {
  if (!body || typeof body !== 'object') {
    return { data: null, error: 'Request body must be a JSON object' };
  }

  const b = body as Record<string, unknown>;

  if (typeof b.name !== 'string' || b.name.trim().length === 0) {
    return { data: null, error: 'name is required (non-empty string)' };
  }
  if (!Array.isArray(b.exercises) || b.exercises.length === 0) {
    return { data: null, error: 'At least one exercise is required' };
  }

  for (let i = 0; i < b.exercises.length; i++) {
    const ex = b.exercises[i] as Record<string, unknown>;
    if (!ex || typeof ex !== 'object') {
      return { data: null, error: `exercises[${i}] must be an object` };
    }
    if (typeof ex.exerciseId !== 'string' || !UUID_RE.test(ex.exerciseId)) {
      return {
        data: null,
        error: `exercises[${i}].exerciseId must be a valid UUID (got: ${JSON.stringify(ex.exerciseId)?.slice(0, 50)})`,
      };
    }
    if (typeof ex.order !== 'number') {
      return { data: null, error: `exercises[${i}].order must be a number (got: ${typeof ex.order})` };
    }
    if (ex.status !== undefined && ex.status !== 'pending' && ex.status !== 'completed') {
      return { data: null, error: `exercises[${i}].status must be 'pending' or 'completed' (got: ${JSON.stringify(ex.status)})` };
    }
    if (!Array.isArray(ex.sets)) {
      return { data: null, error: `exercises[${i}].sets must be an array (got: ${typeof ex.sets})` };
    }
    if (ex.sets.length === 0) {
      return { data: null, error: `exercises[${i}].sets must have at least one set` };
    }
    for (let j = 0; j < (ex.sets as unknown[]).length; j++) {
      const s = (ex.sets as Record<string, unknown>[])[j];
      if (!s || typeof s !== 'object') {
        return { data: null, error: `exercises[${i}].sets[${j}] must be an object` };
      }
      if (typeof s.setIndex !== 'number') {
        return {
          data: null,
          error: `exercises[${i}].sets[${j}].setIndex must be a number (got: ${typeof s.setIndex})`,
        };
      }
    }
  }

  return { data: b as unknown as SaveWorkoutRequest, error: null };
}
