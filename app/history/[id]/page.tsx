'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { theme } from '@/lib/theme';
import { fetchWorkoutDetailApi } from '@/lib/api/client';
import type { WorkoutDetail, WorkoutDetailExercise } from '@/lib/api/types';
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

function formatSetValue(
  set: { weight: number | null; reps: number | null; seconds: number | null },
  measurementType: string,
): string {
  if (measurementType === 'time') {
    return set.seconds != null ? `${set.seconds}s` : '\u2014';
  }
  if (measurementType === 'reps_only') {
    return set.reps != null ? `${set.reps} reps` : '\u2014';
  }
  if (set.weight != null && set.reps != null) {
    return `${set.weight}\u00d7${set.reps}`;
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

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchWorkoutDetailApi(id)
      .then(setWorkout)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

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
      {/* Back button + header */}
      <div>
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
          value={workout.totalVolume.toLocaleString()}
          unit="kg"
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
          <ExerciseDetailCard key={ex.id} exercise={ex} />
        ))}
      </section>
    </div>
  );
}

function ExerciseDetailCard({
  exercise,
}: {
  exercise: WorkoutDetailExercise;
}) {
  const setsText = exercise.sets
    .filter((s) => s.completed)
    .map((s) => formatSetValue(s, exercise.measurementType))
    .join(', ');

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

      {/* Sets table */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {exercise.sets.map((s) => (
          <div
            key={s.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 0',
              opacity: s.completed ? 1 : 0.5,
            }}
          >
            <span
              style={{
                width: '28px',
                color: theme.colors.textMuted,
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              #{s.setIndex}
            </span>
            <span
              style={{
                color: theme.colors.textPrimary,
                fontSize: '14px',
                fontWeight: 500,
                flex: 1,
              }}
            >
              {formatSetValue(s, exercise.measurementType)}
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

      {/* Compact summary line */}
      {setsText && (
        <p
          style={{
            color: theme.colors.textMuted,
            fontSize: '12px',
            margin: '8px 0 0',
            borderTop: `1px solid ${theme.colors.border}`,
            paddingTop: '8px',
          }}
        >
          {setsText}
        </p>
      )}
    </Card>
  );
}
