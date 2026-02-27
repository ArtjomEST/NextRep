'use client';

import React from 'react';
import { theme } from '@/lib/theme';
import type { Exercise } from '@/lib/types';

interface ExerciseInfoSheetProps {
  exercise: Exercise | null;
  open: boolean;
  onClose: () => void;
}

export default function ExerciseInfoSheet({ exercise, open, onClose }: ExerciseInfoSheetProps) {
  if (!open || !exercise) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.55)',
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: 'relative',
          backgroundColor: theme.colors.card,
          borderTop: `1px solid ${theme.colors.border}`,
          borderRadius: '16px 16px 0 0',
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '0 0 env(safe-area-inset-bottom, 16px)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div
            style={{
              width: '36px',
              height: '4px',
              borderRadius: '2px',
              backgroundColor: theme.colors.border,
            }}
          />
        </div>

        <div style={{ padding: '8px 20px 24px' }}>
          {/* Title */}
          <h2 style={{ color: theme.colors.textPrimary, fontSize: '20px', fontWeight: 700, margin: '0 0 16px' }}>
            {exercise.name}
          </h2>

          {/* Illustration placeholder */}
          <div
            style={{
              width: '100%',
              height: '160px',
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.md,
              border: `1px solid ${theme.colors.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <span style={{ color: theme.colors.textMuted, fontSize: '13px' }}>
              Illustration coming soon
            </span>
          </div>

          {/* Muscles worked */}
          <Section title="Muscles Worked">
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {exercise.muscleGroups.map((mg) => (
                <Chip key={mg} label={mg} />
              ))}
            </div>
          </Section>

          {/* Equipment */}
          <Section title="Equipment">
            <div style={{ display: 'flex', gap: '6px' }}>
              <Chip label={exercise.equipment} accent />
            </div>
          </Section>

          {/* Description */}
          <Section title="Description">
            <p style={{ color: theme.colors.textSecondary, fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              {exercise.description ?? 'Detailed exercise description will be available when connected to the exercise database.'}
            </p>
          </Section>

          {/* How to */}
          <Section title="How to Do" last>
            <p style={{ color: theme.colors.textSecondary, fontSize: '14px', lineHeight: 1.6, margin: 0 }}>
              {exercise.howTo ?? 'Step-by-step instructions coming soon.'}
            </p>
          </Section>

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px',
              marginTop: '8px',
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              color: theme.colors.textSecondary,
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? '0' : '18px' }}>
      <h3
        style={{
          color: theme.colors.textMuted,
          fontSize: '11px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          margin: '0 0 8px',
        }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <span
      style={{
        backgroundColor: accent ? 'rgba(31,138,91,0.12)' : theme.colors.surface,
        color: accent ? theme.colors.primary : theme.colors.textSecondary,
        fontSize: '12px',
        fontWeight: 500,
        padding: '5px 12px',
        borderRadius: '6px',
        border: accent ? 'none' : `1px solid ${theme.colors.border}`,
      }}
    >
      {label}
    </span>
  );
}
