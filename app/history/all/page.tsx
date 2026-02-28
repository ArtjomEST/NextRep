'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import { theme } from '@/lib/theme';
import { fetchWorkoutsApi } from '@/lib/api/client';
import type { WorkoutListItem } from '@/lib/api/types';

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(sec: number | null): string {
  if (!sec) return '\u2014';
  const m = Math.round(sec / 60);
  return `${m} min`;
}

export default function HistoryAllPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const result = await fetchWorkoutsApi(PAGE_SIZE, offsetRef.current);
      setWorkouts((prev) => [...prev, ...result.data]);
      setTotal(result.total);
      offsetRef.current += result.data.length;
      setHasMore(result.data.length === PAGE_SIZE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    offsetRef.current = 0;
    setHasMore(true);
    fetchWorkoutsApi(PAGE_SIZE, 0)
      .then((result) => {
        setWorkouts(result.data);
        setTotal(result.total);
        offsetRef.current = result.data.length;
        setHasMore(result.data.length === PAGE_SIZE);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        paddingTop: '16px',
        paddingBottom: '100px',
      }}
    >
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
        History
      </button>

      <h1
        style={{
          color: theme.colors.textPrimary,
          fontSize: '24px',
          fontWeight: 700,
          margin: 0,
        }}
      >
        All Workouts
      </h1>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: 72,
                backgroundColor: theme.colors.card,
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.border}`,
              }}
            />
          ))}
        </div>
      )}

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

      {!loading && !error && workouts.length === 0 && (
        <Card>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p
              style={{
                color: theme.colors.textMuted,
                fontSize: '14px',
                margin: '0 0 16px',
              }}
            >
              No workouts yet. Complete your first workout to see it here!
            </p>
            <button
              onClick={() => router.push('/workout/new')}
              style={{
                padding: '10px 20px',
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.primary,
                color: theme.colors.textPrimary,
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Create your first workout
            </button>
          </div>
        </Card>
      )}

      {!loading && workouts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {workouts.map((w) => (
            <Card
              key={w.id}
              onClick={() => router.push(`/history/${w.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      color: theme.colors.textPrimary,
                      fontSize: '16px',
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {w.name}
                  </h3>
                  <p
                    style={{
                      color: theme.colors.textMuted,
                      fontSize: '13px',
                      margin: '4px 0 0 0',
                    }}
                  >
                    {formatDate(w.createdAt)} · {w.exerciseCount} exercises ·{' '}
                    {formatDuration(w.durationSec)}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <p
                    style={{
                      color: theme.colors.textPrimary,
                      fontSize: '15px',
                      fontWeight: 600,
                      margin: 0,
                    }}
                  >
                    {w.totalVolume.toLocaleString('en-US')} kg
                  </p>
                  <p
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: '13px',
                      margin: '4px 0 0 0',
                    }}
                  >
                    {w.totalSets} sets
                  </p>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={theme.colors.textMuted}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginLeft: 8 }}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </Card>
          ))}

          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              style={{
                padding: '14px',
                borderRadius: theme.radius.md,
                backgroundColor: theme.colors.surface,
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.textSecondary,
                fontSize: 14,
                fontWeight: 600,
                cursor: loadingMore ? 'not-allowed' : 'pointer',
                opacity: loadingMore ? 0.6 : 1,
              }}
            >
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          )}

          <p
            style={{
              color: theme.colors.textMuted,
              fontSize: 12,
              textAlign: 'center',
              margin: '8px 0 0',
            }}
          >
            {workouts.length} of {total} workouts
          </p>
        </div>
      )}
    </div>
  );
}
