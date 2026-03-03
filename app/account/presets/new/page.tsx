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
import { ui } from '@/lib/ui-styles';

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
            width: 28,
            height: 28,
            border: `3px solid rgba(255,255,255,0.1)`,
            borderTopColor: ui.accent,
            borderRadius: '50%',
            animation: 'preset-spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes preset-spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: ui.textMuted, fontSize: 14, margin: 0 }}>Loading preset…</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingBottom: 24 }}>
      <div style={{ padding: 16, paddingBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            onClick={() => router.push('/account')}
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
          <div>
            <h1 style={{ color: ui.textPrimary, fontSize: 22, fontWeight: 800, margin: 0 }}>
              {isEditMode ? 'Edit Preset' : 'Create Preset'}
            </h1>
            {isEditMode && (
              <p style={{ color: ui.textMuted, fontSize: 12, margin: '2px 0 0' }}>
                Editing existing preset
              </p>
            )}
          </div>
        </div>

        <label
          style={{
            display: 'block',
            color: ui.textLabel,
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 8,
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
            background: ui.cardBg,
            border: isEditMode ? `1px solid ${ui.accent}` : ui.cardBorder,
            borderRadius: ui.cardRadius,
            padding: '14px 16px',
            color: ui.textPrimary,
            fontSize: 16,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ color: ui.textPrimary, fontSize: 15, fontWeight: 700, margin: 0 }}>
              Exercises ({exercises.length})
            </h2>
            <button
              onClick={() => setPickerOpen(true)}
              style={{
                background: ui.accent,
                color: ui.textPrimary,
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              + Add Exercise
            </button>
          </div>

          {exercises.length === 0 ? (
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
              No exercises. Tap &quot;Add Exercise&quot; to build your template.
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
        </div>
      </div>

      {error && (
        <p style={{ color: ui.error, fontSize: 14, margin: '12px 16px 0' }}>{error}</p>
      )}

      <div style={{ marginTop: 'auto', padding: 16, paddingBottom: 40 }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            background: isEditMode ? ui.accent : ui.accent,
            color: ui.textPrimary,
            border: 'none',
            borderRadius: ui.cardRadius,
            padding: 16,
            fontSize: 16,
            fontWeight: 700,
            cursor: saving ? 'wait' : 'pointer',
            opacity: saving ? 0.8 : 1,
          }}
        >
          {saving ? 'Saving…' : isEditMode ? 'Save Changes' : 'Save Preset'}
        </button>
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={handleAdd}
        alreadyAddedIds={exercises.map((e) => e.id)}
      />
    </div>
  );
}
