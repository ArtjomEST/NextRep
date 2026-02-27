'use client';

import React, { useState } from 'react';
import StatCard from '@/components/StatCard';
import WorkoutCard from '@/components/WorkoutCard';
import ProgressCard from '@/components/ProgressCard';
import { theme } from '@/lib/theme';
import { mockWorkouts, mockOverviewStats } from '@/lib/mockData';
import type { TimePeriod } from '@/lib/types';

const periods: TimePeriod[] = ['This Week', 'This Month', 'All Time'];

export default function HistoryPage() {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>('This Week');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px' }}>
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

      <div style={{ display: 'flex', gap: '8px' }}>
        {periods.map((period) => (
          <button
            key={period}
            onClick={() => setActivePeriod(period)}
            style={{
              backgroundColor: activePeriod === period ? theme.colors.primary : theme.colors.surface,
              color: activePeriod === period ? theme.colors.textPrimary : theme.colors.textSecondary,
              border: activePeriod === period ? 'none' : `1px solid ${theme.colors.border}`,
              borderRadius: '20px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {period}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <StatCard label="Workouts" value={mockOverviewStats.totalWorkouts} />
        <StatCard label="Volume" value={`${(mockOverviewStats.totalVolume / 1000).toFixed(1)}k`} unit="kg" />
        <StatCard label="PRs" value={mockOverviewStats.prCount} />
      </div>

      <ProgressCard title="Exercise Progress" />

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {mockWorkouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </div>
      </section>
    </div>
  );
}
