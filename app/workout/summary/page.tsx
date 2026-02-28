'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import { useWorkout } from '@/lib/workout/state';
import {
  computeTotalVolume,
  computeTotalSets,
  computeDuration,
  computePRsPlaceholder,
} from '@/lib/workout/metrics';
import { saveWorkoutApi } from '@/lib/api/client';
import type { SaveWorkoutRequest } from '@/lib/api/types';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function WorkoutSummaryPage() {
  const router = useRouter();
  const { draft, dispatch } = useWorkout();
  const [saving, setSaving] = useState(false);
  const [savedWorkoutId, setSavedWorkoutId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(
    () => ({
      duration: computeDuration(draft.startedAt, draft.endedAt),
      volume: computeTotalVolume(draft.exercises),
      sets: computeTotalSets(draft.exercises),
      prs: computePRsPlaceholder(draft.exercises),
    }),
    [draft],
  );

  async function handleSave() {
    if (saving || savedWorkoutId) return;
    setSaving(true);
    setError(null);

    try {
      const request: SaveWorkoutRequest = {
        name: draft.name,
        startedAt: draft.startedAt ?? undefined,
        endedAt: draft.endedAt ?? undefined,
        durationSec: stats.duration > 0 ? stats.duration * 60 : undefined,
        exercises: draft.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          exerciseName: ex.exerciseName,
          order: ex.order,
          status: ex.status,
          sets: ex.sets.map((s, idx) => ({
            setIndex: idx + 1,
            completed: s.completed,
            weight: s.weight || null,
            reps: s.reps || null,
            seconds: null,
          })),
        })),
      };

      const result = await saveWorkoutApi(request);
      setSavedWorkoutId(result.workoutId);
      dispatch({ type: 'RESET_DRAFT' });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save workout',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleViewHistory() {
    if (savedWorkoutId) {
      router.push(`/history/${savedWorkoutId}`);
    } else {
      router.push('/history');
    }
  }

  function handleDone() {
    router.push('/');
  }

  function handleEdit() {
    router.push('/workout/active');
  }

  if (savedWorkoutId) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          paddingTop: '60px',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: 'rgba(34,197,94,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.success}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1
          style={{
            color: theme.colors.textPrimary,
            fontSize: '22px',
            fontWeight: 700,
            margin: 0,
          }}
        >
          Workout Saved!
        </h1>
        <p
          style={{
            color: theme.colors.textSecondary,
            fontSize: '14px',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Your workout has been saved to your history.
        </p>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: '100%',
            marginTop: '12px',
          }}
        >
          <Button fullWidth size="lg" onClick={handleViewHistory}>
            View in History
          </Button>
          <Button variant="ghost" fullWidth onClick={handleDone}>
            Back to Home
          </Button>
        </div>
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
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(34,197,94,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.success}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1
          style={{
            color: theme.colors.textPrimary,
            fontSize: '22px',
            fontWeight: 700,
            margin: 0,
          }}
        >
          Workout Complete
        </h1>
        <p
          style={{
            color: theme.colors.textSecondary,
            fontSize: '14px',
            margin: '4px 0 0',
          }}
        >
          {draft.name}
        </p>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}
      >
        <StatCard label="Duration" value={`${stats.duration}`} unit="min" />
        <StatCard
          label="Volume"
          value={stats.volume.toLocaleString()}
          unit="kg"
        />
        <StatCard label="Sets" value={stats.sets} />
        <StatCard label="PRs" value={stats.prs} />
      </div>

      {/* Highlights */}
      <Card>
        <h3
          style={{
            color: theme.colors.textPrimary,
            fontSize: '15px',
            fontWeight: 600,
            margin: '0 0 12px',
          }}
        >
          Highlights
        </h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <HighlightRow
            icon="+"
            iconColor={theme.colors.success}
            text={`${stats.volume.toLocaleString()} kg total volume`}
          />
          {draft.exercises.length > 0 && (
            <HighlightRow
              icon="*"
              iconColor={theme.colors.warning}
              text={`${draft.exercises.length} exercises completed`}
            />
          )}
          <HighlightRow
            icon="~"
            iconColor={theme.colors.info}
            text={`${stats.sets} total sets`}
          />
        </div>
      </Card>

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

      {/* CTAs */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '4px',
        }}
      >
        <Button fullWidth size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Workout'}
        </Button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            fullWidth
            onClick={handleEdit}
            disabled={saving}
          >
            Edit
          </Button>
          <Button variant="ghost" fullWidth onClick={handleDone}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

function HighlightRow({
  icon,
  iconColor,
  text,
}: {
  icon: string;
  iconColor: string;
  text: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          backgroundColor: `${iconColor}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          flexShrink: 0,
          color: iconColor,
          fontWeight: 700,
        }}
      >
        {icon}
      </span>
      <span
        style={{ color: theme.colors.textSecondary, fontSize: '14px' }}
      >
        {text}
      </span>
    </div>
  );
}
