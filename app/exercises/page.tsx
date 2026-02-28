'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import { searchExercisesRaw } from '@/lib/api/client';
import type { Exercise, MuscleGroup } from '@/lib/types';

const muscleGroups: MuscleGroup[] = [
  'Chest',
  'Back',
  'Legs',
  'Shoulders',
  'Arms',
  'Core',
];

const PAGE_SIZE = 50;

export default function ExercisesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<MuscleGroup | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadExercises = useCallback(
    async (q: string, filter: MuscleGroup | null, offset = 0) => {
      if (offset === 0) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      try {
        const result = await searchExercisesRaw(
          q,
          filter ?? undefined,
          PAGE_SIZE,
          offset,
        );
        if (offset === 0) {
          setExercises(result.data);
        } else {
          setExercises((prev) => [...prev, ...result.data]);
        }
        setTotal(result.total);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load exercises',
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadExercises(search, activeFilter, 0);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, activeFilter, loadExercises]);

  function handleLoadMore() {
    loadExercises(search, activeFilter, exercises.length);
  }

  const hasMore = exercises.length < total;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        paddingTop: '16px',
      }}
    >
      <h1
        style={{
          color: theme.colors.textPrimary,
          fontSize: '24px',
          fontWeight: 700,
          margin: 0,
        }}
      >
        Exercises
      </h1>

      {/* Search */}
      <div style={{ position: 'relative' }}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.colors.textMuted}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md,
            padding: '12px 14px 12px 42px',
            color: theme.colors.textPrimary,
            fontSize: '15px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Filter chips */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          paddingBottom: '4px',
        }}
      >
        {muscleGroups.map((mg) => (
          <button
            key={mg}
            onClick={() =>
              setActiveFilter(activeFilter === mg ? null : mg)
            }
            style={{
              backgroundColor:
                activeFilter === mg
                  ? theme.colors.primary
                  : theme.colors.surface,
              color:
                activeFilter === mg
                  ? theme.colors.textPrimary
                  : theme.colors.textSecondary,
              border:
                activeFilter === mg
                  ? 'none'
                  : `1px solid ${theme.colors.border}`,
              borderRadius: '20px',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            {mg}
          </button>
        ))}
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p
          style={{
            color: theme.colors.textMuted,
            fontSize: '13px',
            margin: 0,
          }}
        >
          {total} exercise{total !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                backgroundColor: theme.colors.card,
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.border}`,
                padding: '16px',
                height: '72px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239,68,68,0.1)',
            border: `1px solid ${theme.colors.error}`,
            borderRadius: theme.radius.md,
            padding: '12px 16px',
            color: theme.colors.error,
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* Exercise list */}
      {!loading && !error && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {exercises.map((exercise) => (
            <ExerciseListCard
              key={exercise.id}
              exercise={exercise}
              onClick={() => router.push(`/exercises/${exercise.id}`)}
            />
          ))}

          {exercises.length === 0 && (
            <p
              style={{
                color: theme.colors.textMuted,
                fontSize: '14px',
                textAlign: 'center',
                padding: '32px 0',
              }}
            >
              No exercises found
            </p>
          )}

          {/* Load more */}
          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.textSecondary,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.md,
                padding: '14px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: loadingMore ? 'not-allowed' : 'pointer',
                marginTop: '4px',
              }}
            >
              {loadingMore
                ? 'Loading...'
                : `Load more (${exercises.length} of ${total})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseListCard({
  exercise,
  onClick,
}: {
  exercise: Exercise;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: theme.radius.md,
        border: `1px solid ${theme.colors.border}`,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'border-color 0.15s ease',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            color: theme.colors.textPrimary,
            fontSize: '15px',
            fontWeight: 600,
            margin: 0,
          }}
        >
          {exercise.name}
        </h3>
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginTop: '8px',
            flexWrap: 'wrap',
          }}
        >
          {exercise.muscleGroups.map((mg) => (
            <span
              key={mg}
              style={{
                backgroundColor: theme.colors.surface,
                color: theme.colors.textSecondary,
                fontSize: '11px',
                fontWeight: 500,
                padding: '3px 8px',
                borderRadius: '6px',
                border: `1px solid ${theme.colors.border}`,
              }}
            >
              {mg}
            </span>
          ))}
          <span
            style={{
              backgroundColor: 'rgba(31, 138, 91, 0.12)',
              color: theme.colors.primary,
              fontSize: '11px',
              fontWeight: 500,
              padding: '3px 8px',
              borderRadius: '6px',
            }}
          >
            {exercise.equipment}
          </span>
        </div>
      </div>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke={theme.colors.textMuted}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ flexShrink: 0, marginLeft: '12px' }}
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
}
