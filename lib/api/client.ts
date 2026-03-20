import type { Exercise, MuscleGroup } from '@/lib/types';
import type {
  SaveWorkoutRequest,
  SaveWorkoutResponse,
  WorkoutListItem,
  WorkoutDetail,
  ExerciseDetail,
  Preset,
  FeedItem,
  UserSearchHit,
  PublicProfileData,
  WorkoutCommentRow,
  FeedPostPresetSummary,
} from './types';
import { getAuthHeaders, getTelegramInitData } from '@/lib/auth/client';

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
  secondaryMuscles: string[] | null;
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
    primaryMuscles: e.primaryMuscles ?? undefined,
    secondaryMuscles: e.secondaryMuscles ?? undefined,
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
    primaryMuscles: d.primaryMuscles,
    secondaryMuscles: d.secondaryMuscles,
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

export async function fetchLastSetsApi(
  exerciseIds: string[],
): Promise<Record<string, { sets: Array<{ weight: number | null; reps: number | null }>; lastWorkoutDate: string }>> {
  if (exerciseIds.length === 0) return {};
  const params = new URLSearchParams({ exerciseIds: exerciseIds.join(',') });
  const res = await fetch(`/api/workouts/last-sets?${params}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return {};
  }
  const json = await res.json();
  return json.data ?? {};
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
  avatarUrl: string | null;
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

/** Thrown by {@link uploadWorkoutPhotoApi} with HTTP status for UI messaging. */
export class UploadPhotoError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'UploadPhotoError';
    this.status = status;
  }
}

function authHeadersForFormData(): HeadersInit {
  const initData = getTelegramInitData();
  if (!initData) return {};
  return { 'x-telegram-init-data': initData };
}

export async function uploadWorkoutPhotoApi(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/upload/workout-photo', {
    method: 'POST',
    headers: authHeadersForFormData(),
    body: form,
  });
  const json = (await res.json().catch(() => ({}))) as {
    error?: string;
    url?: string;
  };
  if (!res.ok) {
    throw new UploadPhotoError(
      res.status,
      typeof json.error === 'string' && json.error.length > 0
        ? json.error
        : `Upload failed (${res.status})`,
    );
  }
  return json.url as string;
}

export type FeedFilter = 'all' | 'following';
export type FeedContentType = 'all' | 'workout' | 'post';

export async function fetchFeedApi(
  limit = 20,
  offset = 0,
  filter: FeedFilter = 'all',
  contentType: FeedContentType = 'all',
): Promise<{ data: FeedItem[]; total: number }> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (filter === 'following') params.set('filter', 'following');
  if (contentType !== 'all') params.set('type', contentType);
  const res = await fetch(`/api/feed?${params}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to load feed (${res.status})`);
  }
  const json = await res.json();
  return {
    data: json.data as FeedItem[],
    total: json.total as number,
  };
}

export async function followUserApi(userId: string): Promise<void> {
  const res = await fetch(`/api/users/${userId}/follow`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Follow failed (${res.status})`);
  }
}

export async function unfollowUserApi(userId: string): Promise<void> {
  const res = await fetch(`/api/users/${userId}/follow`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Unfollow failed (${res.status})`);
  }
}

export async function searchUsersApi(query: string): Promise<UserSearchHit[]> {
  const params = new URLSearchParams({ q: query });
  const res = await fetch(`/api/users/search?${params}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Search failed (${res.status})`);
  }
  const json = await res.json();
  return (json.data ?? []) as UserSearchHit[];
}

export async function fetchPublicProfileApi(
  userId: string,
): Promise<PublicProfileData> {
  const res = await fetch(`/api/users/${userId}/profile`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Profile failed (${res.status})`);
  }
  const json = await res.json();
  return json.data as PublicProfileData;
}

