'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { theme } from '@/lib/theme';
import { fetchExerciseDetailApi } from '@/lib/api/client';
import { useWorkout } from '@/lib/workout/state';
import type { ExerciseDetail } from '@/lib/api/types';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function ExerciseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { dispatch, hasDraft } = useWorkout();

  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchExerciseDetailApi(id)
      .then(setExercise)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  function handleAddToWorkout() {
    if (!exercise) return;
    dispatch({
      type: 'ADD_EXERCISE',
      exercise: {
        id: exercise.id,
        name: exercise.name,
        muscleGroups: [],
        equipment: exercise.equipment.join(', ') || 'Bodyweight',
      },
    });

    if (hasDraft) {
      router.push('/workout/new');
    } else {
      router.push('/workout/new');
    }
  }

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
            height: '40px',
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.sm,
            width: '120px',
          }}
        />
        <div
          style={{
            height: '200px',
            backgroundColor: theme.colors.card,
            borderRadius: theme.radius.lg,
            border: `1px solid ${theme.colors.border}`,
          }}
        />
        <div
          style={{
            height: '24px',
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.sm,
            width: '60%',
          }}
        />
        <div
          style={{
            height: '120px',
            backgroundColor: theme.colors.card,
            borderRadius: theme.radius.md,
            border: `1px solid ${theme.colors.border}`,
          }}
        />
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div
        style={{
          padding: '48px 0',
          textAlign: 'center',
        }}
      >
        <p
          style={{
            color: theme.colors.error,
            fontSize: '15px',
            marginBottom: '16px',
          }}
        >
          {error ?? 'Exercise not found'}
        </p>
        <button
          onClick={() => router.push('/exercises')}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.primary,
            fontSize: '15px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Back to Exercises
        </button>
      </div>
    );
  }

  const allMuscles = [
    ...exercise.primaryMuscles,
    ...exercise.secondaryMuscles,
  ];

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
      {/* Back button */}
      <button
        onClick={() => router.push('/exercises')}
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
          alignSelf: 'flex-start',
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
        Exercises
      </button>

      {/* Title */}
      <h1
        style={{
          color: theme.colors.textPrimary,
          fontSize: '22px',
          fontWeight: 700,
          margin: 0,
        }}
      >
        {exercise.name}
      </h1>

      {/* Hero image */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16/10',
          borderRadius: theme.radius.lg,
          overflow: 'hidden',
          backgroundColor: theme.colors.card,
          border: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {exercise.imageUrl ? (
          <img
            src={exercise.imageUrl}
            alt={exercise.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              color: theme.colors.textMuted,
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6.5 6.5h11v11h-11z" />
              <circle cx="9" cy="9" r="1" />
              <path d="M17.5 17.5L14 13l-3 4-2-2-2.5 2.5" />
            </svg>
            <span style={{ fontSize: '13px' }}>No image available</span>
          </div>
        )}
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {exercise.category && (
          <Badge
            label={exercise.category}
            bgColor={theme.colors.surface}
            textColor={theme.colors.textSecondary}
            bordered
          />
        )}
        {allMuscles.map((m) => (
          <Badge
            key={m}
            label={m}
            bgColor="rgba(31, 138, 91, 0.12)"
            textColor={theme.colors.primary}
          />
        ))}
        {exercise.equipment.map((eq) => (
          <Badge
            key={eq}
            label={eq}
            bgColor="rgba(59, 130, 246, 0.12)"
            textColor={theme.colors.info}
          />
        ))}
      </div>

      {/* Instructions */}
      <Card>
        <h3
          style={{
            color: theme.colors.textPrimary,
            fontSize: '16px',
            fontWeight: 600,
            margin: '0 0 12px',
          }}
        >
          How to Perform
        </h3>
        {exercise.instructions.length > 0 ? (
          <ol
            style={{
              margin: 0,
              paddingLeft: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {exercise.instructions.map((step, i) => (
              <li
                key={i}
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: '14px',
                  lineHeight: 1.5,
                }}
              >
                {step}
              </li>
            ))}
          </ol>
        ) : (
          <p
            style={{
              color: theme.colors.textMuted,
              fontSize: '14px',
              margin: 0,
              fontStyle: 'italic',
            }}
          >
            No instructions available for this exercise yet.
          </p>
        )}
      </Card>

      {/* Quick facts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}
      >
        <FactCard label="Category" value={exercise.category ?? '—'} />
        <FactCard
          label="Muscles"
          value={
            allMuscles.length > 0
              ? allMuscles.slice(0, 3).join(', ')
              : '—'
          }
        />
        <FactCard
          label="Equipment"
          value={
            exercise.equipment.length > 0
              ? exercise.equipment.join(', ')
              : 'Bodyweight'
          }
        />
        <FactCard
          label="Type"
          value={exercise.measurementType.replace(/_/g, ' ')}
        />
      </div>

      {/* CTA */}
      <div style={{ marginTop: '4px' }}>
        <Button fullWidth size="lg" onClick={handleAddToWorkout}>
          Add to Workout
        </Button>
      </div>
    </div>
  );
}

function Badge({
  label,
  bgColor,
  textColor,
  bordered,
}: {
  label: string;
  bgColor: string;
  textColor: string;
  bordered?: boolean;
}) {
  return (
    <span
      style={{
        backgroundColor: bgColor,
        color: textColor,
        fontSize: '12px',
        fontWeight: 500,
        padding: '4px 10px',
        borderRadius: '8px',
        border: bordered ? `1px solid ${theme.colors.border}` : 'none',
      }}
    >
      {label}
    </span>
  );
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.border}`,
        padding: '14px',
      }}
    >
      <p
        style={{
          color: theme.colors.textMuted,
          fontSize: '12px',
          fontWeight: 500,
          margin: '0 0 4px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </p>
      <p
        style={{
          color: theme.colors.textPrimary,
          fontSize: '14px',
          fontWeight: 600,
          margin: 0,
          textTransform: 'capitalize',
        }}
      >
        {value}
      </p>
    </div>
  );
}
