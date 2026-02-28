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
import { fetchExerciseDetailApi } from '@/lib/api/client';
import type { ExerciseDetail } from '@/lib/api/types';
import SetRow from '@/components/SetRow';
import RestTimer from '@/components/RestTimer';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import ExerciseInfoSheet from '@/components/ExerciseInfoSheet';

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const { draft, dispatch } = useWorkout();
  const [elapsed, setElapsed] = useState(0);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showAllDoneModal, setShowAllDoneModal] = useState(false);
  const [showRest, setShowRest] = useState(false);
  const [infoDetail, setInfoDetail] = useState<ExerciseDetail | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
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

  const scrollToExercise = useCallback((id: string) => {
    setTimeout(() => {
      exerciseRefs.current[id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);
  }, []);

  const handleToggleComplete = useCallback(
    (exerciseEntryId: string, setId: string) => {
      dispatch({ type: 'TOGGLE_SET_COMPLETE', exerciseEntryId, setId });
      setShowRest(true);
    },
    [dispatch],
  );

  function handleFinishExercise(exerciseId: string) {
    dispatch({ type: 'FINISH_EXERCISE', exerciseId });
    const nextId = getNextPendingExerciseId(
      draft.exercises.map((e) =>
        e.id === exerciseId
          ? { ...e, status: 'completed' as const }
          : e,
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

  async function handleOpenInfo(exerciseId: string) {
    setInfoOpen(true);
    setInfoLoading(true);
    setInfoDetail(null);

    try {
      const detail = await fetchExerciseDetailApi(exerciseId);
      setInfoDetail(detail);
    } catch {
      const entry = draft.exercises.find(
        (e) => e.exerciseId === exerciseId,
      );
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

  const totalVolume = computeTotalVolume(draft.exercises);
  const totalSets = computeTotalSets(draft.exercises);
  const totalExercises = computeTotalExercises(draft.exercises);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        paddingTop: '12px',
        paddingBottom: '80px',
      }}
    >
      {/* ─── Top Bar ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 0 16px',
          borderBottom: `1px solid ${theme.colors.border}`,
          marginBottom: '20px',
        }}
      >
        <div>
          <h1
            style={{
              color: theme.colors.textPrimary,
              fontSize: '18px',
              fontWeight: 700,
              margin: 0,
            }}
          >
            {draft.name}
          </h1>
          <span
            style={{
              color: theme.colors.primary,
              fontSize: '24px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.2,
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
            borderRadius: theme.radius.sm,
            padding: '12px 22px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Finish
        </button>
      </div>

      {/* ─── Exercise Cards ─── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {draft.exercises.map((entry) => {
          const isActive = draft.activeExerciseId === entry.id;
          const isCompleted = entry.status === 'completed';
          const completedSets = entry.sets.filter(
            (s) => s.completed,
          ).length;

          return (
            <section
              key={entry.id}
              ref={(el) => {
                exerciseRefs.current[entry.id] = el;
              }}
              style={{
                backgroundColor: isActive
                  ? theme.colors.card
                  : theme.colors.surface,
                border: `1.5px solid ${isActive ? theme.colors.primary : theme.colors.border}`,
                borderRadius: theme.radius.md,
                padding: isActive ? '16px' : '14px 16px',
                transition: 'all 0.2s ease',
                boxShadow: isActive
                  ? `0 0 20px rgba(31,138,91,0.08)`
                  : 'none',
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
                  minHeight: '44px',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isCompleted
                      ? theme.colors.success
                      : isActive
                        ? theme.colors.primary
                        : theme.colors.border,
                    flexShrink: 0,
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <h2
                      style={{
                        color: isCompleted
                          ? theme.colors.textMuted
                          : theme.colors.textPrimary,
                        fontSize: '16px',
                        fontWeight: 600,
                        margin: 0,
                        textDecoration: isCompleted
                          ? 'line-through'
                          : 'none',
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
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '4px',
                        }}
                      >
                        Done
                      </span>
                    )}
                  </div>
                  {!isActive && !isCompleted && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '5px',
                        marginTop: '4px',
                        flexWrap: 'wrap',
                      }}
                    >
                      {entry.muscleGroups.map((mg) => (
                        <span key={mg} style={tagStyle}>
                          {mg}
                        </span>
                      ))}
                    </div>
                  )}
                  {!isActive && isCompleted && (
                    <span
                      style={{
                        color: theme.colors.textMuted,
                        fontSize: '12px',
                      }}
                    >
                      {completedSets} set
                      {completedSets !== 1 ? 's' : ''} completed
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                  }}
                >
                  {isCompleted && !isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestoreExercise(entry.id);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.colors.textSecondary,
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        padding: '6px 10px',
                      }}
                    >
                      Restore
                    </button>
                  )}
                  {!isActive && !isCompleted && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={theme.colors.textMuted}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                  {isActive && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={theme.colors.textMuted}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                  )}
                </div>
              </div>

              {/* ─── Expanded content (active only) ─── */}
              {isActive && (
                <div style={{ marginTop: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '8px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '5px',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                      }}
                    >
                      {entry.muscleGroups.map((mg) => (
                        <span key={mg} style={tagStyle}>
                          {mg}
                        </span>
                      ))}
                      <span style={equipTagStyle}>
                        {entry.equipment}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenInfo(entry.exerciseId);
                      }}
                      style={{
                        background: 'none',
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: '6px',
                        color: theme.colors.textMuted,
                        cursor: 'pointer',
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line
                          x1="12"
                          y1="16"
                          x2="12"
                          y2="12"
                        />
                        <line
                          x1="12"
                          y1="8"
                          x2="12.01"
                          y2="8"
                        />
                      </svg>
                      Info
                    </button>
                  </div>

                  {/* Sets */}
                  <div>
                    {entry.sets.map((set, si) => (
                      <SetRow
                        key={set.id}
                        index={si}
                        set={set}
                        onUpdateWeight={(v) =>
                          dispatch({
                            type: 'UPDATE_SET',
                            exerciseEntryId: entry.id,
                            setId: set.id,
                            field: 'weight',
                            value: v,
                          })
                        }
                        onUpdateReps={(v) =>
                          dispatch({
                            type: 'UPDATE_SET',
                            exerciseEntryId: entry.id,
                            setId: set.id,
                            field: 'reps',
                            value: v,
                          })
                        }
                        onToggleComplete={() =>
                          handleToggleComplete(entry.id, set.id)
                        }
                        onRemove={() =>
                          dispatch({
                            type: 'REMOVE_SET',
                            exerciseEntryId: entry.id,
                            setId: set.id,
                          })
                        }
                      />
                    ))}
                  </div>

                  {/* Add set + Finish exercise */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '12px',
                    }}
                  >
                    <button
                      onClick={() =>
                        dispatch({
                          type: 'ADD_SET',
                          exerciseEntryId: entry.id,
                        })
                      }
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: theme.colors.surface,
                        border: `1px dashed ${theme.colors.border}`,
                        borderRadius: theme.radius.sm,
                        color: theme.colors.textSecondary,
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                      }}
                    >
                      + Add Set
                    </button>
                    <button
                      onClick={() =>
                        handleFinishExercise(entry.id)
                      }
                      style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: theme.colors.primary,
                        border: 'none',
                        borderRadius: theme.radius.sm,
                        color: theme.colors.textPrimary,
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Finish Exercise
                    </button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* ─── Rest Timer ─── */}
      <RestTimer
        visible={showRest}
        onDismiss={() => setShowRest(false)}
      />

      {/* ─── Exercise Info Sheet ─── */}
      <ExerciseInfoSheet
        exercise={infoDetail}
        open={infoOpen}
        loading={infoLoading}
        onClose={handleCloseInfo}
      />

      {/* ─── All Done Modal ─── */}
      <Modal
        open={showAllDoneModal}
        onClose={() => setShowAllDoneModal(false)}
      >
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
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.colors.success}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h3
            style={{
              color: theme.colors.textPrimary,
              fontSize: '18px',
              fontWeight: 700,
              margin: '0 0 6px',
            }}
          >
            All exercises completed
          </h3>
          <p
            style={{
              color: theme.colors.textSecondary,
              fontSize: '14px',
              margin: 0,
            }}
          >
            Finish your workout?
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <Button fullWidth onClick={handleFinishWorkout}>
            Finish Workout
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => setShowAllDoneModal(false)}
          >
            Continue Editing
          </Button>
        </div>
      </Modal>

      {/* ─── Manual Finish Modal ─── */}
      <Modal
        open={showFinishModal}
        onClose={() => setShowFinishModal(false)}
      >
        <h3
          style={{
            color: theme.colors.textPrimary,
            fontSize: '18px',
            fontWeight: 700,
            margin: '0 0 16px',
          }}
        >
          Finish workout?
        </h3>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <ModalStat label="Exercises" value={String(totalExercises)} />
          <ModalStat label="Sets" value={String(totalSets)} />
          <ModalStat
            label="Volume"
            value={`${totalVolume.toLocaleString()} kg`}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <Button fullWidth onClick={handleFinishWorkout}>
            Confirm &amp; Finish
          </Button>
          <Button
            variant="ghost"
            fullWidth
            onClick={() => setShowFinishModal(false)}
          >
            Keep Going
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function ModalStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <p
        style={{
          color: theme.colors.textMuted,
          fontSize: '11px',
          margin: 0,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </p>
      <p
        style={{
          color: theme.colors.textPrimary,
          fontSize: '18px',
          fontWeight: 700,
          margin: '4px 0 0',
        }}
      >
        {value}
      </p>
    </div>
  );
}

const tagStyle: React.CSSProperties = {
  backgroundColor: theme.colors.surface,
  color: theme.colors.textSecondary,
  fontSize: '10px',
  fontWeight: 500,
  padding: '2px 7px',
  borderRadius: '5px',
  border: `1px solid ${theme.colors.border}`,
};

const equipTagStyle: React.CSSProperties = {
  backgroundColor: 'rgba(31,138,91,0.12)',
  color: theme.colors.primary,
  fontSize: '10px',
  fontWeight: 500,
  padding: '2px 7px',
  borderRadius: '5px',
};