export async function toggleWorkoutLikeApi(
  workoutId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const res = await fetch(`/api/workouts/${workoutId}/like`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Like failed (${res.status})`);
  }
  return res.json() as Promise<{ liked: boolean; likeCount: number }>;
}

export async function createCommunityPostApi(body: {
  text?: string;
  photoUrl?: string | null;
  presetId?: string | null;
}): Promise<{ id: string; createdAt: string }> {
  const res = await fetch('/api/community/posts', {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `Failed to create post (${res.status})`);
  }
  return json.data as { id: string; createdAt: string };
}

export async function patchCommunityPostApi(
  postId: string,
  body: {
    text?: string | null;
    photoUrl?: string | null;
    presetId?: string | null;
  },
): Promise<{
  text: string | null;
  photoUrl: string | null;
  preset: FeedPostPresetSummary | null;
  savedByMe: boolean;
}> {
  const res = await fetch(`/api/community/posts/${postId}`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `Failed to update post (${res.status})`);
  }
  return json.data as {
    text: string | null;
    photoUrl: string | null;
    preset: FeedPostPresetSummary | null;
    savedByMe: boolean;
  };
}

export async function deleteCommunityPostApi(postId: string): Promise<void> {
  const res = await fetch(`/api/community/posts/${postId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to delete post (${res.status})`);
  }
}

export async function patchWorkoutForFeedApi(
  workoutId: string,
  body: { isPublic?: boolean; photoUrl?: string | null },
): Promise<{ photoUrl: string | null; isPublic: boolean }> {
  const res = await fetch(`/api/workouts/${workoutId}`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `Failed to update workout (${res.status})`);
  }
  return json.data as { photoUrl: string | null; isPublic: boolean };
}

export async function togglePostLikeApi(
  postId: string,
): Promise<{ liked: boolean; likeCount: number }> {
  const res = await fetch(`/api/community/posts/${postId}/like`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Like failed (${res.status})`);
  }
  return res.json() as Promise<{ liked: boolean; likeCount: number }>;
}

export async function fetchPostCommentsApi(
  postId: string,
  limit = 50,
  offset = 0,
): Promise<{ data: WorkoutCommentRow[]; total: number }> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(`/api/community/posts/${postId}/comments?${params}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Comments failed (${res.status})`);
  }
  const json = await res.json();
  return {
    data: json.data as WorkoutCommentRow[],
    total: json.total as number,
  };
}

export async function postPostCommentApi(
  postId: string,
  text: string,
): Promise<WorkoutCommentRow> {
  const res = await fetch(`/api/community/posts/${postId}/comments`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `Comment failed (${res.status})`);
  }
  return json.data as WorkoutCommentRow;
}

export async function savePresetCopyApi(presetId: string): Promise<string> {
  const res = await fetch(`/api/presets/${presetId}/save`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `Save failed (${res.status})`);
  }
  return (json.data as { id: string }).id;
}

export async function fetchWorkoutCommentsApi(
  workoutId: string,
  limit = 50,
  offset = 0,
): Promise<{ data: WorkoutCommentRow[]; total: number }> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const res = await fetch(`/api/workouts/${workoutId}/comments?${params}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Comments failed (${res.status})`);
  }
  const json = await res.json();
  return {
    data: json.data as WorkoutCommentRow[],
    total: json.total as number,
  };
}

export async function postWorkoutCommentApi(
  workoutId: string,
  text: string,
): Promise<WorkoutCommentRow> {
  const res = await fetch(`/api/workouts/${workoutId}/comments`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `Comment failed (${res.status})`);
  }
  return json.data as WorkoutCommentRow;
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
  splitPreference: string | null;
  trainingDaysPerWeek: number | null;
  bestLifts: { benchPress?: number; squat?: number; deadlift?: number } | null;
  injuries: string[] | null;
  onboardingCompleted: boolean;
}

export interface UserProfile extends UserSettings {
  createdAt: string | null;
  updatedAt: string | null;
}

