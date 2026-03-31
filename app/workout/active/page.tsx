'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import { useWorkout } from '@/lib/workout/state';
import {
  formatDuration,
  computeTotalVolume,
  computeTotalSets,
  computeTotalExercises,
  getNextPendingExerciseId,
} from '@/lib/workout/metrics';
import { fetchExerciseDetailApi, fetchLastSetsApi } from '@/lib/api/client';
import type { ExerciseDetail } from '@/lib/api/types';
import type { Exercise } from '@/lib/types';
import SetRow from '@/components/SetRow';
import CardioExerciseCard from '@/components/CardioExerciseCard';
import RestTimer from '@/components/RestTimer';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import ExerciseInfoSheet from '@/components/ExerciseInfoSheet';
import ExercisePicker from '@/components/ExercisePicker';

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const { draft, dispatch } = useWorkout();
  const [elapsed, setElapsed] = useState(0);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showAllDoneModal, setShowAllDoneModal] = useState(false);
  const [showRest, setShowRest] = useState(false);
  const [restMinimized, setRestMinimized] = useState(false);
  const [lastLoggedSetIndex, setLastLoggedSetIndex] = useState(0);
  const [lastLoggedExerciseName, setLastLoggedExerciseName] = useState('');
  const [infoDetail, setInfoDetail] = useState<ExerciseDetail | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [lastSetsMap, setLastSetsMap] = useState<
    Record<string, { sets: Array<{ weight: number | null; reps: number | null }>; lastWorkoutDate: string }>
  >({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [removeConfirmEntry, setRemoveConfirmEntry] = useState<{
    id: string;
    name: string;
    hasLoggedSets: boolean;
  } | null>(null);
  const [exitingId, setExitingId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exerciseRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (draft.status === 'planning' && draft.exercises.length === 0) {
      router.replace('/workout/new');
    }
  }, [draft.status, draft.exercises.length, router]);

  useEffect(() => {
    if (draft.startedAt) {
      const start = new Date(draft.startedAt).getTime();
      const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
      tick();
      timerRef.current = setInterval(tick, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [draft.startedAt]);

  const exerciseIdKey = draft.exercises.map((e) => e.exerciseId).join(',');
  useEffect(() => {
    if (!exerciseIdKey) return;
    const ids = exerciseIdKey.split(',');
    fetchLastSetsApi(ids).then(setLastSetsMap).catch(() => {});
  }, [exerciseIdKey]);

  useEffect(() => {
    if (!exitingId) return;
    const t = setTimeout(() => {
      dispatch({ type: 'REMOVE_EXERCISE', exerciseEntryId: exitingId });
      setExitingId(null);
    }, 250);
    return () => clearTimeout(t);
  }, [exitingId, dispatch]);

  const scrollToExercise = useCallback((id: string) => {
    setTimeout(() => {
      exerciseRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }, []);

  const handleToggleComplete = useCallback(
    (exerciseEntryId: string, setId: string, exerciseName: string, setIndex: number, wasCompleted: boolean) => {
      setLastLoggedExerciseName(exerciseName);
      setLastLoggedSetIndex(setIndex);
      dispatch({ type: 'TOGGLE_SET_COMPLETE', exerciseEntryId, setId });
      if (!wasCompleted) {
        setShowRest(true);
        setRestMinimized(false);
      }
    },
    [dispatch],
  );

  function handleFinishExercise(exerciseId: string) {
    dispatch({ type: 'FINISH_EXERCISE', exerciseId });
    const nextId = getNextPendingExerciseId(
      draft.exercises.map((e) =>
        e.id === exerciseId ? { ...e, status: 'completed' as const } : e,
      ),
      exerciseId,
    );
    if (nextId) {
      scrollToExercise(nextId);
    } else {
      setShowAllDoneModal(true);
    }
  }

  function handleRestoreExercise(exerciseId: string) {
    dispatch({ type: 'RESTORE_EXERCISE', exerciseId });
    scrollToExercise(exerciseId);
  }

  function handleActivate(exerciseId: string) {
    const entry = draft.exercises.find((e) => e.id === exerciseId);
    if (!entry) return;
    if (entry.status === 'completed') {
      handleRestoreExercise(exerciseId);
    } else {
      dispatch({ type: 'SET_ACTIVE_EXERCISE', exerciseId });
      scrollToExercise(exerciseId);
    }
  }

  function handleFinishWorkout() {
    dispatch({ type: 'FINISH_SESSION' });
    setShowFinishModal(false);
    setShowAllDoneModal(false);
    router.push('/workout/summary');
  }

  function handleRestAddSet() {
    setShowRest(false);
    if (draft.activeExerciseId) {
      dispatch({ type: 'ADD_SET', exerciseEntryId: draft.activeExerciseId });
    }
  }

  function handleRestFinishExercise() {
    setShowRest(false);
    if (draft.activeExerciseId) {
      handleFinishExercise(draft.activeExerciseId);
    }
  }

  async function handleOpenInfo(exerciseId: string) {
    setInfoOpen(true);
    setInfoLoading(true);
    setInfoDetail(null);
    try {
      const detail = await fetchExerciseDetailApi(exerciseId);
      setInfoDetail(detail);
    } catch {
      const entry = draft.exercises.find((e) => e.exerciseId === exerciseId);
      if (entry) {
        setInfoDetail({
          id: entry.exerciseId,
          name: entry.exerciseName,
          description: null,
          howTo: null,
          instructions: [],
          category: null,
          primaryMuscles: [],
          secondaryMuscles: [],
          equipment: entry.equipment ? entry.equipment.split(', ') : [],
          measurementType: 'weight_reps',
          imageUrl: null,
          images: [],
          source: 'wger',
          sourceId: null,
        });
      }
    } finally {
      setInfoLoading(false);
    }
  }

  function handleCloseInfo() {
    setInfoOpen(false);
    setInfoDetail(null);
  }

  function handleAddExercises(exercises: Exercise[]) {
    exercises.forEach((ex) => dispatch({ type: 'ADD_EXERCISE', exercise: ex }));
    setPickerOpen(false);
  }

  function handleConfirmRemove() {
    if (!removeConfirmEntry) return;
    setExitingId(removeConfirmEntry.id);
    setRemoveConfirmEntry(null);
  }

  const totalVolume = computeTotalVolume(draft.exercises);
  const totalSets = computeTotalSets(draft.exercises);
  const totalExercises = computeTotalExercises(draft.exercises);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '16px',
        paddingBottom: showRest && restMinimized ? '140px' : '100px',
      }}
    >
      {/* ─── Top Bar ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          paddingBottom: '18px',
          borderBottom: `1px solid ${theme.colors.border}`,
          marginBottom: '18px',
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              color: theme.colors.textPrimary,
              fontSize: '22px',
              fontWeight: 800,
              margin: '0 0 4px',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {draft.name}
          </h1>
          <span
            style={{
              color: theme.colors.primary,
              fontSize: '15px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '0.01em',
            }}
          >
            {formatDuration(elapsed)}
          </span>
        </div>
        <button
          onClick={() => setShowFinishModal(true)}
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.textPrimary,
            border: 'none',
            borderRadius: '8px',
            padding: '10px 22px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          Finish
        </button>
      </div>

      {/* ─── Exercise Cards ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {draft.exercises.map((entry) => {
          const isActive = draft.activeExerciseId === entry.id;
          const isCompleted = entry.status === 'completed';
          const completedSets = entry.sets.filter((s) => s.completed).length;
          const muscleLabel = entry.muscleGroups.join(' · ').toUpperCase();

          if (entry.measurementType === 'cardio') {
            return (
              <section
                key={entry.id}
                ref={(el) => { exerciseRefs.current[entry.id] = el; }}
                style={{
                  backgroundColor: theme.colors.card,
                  border: `1.5px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
                  borderRadius: '14px',
                  padding: isActive ? '14px 16px' : '12px 14px',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease, transform 0.2s ease',
                  boxShadow: isActive ? `0 0 24px rgba(31,138,91,0.12)` : 'none',
                  opacity: exitingId === entry.id ? 0 : isCompleted ? 0.65 : 1,
                  transform: exitingId === entry.id ? 'scale(0.98)' : 'none',
                  pointerEvents: exitingId === entry.id ? 'none' : 'auto',
                }}
              >
                {/* ─── Cardio Header ─── */}
                <div
                  onClick={() => handleActivate(entry.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    minHeight: '40px',
                  }}
                >
                  {/* Status dot */}
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isCompleted
                        ? theme.colors.success
                        : isActive
                          ? theme.colors.primary
                          : theme.colors.textMuted,
                      flexShrink: 0,
                      transition: 'background-color 0.2s ease',
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2
                        style={{
                          color: isCompleted ? theme.colors.textMuted : theme.colors.textPrimary,
                          fontSize: '15px',
                          fontWeight: 600,
                          margin: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {entry.exerciseName}
                      </h2>
                      {isCompleted && (
                        <span
                          style={{
                            backgroundColor: 'rgba(34,197,94,0.12)',
                            color: theme.colors.success,
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            flexShrink: 0,
                          }}
                        >
                          Done
                        </span>
                      )}
                    </div>
                    {/* CARDIO badge */}
                    <div style={{ marginTop: 4 }}>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
                        borderRadius: 5, padding: '1px 6px',
                      }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#3B82F6' }} />
                        <span style={{ fontSize: 9, fontWeight: 600, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          CARDIO
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const hasLoggedSets = (draft.cardioTimers[entry.id]?.elapsed ?? 0) > 0;
                        setRemoveConfirmEntry({ id: entry.id, name: entry.exerciseName, hasLoggedSets });
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.colors.textMuted,
                        cursor: 'pointer',
                        padding: '6px 4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        fontSize: '16px',
                        opacity: 0.4,
                        transition: 'opacity 0.15s ease',
                        lineHeight: 1,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; }}
                      aria-label="Remove exercise"
                    >
                      ✕
                    </button>
                    {isCompleted && !isActive && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRestoreExercise(entry.id); }}
                        style={{
                          background: 'none',
                          border: `1px solid ${theme.colors.border}`,
                          borderRadius: '6px',
                          color: theme.colors.textMuted,
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: '4px 8px',
                        }}
                      >
                        Restore
                      </button>
                    )}
                    {!isActive ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* ─── Expanded body (active only) ─── */}
                {isActive && (
                  <div style={{ marginTop: '14px' }}>
                    <CardioExerciseCard
                      workoutExerciseId={entry.id}
                      exerciseName={entry.exerciseName}
                      timerState={draft.cardioTimers[entry.id] ?? { startedAt: null, elapsed: 0, params: {} }}
                      onStart={() => dispatch({ type: 'CARDIO_START', workoutExerciseId: entry.id })}
                      onStop={() => dispatch({ type: 'CARDIO_STOP', workoutExerciseId: entry.id })}
                      onDone={() => {
                        if (draft.cardioTimers[entry.id]?.startedAt !== null) {
                          dispatch({ type: 'CARDIO_STOP', workoutExerciseId: entry.id });
                        }
                        handleFinishExercise(entry.id);
                      }}
                      onSetParam={(paramKey, value) => dispatch({ type: 'CARDIO_SET_PARAM', workoutExerciseId: entry.id, paramKey, value })}
                    />
                  </div>
                )}
              </section>
            );
          }

          return (
            <section
              key={entry.id}
              ref={(el) => { exerciseRefs.current[entry.id] = el; }}
              style={{
                backgroundColor: theme.colors.card,
                border: `1.5px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
                borderRadius: '14px',
                padding: isActive ? '14px 16px' : '12px 14px',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease, transform 0.2s ease',
                boxShadow: isActive ? `0 0 24px rgba(31,138,91,0.12)` : 'none',
                opacity: exitingId === entry.id ? 0 : isCompleted ? 0.65 : 1,
                transform: exitingId === entry.id ? 'scale(0.98)' : 'none',
                pointerEvents: exitingId === entry.id ? 'none' : 'auto',
              }}
            >
              {/* ─── Exercise Header ─── */}
              <div
                onClick={() => handleActivate(entry.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  cursor: 'pointer',
                  minHeight: '40px',
                }}
              >
                {/* Status dot */}
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted
                      ? theme.colors.success
                      : isActive
                        ? theme.colors.primary
                        : theme.colors.textMuted,
                    flexShrink: 0,
                    transition: 'background-color 0.2s ease',
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2
                      style={{
                        color: isCompleted ? theme.colors.textMuted : theme.colors.textPrimary,
                        fontSize: '15px',
                        fontWeight: 600,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.exerciseName}
                    </h2>
                    {isCompleted && (
                      <span
                        style={{
                          backgroundColor: 'rgba(34,197,94,0.12)',
                          color: theme.colors.success,
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          flexShrink: 0,
                        }}
                      >
                        Done
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      color: theme.colors.textMuted,
                      fontSize: '11px',
                      fontWeight: 500,
                      margin: '2px 0 0',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {isCompleted
                      ? `${muscleLabel} · ${completedSets} SET${completedSets !== 1 ? 'S' : ''} DONE`
                      : muscleLabel}
                  </p>
                </div>

                {/* Right action */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const hasLoggedSets = entry.sets.some((s) => s.completed);
                      setRemoveConfirmEntry({
                        id: entry.id,
                        name: entry.exerciseName,
                        hasLoggedSets,
                      });
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: theme.colors.textMuted,
                      cursor: 'pointer',
                      padding: '6px 4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: '16px',
                      opacity: 0.4,
                      transition: 'opacity 0.15s ease',
                      lineHeight: 1,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; }}
                    aria-label="Remove exercise"
                  >
                    ✕
                  </button>
                  {isCompleted && !isActive && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRestoreExercise(entry.id); }}
                      style={{
                        background: 'none',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '6px',
                        color: theme.colors.textMuted,
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '4px 8px',
                      }}
                    >
                      Restore
                    </button>
                  )}
                  {!isActive ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={theme.colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  )}
                </div>
              </div>

              {/* ─── Expanded (active only) ─── */}
              {isActive && (
                <div style={{ marginTop: '14px' }}>
                  {/* Tags + Info button */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {entry.muscleGroups.map((mg) => (
                        <span key={mg} style={tagStyle}>{mg}</span>
                      ))}
                      {entry.equipment && (
                        <span style={equipTagStyle}>{entry.equipment}</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenInfo(entry.exerciseId); }}
                      style={{
                        background: 'none',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '6px',
                        color: theme.colors.textMuted,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      Info
                    </button>
                  </div>

                  {/* Last time block */}
                  {(() => {
                    const lastData = lastSetsMap[entry.exerciseId];
                    if (!lastData || lastData.sets.length === 0) return null;
                    const daysAgo = Math.floor(
                      (Date.now() - new Date(lastData.lastWorkoutDate).getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    const daysLabel =
                      daysAgo === 0 ? 'TODAY' : daysAgo === 1 ? '1 DAY AGO' : `${daysAgo} DAYS AGO`;
                    return (
                      <div
                        style={{
                          margin: '0 0 12px 0',
                          background: 'rgba(34, 197, 94, 0.06)',
                          border: '1px solid rgba(34, 197, 94, 0.18)',
                          borderRadius: '10px',
                          padding: '9px 12px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            marginBottom: '7px',
                            color: '#4B9E6A',
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4B9E6A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          LAST TIME · {daysLabel}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {lastData.sets.map((s, i) => (
                            <span
                              key={i}
                              style={{
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                padding: '4px 9px',
                                color: '#D1D5DB',
                                fontSize: '12px',
                                fontWeight: 600,
                              }}
                            >
                              {s.weight != null ? `${s.weight} kg × ${s.reps ?? 0}` : `${s.reps ?? 0} reps`}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Sets label */}
                  <p
                    style={{
                      color: theme.colors.textMuted,
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      margin: '0 0 2px',
                    }}
                  >
                    Sets
                  </p>

                  {/* Set rows */}
                  <div>
                    {entry.sets.map((set, si) => (
                      <SetRow
                        key={set.id}
                        index={si}
                        set={set}
                        onUpdateWeight={(v) =>
                          dispatch({ type: 'UPDATE_SET', exerciseEntryId: entry.id, setId: set.id, field: 'weight', value: v })
                        }
                        onUpdateReps={(v) =>
                          dispatch({ type: 'UPDATE_SET', exerciseEntryId: entry.id, setId: set.id, field: 'reps', value: v })
                        }
                        onToggleComplete={() =>
                          handleToggleComplete(entry.id, set.id, entry.exerciseName, si, set.completed)
                        }
                        onRemove={() =>
                          dispatch({ type: 'REMOVE_SET', exerciseEntryId: entry.id, setId: set.id })
                        }
                      />
                    ))}
                  </div>

                  {/* Add Set + Finish Exercise */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button
                      onClick={() => dispatch({ type: 'ADD_SET', exerciseEntryId: entry.id })}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: 'transparent',
                        border: `1px dashed ${theme.colors.border}`,
                        borderRadius: '10px',
                        color: theme.colors.textMuted,
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      + Add Set
                    </button>
                    <button
                      onClick={() => handleFinishExercise(entry.id)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: theme.colors.primary,
                        border: 'none',
                        borderRadius: '10px',
                        color: theme.colors.textPrimary,
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Finish Exercise →
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* ─── Add Exercise ─── */}
      <button
        onClick={() => setPickerOpen(true)}
        style={{
          width: '100%',
          backgroundColor: 'transparent',
          border: `1px dashed ${theme.colors.border}`,
          borderRadius: '10px',
          padding: '14px',
          color: theme.colors.textMuted,
          fontSize: '15px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'border-color 0.15s ease',
          marginTop: '10px',
        }}
      >
        + Add Exercise
      </button>

      {/* ─── Rest Timer Overlay / Mini ─── */}
      <RestTimer
        visible={showRest}
        isMinimized={restMinimized}
        workoutName={draft.name}
        exerciseName={lastLoggedExerciseName}
        setIndex={lastLoggedSetIndex}
        onMinimize={() => setRestMinimized(true)}
        onExpand={() => setRestMinimized(false)}
        onAddSet={handleRestAddSet}
        onFinishExercise={handleRestFinishExercise}
        onDismiss={() => { setShowRest(false); setRestMinimized(false); }}
      />

      {/* ─── Exercise Info Sheet ─── */}
      <ExerciseInfoSheet
        exercise={infoDetail}
        open={infoOpen}
        loading={infoLoading}
        onClose={handleCloseInfo}
      />

      {/* ─── Exercise Picker (add during workout) ─── */}
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={handleAddExercises}
        alreadyAddedIds={draft.exercises.map((e) => e.exerciseId)}
      />

      {/* ─── Remove Exercise Confirmation ─── */}
      <Modal
        open={removeConfirmEntry !== null}
        onClose={() => setRemoveConfirmEntry(null)}
      >
        <h3 style={{ color: theme.colors.textPrimary, fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>
          Remove exercise?
        </h3>
        <p style={{ color: theme.colors.textMuted, fontSize: '14px', margin: '0 0 16px' }}>
          {removeConfirmEntry?.hasLoggedSets
            ? `${removeConfirmEntry.name} has logged sets. Removing it will delete that data.`
            : 'This exercise will be removed from this workout.'}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button fullWidth onClick={handleConfirmRemove}>
            Remove
          </Button>
          <Button variant="ghost" fullWidth onClick={() => setRemoveConfirmEntry(null)}>
            Cancel
          </Button>
        </div>
      </Modal>

      {/* ─── All Done Modal ─── */}
      <Modal open={showAllDoneModal} onClose={() => setShowAllDoneModal(false)}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: 'rgba(34,197,94,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.colors.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3 style={{ color: theme.colors.textPrimary, fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>
            All exercises completed
          </h3>
          <p style={{ color: theme.colors.textMuted, fontSize: '14px', margin: 0 }}>
            Finish your workout?
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button fullWidth onClick={handleFinishWorkout}>Finish Workout</Button>
          <Button variant="ghost" fullWidth onClick={() => setShowAllDoneModal(false)}>Continue Editing</Button>
        </div>
      </Modal>

      {/* ─── Manual Finish Modal ─── */}
      <Modal open={showFinishModal} onClose={() => setShowFinishModal(false)}>
        <h3 style={{ color: theme.colors.textPrimary, fontSize: '18px', fontWeight: 700, margin: '0 0 16px' }}>
          Finish workout?
        </h3>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <ModalStat label="Exercises" value={String(totalExercises)} />
          <ModalStat label="Sets" value={String(totalSets)} />
          <ModalStat label="Volume" value={`${totalVolume.toLocaleString('en-US')} kg`} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Button fullWidth onClick={handleFinishWorkout}>Confirm &amp; Finish</Button>
          <Button variant="ghost" fullWidth onClick={() => setShowFinishModal(false)}>Keep Going</Button>
        </div>
      </Modal>
    </div>
  );
}

function ModalStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <p style={{ color: theme.colors.textMuted, fontSize: '11px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </p>
      <p style={{ color: theme.colors.textPrimary, fontSize: '18px', fontWeight: 700, margin: '4px 0 0' }}>
        {value}
      </p>
    </div>
  );
}

const tagStyle: React.CSSProperties = {
  backgroundColor: theme.colors.surface,
  color: theme.colors.textMuted,
  fontSize: '10px',
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: '5px',
  border: `1px solid ${theme.colors.border}`,
};

const equipTagStyle: React.CSSProperties = {
  backgroundColor: 'rgba(31,138,91,0.14)',
  color: theme.colors.primary,
  fontSize: '10px',
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: '5px',
};
