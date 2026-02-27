import React from 'react';
import Card from './Card';
import { theme } from '@/lib/theme';
import type { Workout } from '@/lib/types';

interface WorkoutCardProps {
  workout: Workout;
  compact?: boolean;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function WorkoutCard({ workout, compact = false }: WorkoutCardProps) {
  const isPositive = workout.improvement >= 0;

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              color: theme.colors.textPrimary,
              fontSize: compact ? '15px' : '16px',
              fontWeight: 600,
              margin: 0,
            }}
          >
            {workout.name}
          </h3>
          <p
            style={{
              color: theme.colors.textMuted,
              fontSize: '13px',
              margin: '4px 0 0 0',
            }}
          >
            {formatDate(workout.date)}
            {!compact && ` · ${workout.exercises.length} exercises`}
          </p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
          <p
            style={{
              color: theme.colors.textPrimary,
              fontSize: '15px',
              fontWeight: 600,
              margin: 0,
            }}
          >
            {workout.totalVolume.toLocaleString()} kg
          </p>
          <p
            style={{
              color: isPositive ? theme.colors.success : theme.colors.error,
              fontSize: '13px',
              fontWeight: 500,
              margin: '4px 0 0 0',
            }}
          >
            {isPositive ? '+' : ''}{workout.improvement}%
          </p>
        </div>
      </div>
    </Card>
  );
}
