'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Skeleton from '@/components/Skeleton';
import { theme } from '@/lib/theme';
import { useAuth } from '@/lib/auth/context';
import { useWorkout } from '@/lib/workout/state';
import { getTelegramUser } from '@/lib/auth/client';
import {
  fetchWorkoutsApi,
  fetchWorkoutDetailApi,
} from '@/lib/api/client';
import type { WorkoutListItem, WorkoutDetail } from '@/lib/api/types';
import {
  getSubtitleMessage,
  getTodayFocus,
  computeStreak,
  getThisWeekCount,
  getWeekDotDates,
  getMonthSnapshot,
  findRecentPR,
  isLatestWorkoutWithinDays,
  WEEK_SESSION_TARGET,
} from '@/lib/home/utils';

export default function HomePage() {
  const router = useRouter();
  const { status: authStatus, user } = useAuth();
  const { hasDraft, draft, dispatch } = useWorkout();

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutListItem[]>([]);
  const [latestDetail, setLatestDetail] = useState<WorkoutDetail | null>(null);
  const [previousDetail, setPreviousDetail] = useState<WorkoutDetail | null>(null);
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
      const { data: list } = await fetchWorkoutsApi(30, 0);
      setWorkouts(list);

      if (list.length >= 1) {
        const [detail1, detail2] = await Promise.all([
          fetchWorkoutDetailApi(list[0].id),
          list.length >= 2 ? fetchWorkoutDetailApi(list[1].id) : Promise.resolve(null),
        ]);
        setLatestDetail(detail1);
        setPreviousDetail(detail2);
      } else {
        setLatestDetail(null);
        setPreviousDetail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      setWorkouts([]);
      setLatestDetail(null);
      setPreviousDetail(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const workoutCount = workouts.length;
  const latestItem = workouts[0] ?? null;
  const lastWorkoutDate = latestItem
    ? (latestItem.startedAt ?? latestItem.createdAt)?.slice(0, 10) ?? null
    : null;
  const daysSinceLast =
    lastWorkoutDate && latestItem
      ? Math.floor(
          (Date.now() - new Date(latestItem.startedAt ?? latestItem.createdAt ?? 0).getTime()) /
            (24 * 60 * 60 * 1000),
        )
      : 999;

  const subtitle = getSubtitleMessage(workoutCount, lastWorkoutDate);
  const focus = getTodayFocus(workoutCount, latestDetail, daysSinceLast);
  const streak = computeStreak(workouts);
  const thisWeekSessions = getThisWeekCount(workouts);
  const weekDots = getWeekDotDates(workouts);
  const month = getMonthSnapshot(workouts);
  const prAlert =
    isLatestWorkoutWithinDays(latestItem, 7) && findRecentPR(latestDetail, previousDetail);

  const handleDiscardDraft = () => {
    dispatch({ type: 'RESET_DRAFT' });
  };

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Athlete';
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 8 }}>
      {/* ─── 1) Greeting Header ───────────────────────────────────── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: `${theme.spacing.md} 0`,
        }}
      >
        {photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            width={48}
            height={48}
            style={{
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0,
              border: `2px solid ${theme.colors.border}`,
            }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              backgroundColor: theme.colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 700,
              color: theme.colors.textPrimary,
              flexShrink: 0,
            }}
          >
            {authStatus === 'loading' ? '' : initials}
          </div>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1
            style={{
              color: theme.colors.textPrimary,
              fontSize: 22,
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {authStatus === 'loading' ? (
              <Skeleton width={140} height={26} />
            ) : (
              `Hey, ${displayName}`
            )}
          </h1>
          {user?.username && (
            <p
              style={{
                color: theme.colors.textMuted,
                fontSize: 13,
                margin: '2px 0 0',
              }}
            >
              @{user.username}
            </p>
          )}
          <p
            style={{
              color: theme.colors.textSecondary,
              fontSize: 14,
              margin: '4px 0 0',
            }}
          >
            {subtitle}
          </p>
        </div>
      </header>

      {/* ─── 2) Start Workout CTA ─────────────────────────────────── */}
      <Button
        fullWidth
        size="lg"
        onClick={() => router.push('/workout/new')}
        style={{ fontSize: 17, padding: '18px 24px' }}
      >
        Start Workout
      </Button>

      {/* ─── 3) Resume Workout (only if draft) ─────────────────────── */}
      {hasDraft && (
        <Card
          style={{
            borderColor: theme.colors.primary,
            background: `linear-gradient(135deg, ${theme.colors.card} 0%, rgba(31,138,91,0.08) 100%)`,
          }}
        >
          <div style={{ marginBottom: 12 }}>
            <p
              style={{
                color: theme.colors.textPrimary,
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
              }}
            >
              {draft.name}
            </p>
            <p
              style={{
                color: theme.colors.textSecondary,
                fontSize: 13,
                margin: '4px 0 0',
              }}
            >
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
                router.push(
                  draft.status === 'active' ? '/workout/active' : '/workout/new',
                )
              }
            >
              Continue
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDiscardDraft}
              style={{ color: theme.colors.error }}
            >
              Discard
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <p style={{ color: theme.colors.error, fontSize: 14, margin: 0 }}>
          {error}
        </p>
      )}

      {loading ? (
        <>
          <Card><Skeleton height={80} /></Card>
          <Card><Skeleton height={60} /></Card>
          <Card><Skeleton height={100} /></Card>
        </>
      ) : (
        <>
          {/* ─── 4) Daily Focus ────────────────────────────────────── */}
          <Card>
            <h3
              style={{
                color: theme.colors.textPrimary,
                fontSize: 15,
                fontWeight: 600,
                margin: '0 0 4px',
              }}
            >
              Today&apos;s Focus
            </h3>
            <p
              style={{
                color: theme.colors.primary,
                fontSize: 18,
                fontWeight: 700,
                margin: 0,
              }}
            >
              {focus.name}
            </p>
            <p
              style={{
                color: theme.colors.textSecondary,
                fontSize: 13,
                margin: '4px 0 0',
              }}
            >
              {focus.subline}
            </p>
            <p
              style={{
                color: theme.colors.textMuted,
                fontSize: 12,
                margin: '8px 0 12px',
              }}
            >
              Based on your recent sessions
            </p>
            <Button
              size="sm"
              onClick={() => router.push('/workout/new')}
            >
              Start {focus.name} Workout
            </Button>
          </Card>

          {/* ─── 5) PR Alert (only when PR) ─────────────────────────── */}
          {prAlert && (
            <Card
              style={{
                borderColor: theme.colors.success,
                background: `linear-gradient(135deg, ${theme.colors.card} 0%, rgba(34,197,94,0.08) 100%)`,
              }}
            >
              <p style={{ color: theme.colors.textMuted, fontSize: 12, margin: '0 0 4px' }}>
                🏆 New Personal Record
              </p>
              <p style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: 600, margin: 0 }}>
                {prAlert.exerciseName}
              </p>
              <p style={{ color: theme.colors.success, fontSize: 14, margin: '4px 0 0' }}>
                {prAlert.label}
              </p>
            </Card>
          )}

          {/* ─── 6) Consistency ─────────────────────────────────────── */}
          <Card>
            <h3
              style={{
                color: theme.colors.textPrimary,
                fontSize: 15,
                fontWeight: 600,
                margin: '0 0 12px',
              }}
            >
              Consistency
            </h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 12 }}>
              <div>
                <p style={{ color: theme.colors.textMuted, fontSize: 12, margin: 0 }}>
                  Current streak
                </p>
                <p style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: 700, margin: '2px 0 0' }}>
                  {streak} {streak === 1 ? 'day' : 'days'}
                </p>
              </div>
              <div>
                <p style={{ color: theme.colors.textMuted, fontSize: 12, margin: 0 }}>
                  This week
                </p>
                <p style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: 700, margin: '2px 0 0' }}>
                  {thisWeekSessions} / {WEEK_SESSION_TARGET} sessions
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <div
                  key={day}
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 10,
                    color: theme.colors.textMuted,
                  }}
                >
                  {day.slice(0, 1)}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <div
                  key={d}
                  style={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: weekDots.includes(d)
                      ? theme.colors.primary
                      : theme.colors.surface,
                  }}
                />
              ))}
            </div>
          </Card>

          {/* ─── 7) This Month ─────────────────────────────────────── */}
          <Card>
            <h3
              style={{
                color: theme.colors.textPrimary,
                fontSize: 15,
                fontWeight: 600,
                margin: '0 0 12px',
              }}
            >
              This Month
            </h3>
            <div style={{ display: 'flex', gap: 20 }}>
              <div>
                <p style={{ color: theme.colors.textMuted, fontSize: 12, margin: 0 }}>
                  Workouts
                </p>
                <p style={{ color: theme.colors.textPrimary, fontSize: 20, fontWeight: 700, margin: '2px 0 0' }}>
                  {month.thisMonthWorkouts}
                </p>
                {month.workoutsDelta != null && (
                  <p
                    style={{
                      fontSize: 12,
                      margin: '2px 0 0',
                      color:
                        month.workoutsDelta >= 0
                          ? theme.colors.success
                          : theme.colors.error,
                    }}
                  >
                    {month.workoutsDelta >= 0 ? '+' : ''}
                    {month.workoutsDelta} vs last month
                  </p>
                )}
              </div>
              <div>
                <p style={{ color: theme.colors.textMuted, fontSize: 12, margin: 0 }}>
                  Volume
                </p>
                <p style={{ color: theme.colors.textPrimary, fontSize: 20, fontWeight: 700, margin: '2px 0 0' }}>
                  {month.thisMonthVolume >= 1000
                    ? `${(month.thisMonthVolume / 1000).toFixed(1)}k`
                    : month.thisMonthVolume.toLocaleString('en-US')}{' '}
                  kg
                </p>
                {month.volumeDelta != null && (
                  <p
                    style={{
                      fontSize: 12,
                      margin: '2px 0 0',
                      color:
                        month.volumeDelta >= 0
                          ? theme.colors.success
                          : theme.colors.error,
                    }}
                  >
                    {month.volumeDelta >= 0 ? '+' : ''}
                    {month.volumeDelta.toLocaleString('en-US')} kg vs last month
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* ─── 8) Last Workout ────────────────────────────────────── */}
          <section>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <h2
                style={{
                  color: theme.colors.textPrimary,
                  fontSize: 16,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Last Workout
              </h2>
              <span
                onClick={() => router.push('/history')}
                style={{
                  color: theme.colors.primary,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                View all →
              </span>
            </div>

            {latestItem ? (
              <Card
                onClick={() => router.push(`/history/${latestItem.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3
                      style={{
                        color: theme.colors.textPrimary,
                        fontSize: 16,
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      {latestItem.name}
                    </h3>
                    <p
                      style={{
                        color: theme.colors.textMuted,
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
                        color: theme.colors.textPrimary,
                        fontSize: 15,
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      {latestItem.totalVolume.toLocaleString('en-US')} kg
                    </p>
                    <p style={{ color: theme.colors.textSecondary, fontSize: 13, margin: '4px 0 0' }}>
                      {latestItem.totalSets} sets
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <Card
                style={{
                  textAlign: 'center',
                  padding: theme.spacing.lg,
                  borderStyle: 'dashed',
                }}
              >
                <p style={{ color: theme.colors.textMuted, fontSize: 14, margin: '0 0 12px' }}>
                  No workouts yet
                </p>
                <Button size="sm" onClick={() => router.push('/workout/new')}>
                  Start your first workout
                </Button>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
}
