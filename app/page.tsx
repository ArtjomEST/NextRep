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
import { useProfile } from '@/lib/profile/context';
import { ui } from '@/lib/ui-styles';
import LegendsWorkoutSlider from '@/components/LegendsWorkoutSlider';
import WeeklyVolumeChart from '@/components/WeeklyVolumeChart';
import { SectionErrorBoundary } from './AppErrorBoundary';
import EmptyStatsOverlay from '@/components/EmptyStatsOverlay';

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}k`;
  return kg.toLocaleString('en-US');
}

export default function HomePage() {
  const router = useRouter();
  const { status: authStatus, user } = useAuth();
  const { hasDraft, draft, dispatch } = useWorkout();
  const { profile } = useProfile();

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutListItem[]>([]);
  const [latestDetail, setLatestDetail] = useState<WorkoutDetail | null>(null);
  const [totalVolumeFromApi, setTotalVolumeFromApi] = useState<number | null>(null);
  const [totalSetsFromApi, setTotalSetsFromApi] = useState<number | null>(null);
  const [totalWorkoutsFromApi, setTotalWorkoutsFromApi] = useState<number | null>(null);
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
      const list = Array.isArray(listRes?.data) ? listRes.data : [];
      setWorkouts(list);
      if (statsRes?.totalVolume != null) {
        setTotalVolumeFromApi(Number(statsRes.totalVolume));
      } else {
        setTotalVolumeFromApi(null);
      }
      if (statsRes?.totalSets != null) {
        setTotalSetsFromApi(Number(statsRes.totalSets));
      } else {
        setTotalSetsFromApi(null);
      }
      if (statsRes?.total != null) {
        setTotalWorkoutsFromApi(Number(statsRes.total));
      } else {
        setTotalWorkoutsFromApi(null);
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
      setTotalSetsFromApi(null);
      setTotalWorkoutsFromApi(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = getHomeStats(workouts, latestDetail, totalVolumeFromApi, profile?.trainingDaysPerWeek);
  const latestItem = workouts[0] ?? null;
  const totalWorkouts = totalWorkoutsFromApi ?? workouts.length;

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <div style={{ background: statCardBg, border: statCardBorder, borderRadius: 14, padding: '18px 12px' }}><Skeleton height={72} /></div>
            <div style={{ background: statCardBg, border: statCardBorder, borderRadius: 14, padding: '18px 12px' }}><Skeleton height={72} /></div>
            <div style={{ background: statCardBg, border: statCardBorder, borderRadius: 14, padding: '18px 12px' }}><Skeleton height={72} /></div>
          </div>
          <div style={{ background: statCardBg, border: statCardBorder, borderRadius: 14, padding: '20px 20px' }}><Skeleton height={68} /></div>
        </div>
      ) : (
        <>
          {/* ─── 4) Stats: top row 3 cards (Volume, Workouts, Sets), bottom full-width Best Lift / PR ─ */}
          <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top row — three equal-width cards, no extra horizontal padding (layout shell owns the 16px sides) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  background: statCardBg,
                  border: statCardBorder,
                  borderRadius: 14,
                  padding: '18px 12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                <p
                  style={{
                    color: textMutedSoft,
                    fontSize: 13,
                    fontWeight: 700,
                    margin: 0,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Volume
                </p>
                <p
                  style={{
                    color: '#f3f4f6',
                    fontSize: 20,
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
                <p style={{ color: textMutedSoft, fontSize: 11, margin: '5px 0 0', whiteSpace: 'nowrap' }}>
                  All time
                </p>
              </div>
              <div
                style={{
                  background: statCardBg,
                  border: statCardBorder,
                  borderRadius: 14,
                  padding: '18px 12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                <p
                  style={{
                    color: textMutedSoft,
                    fontSize: 13,
                    fontWeight: 700,
                    margin: 0,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Workouts
                </p>
                <p
                  style={{
                    color: '#f3f4f6',
                    fontSize: 20,
                    fontWeight: 800,
                    margin: '6px 0 0',
                    fontVariantNumeric: 'tabular-nums',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {stats.workoutsThisMonth}
                </p>
                <p style={{ color: textMutedSoft, fontSize: 11, margin: '5px 0 0', whiteSpace: 'nowrap' }}>
                  This month
                </p>
              </div>
              <div
                style={{
                  background: statCardBg,
                  border: statCardBorder,
                  borderRadius: 14,
                  padding: '18px 12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  minWidth: 0,
                  overflow: 'hidden',
                }}
              >
                <p
                  style={{
                    color: textMutedSoft,
                    fontSize: 13,
                    fontWeight: 700,
                    margin: 0,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Sets
                </p>
                <p
                  style={{
                    color: '#f3f4f6',
                    fontSize: 20,
                    fontWeight: 800,
                    margin: '6px 0 0',
                    fontVariantNumeric: 'tabular-nums',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {totalSetsFromApi != null
                    ? totalSetsFromApi.toLocaleString('en-US')
                    : workouts.reduce((sum, w) => sum + (w.totalSets ?? 0), 0).toLocaleString('en-US')}
                </p>
                <p style={{ color: textMutedSoft, fontSize: 11, margin: '5px 0 0', whiteSpace: 'nowrap' }}>
                  All time
                </p>
              </div>
            </div>

            {/* Bottom: full-width Best Lift / Personal Record — stat left, trophy badge right */}
            <div
              style={{
                background: statCardBg,
                border: statCardBorder,
                borderRadius: 14,
                padding: '18px 12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 24,
                minWidth: 0,
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    color: textMutedSoft,
                    fontSize: 13,
                    fontWeight: 700,
                    margin: 0,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  Best Lift / Personal Record
                </p>
                <p
                  style={{
                    color: '#f3f4f6',
                    fontSize: 20,
                    fontWeight: 800,
                    margin: '10px 0 0',
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
                    margin: '5px 0 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {stats.bestLift?.label ?? '—'}
                </p>
              </div>
              <div
                style={{
                  flexShrink: 0,
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: 'linear-gradient(145deg, rgba(234,179,8,0.25) 0%, rgba(234,179,8,0.08) 100%)',
                  border: '1px solid rgba(234,179,8,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(234,179,8,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M6 9a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2" />
                  <path d="M12 2v4" />
                  <path d="M8 22h8" />
                  <path d="M12 22V12" />
                  <path d="m8 12 4-4 4 4" />
                </svg>
              </div>
            </div>
          </div>

          {/* ─── 5) Weekly Volume Chart ──────────────────────────────────── */}
          <WeeklyVolumeChart />
          {totalWorkouts === 0 && <EmptyStatsOverlay />}
          </div>

          {/* ─── Legends Workouts: hero cards, horizontal slider ───────────── */}
          <SectionErrorBoundary>
            <LegendsWorkoutSlider />
          </SectionErrorBoundary>

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
