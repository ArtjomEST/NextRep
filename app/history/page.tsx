'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { fetchWorkoutsApi, fetchWorkoutStatsApi } from '@/lib/api/client';
import type { WorkoutListItem } from '@/lib/api/types';
import { HistoryProgressSection } from '@/components/HistoryProgressSection';
import { ui } from '@/lib/ui-styles';

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

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`;
  return kg.toLocaleString('en-US');
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
        History
      </h1>

      {/* Overview stats — same card style as Home */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 100px), 1fr))',
          gap: ui.sectionGap,
        }}
      >
        <div
          style={{
            background: ui.cardBg,
            border: ui.cardBorder,
            borderRadius: ui.cardRadius,
            padding: '16px 14px',
            boxShadow: ui.cardShadow,
          }}
        >
          <p style={{ color: ui.textMuted, fontSize: 10, fontWeight: 700, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Workouts
          </p>
          <p style={{ color: ui.textPrimary, fontSize: 'clamp(20px, 5.5vw, 24px)', fontWeight: 800, margin: '6px 0 0', fontVariantNumeric: 'tabular-nums' }}>
            {total}
          </p>
        </div>
        <div
          style={{
            background: ui.cardBg,
            border: ui.cardBorder,
            borderRadius: ui.cardRadius,
            padding: '16px 14px',
            boxShadow: ui.cardShadow,
          }}
        >
          <p style={{ color: ui.textMuted, fontSize: 10, fontWeight: 700, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Volume
          </p>
          <p style={{ color: ui.textPrimary, fontSize: 'clamp(20px, 5.5vw, 24px)', fontWeight: 800, margin: '6px 0 0', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {formatVolume(totalVolume)} kg
          </p>
        </div>
        <div
          style={{
            background: ui.cardBg,
            border: ui.cardBorder,
            borderRadius: ui.cardRadius,
            padding: '16px 14px',
            boxShadow: ui.cardShadow,
          }}
        >
          <p style={{ color: ui.textMuted, fontSize: 10, fontWeight: 700, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Sets
          </p>
          <p style={{ color: ui.textPrimary, fontSize: 'clamp(20px, 5.5vw, 24px)', fontWeight: 800, margin: '6px 0 0', fontVariantNumeric: 'tabular-nums' }}>
            {totalSets}
          </p>
        </div>
      </div>

      {/* Workout list */}
      <section>
        <h2
          style={{
            color: ui.textLabel,
            fontSize: 15,
            fontWeight: 700,
            margin: `0 0 ${ui.sectionGap}px 0`,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Recent Workouts
        </h2>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map((i) => (
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

        {!loading && !error && workouts.length === 0 && (
          <div
            style={{
              background: ui.cardBg,
              border: ui.cardBorder,
              borderRadius: ui.cardRadius,
              padding: 24,
              boxShadow: ui.cardShadow,
              textAlign: 'center',
            }}
          >
            <p style={{ color: ui.textMuted, fontSize: 14, margin: '0 0 16px' }}>
              No workouts yet. Complete your first workout to see it here!
            </p>
            <Button size="sm" onClick={() => router.push('/workout/new')}>
              Create your first workout
            </Button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {workouts.map((w) => (
            <div
              key={w.id}
              onClick={() => router.push(`/history/${w.id}`)}
              style={{
                cursor: 'pointer',
                background: ui.cardBg,
                border: ui.cardBorder,
                borderRadius: ui.cardRadius,
                padding: 18,
                boxShadow: ui.cardShadow,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ color: ui.textPrimary, fontSize: 16, fontWeight: 700, margin: 0 }}>
                    {w.name}
                  </h3>
                  <p style={{ color: ui.textMuted, fontSize: 13, margin: '4px 0 0' }}>
                    {formatDate(w.createdAt)} · {w.exerciseCount} exercises · {formatDuration(w.durationSec)}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <p style={{ color: ui.textPrimary, fontSize: 15, fontWeight: 700, margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                    {w.totalVolume.toLocaleString('en-US')} kg
                  </p>
                  <p style={{ color: ui.textLabel, fontSize: 13, margin: '4px 0 0' }}>
                    {w.totalSets} sets
                  </p>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={ui.textMuted}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ flexShrink: 0, marginLeft: 8, alignSelf: 'center' }}
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          ))}

          {!loading && !error && total > RECENT_LIMIT && (
            <div
              onClick={() => router.push('/history/all')}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 18,
                background: ui.cardBg,
                border: ui.cardBorder,
                borderRadius: ui.cardRadius,
                boxShadow: ui.cardShadow,
              }}
            >
              <span style={{ color: ui.accent, fontSize: 15, fontWeight: 600 }}>
                View all workouts
              </span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ui.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          )}
        </div>
      </section>

      <HistoryProgressSection />
    </div>
  );
}
