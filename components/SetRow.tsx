'use client';

import React, { useState, useEffect, useRef } from 'react';
import { theme } from '@/lib/theme';
import type { WorkoutSet } from '@/lib/types';

function normalizeDecimalInput(value: string): string {
  return value.replace(',', '.');
}

function parseWeight(value: string): number {
  const normalized = normalizeDecimalInput(value);
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? 0 : parsed;
}

interface SetRowProps {
  index: number;
  set: WorkoutSet;
  onUpdateWeight: (value: number) => void;
  onUpdateReps: (value: number) => void;
  onToggleComplete: () => void;
  onRemove: () => void;
  /** Read-only display (e.g. onboarding) — same layout, no editing or remove. */
  readOnly?: boolean;
}

export default function SetRow({
  index,
  set,
  onUpdateWeight,
  onUpdateReps,
  onToggleComplete,
  onRemove,
  readOnly = false,
}: SetRowProps) {
  const [weightInput, setWeightInput] = useState(() =>
    set.weight != null && set.weight !== 0 ? String(set.weight) : ''
  );
  const prevSetIdRef = useRef(set.id);

  useEffect(() => {
    if (set.id !== prevSetIdRef.current) {
      prevSetIdRef.current = set.id;
      setWeightInput(set.weight != null && set.weight !== 0 ? String(set.weight) : '');
    }
  }, [set.id, set.weight]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '9px 0',
        borderBottom: `1px solid ${theme.colors.border}`,
        opacity: set.completed ? 0.5 : 1,
        transition: 'opacity 0.15s ease',
      }}
    >
      {/* Set number */}
      <span
        style={{
          color: set.completed ? theme.colors.success : theme.colors.textMuted,
          fontSize: '12px',
          fontWeight: 700,
          width: '26px',
          textAlign: 'center',
          flexShrink: 0,
          letterSpacing: '0.02em',
        }}
      >
        #{index + 1}
      </span>

      {/* Weight */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1 }}>
        <input
          type="text"
          inputMode="decimal"
          value={weightInput}
          placeholder="0"
          readOnly={readOnly}
          onChange={(e) => {
            if (readOnly) return;
            const raw = e.target.value;
            setWeightInput(raw);
            onUpdateWeight(parseWeight(raw));
          }}
          style={readOnly ? { ...inputStyle, cursor: 'default' } : inputStyle}
        />
        <span style={unitStyle}>kg</span>
      </div>

      {/* Separator */}
      <span style={{ color: theme.colors.border, fontSize: '13px', flexShrink: 0 }}>×</span>

      {/* Reps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1 }}>
        <input
          type="number"
          inputMode="numeric"
          value={set.reps || ''}
          placeholder="0"
          readOnly={readOnly}
          onChange={(e) => {
            if (readOnly) return;
            onUpdateReps(parseInt(e.target.value) || 0);
          }}
          style={readOnly ? { ...inputStyle, cursor: 'default' } : inputStyle}
        />
        <span style={unitStyle}>reps</span>
      </div>

      {/* Done toggle */}
      <button
        type="button"
        disabled={readOnly}
        onClick={onToggleComplete}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          border: set.completed ? 'none' : `1.5px solid ${theme.colors.border}`,
          backgroundColor: set.completed ? theme.colors.primary : 'transparent',
          color: set.completed ? '#fff' : theme.colors.textMuted,
          cursor: readOnly ? 'default' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s ease',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </button>

      {/* Remove */}
      {!readOnly && (
      <button
        type="button"
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          color: theme.colors.textMuted,
          cursor: 'pointer',
          padding: '6px 2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          opacity: 0.35,
          transition: 'opacity 0.15s ease',
          fontSize: '16px',
          fontWeight: 500,
          lineHeight: 1,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.35'; }}
      >
        ✕
      </button>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '70px',
  backgroundColor: theme.colors.surface,
  border: `1px solid ${theme.colors.border}`,
  borderRadius: '8px',
  padding: '10px 6px',
  color: theme.colors.textPrimary,
  fontSize: '16px',
  fontWeight: 700,
  textAlign: 'center',
  outline: 'none',
};

const unitStyle: React.CSSProperties = {
  color: theme.colors.textMuted,
  fontSize: '12px',
  fontWeight: 500,
  flexShrink: 0,
};
