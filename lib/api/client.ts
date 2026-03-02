import type { Exercise, MuscleGroup } from '@/lib/types';
import type {
  SaveWorkoutRequest,
  SaveWorkoutResponse,
  WorkoutListItem,
  WorkoutDetail,
  ExerciseDetail,
  Preset,
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

/** Map API ExerciseDetail to app Exercise for workout store. */
export function exerciseDetailToExercise(d: ExerciseDetail): Exercise {
  const cat = (d.category ?? '').toLowerCase();
  const muscleGroup = CATEGORY_TO_MUSCLE[cat];
  const muscleGroups: MuscleGroup[] = muscleGroup ? [muscleGroup] : [];
  return {
    id: d.id,
    name: d.name,
    muscleGroups,
    equipment: d.equipment?.join(', ') ?? 'Bodyweight',
    description: d.description ?? undefined,
    howTo: d.howTo ?? undefined,
    imageUrl: d.imageUrl ?? undefined,
  };
}

/** Fetch multiple exercises by ID (for preset → draft copy). Returns in requested order; skips missing. */
export async function fetchExercisesByIds(ids: string[]): Promise<Exercise[]> {
  const out: Exercise[] = [];
  for (const id of ids) {
    try {
      const detail = await fetchExerciseDetailApi(id);
      out.push(exerciseDetailToExercise(detail));
    } catch {
      // skip missing/invalid
    }
  }
  return out;
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
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = json.message ? `: ${json.message}` : '';
    throw new Error(
      (json.error ?? 'Failed to save workout') + ` (${res.status})` + detail,
    );
  }
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

export async function fetchWorkoutStatsApi(): Promise<{
  total: number;
  totalVolume: number;
  totalSets: number;
}> {
  const res = await fetch('/api/workouts/stats', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to fetch stats (${res.status})`);
  }
  const json = await res.json();
  return json.data;
}

export async function deleteWorkoutApi(id: string): Promise<void> {
  const res = await fetch(`/api/workouts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to delete workout (${res.status})`);
  }
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
  const res = await fetch('/api/me', { headers: getAuthHeaders() });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Authentication failed (${res.status})`);
  }
  const json = await res.json();
  return json.data as MeResponse;
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

// ─── Settings ────────────────────────────────────────────────

export interface UserSettings {
  userId: string;
  heightCm: number | null;
  weightKg: string | null;
  age: number | null;
  units: 'kg' | 'lb';
  experienceLevel: string | null;
  goal: string | null;
}

export async function fetchSettings(): Promise<UserSettings> {
  const res = await fetch('/api/me/settings', { headers: getAuthHeaders() });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to fetch settings (${res.status})`);
  }
  const json = await res.json();
  return json.data as UserSettings;
}

export async function updateSettings(
  updates: Partial<Omit<UserSettings, 'userId'>>,
): Promise<UserSettings> {
  const res = await fetch('/api/me/settings', {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to update settings (${res.status})`);
  }
  const json = await res.json();
  return json.data as UserSettings;
}

// ─── Progress ────────────────────────────────────────────────

export interface ProgressExercise {
  id: string;
  name: string;
  category: string | null;
  lastUsedAt: string;
  usageCount: number;
}

export interface ProgressExerciseDetail {
  measurementType: string;
  pr: {
    bestWeight?: number;
    bestReps?: number;
    bestVolume?: number;
    bestSeconds?: number;
    date: string;
  } | null;
  last5: {
    workoutId: string;
    date: string;
    bestWeight?: number | null;
    bestReps?: number | null;
    bestSeconds?: number | null;
    volume: number;
  }[];
  progress30d: {
    deltaWeight?: number;
    deltaReps?: number;
    deltaVolume?: number;
    deltaSeconds?: number;
    label: string;
  } | null;
}

export async function fetchProgressExercisesApi(): Promise<ProgressExercise[]> {
  const res = await fetch('/api/progress/exercises', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to fetch progress exercises (${res.status})`);
  }
  const json = await res.json();
  return json.data as ProgressExercise[];
}

export async function fetchProgressExerciseDetailApi(
  exerciseId: string,
): Promise<ProgressExerciseDetail> {
  const res = await fetch(`/api/progress/exercises/${exerciseId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to fetch progress (${res.status})`);
  }
  const json = await res.json();
  return json.data as ProgressExerciseDetail;
}

// ─── Workout Presets (API with localStorage fallback) ────────

const PRESETS_STORAGE_KEY = 'nextrep_presets';

function getPresetsFromStorage(): Preset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePresetsToStorage(presets: Preset[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // ignore
  }
}

export async function fetchPresetsApi(): Promise<Preset[]> {
  try {
    const res = await fetch('/api/presets', { headers: getAuthHeaders() });
    if (res.ok) {
      const json = await res.json();
      return (json.data ?? []) as Preset[];
    }
    if (res.status === 401) return getPresetsFromStorage();
    throw new Error('Failed to fetch presets');
  } catch {
    return getPresetsFromStorage();
  }
}

export async function createPresetApi(payload: {
  name: string;
  exerciseIds: string[];
}): Promise<Preset> {
  try {
    const res = await fetch('/api/presets', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await res.json();
      return json.data as Preset;
    }
    if (res.status === 401) {
      const preset: Preset = {
        id: crypto.randomUUID(),
        userId: '',
        name: payload.name.trim(),
        exerciseIds: payload.exerciseIds,
        createdAt: new Date().toISOString(),
      };
      const list = getPresetsFromStorage();
      list.unshift(preset);
      savePresetsToStorage(list);
      return preset;
    }
    throw new Error('Failed to create preset');
  } catch (err) {
    const preset: Preset = {
      id: crypto.randomUUID(),
      userId: '',
      name: payload.name.trim(),
      exerciseIds: payload.exerciseIds,
      createdAt: new Date().toISOString(),
    };
    const list = getPresetsFromStorage();
    list.unshift(preset);
    savePresetsToStorage(list);
    return preset;
  }
}

export async function deletePresetApi(id: string): Promise<void> {
  try {
    const res = await fetch(`/api/presets/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (res.ok) return;
    if (res.status === 401 || res.status === 404) {
      const list = getPresetsFromStorage().filter((p) => p.id !== id);
      savePresetsToStorage(list);
      return;
    }
    throw new Error('Failed to delete preset');
  } catch {
    const list = getPresetsFromStorage().filter((p) => p.id !== id);
    savePresetsToStorage(list);
  }
}
