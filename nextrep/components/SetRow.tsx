'use client';

import React from 'react';
import { theme } from '@/lib/theme';
import type { WorkoutSet } from '@/lib/types';

interface SetRowProps {
  index: number;
  set: WorkoutSet;
  onUpdateWeight: (value: number) => void;
  onUpdateReps: (value: number) => void;
  onToggleComplete: () => void;
  onRemove: () => void;
}

export default function SetRow({
  index,
  set,
  onUpdateWeight,
  onUpdateReps,
  onToggleComplete,
  onRemove,
}: SetRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 0',
        borderBottom: `1px solid ${theme.colors.border}`,
        opacity: set.completed ? 0.55 : 1,
        transition: 'opacity 0.15s ease',
      }}
    >
      {/* Set number */}
      <span
        style={{
          color: theme.colors.textMuted,
          fontSize: '13px',
          fontWeight: 600,
          width: '28px',
          textAlign: 'center',
          flexShrink: 0,
        }}
      >
        #{index + 1}
      </span>

      {/* Weight */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
        <input
          type="number"
          inputMode="decimal"
          value={set.weight || ''}
          placeholder="0"
          onChange={(e) => onUpdateWeight(parseFloat(e.target.value) || 0)}
          style={inputStyle}
        />
        <span style={unitStyle}>kg</span>
      </div>

      {/* Separator */}
      <span style={{ color: theme.colors.textMuted, fontSize: '14px', flexShrink: 0 }}>×</span>

      {/* Reps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
        <input
          type="number"
          inputMode="numeric"
          value={set.reps || ''}
          placeholder="0"
          onChange={(e) => onUpdateReps(parseInt(e.target.value) || 0)}
          style={inputStyle}
        />
        <span style={unitStyle}>reps</span>
      </div>

      {/* Done toggle */}
      <button
        onClick={onToggleComplete}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '10px',
          border: set.completed ? 'none' : `1.5px solid ${theme.colors.border}`,
          backgroundColor: set.completed ? theme.colors.primary : 'transparent',
          color: set.completed ? theme.colors.textPrimary : theme.colors.textMuted,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s ease',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>

      {/* Remove */}
      <button
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          color: theme.colors.textMuted,
          cursor: 'pointer',
          padding: '8px 2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          opacity: 0.4,
          transition: 'opacity 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.4'; }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '72px',
  backgroundColor: theme.colors.surface,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: '8px',
  padding: '12px 8px',
  color: theme.colors.textPrimary,
  fontSize: '17px',
  fontWeight: 600,
  textAlign: 'center',
  outline: 'none',
};

const unitStyle: React.CSSProperties = {
  color: theme.colors.textMuted,
  fontSize: '13px',
  fontWeight: 500,
  flexShrink: 0,
};
