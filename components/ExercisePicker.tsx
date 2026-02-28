'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { theme } from '@/lib/theme';
import { mockExercises } from '@/lib/mockData';
import type { Exercise, MuscleGroup } from '@/lib/types';

interface ExercisePickerProps {
  open: boolean;
  onClose: () => void;
  onAdd: (exercises: Exercise[]) => void;
  alreadyAddedIds: string[];
}

const muscleGroups: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

export default function ExercisePicker({ open, onClose, onAdd, alreadyAddedIds }: ExercisePickerProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MuscleGroup | null>(null);
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  // Reset selection each time picker opens
  useEffect(() => {
    if (open) {
      setPendingIds([]);
      setSearch('');
      setFilter(null);
    }
  }, [open]);

  const filtered = useMemo(() => {
    return mockExercises.filter((ex) => {
      const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase());
      const matchFilter = !filter || ex.muscleGroups.includes(filter);
      return matchSearch && matchFilter;
    });
  }, [search, filter]);

  function toggleExercise(ex: Exercise) {
    if (alreadyAddedIds.includes(ex.id)) return;
    setPendingIds((prev) =>
      prev.includes(ex.id) ? prev.filter((id) => id !== ex.id) : [...prev, ex.id],
    );
  }

  function handleAddSelected() {
    const selectedExercises = pendingIds
      .map((id) => mockExercises.find((ex) => ex.id === id))
      .filter((ex): ex is Exercise => ex !== undefined);
    onAdd(selectedExercises);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.colors.bgPrimary,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px',
          borderBottom: `1px solid ${theme.colors.border}`,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.textSecondary,
            fontSize: '15px',
            cursor: 'pointer',
            padding: '8px',
            margin: '-8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span style={{ fontSize: '15px' }}>Back</span>
        </button>
        <h2
          style={{
            color: theme.colors.textPrimary,
            fontSize: '17px',
            fontWeight: 600,
            margin: 0,
            flex: 1,
            textAlign: 'center',
          }}
        >
          Add Exercises
        </h2>
        {/* Spacer to balance the back button */}
        <div style={{ width: '64px', flexShrink: 0 }} />
      </div>

      {/* Search */}
      <div style={{ padding: '12px 16px 0', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={theme.colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              padding: '12px 14px 12px 42px',
              color: theme.colors.textPrimary,
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Filter chips */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          flexShrink: 0,
        }}
      >
        {muscleGroups.map((mg) => (
          <button
            key={mg}
            onClick={() => setFilter(filter === mg ? null : mg)}
            style={{
              backgroundColor: filter === mg ? theme.colors.primary : theme.colors.surface,
              color: filter === mg ? '#fff' : theme.colors.textSecondary,
              border: filter === mg ? 'none' : `1px solid ${theme.colors.border}`,
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

      {/* Exercise list */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {filtered.map((ex) => {
          const isAlreadyAdded = alreadyAddedIds.includes(ex.id);
          const isPending = pendingIds.includes(ex.id);

          return (
            <button
              key={ex.id}
              onClick={() => toggleExercise(ex)}
              disabled={isAlreadyAdded}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                textAlign: 'left',
                backgroundColor: isPending
                  ? 'rgba(31, 138, 91, 0.10)'
                  : theme.colors.card,
                border: `1px solid ${
                  isPending
                    ? theme.colors.primary
                    : isAlreadyAdded
                    ? theme.colors.border
                    : theme.colors.border
                }`,
                borderRadius: theme.radius.md,
                padding: '14px 16px',
                cursor: isAlreadyAdded ? 'default' : 'pointer',
                opacity: isAlreadyAdded ? 0.5 : 1,
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    color: theme.colors.textPrimary,
                    fontSize: '15px',
                    fontWeight: 600,
                  }}
                >
                  {ex.name}
                </span>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {ex.muscleGroups.map((mg) => (
                    <span
                      key={mg}
                      style={{
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.textSecondary,
                        fontSize: '11px',
                        fontWeight: 500,
                        padding: '2px 7px',
                        borderRadius: '6px',
                        border: `1px solid ${theme.colors.border}`,
                      }}
                    >
                      {mg}
                    </span>
                  ))}
                  <span
                    style={{
                      backgroundColor: 'rgba(31, 138, 91, 0.12)',
                      color: theme.colors.primary,
                      fontSize: '11px',
                      fontWeight: 500,
                      padding: '2px 7px',
                      borderRadius: '6px',
                    }}
                  >
                    {ex.equipment}
                  </span>
                </div>
              </div>

              {/* Right-side indicator */}
              <div style={{ flexShrink: 0, marginLeft: '12px', display: 'flex', alignItems: 'center' }}>
                {isAlreadyAdded ? (
                  <span style={{ color: theme.colors.textMuted, fontSize: '12px', fontWeight: 500 }}>
                    Already added
                  </span>
                ) : isPending ? (
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: theme.colors.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                ) : (
                  <div
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      border: `1.5px solid ${theme.colors.border}`,
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}

        {filtered.length === 0 && (
          <p style={{ color: theme.colors.textMuted, fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
            No exercises found
          </p>
        )}
      </div>

      {/* Sticky bottom — Add Selected button */}
      <div
        style={{
          padding: '12px 16px',
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
          borderTop: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.bgPrimary,
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleAddSelected}
          disabled={pendingIds.length === 0}
          style={{
            width: '100%',
            backgroundColor: pendingIds.length === 0 ? theme.colors.surface : theme.colors.primary,
            color: pendingIds.length === 0 ? theme.colors.textMuted : '#fff',
            border: 'none',
            borderRadius: theme.radius.md,
            padding: '16px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: pendingIds.length === 0 ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.15s ease, color 0.15s ease',
          }}
        >
          {pendingIds.length === 0 ? 'Select exercises' : `Add Selected (${pendingIds.length})`}
        </button>
      </div>
    </div>
  );
}
