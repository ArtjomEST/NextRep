'use client';

import React, { useEffect } from 'react';
import { theme } from '@/lib/theme';
import type { ExerciseDetail } from '@/lib/api/types';

interface ExerciseInfoSheetProps {
  exercise: ExerciseDetail | null;
  open: boolean;
  loading?: boolean;
  onClose: () => void;
}

export default function ExerciseInfoSheet({
  exercise,
  open,
  loading,
  onClose,
}: ExerciseInfoSheetProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

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
        onClick={(e) => e.stopPropagation()}
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '10px 0 4px',
          }}
        >
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
          {loading && !exercise && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px 0',
              }}
            >
              <div
                style={{
                  height: '24px',
                  width: '60%',
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.sm,
                }}
              />
              <div
                style={{
                  height: '140px',
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.md,
                }}
              />
              <div
                style={{
                  height: '16px',
                  width: '40%',
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.sm,
                }}
              />
            </div>
          )}

          {exercise && (
            <>
              {/* Title */}
              <h2
                style={{
                  color: theme.colors.textPrimary,
                  fontSize: '20px',
                  fontWeight: 700,
                  margin: '0 0 16px',
                }}
              >
                {exercise.name}
              </h2>

              {/* Image */}
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
                  overflow: 'hidden',
                }}
              >
                {exercise.imageUrl ? (
                  <img
                    src={exercise.imageUrl}
                    alt={exercise.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <span
                    style={{
                      color: theme.colors.textMuted,
                      fontSize: '13px',
                    }}
                  >
                    No image available
                  </span>
                )}
              </div>

              {/* Category + Muscles */}
              <Section title="Muscles Worked">
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    flexWrap: 'wrap',
                  }}
                >
                  {exercise.category && (
                    <Chip label={exercise.category} />
                  )}
                  {exercise.primaryMuscles.map((m) => (
                    <Chip key={m} label={m} accent />
                  ))}
                  {exercise.secondaryMuscles.map((m) => (
                    <Chip key={m} label={m} />
                  ))}
                  {exercise.primaryMuscles.length === 0 &&
                    exercise.secondaryMuscles.length === 0 &&
                    !exercise.category && (
                      <span
                        style={{
                          color: theme.colors.textMuted,
                          fontSize: '13px',
                          fontStyle: 'italic',
                        }}
                      >
                        Not specified
                      </span>
                    )}
                </div>
              </Section>

              {/* Equipment */}
              <Section title="Equipment">
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {exercise.equipment.length > 0 ? (
                    exercise.equipment.map((eq) => (
                      <Chip key={eq} label={eq} accent />
                    ))
                  ) : (
                    <Chip label="Bodyweight" accent />
                  )}
                </div>
              </Section>

              {/* Instructions */}
              <Section title="How to Perform">
                {exercise.instructions.length > 0 ? (
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    {exercise.instructions.map((step, i) => (
                      <li
                        key={i}
                        style={{
                          color: theme.colors.textSecondary,
                          fontSize: '14px',
                          lineHeight: 1.5,
                        }}
                      >
                        {step}
                      </li>
                    ))}
                  </ol>
                ) : exercise.description ? (
                  <p
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: '14px',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {exercise.description}
                  </p>
                ) : (
                  <p
                    style={{
                      color: theme.colors.textMuted,
                      fontSize: '14px',
                      margin: 0,
                      fontStyle: 'italic',
                    }}
                  >
                    No instructions available yet.
                  </p>
                )}
              </Section>

              {/* Type */}
              <Section title="Type" last>
                <Chip
                  label={exercise.measurementType.replace(/_/g, ' ')}
                />
              </Section>
            </>
          )}

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

function Section({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
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
        backgroundColor: accent
          ? 'rgba(31,138,91,0.12)'
          : theme.colors.surface,
        color: accent ? theme.colors.primary : theme.colors.textSecondary,
        fontSize: '12px',
        fontWeight: 500,
        padding: '5px 12px',
        borderRadius: '6px',
        border: accent ? 'none' : `1px solid ${theme.colors.border}`,
        textTransform: 'capitalize',
      }}
    >
      {label}
    </span>
  );
}
