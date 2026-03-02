'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import Skeleton from '@/components/Skeleton';
import { useAuth } from '@/lib/auth/context';
import { useWorkout } from '@/lib/workout/state';
import { getTelegramUser } from '@/lib/auth/client';
import {
  fetchWorkoutsApi,
  fetchWorkoutDetailApi,
  fetchWorkoutStatsApi,
} from '@/lib/api/client';
import type { WorkoutListItem, WorkoutDetail } from '@/lib/api/types';
import { getTimeGreeting, getHomeStats } from '@/lib/home/utils';
import { ui } from '@/lib/ui-styles';
import LegendsWorkoutSlider from '@/components/LegendsWorkoutSlider';

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`;
  return kg.toLocaleString('en-US');
}

export default function HomePage() {
  const router = useRouter();
  const { status: authStatus, user } = useAuth();
  const { hasDraft, draft, dispatch } = useWorkout();

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutListItem[]>([]);
  const [latestDetail, setLatestDetail] = useState<WorkoutDetail | null>(null);
  const [totalVolumeFromApi, setTotalVolumeFromApi] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tg = getTelegramUser();
    setPhotoUrl(tg?.photo_url ?? null);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes] = await Promise.all([
        fetchWorkoutsApi(30, 0),
        fetchWorkoutStatsApi().catch(() => null),
      ]);
      const list = listRes.data;
      setWorkouts(list);
      if (statsRes?.totalVolume != null) {
        setTotalVolumeFromApi(Number(statsRes.totalVolume));
      } else {
        setTotalVolumeFromApi(null);
      }
      if (list.length >= 1) {
        const detail = await fetchWorkoutDetailApi(list[0].id);
        setLatestDetail(detail);
      } else {
        setLatestDetail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      setWorkouts([]);
      setLatestDetail(null);
      setTotalVolumeFromApi(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = getHomeStats(workouts, latestDetail, totalVolumeFromApi);
  const latestItem = workouts[0] ?? null;

  const handleDiscardDraft = () => {
    dispatch({ type: 'RESET_DRAFT' });
  };

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Athlete';
  const initials = displayName
    .split(/\s+/)
    .map((s) => s.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
  const greeting = getTimeGreeting();

  const { cardBg: statCardBg, cardBorder: statCardBorder, textMuted: textMutedSoft, textLabel: textLabelSoft } = ui;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: ui.gap, paddingBottom: 8 }}>
      {/* ─── 1) Header: greeting + name left, avatar right ───────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          padding: '14px 0 6px',
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              color: textLabelSoft,
              fontSize: 13,
              margin: 0,
              textTransform: 'none',
              letterSpacing: '0.01em',
            }}
          >
            {greeting}
          </p>
          <h1
            style={{
              color: '#f3f4f6',
              fontSize: 24,
              fontWeight: 800,
              margin: '4px 0 0',
              lineHeight: 1.2,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {authStatus === 'loading' ? (
              <Skeleton width={140} height={28} />
            ) : (
              displayName
            )}
          </h1>
        </div>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              width={52}
              height={52}
              style={{
                borderRadius: 12,
                objectFit: 'cover',
                border: `2px solid rgba(255,255,255,0.08)`,
              }}
            />
          ) : (
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: 'linear-gradient(145deg, #1a5c3a 0%, #165834 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 17,
                fontWeight: 800,
                color: '#f3f4f6',
                letterSpacing: '0.02em',
              }}
            >
              {authStatus === 'loading' ? '' : initials}
            </div>
          )}
          <span
            style={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              border: '2px solid #0E1114',
              boxShadow: '0 0 0 1px rgba(34,197,94,0.5)',
            }}
          />
        </div>
      </header>

      {/* ─── 2) Hero CTA: layered divs only (no background/backgroundImage mix) ─ */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push('/start')}
        onKeyDown={(e) => e.key === 'Enter' && router.push('/start')}
        style={{
          borderRadius: 18,
          padding: '24px 20px',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow:
            '0 4px 6px -1px rgba(0,0,0,0.3), 0 10px 28px -4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Layer 1: base gradient */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: ui.heroGradient,
            pointerEvents: 'none',
          }}
        />
        {/* Layer 2: radial glow top-right */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: ui.heroGlowOuter,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -20,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: ui.heroGlowInner,
            pointerEvents: 'none',
          }}
        />
        <p
          style={{
            color: 'rgba(180,220,190,0.9)',
            fontSize: 11,
            fontWeight: 700,
            margin: 0,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            position: 'relative',
          }}
        >
          Ready to train?
        </p>
        <p
          style={{
            color: '#ffffff',
            fontSize: 'clamp(26px, 7vw, 34px)',
            fontWeight: 800,
            margin: '10px 0 0',
            letterSpacing: '0.02em',
            textTransform: 'uppercase',
            lineHeight: 1.15,
            position: 'relative',
            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
        >
          Start Workout
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: 24,
            position: 'relative',
          }}
        >
          <div>
            <p
              style={{
                color: textLabelSoft,
                fontSize: 10,
                fontWeight: 700,
                margin: 0,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              Streak
            </p>
            <p style={{ color: '#ffffff', fontSize: 17, fontWeight: 700, margin: '4px 0 0' }}>
              {stats.streak} day{stats.streak !== 1 ? 's' : ''} 🔥
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                color: textLabelSoft,
                fontSize: 10,
                fontWeight: 700,
                margin: 0,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              This week
            </p>
            <p style={{ color: '#ffffff', fontSize: 17, fontWeight: 700, margin: '4px 0 0' }}>
              {stats.thisWeekDone}/{stats.thisWeekTarget}
            </p>
          </div>
        </div>
      </div>

      {/* ─── 3) Resume Workout (only if draft) ─────────────────────────── */}
      {hasDraft && (
        <div
          style={{
            background: 'linear-gradient(145deg, #1a2420 0%, #151b21 100%)',
            border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 14,
            padding: 18,
            boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <p style={{ color: '#f3f4f6', fontSize: 16, fontWeight: 700, margin: 0 }}>
              {draft.name}
            </p>
            <p style={{ color: textLabelSoft, fontSize: 13, margin: '4px 0 0' }}>
              {draft.exercises.length} exercise{draft.exercises.length !== 1 ? 's' : ''} ·{' '}
              {draft.exercises.reduce((n, e) => n + e.sets.length, 0)} sets
              {draft.startedAt && (
                <> · Started {Math.floor((Date.now() - new Date(draft.startedAt).getTime()) / 60000)} min ago</>
              )}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              size="sm"
              onClick={() =>
                router.push(draft.status === 'active' ? '/workout/active' : '/workout/new')
              }
            >
              Continue
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDiscardDraft} style={{ color: ui.error }}>
              Discard
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p style={{ color: ui.error, fontSize: 14, margin: 0 }}>{error}</p>
      )}

      {loading ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 12 }}>
            <div style={{ background: statCardBg, border: statCardBorder, borderRadius: ui.cardRadius, padding: 18 }}><Skeleton height={72} /></div>
            <div style={{ background: statCardBg, border: statCardBorder, borderRadius: ui.cardRadius, padding: 18 }}><Skeleton height={72} /></div>
            <div style={{ background: statCardBg, border: statCardBorder, borderRadius: ui.cardRadius, padding: 18 }}><Skeleton height={72} /></div>
          </div>
          <div style={{ background: statCardBg, border: statCardBorder, borderRadius: ui.cardRadius, padding: 18 }}><Skeleton height={60} /></div>
        </>
      ) : (
        <>
          {/* ─── 4) Three stat cards: darker elevated surface, soft border, screenshot proportions ─ */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))',
              gap: 14,
            }}
          >
            <div
              style={{
                background: statCardBg,
                border: statCardBorder,
                borderRadius: 14,
                padding: '16px 14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              }}
            >
              <p
                style={{
                  color: textMutedSoft,
                  fontSize: 10,
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Total Volume
              </p>
              <p
                style={{
                  color: '#f3f4f6',
                  fontSize: 'clamp(20px, 5.5vw, 24px)',
                  fontWeight: 800,
                  margin: '6px 0 0',
                  fontVariantNumeric: 'tabular-nums',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatVolume(stats.totalVolumeAllTime)} kg
              </p>
              <p style={{ color: textMutedSoft, fontSize: 11, margin: '6px 0 0' }}>
                All time
              </p>
            </div>
            <div
              style={{
                background: statCardBg,
                border: statCardBorder,
                borderRadius: 14,
                padding: '16px 14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              }}
            >
              <p
                style={{
                  color: textMutedSoft,
                  fontSize: 10,
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Workouts
              </p>
              <p
                style={{
                  color: '#f3f4f6',
                  fontSize: 'clamp(20px, 5.5vw, 24px)',
                  fontWeight: 800,
                  margin: '6px 0 0',
                  fontVariantNumeric: 'tabular-nums',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {stats.workoutsThisMonth} total
              </p>
              <p style={{ color: textMutedSoft, fontSize: 11, margin: '6px 0 0' }}>
                This month
              </p>
            </div>
            <div
              style={{
                background: statCardBg,
                border: statCardBorder,
                borderRadius: 14,
                padding: '16px 14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              }}
            >
              <p
                style={{
                  color: textMutedSoft,
                  fontSize: 10,
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Best Lift
              </p>
              <p
                style={{
                  color: '#f3f4f6',
                  fontSize: 'clamp(20px, 5.5vw, 24px)',
                  fontWeight: 800,
                  margin: '6px 0 0',
                  fontVariantNumeric: 'tabular-nums',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {stats.bestLift ? `${stats.bestLift.value} kg` : '—'}
              </p>
              <p
                style={{
                  color: stats.bestLift ? 'rgba(34,197,94,0.95)' : textMutedSoft,
                  fontSize: 11,
                  margin: '6px 0 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {stats.bestLift?.label ?? '—'}
              </p>
            </div>
          </div>

          {/* ─── 5) Weekly strip: muted header, darker day cells, screenshot-like ─ */}
          <section>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <h2
                style={{
                  color: textLabelSoft,
                  fontSize: 15,
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                This Week
              </h2>
              <span
                style={{
                  color: 'rgba(34,197,94,0.95)',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {stats.thisWeekDone}/{stats.thisWeekTarget} done
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {stats.weekStrip.map((cell, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    aspectRatio: '1',
                    maxWidth: 50,
                    borderRadius: 12,
                    background:
                      cell.status === 'completed'
                        ? 'linear-gradient(145deg, #1a5c3a 0%, #165834 100%)'
                        : 'linear-gradient(180deg, #1a2026 0%, #151b21 100%)',
                    border: cell.status === 'completed' ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                  }}
                >
                  <span
                    style={{
                      color:
                        cell.status === 'completed' || cell.status === 'current'
                          ? '#f3f4f6'
                          : textMutedSoft,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {cell.dayLetter}
                  </span>
                  {cell.status === 'completed' && (
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {cell.status === 'current' && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: '#f3f4f6',
                      }}
                    />
                  )}
                  {cell.status === 'empty' && (
                    <span
                      style={{
                        width: 12,
                        height: 2,
                        backgroundColor: textMutedSoft,
                        borderRadius: 1,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* ─── Legends Workouts: hero cards, horizontal slider ───────────── */}
          <LegendsWorkoutSlider />

          {/* ─── 6) Last Workout: darker card, muted labels ───────────────── */}
          <section>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <h2
                style={{
                  color: textLabelSoft,
                  fontSize: 15,
                  fontWeight: 700,
                  margin: 0,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                }}
              >
                Last Workout
              </h2>
              <span
                onClick={() => router.push('/history')}
                style={{
                  color: 'rgba(34,197,94,0.95)',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                See all →
              </span>
            </div>
            {latestItem ? (
              <div
                onClick={() => router.push(`/history/${latestItem.id}`)}
                style={{
                  cursor: 'pointer',
                  background: statCardBg,
                  border: statCardBorder,
                  borderRadius: 14,
                  padding: 18,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        color: '#f3f4f6',
                        fontSize: 16,
                        fontWeight: 700,
                        margin: 0,
                      }}
                    >
                      {latestItem.name}
                    </h3>
                    <p
                      style={{
                        color: textMutedSoft,
                        fontSize: 13,
                        margin: '4px 0 0',
                      }}
                    >
                      {latestItem.createdAt
                        ? new Date(latestItem.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : ''}{' '}
                      · {latestItem.exerciseCount} exercises
                      {latestItem.durationSec != null &&
                        ` · ${Math.round(latestItem.durationSec / 60)} min`}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <p
                      style={{
                        color: '#f3f4f6',
                        fontSize: 15,
                        fontWeight: 700,
                        margin: 0,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {latestItem.totalVolume.toLocaleString('en-US')} kg
                    </p>
                    <p style={{ color: textLabelSoft, fontSize: 13, margin: '4px 0 0' }}>
                      {latestItem.totalSets} sets
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: 24,
                  border: '1px dashed rgba(255,255,255,0.12)',
                  borderRadius: 14,
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                <p style={{ color: textMutedSoft, fontSize: 14, margin: '0 0 12px' }}>
                  No workouts yet
                </p>
                <Button size="sm" onClick={() => router.push('/workout/new')}>
                  Start your first workout
                </Button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
