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
import ExercisePicker from '@/components/ExercisePicker';
import SortableExerciseCard from '@/components/SortableExerciseCard';

export default function NewWorkoutPage() {
  const router = useRouter();
  const { draft, dispatch } = useWorkout();
  const [pickerOpen, setPickerOpen] = useState(false);

  const canStart = draft.exercises.length > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
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
          New Workout
        </h1>
      </div>

      {/* ─── Workout name input ─── */}
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
          Workout Name
        </label>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => dispatch({ type: 'SET_NAME', name: e.target.value })}
          placeholder="e.g. Push Day, Arm Day"
          style={{
            width: '100%',
            backgroundColor: theme.colors.card,
            border: `1.5px solid ${theme.colors.border}`,
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

      {/* ─── Exercise list with DnD ─── */}
      {draft.exercises.length > 0 && (
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
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
            <span
              style={{
                color: theme.colors.textMuted,
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {draft.exercises.length}
            </span>
          </div>
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

      {/* ─── Add exercise ─── */}
      <button
        onClick={() => setPickerOpen(true)}
        style={{
          width: '100%',
          backgroundColor: 'transparent',
          border: `1px dashed ${theme.colors.border}`,
          borderRadius: '10px',
          padding: '14px',
          color: theme.colors.textMuted,
          fontSize: '15px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'border-color 0.15s ease',
        }}
      >
        + Add Exercise
      </button>

      {/* ─── CTAs ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          onClick={handleStart}
          disabled={!canStart}
          style={{
            width: '100%',
            backgroundColor: theme.colors.primary,
            color: theme.colors.textPrimary,
            border: 'none',
            borderRadius: '12px',
            padding: '15px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: canStart ? 'pointer' : 'not-allowed',
            opacity: canStart ? 1 : 0.4,
            letterSpacing: '0.01em',
            transition: 'opacity 0.15s ease',
          }}
        >
          Start Session
        </button>
        <button
          onClick={handleCancel}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            color: theme.colors.textMuted,
            fontSize: '15px',
            fontWeight: 600,
            padding: '12px',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>

      {/* ─── Exercise picker overlay ─── */}
      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onAdd={handleAdd}
        alreadyAddedIds={draft.exercises.map((e) => e.exerciseId)}
      />
    </div>
  );
}
