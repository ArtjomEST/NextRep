'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  createPresetApi,
  updatePresetApi,
  fetchExercisesByIds,
  fetchPresetApi,
} from '@/lib/api/client';
import type { Exercise, WorkoutExercise } from '@/lib/types';
import { createEmptySet } from '@/lib/workout/metrics';
import ExercisePicker from '@/components/ExercisePicker';
import SortableExerciseCard from '@/components/SortableExerciseCard';
import { theme } from '@/lib/theme';

function exercisesToEntries(exercises: Exercise[]): WorkoutExercise[] {
  return exercises.map((ex, i) => ({
    id: ex.id,
    exerciseId: ex.id,
    exerciseName: ex.name,
    muscleGroups: ex.muscleGroups,
    equipment: ex.equipment,
    order: i,
    sets: [createEmptySet()],
    status: 'pending' as const,
  }));
}

export default function PresetFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');
  const isEditMode = !!editId;

  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingPreset, setLoadingPreset] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);

  const entries = useMemo(() => exercisesToEntries(exercises), [exercises]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  );

  const loadPreset = useCallback(async (id: string) => {
    setLoadingPreset(true);
    setError(null);
    try {
      const preset = await fetchPresetApi(id);
      setName(preset.name);
      if (preset.exerciseIds.length > 0) {
        const loaded = await fetchExercisesByIds(preset.exerciseIds);
        setExercises(loaded);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preset');
    } finally {
      setLoadingPreset(false);
    }
  }, []);

  useEffect(() => {
    if (editId) loadPreset(editId);
  }, [editId, loadPreset]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = entries.findIndex((e) => e.id === active.id);
    const newIndex = entries.findIndex((e) => e.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      setExercises((prev) => {
        const next = [...prev];
        const [removed] = next.splice(oldIndex, 1);
        next.splice(newIndex, 0, removed);
        return next;
      });
    }
  }

  function handleAdd(added: Exercise[]) {
    const ids = new Set(exercises.map((e) => e.id));
    const newOnes = added.filter((e) => !ids.has(e.id));
    setExercises((prev) => [...prev, ...newOnes]);
  }

  function handleRemove(exerciseId: string) {
    setExercises((prev) => prev.filter((e) => e.id !== exerciseId));
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a preset name');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = { name: trimmed, exerciseIds: exercises.map((e) => e.id) };
      if (isEditMode && editId) {
        await updatePresetApi(editId, payload);
      } else {
        await createPresetApi(payload);
      }
      router.push('/account');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preset');
    } finally {
      setSaving(false);
    }
  }

  if (loadingPreset) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: 16,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            border: `3px solid ${theme.colors.border}`,
            borderTopColor: theme.colors.primary,
            borderRadius: '50%',
            animation: 'preset-spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes preset-spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: theme.colors.textMuted, fontSize: 14, margin: 0 }}>
          Loading preset…
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        paddingTop: '16px',
        paddingBottom: '32px',
      }}
    >
      {/* ─── Header ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => router.push('/account')}
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
        <div>
          <h1
            style={{
              color: theme.colors.textPrimary,
              fontSize: '22px',
              fontWeight: 800,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {isEditMode ? 'Edit Preset' : 'Create Preset'}
          </h1>
          {isEditMode && (
            <p
              style={{
                color: theme.colors.textMuted,
                fontSize: '12px',
                margin: '2px 0 0',
              }}
            >
              Editing existing preset
            </p>
          )}
        </div>
      </div>

      {/* ─── Preset name input ─── */}
      <div>
        <label
          style={{
            display: 'block',
            color: theme.colors.textMuted,
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: '8px',
          }}
        >
          Preset name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Arm Day, Push Day"
          style={{
            width: '100%',
            backgroundColor: theme.colors.card,
            border: `1.5px solid ${isEditMode ? theme.colors.primary : theme.colors.border}`,
            borderRadius: '12px',
            padding: '14px 16px',
            color: theme.colors.textPrimary,
            fontSize: '16px',
            fontWeight: 500,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* ─── Exercises section ─── */}
      <section>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <h2
            style={{
              color: theme.colors.textPrimary,
              fontSize: '15px',
              fontWeight: 700,
              margin: 0,
            }}
          >
            Exercises
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {exercises.length > 0 && (
              <span style={{ color: theme.colors.textMuted, fontSize: '13px', fontWeight: 600 }}>
                {exercises.length}
              </span>
            )}
            <button
              onClick={() => setPickerOpen(true)}
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.textPrimary,
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + Add
            </button>
          </div>
        </div>

        {exercises.length === 0 ? (
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
            No exercises yet. Tap &quot;+ Add&quot; to build your template.
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={entries.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {entries.map((entry) => (
                  <SortableExerciseCard
                    key={entry.id}
                    entry={entry}
                    onRemove={() => handleRemove(entry.exerciseId)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </section>

      {/* ─── Error message ─── */}
      {error && (
        <p
          style={{
            color: theme.colors.error,
            fontSize: '14px',
            margin: 0,
            fontWeight: 500,
          }}
        >
          {error}
        </p>
      )}

      {/* ─── Save button ─── */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          width: '100%',
          backgroundColor: theme.colors.primary,
          color: theme.colors.textPrimary,
          border: 'none',
          borderRadius: '12px',
          padding: '15px',
          fontSize: '16px',
          fontWeight: 700,
          cursor: saving ? 'wait' : 'pointer',
          opacity: saving ? 0.75 : 1,
          letterSpacing: '0.01em',
          transition: 'opacity 0.15s ease',
        }}
      >
        {saving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Save Preset'}
      </button>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={handleAdd}
        alreadyAddedIds={exercises.map((e) => e.id)}
      />
    </div>
  );
}