export interface OnboardingData {
  goal: string;
  experienceLevel: string;
  splitPreference: string;
  trainingDaysPerWeek: number;
  heightCm: number | null;
  weightKg: number | null;
  age: number | null;
  bestLifts: { benchPress?: number; squat?: number; deadlift?: number } | null;
  injuries: string[];
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

export interface ChartDataPoint {
  date: string;
  bestWeight: number;
  bestReps: number;
  volume: number;
  estimatedOneRM: number | null;
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
  chartData: ChartDataPoint[];
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
  days: 30 | 60 | 90 = 30,
): Promise<ProgressExerciseDetail> {
  const res = await fetch(`/api/progress/exercises/${exerciseId}?days=${days}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to fetch progress (${res.status})`);
  }
  const json = await res.json();
  return json.data as ProgressExerciseDetail;
}

// ─── Workout Presets ─────────────────────────────────────────

export async function fetchPresetsApi(): Promise<Preset[]> {
  const res = await fetch('/api/presets', { headers: getAuthHeaders() });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to fetch presets (${res.status})`);
  }
  const json = await res.json();
  return (json.data ?? []) as Preset[];
}

export async function fetchPresetApi(id: string): Promise<Preset> {
  const res = await fetch(`/api/presets/${id}`, { headers: getAuthHeaders() });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to fetch preset (${res.status})`);
  }
  const json = await res.json();
  return json.data as Preset;
}

export async function createPresetApi(payload: {
  name: string;
  exerciseIds: string[];
}): Promise<Preset> {
  const res = await fetch('/api/presets', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to create preset (${res.status})`);
  }
  const json = await res.json();
  return json.data as Preset;
}

export async function updatePresetApi(
  id: string,
  payload: { name: string; exerciseIds: string[] },
): Promise<Preset> {
  const res = await fetch(`/api/presets/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to update preset (${res.status})`);
  }
  const json = await res.json();
  return json.data as Preset;
}

export async function deletePresetApi(id: string): Promise<void> {
  const res = await fetch(`/api/presets/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to delete preset (${res.status})`);
  }
}

// ─── User Profile (Onboarding) ────────────────────────────────

export async function fetchProfileApi(): Promise<UserProfile | null> {
  const res = await fetch('/api/profile', { headers: getAuthHeaders() });
  if (res.status === 404) return null;
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to fetch profile (${res.status})`);
  }
  const json = await res.json();
  return json.data as UserProfile;
}

export async function saveProfileApi(data: OnboardingData): Promise<UserProfile> {
  const res = await fetch('/api/profile', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to save profile (${res.status})`);
  }
  const json = await res.json();
  return json.data as UserProfile;
}

export async function updateProfileApi(
  data: Partial<OnboardingData>,
): Promise<UserProfile> {
  const res = await fetch('/api/profile', {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to update profile (${res.status})`);
  }
  const json = await res.json();
  return json.data as UserProfile;
}

// ─── AI Coach ───────────────────────────────────────────────

export interface AiChatMessageRow {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export async function fetchAiChatHistoryApi(): Promise<AiChatMessageRow[]> {
  const res = await fetch('/api/ai/chat/history', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Failed to load chat (${res.status})`);
  }
  const json = await res.json();
  return (json.data?.messages ?? []) as AiChatMessageRow[];
}

export async function postAiChatApi(message: string): Promise<{ reply: string }> {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ message }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `Chat failed (${res.status})`);
  }
  return { reply: json.reply as string };
}

export interface AiWorkoutReportScores {
  total: number;
  volume: number;
  intensity: number;
  consistency: number;
  duration: number;
  prBonus: number;
}

export async function fetchAiWorkoutReportApi(
  workoutId: string,
): Promise<{ report: string; scores: AiWorkoutReportScores } | null> {
  const params = new URLSearchParams({ workoutId });
  const res = await fetch(`/api/ai/workout-report?${params}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error ?? `Report failed (${res.status})`);
  }
  const json = await res.json();
  if (!json.data) return null;
  return json.data as { report: string; scores: AiWorkoutReportScores };
}

export async function postAiWorkoutReportApi(
  workoutId: string,
): Promise<{ report: string; scores: AiWorkoutReportScores }> {
  const res = await fetch('/api/ai/workout-report', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ workoutId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `Report failed (${res.status})`);
  }
  return {
    report: json.report as string,
    scores: json.scores as AiWorkoutReportScores,
  };
}
