'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkout } from '@/lib/workout/state';
import { fetchPresetsApi, fetchExercisesByIds } from '@/lib/api/client';
import type { Preset } from '@/lib/api/types';
import { ui } from '@/lib/ui-styles';

export default function StartWorkoutPage() {
  const router = useRouter();
  const { dispatch } = useWorkout();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const loadPresets = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchPresetsApi();
      setPresets(list);
    } catch {
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
        gap: ui.gap,
        padding: 16,
        paddingBottom: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'none',
            border: 'none',
            color: ui.textLabel,
            cursor: 'pointer',
            padding: 8,
            margin: -8,
            fontSize: 18,
          }}
        >
          ←
        </button>
        <h1 style={{ color: ui.textPrimary, fontSize: 22, fontWeight: 800, margin: 0 }}>
          Start Workout
        </h1>
      </div>

      <button
        onClick={handleNewEmpty}
        style={{
          width: '100%',
          background: ui.heroGradient,
          border: ui.cardBorder,
          borderRadius: 18,
          padding: '20px 24px',
          color: ui.textPrimary,
          fontSize: 18,
          fontWeight: 700,
          cursor: 'pointer',
          textAlign: 'center',
          boxShadow: ui.cardShadow,
        }}
      >
        New Empty Workout
      </button>

      <section>
        <h2
          style={{
            color: ui.textLabel,
            fontSize: 13,
            fontWeight: 700,
            margin: '0 0 12px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Use Preset
        </h2>
        {loading ? (
          <div
            style={{
              background: ui.cardBg,
              border: ui.cardBorder,
              borderRadius: ui.cardRadius,
              padding: 24,
              textAlign: 'center',
              color: ui.textMuted,
            }}
          >
            Loading presets…
          </div>
        ) : presets.length === 0 ? (
          <div
            style={{
              background: ui.cardBg,
              border: ui.cardBorder,
              borderRadius: ui.cardRadius,
              padding: 24,
              textAlign: 'center',
              color: ui.textMuted,
              fontSize: 14,
            }}
          >
            No presets yet. Create one in Account → Workout Presets.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleUsePreset(preset)}
                disabled={applyingId !== null}
                style={{
                  background: ui.cardBg,
                  border: ui.cardBorder,
                  borderRadius: ui.cardRadius,
                  padding: 18,
                  boxShadow: ui.cardShadow,
                  cursor: applyingId !== null ? 'wait' : 'pointer',
                  textAlign: 'left',
                  color: 'inherit',
                  opacity: applyingId === preset.id ? 0.7 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: ui.textPrimary, fontSize: 16, fontWeight: 700 }}>
                    {preset.name}
                  </span>
                  <span style={{ color: ui.textMuted, fontSize: 13 }}>
                    {preset.exerciseIds.length} exercise{preset.exerciseIds.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {applyingId === preset.id && (
                  <p style={{ color: ui.textMuted, fontSize: 12, margin: '8px 0 0' }}>
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
