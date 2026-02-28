'use client';

import React, { useState } from 'react';
import ExerciseCard from '@/components/ExerciseCard';
import { theme } from '@/lib/theme';
import { mockExercises } from '@/lib/mockData';
import type { MuscleGroup } from '@/lib/types';

const muscleGroups: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

export default function ExercisesPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<MuscleGroup | null>(null);

  const filtered = mockExercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !activeFilter || ex.muscleGroups.includes(activeFilter);
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px' }}>
      <h1
        style={{
          color: theme.colors.textPrimary,
          fontSize: '24px',
          fontWeight: 700,
          margin: 0,
        }}
      >
        Exercises
      </h1>

      <div style={{ position: 'relative' }}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={theme.colors.textMuted}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          placeholder="Search exercises..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%',
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md,
            padding: '12px 14px 12px 42px',
            color: theme.colors.textPrimary,
            fontSize: '15px',
            outline: 'none',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          paddingBottom: '4px',
        }}
      >
        {muscleGroups.map((mg) => (
          <button
            key={mg}
            onClick={() => setActiveFilter(activeFilter === mg ? null : mg)}
            style={{
              backgroundColor: activeFilter === mg ? theme.colors.primary : theme.colors.surface,
              color: activeFilter === mg ? theme.colors.textPrimary : theme.colors.textSecondary,
              border: activeFilter === mg ? 'none' : `1px solid ${theme.colors.border}`,
              borderRadius: '20px',
              padding: '7px 14px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
          >
            {mg}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.map((exercise) => (
          <ExerciseCard key={exercise.id} exercise={exercise} />
        ))}
        {filtered.length === 0 && (
          <p
            style={{
              color: theme.colors.textMuted,
              fontSize: '14px',
              textAlign: 'center',
              padding: '32px 0',
            }}
          >
            No exercises found
          </p>
        )}
      </div>
    </div>
  );
}
