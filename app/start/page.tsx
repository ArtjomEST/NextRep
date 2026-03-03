'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkout } from '@/lib/workout/state';
import { fetchPresetsApi, fetchExercisesByIds } from '@/lib/api/client';
import type { Preset } from '@/lib/api/types';
import { theme } from '@/lib/theme';

export default function StartWorkoutPage() {
  const router = useRouter();
  const { dispatch } = useWorkout();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetsError, setPresetsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const loadPresets = useCallback(async () => {
    setLoading(true);
    setPresetsError(null);
    try {
      const list = await fetchPresetsApi();
      setPresets(list);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load presets';
      setPresetsError(msg);
      setPresets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  function handleNewEmpty() {
    dispatch({ type: 'RESET_DRAFT' });
    router.push('/workout/new');
  }

  async function handleUsePreset(preset: Preset) {
    setApplyingId(preset.id);
    try {
      const exercises = await fetchExercisesByIds(preset.exerciseIds);
      dispatch({ type: 'RESET_DRAFT' });
      dispatch({ type: 'SET_NAME', name: preset.name });
      for (const ex of exercises) {
        dispatch({ type: 'ADD_EXERCISE', exercise: ex });
      }
      router.push('/workout/new');
    } catch {
      setApplyingId(null);
    } finally {
      setApplyingId(null);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        paddingTop: '16px',
        paddingBottom: '100px',
      }}
    >
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.textMuted,
            cursor: 'pointer',
            padding: '8px',
            margin: '-8px',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          ←
        </button>
        <h1
          style={{
            color: theme.colors.textPrimary,
            fontSize: '22px',
            fontWeight: 800,
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          Start Workout
        </h1>
      </div>

      {/* ─── New Empty Workout ─── */}
      <button
        onClick={handleNewEmpty}
        style={{
          width: '100%',
          background: `linear-gradient(145deg, #0f2e1f 0%, #143d28 40%, #165834 100%)`,
          border: `1.5px solid rgba(255,255,255,0.07)`,
          borderRadius: '18px',
          padding: '22px 24px',
          color: theme.colors.textPrimary,
          fontSize: '17px',
          fontWeight: 700,
          cursor: 'pointer',
          textAlign: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
          letterSpacing: '0.01em',
        }}
      >
        New Empty Workout
      </button>

      {/* ─── Presets section ─── */}
      <section>
        <h2
          style={{
            color: theme.colors.textMuted,
            fontSize: '11px',
            fontWeight: 700,
            margin: '0 0 12px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          Use Preset
        </h2>

        {loading ? (
          <div
            style={{
              backgroundColor: theme.colors.card,
              border: `1.5px solid ${theme.colors.border}`,
              borderRadius: '14px',
              padding: '24px',
              textAlign: 'center',
              color: theme.colors.textMuted,
              fontSize: '14px',
            }}
          >
            Loading presets…
          </div>
        ) : presetsError ? (
          <div
            style={{
              backgroundColor: theme.colors.card,
              border: `1.5px solid ${theme.colors.border}`,
              borderRadius: '14px',
              padding: '24px',
              textAlign: 'center',
              color: theme.colors.error,
              fontSize: '14px',
            }}
          >
            {presetsError.includes('401') || presetsError.includes('Authentication')
              ? 'Open NextRep via Telegram to access your presets.'
              : presetsError}
          </div>
        ) : presets.length === 0 ? (
          <div
            style={{
              backgroundColor: theme.colors.card,
              border: `1.5px solid ${theme.colors.border}`,
              borderRadius: '14px',
              padding: '28px 20px',
              textAlign: 'center',
              color: theme.colors.textMuted,
              fontSize: '14px',
            }}
          >
            No presets yet. Create one in Account → Workout Presets.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleUsePreset(preset)}
                disabled={applyingId !== null}
                style={{
                  backgroundColor: theme.colors.card,
                  border: `1.5px solid ${applyingId === preset.id ? theme.colors.primary : theme.colors.border}`,
                  borderRadius: '14px',
                  padding: '14px 16px',
                  boxShadow: 'none',
                  cursor: applyingId !== null ? 'wait' : 'pointer',
                  textAlign: 'left',
                  color: 'inherit',
                  opacity: applyingId !== null && applyingId !== preset.id ? 0.5 : 1,
                  transition: 'border-color 0.15s ease, opacity 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      color: theme.colors.textPrimary,
                      fontSize: '15px',
                      fontWeight: 600,
                    }}
                  >
                    {preset.name}
                  </span>
                  <span
                    style={{
                      color: theme.colors.textMuted,
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  >
                    {preset.exerciseIds.length} exercise{preset.exerciseIds.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {applyingId === preset.id && (
                  <p
                    style={{
                      color: theme.colors.primary,
                      fontSize: '12px',
                      fontWeight: 600,
                      margin: '6px 0 0',
                    }}
                  >
                    Loading…
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
