'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { searchExercisesRaw } from '@/lib/api/client';
import type { Exercise, MuscleGroup } from '@/lib/types';
import { ui } from '@/lib/ui-styles';

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
        gap: ui.gap,
        paddingTop: 16,
        paddingBottom: 100,
      }}
    >
      <h1
        style={{
          color: ui.textPrimary,
          fontSize: 24,
          fontWeight: 800,
          margin: 0,
          letterSpacing: '0.02em',
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
          stroke={ui.textMuted}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: 'absolute',
            left: 14,
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
            background: ui.cardBg,
            border: ui.cardBorder,
            borderRadius: ui.cardRadius,
            padding: '12px 14px 12px 42px',
            color: ui.textPrimary,
            fontSize: 15,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Filter chips */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          paddingBottom: 4,
        }}
      >
        {muscleGroups.map((mg) => (
          <button
            key={mg}
            onClick={() =>
              setActiveFilter(activeFilter === mg ? null : mg)
            }
            style={{
              background: activeFilter === mg ? ui.accent : ui.cardBg,
              color: activeFilter === mg ? ui.textPrimary : ui.textLabel,
              border: activeFilter === mg ? 'none' : ui.cardBorder,
              borderRadius: 20,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {mg}
          </button>
        ))}
      </div>

      {!loading && !error && (
        <p style={{ color: ui.textMuted, fontSize: 13, margin: 0 }}>
          {total} exercise{total !== 1 ? 's' : ''} found
        </p>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              style={{
                background: ui.cardBg,
                border: ui.cardBorder,
                borderRadius: ui.cardRadius,
                padding: 18,
                height: 72,
              }}
            />
          ))}
        </div>
      )}

      {error && (
        <div
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid #EF4444',
            borderRadius: ui.cardRadius,
            padding: '12px 16px',
            color: '#EF4444',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              onClick={() => router.push(`/exercises/${exercise.id}`)}
              style={{
                background: ui.cardBg,
                border: ui.cardBorder,
                borderRadius: ui.cardRadius,
                padding: '16px 18px',
                cursor: 'pointer',
                boxShadow: ui.cardShadow,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ color: ui.textPrimary, fontSize: 15, fontWeight: 700, margin: 0 }}>
                  {exercise.name}
                </h3>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {exercise.muscleGroups.map((mg) => (
                    <span
                      key={mg}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        color: ui.textLabel,
                        fontSize: 11,
                        fontWeight: 500,
                        padding: '3px 8px',
                        borderRadius: 8,
                        border: ui.cardBorder,
                      }}
                    >
                      {mg}
                    </span>
                  ))}
                  <span
                    style={{
                      background: ui.accentSoft,
                      color: ui.accent,
                      fontSize: 11,
                      fontWeight: 500,
                      padding: '3px 8px',
                      borderRadius: 8,
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
                stroke={ui.textMuted}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ flexShrink: 0, marginLeft: 12 }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          ))}

          {exercises.length === 0 && (
            <p
              style={{
                color: ui.textMuted,
                fontSize: 14,
                textAlign: 'center',
                padding: '32px 0',
              }}
            >
              No exercises found
            </p>
          )}

          {hasMore && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              style={{
                background: ui.cardBg,
                color: ui.textLabel,
                border: ui.cardBorder,
                borderRadius: ui.cardRadius,
                padding: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: loadingMore ? 'not-allowed' : 'pointer',
                marginTop: 4,
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
