'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import Skeleton from '@/components/Skeleton';
import { useProfile } from '@/lib/profile/context';
import { useWorkout } from '@/lib/workout/state';
import {
  fetchDeloadPlanApi,
  createPresetApi,
  searchExercisesApi,
} from '@/lib/api/client';

interface PresetExercise {
  name: string;
  sets: number;
  targetReps: number;
  targetWeight: number;
}

interface DeloadPlan {
  explanation: string;
  preset: {
    name: string;
    exercises: PresetExercise[];
  };
}

interface DeloadPlanSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function DeloadPlanSheet({ open, onClose }: DeloadPlanSheetProps) {
  const router = useRouter();
  const { isPro } = useProfile();
  const { dispatch } = useWorkout();

  const [plan, setPlan] = useState<DeloadPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDeloadPlanApi();
      setPlan(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && !plan && !loading) {
      loadPlan();
    }
  }, [open, plan, loading, loadPlan]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const resolveExerciseIds = async (names: string[]): Promise<string[]> => {
    const ids: string[] = [];
    for (const name of names) {
      try {
        const results = await searchExercisesApi(name, undefined, 1);
        if (results.length > 0) ids.push(results[0].id);
      } catch {
        // skip
      }
    }
    return ids;
  };

  const handleSavePreset = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      const names = plan.preset.exercises.map((e) => e.name);
      const ids = await resolveExerciseIds(names);
      if (ids.length === 0) throw new Error('No matching exercises found');
      await createPresetApi({ name: plan.preset.name, exerciseIds: ids });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preset');
    } finally {
      setSaving(false);
    }
  };

  const handleStartWorkout = async () => {
    if (!plan) return;
    setStarting(true);
    try {
      dispatch({ type: 'RESET_DRAFT' });
      dispatch({ type: 'SET_NAME', name: plan.preset.name });

      const names = plan.preset.exercises.map((e) => e.name);
      for (const name of names) {
        const results = await searchExercisesApi(name, undefined, 1);
        if (results.length > 0) {
          dispatch({ type: 'ADD_EXERCISE', exercise: results[0] });
        }
      }

      onClose();
      router.push('/workout/new');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start workout');
    } finally {
      setStarting(false);
    }
  };

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
          maxHeight: '85vh',
          overflowY: 'auto',
          padding: '0 0 env(safe-area-inset-bottom, 24px)',
        }}
      >
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: theme.colors.border,
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            padding: '12px 16px 16px',
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: 700, margin: 0 }}>
            Deload Week Plan
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: theme.colors.textMuted,
              fontSize: 20,
              cursor: 'pointer',
              padding: '2px 6px',
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '16px 16px 8px' }}>
          {/* PRO gate for free users */}
          {!isPro && (
            <div
              style={{
                background: 'rgba(249,115,22,0.1)',
                border: '1px solid rgba(249,115,22,0.3)',
                borderRadius: theme.radius.md,
                padding: 16,
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#F97316', fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>
                PRO Feature
              </p>
              <p style={{ color: theme.colors.textMuted, fontSize: 13, margin: 0 }}>
                Upgrade to PRO to access your personalized deload plan.
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: `1px solid rgba(239,68,68,0.3)`,
                borderRadius: theme.radius.sm,
                padding: 12,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <p style={{ color: theme.colors.error, fontSize: 13, margin: 0, flex: 1 }}>
                {error}
              </p>
              <button
                onClick={() => { setError(null); loadPlan(); }}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.colors.error}`,
                  borderRadius: 6,
                  color: theme.colors.error,
                  fontSize: 12,
                  padding: '4px 10px',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                Retry
              </button>
            </div>
          )}

          {/* Section 1: Why now */}
          <section style={{ marginBottom: 20 }}>
            <h3
              style={{
                color: theme.colors.textMuted,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 10px',
              }}
            >
              Why now
            </h3>
            {loading ? (
              <Skeleton height={56} />
            ) : (
              <p
                style={{
                  color: theme.colors.textPrimary,
                  fontSize: 14,
                  lineHeight: 1.6,
                  margin: 0,
                }}
              >
                {plan?.explanation ?? '—'}
              </p>
            )}
          </section>

          {/* Section 2: Guidelines */}
          <section style={{ marginBottom: 20 }}>
            <h3
              style={{
                color: theme.colors.textMuted,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 10px',
              }}
            >
              Guidelines
            </h3>
            <div
              style={{
                background: theme.colors.surface,
                borderRadius: theme.radius.sm,
                border: `1px solid ${theme.colors.border}`,
                overflow: 'hidden',
              }}
            >
              {[
                { label: 'Sets', value: 'Reduce by 40%' },
                { label: 'Weight', value: '60–70% of working weight' },
                { label: 'Focus', value: 'Technique, not intensity' },
              ].map((row, i, arr) => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderBottom: i < arr.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
                  }}
                >
                  <span style={{ color: theme.colors.textMuted, fontSize: 13 }}>{row.label}</span>
                  <span style={{ color: theme.colors.textPrimary, fontSize: 13, fontWeight: 600 }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Section 3: Preset exercises */}
          <section style={{ marginBottom: 20 }}>
            <h3
              style={{
                color: theme.colors.textMuted,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                margin: '0 0 10px',
              }}
            >
              Exercises
            </h3>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton height={44} />
                <Skeleton height={44} />
                <Skeleton height={44} />
                <Skeleton height={44} />
              </div>
            ) : plan?.preset.exercises.length ? (
              <div
                style={{
                  background: theme.colors.surface,
                  borderRadius: theme.radius.sm,
                  border: `1px solid ${theme.colors.border}`,
                  overflow: 'hidden',
                }}
              >
                {plan.preset.exercises.map((ex, i) => (
                  <div
                    key={`${ex.name}-${i}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      borderBottom:
                        i < plan.preset.exercises.length - 1
                          ? `1px solid ${theme.colors.border}`
                          : 'none',
                    }}
                  >
                    <span
                      style={{
                        color: theme.colors.textPrimary,
                        fontSize: 13,
                        fontWeight: 500,
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ex.name}
                    </span>
                    <span
                      style={{
                        color: theme.colors.textMuted,
                        fontSize: 12,
                        flexShrink: 0,
                        marginLeft: 8,
                      }}
                    >
                      {ex.sets} × {ex.targetReps} @ {ex.targetWeight} kg
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              !error && (
                <p style={{ color: theme.colors.textMuted, fontSize: 13, margin: 0 }}>
                  No exercises available.
                </p>
              )
            )}
          </section>

          {/* Actions */}
          {isPro && !loading && plan && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <button
                onClick={handleSavePreset}
                disabled={saving || saveSuccess}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: theme.radius.sm,
                  border: `1px solid ${theme.colors.border}`,
                  background: 'transparent',
                  color: saveSuccess ? theme.colors.success : theme.colors.textPrimary,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: saving || saveSuccess ? 'default' : 'pointer',
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saveSuccess ? 'Saved!' : saving ? 'Saving…' : 'Save as preset'}
              </button>
              <button
                onClick={handleStartWorkout}
                disabled={starting}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: theme.radius.sm,
                  border: 'none',
                  background: theme.colors.primary,
                  color: '#ffffff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: starting ? 'default' : 'pointer',
                  opacity: starting ? 0.6 : 1,
                }}
              >
                {starting ? 'Loading…' : 'Start workout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
