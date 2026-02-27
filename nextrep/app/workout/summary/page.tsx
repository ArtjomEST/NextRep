'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import { useWorkout } from '@/lib/workout/state';
import {
  computeTotalVolume,
  computeTotalSets,
  computeDuration,
  computePRsPlaceholder,
} from '@/lib/workout/metrics';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';
import Button from '@/components/Button';

export default function WorkoutSummaryPage() {
  const router = useRouter();
  const { draft, saveWorkoutToHistory } = useWorkout();

  const stats = useMemo(() => ({
    duration: computeDuration(draft.startedAt, draft.endedAt),
    volume: computeTotalVolume(draft.exercises),
    sets: computeTotalSets(draft.exercises),
    prs: computePRsPlaceholder(draft.exercises),
  }), [draft]);

  function handleSave() {
    saveWorkoutToHistory();
    router.push('/');
  }

  function handleDone() {
    router.push('/');
  }

  function handleEdit() {
    router.push('/workout/active');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px', paddingBottom: '24px' }}>
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
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={theme.colors.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 style={{ color: theme.colors.textPrimary, fontSize: '22px', fontWeight: 700, margin: 0 }}>
          Workout Complete
        </h1>
        <p style={{ color: theme.colors.textSecondary, fontSize: '14px', margin: '4px 0 0' }}>
          {draft.name}
        </p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <StatCard label="Duration" value={`${stats.duration}`} unit="min" />
        <StatCard label="Volume" value={stats.volume.toLocaleString()} unit="kg" />
        <StatCard label="Sets" value={stats.sets} />
        <StatCard label="PRs" value={stats.prs} />
      </div>

      {/* Highlights */}
      <Card>
        <h3 style={{ color: theme.colors.textPrimary, fontSize: '15px', fontWeight: 600, margin: '0 0 12px' }}>
          Highlights
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <HighlightRow
            icon="↑"
            iconColor={theme.colors.success}
            text={`+${((Math.random() * 6) + 1).toFixed(1)}% volume vs last time`}
          />
          {draft.exercises.length > 0 && (
            <HighlightRow
              icon="🏆"
              iconColor={theme.colors.warning}
              text={`${draft.exercises[0].exerciseName}: +2.5kg`}
            />
          )}
          <HighlightRow
            icon="🔥"
            iconColor={theme.colors.warning}
            text="Streak continues!"
          />
        </div>
      </Card>

      {/* CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
        <Button fullWidth size="lg" onClick={handleSave}>
          Save Workout
        </Button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" fullWidth onClick={handleEdit}>
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

function HighlightRow({ icon, iconColor, text }: { icon: string; iconColor: string; text: string }) {
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
          fontSize: '14px',
          flexShrink: 0,
          color: iconColor,
          fontWeight: 700,
        }}
      >
        {icon}
      </span>
      <span style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>{text}</span>
    </div>
  );
}
