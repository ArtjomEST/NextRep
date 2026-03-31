'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type { WorkoutDraft, WorkoutExercise, WorkoutSet, Exercise, Workout, CardioTimerState } from '@/lib/types';
import {
  generateId,
  defaultWorkoutName,
  createEmptySet,
  createPrefilledSet,
  computeTotalVolume,
  computeDuration,
  computeImprovementMock,
  getNextPendingExerciseId,
} from './metrics';

const STORAGE_KEY = 'nextrep_workout_draft';
const HISTORY_KEY = 'nextrep_workout_history';

/** Deterministic initial state for SSR — same on server and client to avoid hydration mismatch. */
const INITIAL_DRAFT: WorkoutDraft = {
  id: 'init',
  name: 'Workout',
  status: 'planning',
  startedAt: null,
  endedAt: null,
  exercises: [],
  activeExerciseId: null,
  cardioTimers: {},
};

function createEmptyDraft(): WorkoutDraft {
  return {
    id: generateId(),
    name: defaultWorkoutName(),
    status: 'planning',
    startedAt: null,
    endedAt: null,
    exercises: [],
    activeExerciseId: null,
    cardioTimers: {},
  };
}

// ─── Actions ──────────────────────────────────────────────

type Action =
  | { type: 'LOAD_DRAFT'; draft: WorkoutDraft }
  | { type: 'SET_NAME'; name: string }
  | { type: 'ADD_EXERCISE'; exercise: Exercise }
  | { type: 'REMOVE_EXERCISE'; exerciseEntryId: string }
  | { type: 'REORDER_EXERCISES'; fromIndex: number; toIndex: number }
  | { type: 'ADD_SET'; exerciseEntryId: string }
  | { type: 'UPDATE_SET'; exerciseEntryId: string; setId: string; field: keyof Pick<WorkoutSet, 'weight' | 'reps'>; value: number }
  | { type: 'TOGGLE_SET_COMPLETE'; exerciseEntryId: string; setId: string }
  | { type: 'REMOVE_SET'; exerciseEntryId: string; setId: string }
  | { type: 'START_SESSION' }
  | { type: 'FINISH_SESSION' }
  | { type: 'RESET_DRAFT' }
  | { type: 'SET_ACTIVE_EXERCISE'; exerciseId: string }
  | { type: 'FINISH_EXERCISE'; exerciseId: string }
  | { type: 'RESTORE_EXERCISE'; exerciseId: string }
  | { type: 'CARDIO_INIT'; workoutExerciseId: string }
  | { type: 'CARDIO_START'; workoutExerciseId: string }
  | { type: 'CARDIO_STOP'; workoutExerciseId: string }
  | { type: 'CARDIO_SET_PARAM'; workoutExerciseId: string; paramKey: string; value: number };

