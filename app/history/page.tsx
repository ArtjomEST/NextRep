'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { theme } from '@/lib/theme';
import { fetchWorkoutsApi, fetchWorkoutStatsApi } from '@/lib/api/client';
import type { WorkoutListItem } from '@/lib/api/types';
import { HistoryProgressSection } from '@/components/HistoryProgressSection';

export const RECENT_LIMIT = 3;

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

export default function HistoryPage() {
  const router = useRouter();
  const [workouts, setWorkouts] = useState<WorkoutListItem[]>([]);
  const [stats, setStats] = useState<{ total: number; totalVolume: number; totalSets: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [workoutsRes, statsRes] = await Promise.all([
        fetchWorkoutsApi(RECENT_LIMIT, 0),
        fetchWorkoutStatsApi(),
      ]);
      setWorkouts(workoutsRes.data);
      setStats(statsRes);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load history',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = stats?.total ?? 0;
  const totalVolume = stats?.totalVolume ?? 0;
  const totalSets = stats?.totalSets ?? 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
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
        History
      </h1>

      {/* Overview stats */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <StatCard label="Workouts" value={total} />
        <StatCard
          label="Volume"
          value={
            totalVolume > 1000
              ? `${(totalVolume / 1000).toFixed(1)}k`
              : String(totalVolume)
          }
          unit="kg"
        />
        <StatCard label="Sets" value={totalSets} />
      </div>

      {/* Workout list */}
      <section>
        <h2
          style={{
            color: theme.colors.textPrimary,
            fontSize: '16px',
            fontWeight: 600,
            margin: '0 0 12px 0',
          }}
        >
          Recent Workouts
        </h2>

        {loading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: theme.colors.card,
                  borderRadius: theme.radius.md,
                  border: `1px solid ${theme.colors.border}`,
                  padding: '16px',
                  height: '72px',
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
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p
                style={{
                  color: theme.colors.textMuted,
                  fontSize: '14px',
                  margin: '0 0 16px',
                }}
              >
                No workouts yet. Complete your first workout to see it
                here!
              </p>
              <Button
                size="sm"
                onClick={() => router.push('/workout/new')}
              >
                Create your first workout
              </Button>
            </div>
          </Card>
        )}

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
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
                    {formatDate(w.createdAt)} &middot; {w.exerciseCount}{' '}
                    exercises &middot; {formatDuration(w.durationSec)}
                  </p>
                </div>
                <div
                  style={{
                    textAlign: 'right',
                    flexShrink: 0,
                    marginLeft: '12px',
                  }}
                >
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
                <div
                  style={{
                    flexShrink: 0,
                    marginLeft: '8px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
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
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            </Card>
          ))}

          {!loading && !error && total > RECENT_LIMIT && (
            <Card
              onClick={() => router.push('/history/all')}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px',
              }}
            >
              <span
                style={{
                  color: theme.colors.primary,
                  fontSize: '15px',
                  fontWeight: 600,
                }}
              >
                View all workouts
              </span>
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.colors.primary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Card>
          )}
        </div>
      </section>

      <HistoryProgressSection />
    </div>
  );
}
