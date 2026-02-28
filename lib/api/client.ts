import type { Exercise, MuscleGroup } from '@/lib/types';
import type {
  SaveWorkoutRequest,
  SaveWorkoutResponse,
  WorkoutListItem,
  WorkoutDetail,
  ExerciseDetail,
} from './types';
import { getAuthHeaders } from '@/lib/auth/client';

// ─── Exercises ──────────────────────────────────────────────

const CATEGORY_TO_MUSCLE: Record<string, MuscleGroup> = {
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  calves: 'Legs',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
  abs: 'Core',
};

interface DbExercise {
  id: string;
  name: string;
  category: string | null;
  primaryMuscles: string[] | null;
  equipment: string[] | null;
  description: string | null;
  howTo: string | null;
  measurementType: string;
  imageUrl: string | null;
}

function mapDbExercise(e: DbExercise): Exercise {
  const cat = e.category?.toLowerCase() ?? '';
  const muscleGroup = CATEGORY_TO_MUSCLE[cat];
  const muscleGroups: MuscleGroup[] = muscleGroup ? [muscleGroup] : [];

  return {
    id: e.id,
    name: e.name,
    muscleGroups,
    equipment: e.equipment?.join(', ') ?? 'Bodyweight',
    description: e.description ?? undefined,
    howTo: e.howTo ?? undefined,
    imageUrl: e.imageUrl ?? undefined,
  };
}

export async function searchExercisesApi(
  query: string,
  category?: string,
  limit = 50,
): Promise<Exercise[]> {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (category) params.set('category', category);
  params.set('limit', String(limit));

  const res = await fetch(`/api/exercises?${params}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to fetch exercises (${res.status})`);
  }
  const json = await res.json();
  return (json.data as DbExercise[]).map(mapDbExercise);
}

export async function searchExercisesRaw(
  query: string,
  category?: string,
  limit = 50,
  offset = 0,
): Promise<{ data: Exercise[]; total: number }> {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (category) params.set('category', category);
  params.set('limit', String(limit));
  params.set('offset', String(offset));

  const res = await fetch(`/api/exercises?${params}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to fetch exercises (${res.status})`);
  }
  const json = await res.json();
  return {
    data: (json.data as DbExercise[]).map(mapDbExercise),
    total: json.total as number,
  };
}

export async function fetchExerciseDetailApi(
  id: string,
): Promise<ExerciseDetail> {
  const res = await fetch(`/api/exercises/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    if (res.status === 404) throw new Error('Exercise not found');
    throw new Error(json.error ?? `Failed to fetch exercise (${res.status})`);
  }
  const json = await res.json();
  return json.data as ExerciseDetail;
}

// ─── Workouts ───────────────────────────────────────────────

export async function saveWorkoutApi(
  request: SaveWorkoutRequest,
): Promise<SaveWorkoutResponse> {
  const res = await fetch('/api/workouts', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(request),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Failed to save workout');
  return json.data as SaveWorkoutResponse;
}

export async function fetchWorkoutsApi(
  limit = 20,
  offset = 0,
): Promise<{ data: WorkoutListItem[]; total: number }> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(`/api/workouts?${params}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to fetch workouts (${res.status})`);
  }
  const json = await res.json();
  return {
    data: json.data as WorkoutListItem[],
    total: json.total as number,
  };
}

export async function fetchWorkoutDetailApi(
  id: string,
): Promise<WorkoutDetail> {
  const res = await fetch(`/api/workouts/${id}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Workout not found (${res.status})`);
  }
  const json = await res.json();
  return json.data as WorkoutDetail;
}

// ─── User / Me ──────────────────────────────────────────────

export interface MeResponse {
  id: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  isLinked: boolean;
  telegramUserId: string | null;
}

export async function fetchMe(): Promise<MeResponse | null> {
  try {
    const res = await fetch('/api/me', { headers: getAuthHeaders() });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as MeResponse;
  } catch {
    return null;
  }
}

export async function linkAccount(): Promise<boolean> {
  try {
    const res = await fetch('/api/me/link', {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}