function reducer(state: WorkoutDraft, action: Action): WorkoutDraft {
  switch (action.type) {
    case 'LOAD_DRAFT': {
      // Ensure cardioTimers exists (old drafts won't have it)
      // Also reset any running timers (startedAt) since page was reloaded
      const loadedTimers: Record<string, CardioTimerState> = {};
      for (const [k, v] of Object.entries(action.draft.cardioTimers ?? {})) {
        loadedTimers[k] = { ...v, startedAt: null };
      }
      return { ...action.draft, cardioTimers: loadedTimers };
    }

    case 'SET_NAME':
      return { ...state, name: action.name };

    case 'ADD_EXERCISE': {
      const ex = action.exercise;
      const already = state.exercises.some((e) => e.exerciseId === ex.id);
      if (already) return state;
      const entry: WorkoutExercise = {
        id: generateId(),
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroups: ex.muscleGroups,
        primaryMuscles: ex.primaryMuscles,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment,
        order: state.exercises.length,
        sets: [createEmptySet()],
        status: 'pending',
        measurementType: ex.measurementType,
      };
      const exercises = [...state.exercises, entry];
      const newState = {
        ...state,
        exercises,
        activeExerciseId: state.activeExerciseId ?? entry.id,
      };
      if (ex.measurementType === 'cardio') {
        return {
          ...newState,
          cardioTimers: {
            ...newState.cardioTimers,
            [entry.id]: { startedAt: null, elapsed: 0, params: {} },
          },
        };
      }
      return newState;
    }

    case 'REMOVE_EXERCISE': {
      const exercises = state.exercises
        .filter((e) => e.id !== action.exerciseEntryId)
        .map((e, i) => ({ ...e, order: i }));
      let activeId = state.activeExerciseId;
      if (activeId === action.exerciseEntryId) {
        activeId = getNextPendingExerciseId(exercises, null);
      }
      return { ...state, exercises, activeExerciseId: activeId };
    }

    case 'REORDER_EXERCISES': {
      const list = [...state.exercises];
      const [moved] = list.splice(action.fromIndex, 1);
      list.splice(action.toIndex, 0, moved);
      return { ...state, exercises: list.map((e, i) => ({ ...e, order: i })) };
    }

    case 'ADD_SET': {
      return {
        ...state,
        exercises: state.exercises.map((e) => {
          if (e.id !== action.exerciseEntryId) return e;
          return { ...e, sets: [...e.sets, createPrefilledSet(e)] };
        }),
      };
    }

    case 'UPDATE_SET':
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          e.id === action.exerciseEntryId
            ? {
                ...e,
                sets: e.sets.map((s) =>
                  s.id === action.setId ? { ...s, [action.field]: Math.max(0, action.value) } : s,
                ),
              }
            : e,
        ),
      };

    case 'TOGGLE_SET_COMPLETE':
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          e.id === action.exerciseEntryId
            ? {
                ...e,
                sets: e.sets.map((s) =>
                  s.id === action.setId ? { ...s, completed: !s.completed } : s,
                ),
              }
            : e,
        ),
      };

    case 'REMOVE_SET':
      return {
        ...state,
        exercises: state.exercises.map((e) =>
          e.id === action.exerciseEntryId
            ? { ...e, sets: e.sets.filter((s) => s.id !== action.setId) }
            : e,
        ),
      };

    case 'START_SESSION': {
      const firstPending = getNextPendingExerciseId(state.exercises, null);
      return {
        ...state,
        status: 'active',
        startedAt: new Date().toISOString(),
        activeExerciseId: firstPending ?? state.exercises[0]?.id ?? null,
      };
    }

    case 'FINISH_SESSION':
      return { ...state, status: 'finished', endedAt: new Date().toISOString() };

    case 'RESET_DRAFT':
      return createEmptyDraft();

    case 'SET_ACTIVE_EXERCISE':
      return { ...state, activeExerciseId: action.exerciseId };

    case 'FINISH_EXERCISE': {
      const exercises = state.exercises.map((e) =>
        e.id === action.exerciseId ? { ...e, status: 'completed' as const } : e,
      );
      const nextId = getNextPendingExerciseId(exercises, action.exerciseId);
      return { ...state, exercises, activeExerciseId: nextId };
    }

    case 'RESTORE_EXERCISE': {
      const exercises = state.exercises.map((e) =>
        e.id === action.exerciseId ? { ...e, status: 'pending' as const } : e,
      );
      return { ...state, exercises, activeExerciseId: action.exerciseId };
    }

    case 'CARDIO_INIT': {
      if (state.cardioTimers[action.workoutExerciseId]) return state;
      return {
        ...state,
        cardioTimers: {
          ...state.cardioTimers,
          [action.workoutExerciseId]: { startedAt: null, elapsed: 0, params: {} },
        },
      };
    }

    case 'CARDIO_START': {
      const timer = state.cardioTimers[action.workoutExerciseId];
      if (!timer || timer.startedAt !== null) return state;
      return {
        ...state,
        cardioTimers: {
          ...state.cardioTimers,
          [action.workoutExerciseId]: { ...timer, startedAt: Date.now() },
        },
      };
    }

    case 'CARDIO_STOP': {
      const timer = state.cardioTimers[action.workoutExerciseId];
      if (!timer || timer.startedAt === null) return state;
      const elapsed = timer.elapsed + (Date.now() - timer.startedAt) / 1000;
      return {
        ...state,
        cardioTimers: {
          ...state.cardioTimers,
          [action.workoutExerciseId]: { ...timer, startedAt: null, elapsed },
        },
      };
    }

    case 'CARDIO_SET_PARAM': {
      const timer = state.cardioTimers[action.workoutExerciseId];
      if (!timer) return state;
      return {
        ...state,
        cardioTimers: {
          ...state.cardioTimers,
          [action.workoutExerciseId]: {
            ...timer,
            params: { ...timer.params, [action.paramKey]: action.value },
          },
        },
      };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────

interface WorkoutContextValue {
  draft: WorkoutDraft;
  dispatch: React.Dispatch<Action>;
  savedWorkouts: Workout[];
  saveWorkoutToHistory: () => Workout | null;
  hasDraft: boolean;
}

const WorkoutContext = createContext<WorkoutContextValue | null>(null);

export function useWorkout(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext);
  if (!ctx) throw new Error('useWorkout must be used inside WorkoutProvider');
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [draft, dispatch] = useReducer(reducer, INITIAL_DRAFT);
  const [savedWorkouts, setSavedWorkouts] = React.useState<Workout[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as WorkoutDraft;
        if (parsed && parsed.exercises && parsed.status !== 'finished') {
          dispatch({ type: 'LOAD_DRAFT', draft: parsed });
        }
      }
      const history = localStorage.getItem(HISTORY_KEY);
      if (history) {
        setSavedWorkouts(JSON.parse(history) as Workout[]);
      }
    } catch {
      // ignore
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      if (draft.status === 'finished' || (draft.exercises.length === 0 && draft.status === 'planning')) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
      }
    } catch {
      // ignore
    }
  }, [draft]);

  const saveWorkoutToHistory = useCallback((): Workout | null => {
    if (draft.exercises.length === 0) return null;
    const now = new Date().toISOString();
    const workout: Workout = {
      id: draft.id,
      name: draft.name,
      date: now.slice(0, 10),
      startedAt: draft.startedAt ?? now,
      endedAt: draft.endedAt ?? now,
      exercises: draft.exercises,
      totalVolume: computeTotalVolume(draft.exercises),
      duration: computeDuration(draft.startedAt, draft.endedAt),
      improvement: computeImprovementMock(draft),
    };
    const updated = [workout, ...savedWorkouts];
    setSavedWorkouts(updated);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    dispatch({ type: 'RESET_DRAFT' });
    return workout;
  }, [draft, savedWorkouts]);

  const hasDraft = draft.exercises.length > 0 && draft.status !== 'finished';

  return React.createElement(
    WorkoutContext.Provider,
    { value: { draft, dispatch, savedWorkouts, saveWorkoutToHistory, hasDraft } },
    children,
  );
}
