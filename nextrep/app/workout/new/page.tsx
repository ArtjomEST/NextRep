'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { theme } from '@/lib/theme';
import { useWorkout } from '@/lib/workout/state';
import type { Exercise } from '@/lib/types';
import Button from '@/components/Button';
import ExercisePicker from '@/components/ExercisePicker';
import SortableExerciseCard from '@/components/SortableExerciseCard';

export default function NewWorkoutPage() {
  const router = useRouter();
  const { draft, dispatch } = useWorkout();
  const [pickerOpen, setPickerOpen] = useState(false);

  const canStart = draft.exercises.length > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 8 },
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = draft.exercises.findIndex((e) => e.id === active.id);
    const newIndex = draft.exercises.findIndex((e) => e.id === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      dispatch({ type: 'REORDER_EXERCISES', fromIndex: oldIndex, toIndex: newIndex });
    }
  }

  function handleAdd(exercises: Exercise[]) {
    exercises.forEach((ex) => dispatch({ type: 'ADD_EXERCISE', exercise: ex }));
  }

  function handleStart() {
    dispatch({ type: 'START_SESSION' });
    router.push('/workout/active');
  }

  function handleCancel() {
    dispatch({ type: 'RESET_DRAFT' });
    router.push('/');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px', paddingBottom: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => router.push('/')}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.textSecondary,
            cursor: 'pointer',
            padding: '8px',
            margin: '-8px',
            fontSize: '15px',
          }}
        >
          ←
        </button>
        <h1 style={{ color: theme.colors.textPrimary, fontSize: '22px', fontWeight: 700, margin: 0 }}>
          New Workout
        </h1>
      </div>

      {/* Workout name */}
      <div>
        <label style={{ color: theme.colors.textSecondary, fontSize: '13px', fontWeight: 500, marginBottom: '6px', display: 'block' }}>
          Workout Name
        </label>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => dispatch({ type: 'SET_NAME', name: e.target.value })}
          placeholder="Workout name (e.g. Push Day)"
          style={{
            width: '100%',
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md,
            padding: '14px 16px',
            color: theme.colors.textPrimary,
            fontSize: '16px',
            fontWeight: 500,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Exercise list with DnD */}
      {draft.exercises.length > 0 && (
        <section>
          <h2 style={{ color: theme.colors.textPrimary, fontSize: '15px', fontWeight: 600, margin: '0 0 10px 0' }}>
            Exercises ({draft.exercises.length})
          </h2>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={draft.exercises.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {draft.exercises.map((entry) => (
                  <SortableExerciseCard
                    key={entry.id}
                    entry={entry}
                    onRemove={() => dispatch({ type: 'REMOVE_EXERCISE', exerciseEntryId: entry.id })}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </section>
      )}

      {/* Add exercise */}
      <Button
        variant="secondary"
        fullWidth
        onClick={() => setPickerOpen(true)}
      >
        + Add Exercise
      </Button>

      {/* CTAs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
        <Button
          fullWidth
          size="lg"
          disabled={!canStart}
          onClick={handleStart}
          style={{ opacity: canStart ? 1 : 0.4 }}
        >
          Start Session
        </Button>
        <Button
          variant="ghost"
          fullWidth
          onClick={handleCancel}
        >
          Cancel
        </Button>
      </div>

      {/* Picker overlay */}
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={handleAdd}
        alreadyAddedIds={draft.exercises.map((e) => e.exerciseId)}
      />
    </div>
  );
}
