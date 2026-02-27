'use client';

import React, { useState } from 'react';
import Card from './Card';
import LineChart from './LineChart';
import { theme } from '@/lib/theme';
import { mockWeeklyData, exerciseChips } from '@/lib/mockData';

interface ProgressCardProps {
  title?: string;
}

export default function ProgressCard({ title = 'Progress' }: ProgressCardProps) {
  const [activeChip, setActiveChip] = useState(0);

  return (
    <Card>
      <h3
        style={{
          color: theme.colors.textPrimary,
          fontSize: '16px',
          fontWeight: 600,
          margin: '0 0 12px 0',
        }}
      >
        {title}
      </h3>
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        {exerciseChips.map((chip, i) => (
          <button
            key={chip}
            onClick={() => setActiveChip(i)}
            style={{
              backgroundColor: activeChip === i ? theme.colors.primary : theme.colors.surface,
              color: activeChip === i ? theme.colors.textPrimary : theme.colors.textSecondary,
              border: activeChip === i ? 'none' : `1px solid ${theme.colors.border}`,
              borderRadius: '20px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            {chip}
          </button>
        ))}
      </div>
      <LineChart data={mockWeeklyData} />
    </Card>
  );
}
