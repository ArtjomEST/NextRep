// ─── Save Workout Request / Response ────────────────────────

export interface SaveWorkoutSetPayload {
  setIndex: number;
  completed: boolean;
  weight: number | null;
  reps: number | null;
  seconds: number | null;
}

export interface SaveWorkoutExercisePayload {
  exerciseId: string;
  order: number;
  status: 'pending' | 'completed';
  sets: SaveWorkoutSetPayload[];
}

export interface SaveWorkoutRequest {
  name: string;
  startedAt?: string;
  endedAt?: string;
  durationSec?: number;
  notes?: string;
  /** Public workouts appear in followers' feeds. Default true when omitted. */
  isPublic?: boolean;
  /** Optional workout photo URL (e.g. Vercel Blob) after client upload. */
  photoUrl?: string | null;
  exercises: SaveWorkoutExercisePayload[];
}

export interface SaveWorkoutResponse {
  workoutId: string;
  createdAt: string;
  totalVolume: number;
  totalSets: number;
  durationSec: number | null;
}

// ─── Workout List Item (GET /api/workouts) ──────────────────

export interface WorkoutListItem {
  id: string;
  name: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  totalVolume: number;
  totalSets: number;
  durationSec: number | null;
  exerciseCount: number;
}

// ─── Workout Detail (GET /api/workouts/[id]) ────────────────

export interface WorkoutDetailSet {
  id: string;
  setIndex: number;
  weight: number | null;
  reps: number | null;
  seconds: number | null;
  completed: boolean;
}

export interface LastSet {
  weight: number | null;
  reps: number | null;
}

export interface WorkoutDetailExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: string | null;
  imageUrl: string | null;
  measurementType: string;
  order: number;
  status: string;
  sets: WorkoutDetailSet[];
  lastSets: LastSet[];
}

export interface WorkoutDetail {
  id: string;
  userId: string;
  name: string;
  startedAt: string | null;
  endedAt: string | null;
  durationSec: number | null;
  totalVolume: number;
  totalSets: number;
  notes: string | null;
  createdAt: string;
  exercises: WorkoutDetailExercise[];
}

// ─── Exercise Detail (GET /api/exercises/[id]) ──────────────

export interface ExerciseDetail {
  id: string;
  name: string;
  description: string | null;
  howTo: string | null;
  instructions: string[];
  category: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  measurementType: string;
  imageUrl: string | null;
  images: string[];
  source: string;
  sourceId: number | null;
}

// ─── Workout Presets ─────────────────────────────────────────

export interface Preset {
  id: string;
  userId: string;
  name: string;
  exerciseIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Community / Feed ───────────────────────────────────────

export interface FeedWorkoutLogLine {
  exerciseName: string;
  exerciseImageUrl: string | null;
  completedSets: number;
}

export interface FeedCommentPreview {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  text: string;
  createdAt: string;
}

/** Global / Following feed: completed public workout card. */
export interface FeedWorkoutItem {
  type: 'workout';
  workoutId: string;
  user: { id: string; name: string; avatarUrl: string | null };
  postedAt: string;
  name: string;
  durationSec: number | null;
  totalVolume: number;
  totalSets: number;
  hasPr: boolean;
  photoUrl: string | null;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  log: FeedWorkoutLogLine[];
  commentPreviews: FeedCommentPreview[];
}

export interface FeedPostPresetSummary {
  id: string;
  name: string;
  exerciseCount: number;
  exerciseNames: string[];
}

/** Community post in the merged feed. */
export interface FeedPostItem {
  type: 'post';
  postId: string;
  user: { id: string; name: string; avatarUrl: string | null };
  postedAt: string;
  text: string | null;
  photoUrl: string | null;
  preset: FeedPostPresetSummary | null;
  /** True when this post has a preset and the viewer has saved a copy (see workout_presets.saved_from_preset_id). */
  savedByMe: boolean;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  commentPreviews: FeedCommentPreview[];
}

export type FeedItem = FeedWorkoutItem | FeedPostItem;

export interface UserSearchHit {
  id: string;
  name: string;
  avatarUrl: string | null;
  isFollowing: boolean;
  isSelf: boolean;
}

export interface PublicProfileWorkout {
  id: string;
  name: string;
  endedAt: string;
  durationSec: number | null;
  totalVolume: number;
  totalSets: number;
  photoUrl: string | null;
}

export interface PublicProfileData {
  user: { id: string; name: string; avatarUrl: string | null };
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isSelf: boolean;
  totalWorkouts: number;
  totalVolume: number;
  publicWorkouts: PublicProfileWorkout[];
}

export interface WorkoutCommentRow {
  id: string;
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  text: string;
  createdAt: string;
}
