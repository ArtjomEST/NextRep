'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import WorkoutExerciseCard from './WorkoutExerciseCard';
import type { WorkoutExercise } from '@/lib/types';

interface SortableExerciseCardProps {
  entry: WorkoutExercise;
  onRemove: () => void;
}

export default function SortableExerciseCard({ entry, onRemove }: SortableExerciseCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition ?? undefined,
        position: 'relative',
        zIndex: isDragging ? 10 : 0,
      }}
    >
      <WorkoutExerciseCard
        entry={entry}
        onRemove={onRemove}
        isDragging={isDragging}
        dragHandleProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLDivElement>}
      />
    </div>
  );
}
