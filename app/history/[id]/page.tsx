'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { theme } from '@/lib/theme';
import { fetchWorkoutDetailApi, deleteWorkoutApi, fetchSettings } from '@/lib/api/client';
import type { WorkoutDetail, WorkoutDetailExercise, WorkoutDetailSet } from '@/lib/api/types';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDuration(sec: number | null): string {
  if (!sec) return '\u2014';
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

const KG_TO_LB = 2.20462;

function formatSetDisplay(
  set: WorkoutDetailSet,
  measurementType: string,
  weightUnit: 'kg' | 'lb',
): string {
  if (measurementType === 'time') {
    return set.seconds != null ? `${set.seconds} sec` : '\u2014';
  }
  if (measurementType === 'reps_only') {
    return set.reps != null ? `${set.reps} reps` : '\u2014';
  }
  if (measurementType === 'weight_reps') {
    if (set.weight != null && set.reps != null) {
      const w = set.weight;
      const displayWeight =
        weightUnit === 'lb' ? Math.round(w * KG_TO_LB) : w;
      const unit = weightUnit === 'lb' ? 'lbs' : 'kg';
      return `${displayWeight} ${unit} × ${set.reps} reps`;
    }
    if (set.reps != null) return `${set.reps} reps`;
    return '\u2014';
  }
  if (set.weight != null && set.reps != null) {
    const w = set.weight;
    const displayWeight =
      weightUnit === 'lb' ? Math.round(w * KG_TO_LB) : w;
    const unit = weightUnit === 'lb' ? 'lbs' : 'kg';
    return `${displayWeight} ${unit} × ${set.reps} reps`;
  }
  if (set.reps != null) return `${set.reps} reps`;
  return '\u2014';
}

export default function WorkoutDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [workout, setWorkout] = useState<WorkoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [units, setUnits] = useState<'kg' | 'lb'>('kg');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [detail, settings] = await Promise.all([
        fetchWorkoutDetailApi(id),
        fetchSettings().catch(() => null),
      ]);
      setWorkout(detail);
      if (settings?.units) setUnits(settings.units);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workout');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteWorkoutApi(id);
      setDeleteModalOpen(false);
      router.push('/history');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          paddingTop: '16px',
        }}
      >
        <div
          style={{
            height: '24px',
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.sm,
            width: '80px',
          }}
        />
        <div
          style={{
            height: '28px',
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.sm,
            width: '60%',
          }}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
          }}
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '72px',
                backgroundColor: theme.colors.card,
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.border}`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <p
          style={{
            color: theme.colors.error,
            fontSize: '15px',
            marginBottom: '16px',
          }}
        >
          {error ?? 'Workout not found'}
        </p>
        <button
          onClick={() => router.push('/history')}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.primary,
            fontSize: '15px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Back to History
        </button>
      </div>
    );
  }

  const volumeUnit = units === 'lb' ? 'lbs' : 'kg';
  const displayVolume =
    units === 'lb'
      ? Math.round(workout.totalVolume * KG_TO_LB)
      : workout.totalVolume;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        paddingTop: '16px',
        paddingBottom: '24px',
      }}
    >
      {/* Back button + header + menu */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => router.push('/history')}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.textSecondary,
            fontSize: '15px',
            cursor: 'pointer',
            padding: '4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginBottom: '12px',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          History
        </button>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                color: theme.colors.textPrimary,
                fontSize: '22px',
                fontWeight: 700,
                margin: 0,
              }}
            >
              {workout.name}
            </h1>
            <p
              style={{
                color: theme.colors.textMuted,
                fontSize: '14px',
                margin: '4px 0 0',
              }}
            >
              {formatDate(workout.createdAt)}
            </p>
          </div>

          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                background: 'none',
                border: 'none',
                padding: 8,
                cursor: 'pointer',
                color: theme.colors.textMuted,
                borderRadius: 8,
              }}
              aria-label="Menu"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="6" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="18" r="1.5" />
              </svg>
            </button>

            {menuOpen && (
              <>
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9998,
                  }}
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 4,
                    backgroundColor: theme.colors.card,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.sm,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    zIndex: 9999,
                    minWidth: 180,
                    overflow: 'hidden',
                  }}
                >
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setDeleteModalOpen(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'none',
                      border: 'none',
                      color: theme.colors.error,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    Delete workout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}
      >
        <StatCard
          label="Duration"
          value={formatDuration(workout.durationSec)}
        />
        <StatCard
          label="Volume"
          value={displayVolume.toLocaleString('en-US')}
          unit={volumeUnit}
        />
        <StatCard label="Sets" value={workout.totalSets} />
        <StatCard label="Exercises" value={workout.exercises.length} />
      </div>

      {/* Exercise sections */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <h2
          style={{
            color: theme.colors.textPrimary,
            fontSize: '16px',
            fontWeight: 600,
            margin: 0,
          }}
        >
          Exercises
        </h2>

        {workout.exercises.map((ex) => (
          <ExerciseDetailCard
            key={ex.id}
            exercise={ex}
            units={units}
            formatSetDisplay={formatSetDisplay}
          />
        ))}
      </section>

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 24,
          }}
        >
          <div
            style={{
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.border}`,
              padding: 24,
              maxWidth: 320,
              width: '100%',
            }}
          >
            <h3
              style={{
                color: theme.colors.textPrimary,
                fontSize: 18,
                fontWeight: 600,
                margin: '0 0 8px',
              }}
            >
              Delete this workout?
            </h3>
            <p
              style={{
                color: theme.colors.textSecondary,
                fontSize: 14,
                margin: '0 0 20px',
                lineHeight: 1.5,
              }}
            >
              This can&apos;t be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  background: 'transparent',
                  color: theme.colors.textSecondary,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: '10px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: theme.colors.error,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  opacity: deleting ? 0.7 : 1,
                }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseDetailCard({
  exercise,
  units,
  formatSetDisplay,
}: {
  exercise: WorkoutDetailExercise;
  units: 'kg' | 'lb';
  formatSetDisplay: (
    set: WorkoutDetailSet,
    mt: string,
    wu: 'kg' | 'lb',
  ) => string;
}) {
  const mt = exercise.measurementType;
  const headerLabels =
    mt === 'weight_reps'
      ? 'Weight · Reps'
      : mt === 'reps_only'
        ? 'Reps'
        : mt === 'time'
          ? 'Time'
          : '';

  return (
    <Card>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '10px',
        }}
      >
        <div>
          <h3
            style={{
              color: theme.colors.textPrimary,
              fontSize: '15px',
              fontWeight: 600,
              margin: 0,
            }}
          >
            {exercise.exerciseName}
          </h3>
          <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
            {exercise.category && (
              <span
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textSecondary,
                  fontSize: '11px',
                  fontWeight: 500,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                {exercise.category}
              </span>
            )}
          </div>
        </div>
        {exercise.status === 'completed' && (
          <span
            style={{
              backgroundColor: 'rgba(34,197,94,0.12)',
              color: theme.colors.success,
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '6px',
            }}
          >
            Done
          </span>
        )}
      </div>

      {headerLabels && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '6px 0 4px',
            borderBottom: `1px solid ${theme.colors.border}`,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              width: 28,
              color: 'transparent',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            #
          </span>
          <span
            style={{
              color: theme.colors.textMuted,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {headerLabels}
          </span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        {exercise.sets.map((s) => (
          <div
            key={s.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '6px 0',
              opacity: s.completed ? 1 : 0.5,
            }}
          >
            <span
              style={{
                width: 28,
                color: theme.colors.textMuted,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              #{s.setIndex}
            </span>
            <span
              style={{
                color: theme.colors.textPrimary,
                fontSize: 14,
                fontWeight: 500,
                flex: 1,
              }}
            >
              {formatSetDisplay(s, mt, units)}
            </span>
            {s.completed && (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.colors.success}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
