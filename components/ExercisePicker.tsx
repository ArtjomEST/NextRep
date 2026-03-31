'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { theme } from '@/lib/theme';
import { searchExercisesApi } from '@/lib/api/client';
import type { Exercise, MuscleGroup } from '@/lib/types';

interface ExercisePickerProps {
  open: boolean;
  onClose: () => void;
  onAdd: (exercises: Exercise[]) => void;
  alreadyAddedIds: string[];
}

const muscleGroups: MuscleGroup[] = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

const MUSCLE_TO_CATEGORY: Record<MuscleGroup, string> = {
  Chest: 'Chest',
  Back: 'Back',
  Legs: 'Legs',
  Shoulders: 'Shoulders',
  Arms: 'Arms',
  Core: 'Core',
};

export default function ExercisePicker({ open, onClose, onAdd, alreadyAddedIds }: ExercisePickerProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MuscleGroup | null>(null);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [results, setResults] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectedMapRef = useRef<Map<string, Exercise>>(new Map());

  useEffect(() => {
    if (open) {
      setPendingIds([]);
      setSearch('');
      setFilter(null);
      selectedMapRef.current = new Map();
    }
  }, [open]);

  const loadExercises = useCallback(async (q: string, mg: MuscleGroup | null) => {
    setLoading(true);
    try {
      const category = mg ? MUSCLE_TO_CATEGORY[mg] : undefined;
      const data = await searchExercisesApi(q, category, 50);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => loadExercises(search, filter), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, filter, open, loadExercises]);

  function toggleExercise(ex: Exercise) {
    if (alreadyAddedIds.includes(ex.id)) return;
    setPendingIds((prev) => {
      if (prev.includes(ex.id)) {
        selectedMapRef.current.delete(ex.id);
        return prev.filter((id) => id !== ex.id);
      }
      selectedMapRef.current.set(ex.id, ex);
      return [...prev, ex.id];
    });
  }

  function handleAddSelected() {
    const selectedExercises = pendingIds
      .map((id) => selectedMapRef.current.get(id) ?? results.find((ex) => ex.id === id))
      .filter((ex): ex is Exercise => ex !== undefined);
    onAdd(selectedExercises);
    onClose();
  }

  if (!open) return null;

  const hasSelection = pendingIds.length > 0;

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
      {/* ─── Header ─── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 16px 14px',
          borderBottom: `1px solid ${theme.colors.border}`,
          flexShrink: 0,
          gap: 12,
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: theme.colors.textMuted,
            fontSize: '15px',
            cursor: 'pointer',
            padding: '6px',
            margin: '-6px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            flexShrink: 0,
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        <div style={{ textAlign: 'center', flex: 1 }}>
          <h2
            style={{
              color: theme.colors.textPrimary,
              fontSize: '17px',
              fontWeight: 700,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Add Exercises
          </h2>
          {hasSelection && (
            <p
              style={{
                color: theme.colors.primary,
                fontSize: '12px',
                fontWeight: 600,
                margin: '2px 0 0',
              }}
            >
              {pendingIds.length} selected
            </p>
          )}
        </div>

        <div style={{ width: '52px', flexShrink: 0 }} />
      </div>

      {/* ─── Search ─── */}
      <div style={{ padding: '14px 16px 0', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <svg
            width="16"
            height="16"
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
            placeholder="Search exercises…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              backgroundColor: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: '10px',
              padding: '12px 14px 12px 40px',
              color: theme.colors.textPrimary,
              fontSize: '15px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* ─── Muscle group filter chips ─── */}
      <div
        style={{
          display: 'flex',
          gap: '7px',
          padding: '12px 16px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          flexShrink: 0,
        }}
      >
        {muscleGroups.map((mg) => {
          const active = filter === mg;
          return (
            <button
              key={mg}
              onClick={() => setFilter(active ? null : mg)}
              style={{
                backgroundColor: active ? theme.colors.primary : theme.colors.card,
                color: active ? theme.colors.textPrimary : theme.colors.textMuted,
                border: `1.5px solid ${active ? theme.colors.primary : theme.colors.border}`,
                borderRadius: '20px',
                padding: '7px 14px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
              }}
            >
              {mg}
            </button>
          );
        })}
      </div>

      {/* ─── Exercise list ─── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0 16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {loading && results.length === 0 && (
          <p
            style={{
              color: theme.colors.textMuted,
              fontSize: '14px',
              textAlign: 'center',
              padding: '40px 0',
              margin: 0,
            }}
          >
            Loading exercises…
          </p>
        )}

        {!loading && results.length === 0 && (
          <p
            style={{
              color: theme.colors.textMuted,
              fontSize: '14px',
              textAlign: 'center',
              padding: '40px 0',
              margin: 0,
            }}
          >
            No exercises found
          </p>
        )}

        {results.map((ex) => {
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
                  ? 'rgba(31,138,91,0.08)'
                  : theme.colors.card,
                border: `1.5px solid ${
                  isPending ? theme.colors.primary : theme.colors.border
                }`,
                borderRadius: '14px',
                padding: '13px 14px',
                cursor: isAlreadyAdded ? 'default' : 'pointer',
                opacity: isAlreadyAdded ? 0.45 : 1,
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
              }}
            >
              {/* Exercise info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    color: theme.colors.textPrimary,
                    fontSize: '15px',
                    fontWeight: 600,
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {ex.name}
                </span>
                <div style={{ display: 'flex', gap: '5px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {ex.muscleGroups.map((mg) => (
                    <span key={mg} style={muscleTagStyle}>{mg}</span>
                  ))}
                  {ex.equipment && (
                    <span style={equipTagStyle}>{ex.equipment}</span>
                  )}
                  {ex.measurementType === 'cardio' && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)',
                      borderRadius: 5, padding: '1px 6px',
                    }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#3B82F6' }} />
                      <span style={{ fontSize: 9, fontWeight: 600, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        CARDIO
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Selection indicator */}
              <div style={{ flexShrink: 0, marginLeft: '12px', display: 'flex', alignItems: 'center' }}>
                {isAlreadyAdded ? (
                  <span
                    style={{
                      color: theme.colors.textMuted,
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    Added
                  </span>
                ) : isPending ? (
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: theme.colors.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                ) : (
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: `1.5px solid ${theme.colors.border}`,
                      flexShrink: 0,
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ─── Sticky add button ─── */}
      <div
        style={{
          padding: '12px 16px',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          borderTop: `1px solid ${theme.colors.border}`,
          backgroundColor: theme.colors.bgPrimary,
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleAddSelected}
          disabled={!hasSelection}
          style={{
            width: '100%',
            backgroundColor: hasSelection ? theme.colors.primary : theme.colors.card,
            color: hasSelection ? theme.colors.textPrimary : theme.colors.textMuted,
            border: `1px solid ${hasSelection ? 'transparent' : theme.colors.border}`,
            borderRadius: '12px',
            padding: '15px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: hasSelection ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.15s ease, color 0.15s ease',
            letterSpacing: '0.01em',
          }}
        >
          {!hasSelection ? 'Select exercises' : `Add ${pendingIds.length} Exercise${pendingIds.length !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}

const muscleTagStyle: React.CSSProperties = {
  backgroundColor: theme.colors.surface,
  color: theme.colors.textMuted,
  fontSize: '10px',
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: '5px',
  border: `1px solid ${theme.colors.border}`,
};

const equipTagStyle: React.CSSProperties = {
  backgroundColor: 'rgba(31,138,91,0.14)',
  color: theme.colors.primary,
  fontSize: '10px',
  fontWeight: 600,
  padding: '3px 8px',
  borderRadius: '5px',
};
