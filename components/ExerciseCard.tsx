import React from 'react';
import Card from './Card';
import { theme } from '@/lib/theme';
import type { Exercise } from '@/lib/types';

interface ExerciseCardProps {
  exercise: Exercise;
}

export default function ExerciseCard({ exercise }: ExerciseCardProps) {
  return (
    <Card style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              color: theme.colors.textPrimary,
              fontSize: '15px',
              fontWeight: 600,
              margin: 0,
            }}
          >
            {exercise.name}
          </h3>
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
            {exercise.muscleGroups.map((mg) => (
              <span
                key={mg}
                style={{
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.textSecondary,
                  fontSize: '11px',
                  fontWeight: 500,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${theme.colors.border}`,
                }}
              >
                {mg}
              </span>
            ))}
            <span
              style={{
                backgroundColor: 'rgba(31, 138, 91, 0.12)',
                color: theme.colors.primary,
                fontSize: '11px',
                fontWeight: 500,
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              {exercise.equipment}
            </span>
          </div>
        </div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.colors.textMuted}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, marginLeft: '12px' }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </div>
    </Card>
  );
}
