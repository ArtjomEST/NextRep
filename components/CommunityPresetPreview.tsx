'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { fetchCommunityPresetExercisesApi, fetchExerciseDetailApi } from '@/lib/api/client';
import type {
  ExerciseDetail,
  FeedPostPresetSummary,
  FeedPresetExercisePreview,
} from '@/lib/api/types';
import Button from '@/components/Button';
import ExerciseInfoSheet from '@/components/ExerciseInfoSheet';
import MuscleMapLazy from '@/components/MuscleMapLazy';
import { WorkoutLogExerciseRow } from '@/components/WorkoutLogExerciseRow';

// ─── Constants ───────────────────────────────────────────────────────────────

const CARD_BG = '#1A1D23';
const GREEN = '#22C55E';
const MUTED = '#6B7280';
const TEXT = '#F3F4F6';
const BORDER = '#262E36';
const DIVIDER = 'rgba(255,255,255,0.07)';

const MAX_PRIMARY_TAGS = 3;
const MAX_SECONDARY_TAGS = 3;

// ─── Cache ────────────────────────────────────────────────────────────────────

const presetExerciseCache = new Map<string, FeedPresetExercisePreview[]>();

function cacheGet(id: string) {
  return presetExerciseCache.get(id);
}
function cacheSet(id: string, rows: FeedPresetExercisePreview[]) {
  presetExerciseCache.set(id, rows);
}

function setsLabelForRow(ex: FeedPresetExercisePreview): string | undefined {
  if (ex.targetSets != null && ex.targetSets > 0) return `${ex.targetSets} sets`;
  if (ex.setsRepsLabel) return ex.setsRepsLabel;
  return undefined;
}

/** Primary: зелёная обводка. Secondary: серые. Компактные для карточки. */
function MuscleTagPrimary({ label, compact }: { label: string; compact?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: compact ? '4px 8px' : '6px 10px',
        borderRadius: '8px',
        border: `1px solid ${GREEN}`,
        backgroundColor: 'transparent',
        color: TEXT,
        fontSize: compact ? '11px' : '12px',
        fontWeight: 500,
        lineHeight: 1.35,
      }}
    >
      {label}
    </span>
  );
}

function MuscleTagSecondary({ label, compact }: { label: string; compact?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: compact ? '4px 8px' : '6px 10px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.14)',
        backgroundColor: 'rgba(255,255,255,0.04)',
        color: MUTED,
        fontSize: compact ? '11px' : '12px',
        fontWeight: 500,
        lineHeight: 1.35,
      }}
    >
      {label}
    </span>
  );
}

function useNarrowLayout(breakpointPx: number) {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [breakpointPx]);

  return narrow;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function CommunityPresetPreview({
  preset,
  authorName,
  showSavePreset,
  savedByMe,
  onSavePreset,
}: {
  preset: FeedPostPresetSummary;
  authorName: string;
  showSavePreset: boolean;
  savedByMe: boolean;
  onSavePreset: () => void;
}) {
  const narrow = useNarrowLayout(420);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoDetail, setInfoDetail] = useState<ExerciseDetail | null>(null);
  const [resolved, setResolved] = useState<FeedPresetExercisePreview[]>(() => {
    const ex = preset.exercises ?? [];
    if (ex.length > 0) {
      cacheSet(preset.id, ex);
      return ex;
    }
    return cacheGet(preset.id) ?? [];
  });

  useEffect(() => {
    const ex = preset.exercises;
    if (ex && ex.length > 0) {
      cacheSet(preset.id, ex);
      setResolved(ex);
    }
  }, [preset.id, preset.exercises]);

  const loadAll = useCallback(async () => {
    const cached = cacheGet(preset.id);
    if (cached && cached.length > 0) {
      setResolved(cached);
      return;
    }
    const feedEx = preset.exercises ?? [];
    if (feedEx.length > 0) {
      cacheSet(preset.id, feedEx);
      setResolved(feedEx);
      return;
    }
    const rows = await fetchCommunityPresetExercisesApi(preset.id);
    cacheSet(preset.id, rows);
    setResolved(rows);
  }, [preset.id, preset.exercises]);

  useEffect(() => {
    if (sheetOpen) void loadAll().catch(() => {});
  }, [sheetOpen, loadAll]);

  const ms = preset.muscleSummary ?? {
    primary: [] as string[],
    secondary: [] as string[],
  };

  const totalSets = resolved.reduce((s, ex) => s + (ex.targetSets ?? 0), 0);
  const metaLine = [
    `${preset.exerciseCount} exercise${preset.exerciseCount !== 1 ? 's' : ''}`,
    totalSets > 0 ? `${totalSets} sets` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const sheetExercises = resolved.length > 0 ? resolved : (preset.exercises ?? []);
  const hasMuscles = ms.primary.length > 0 || ms.secondary.length > 0;

  const handleOpenExerciseInfo = useCallback(
    async (exerciseId: string) => {
      setInfoOpen(true);
      setInfoLoading(true);
      setInfoDetail(null);
      try {
        const detail = await fetchExerciseDetailApi(exerciseId);
        setInfoDetail(detail);
      } catch {
        const ex = sheetExercises.find((e) => e.exerciseId === exerciseId);
        if (ex) {
          setInfoDetail({
            id: ex.exerciseId,
            name: ex.name,
            description: null,
            howTo: null,
            instructions: [],
            category: null,
            primaryMuscles: [],
            secondaryMuscles: [],
            equipment: [],
            measurementType: 'weight_reps',
            imageUrl: ex.imageUrl,
            images: [],
            source: 'wger',
            sourceId: null,
          });
        }
      } finally {
        setInfoLoading(false);
      }
    },
    [sheetExercises],
  );

  const handleCloseExerciseInfo = useCallback(() => {
    setInfoOpen(false);
    setInfoDetail(null);
  }, []);

  const primaryShown = ms.primary.slice(0, MAX_PRIMARY_TAGS);
  const secondaryShown = ms.secondary.slice(0, MAX_SECONDARY_TAGS);
  const hiddenMuscleCount =
    Math.max(0, ms.primary.length - MAX_PRIMARY_TAGS) +
    Math.max(0, ms.secondary.length - MAX_SECONDARY_TAGS);

  return (
    <>
      <div
        style={{
          borderRadius: '14px',
          backgroundColor: CARD_BG,
          border: `1px solid ${BORDER}`,
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <div
          style={{
            height: '3px',
            background: 'linear-gradient(90deg, #1F8A5B 0%, #22C55E 100%)',
          }}
        />

        <div style={{ padding: narrow ? '8px 10px 10px' : '10px 14px 12px', minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '8px',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px 2px 6px',
                borderRadius: '999px',
                backgroundColor: 'rgba(34,197,94,0.09)',
                border: '1px solid rgba(34,197,94,0.2)',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: GREEN,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  color: GREEN,
                  textTransform: 'uppercase',
                }}
              >
                Workout Preset
              </span>
            </div>
          </div>

          <div style={{ height: '1px', backgroundColor: DIVIDER, marginBottom: '10px' }} />

          {/* Двухколоночный блок: слева заголовок + meta, справа теги мышц */}
          <div
            style={{
              display: 'flex',
              flexDirection: narrow ? 'column' : 'row',
              alignItems: narrow ? 'stretch' : 'flex-start',
              gap: narrow ? '10px' : '14px',
              marginBottom: '10px',
            }}
          >
            <div style={{ flex: '1 1 0', minWidth: 0 }}>
              <div
                style={{
                  color: TEXT,
                  fontWeight: 700,
                  fontSize: '16px',
                  lineHeight: 1.25,
                  letterSpacing: '-0.01em',
                  marginBottom: '4px',
                }}
              >
                {preset.name}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: MUTED,
                  fontWeight: 500,
                  lineHeight: 1.35,
                }}
              >
                {metaLine}
              </div>
            </div>

            <div
              style={{
                flex: narrow ? 'none' : '1 1 0',
                minWidth: 0,
                maxHeight: narrow ? '60px' : 120,
                overflowY: 'auto',
                alignSelf: narrow ? 'stretch' : 'flex-start',
              }}
            >
              {hasMuscles ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: narrow ? 'flex-start' : 'flex-end' }}>
                  {primaryShown.map((m) => (
                    <MuscleTagPrimary key={`p-${m}`} label={m} compact />
                  ))}
                  {secondaryShown.map((m) => (
                    <MuscleTagSecondary key={`s-${m}`} label={m} compact />
                  ))}
                  {hiddenMuscleCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setSheetOpen(true)}
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        border: `1px dashed ${BORDER}`,
                        background: 'transparent',
                        color: MUTED,
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      +{hiddenMuscleCount}
                    </button>
                  ) : null}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: '11px', color: MUTED, textAlign: narrow ? 'left' : 'right' }}>
                  Muscle data unavailable
                </p>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gap: narrow ? '6px' : '8px',
              width: '100%',
              minWidth: 0,
              gridTemplateColumns:
                showSavePreset || savedByMe
                  ? 'minmax(0, 1fr) minmax(0, 1fr)'
                  : 'minmax(0, 1fr)',
              justifyItems: 'stretch',
            }}
          >
            <Button
              type="button"
              size="sm"
              variant="secondary"
              fullWidth
              style={{
                minWidth: 0,
                maxWidth: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              onClick={() => setSheetOpen(true)}
            >
              View Preset
            </Button>
            {showSavePreset ? (
              <Button
                type="button"
                size="sm"
                variant="primary"
                fullWidth
                style={{
                  minWidth: 0,
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                onClick={onSavePreset}
              >
                ADD
              </Button>
            ) : savedByMe ? (
              <span
                style={{
                  minWidth: 0,
                  maxWidth: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: GREEN,
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                Saved
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {sheetOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 220,
            backgroundColor: 'rgba(0,0,0,0.65)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
          role="presentation"
          onClick={() => setSheetOpen(false)}
        >
          <style>{`
            @keyframes preset-sheet-up {
              from { transform: translateY(100%); opacity: 0.6; }
              to   { transform: translateY(0);    opacity: 1;   }
            }
            .preset-sheet-panel {
              animation: preset-sheet-up 0.26s cubic-bezier(0.32, 0.72, 0, 1);
            }
          `}</style>

          <div
            className="preset-sheet-panel"
            style={{
              backgroundColor: '#0E1114',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              border: `1px solid ${BORDER}`,
              borderBottom: 'none',
            }}
            role="dialog"
            aria-modal="true"
            aria-label={preset.name}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '16px 16px 14px',
                borderBottom: `1px solid ${BORDER}`,
                flexShrink: 0,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: TEXT,
                    fontWeight: 700,
                    fontSize: '18px',
                    lineHeight: 1.25,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {preset.name}
                </div>
                <div style={{ color: MUTED, fontSize: '12px', marginTop: '4px' }}>
                  {sheetExercises.length} exercise{sheetExercises.length === 1 ? '' : 's'} total
                </div>
                <div style={{ color: MUTED, fontSize: '12px', marginTop: '2px' }}>
                  by {authorName}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                style={{
                  background: CARD_BG,
                  border: `1px solid ${BORDER}`,
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: MUTED,
                  fontSize: '20px',
                  lineHeight: 1,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {hasMuscles && (
              <div
                style={{
                  padding: '10px 12px 12px',
                  borderBottom: `1px solid ${BORDER}`,
                  overflowX: 'auto',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                <MuscleMapLazy
                  primaryMuscles={ms.primary}
                  secondaryMuscles={ms.secondary}
                  large
                />
              </div>
            )}

            <div
              style={{
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                flex: 1,
                overflowY: 'auto',
                minHeight: '120px',
              }}
            >
              {sheetExercises.length === 0 ? (
                <p style={{ color: MUTED, margin: 0, fontSize: '14px' }}>Loading exercises…</p>
              ) : (
                sheetExercises.map((ex) => (
                  <WorkoutLogExerciseRow
                    key={ex.exerciseId}
                    exerciseImageUrl={ex.imageUrl}
                    exerciseName={ex.name}
                    thumbSize={44}
                    nameFontWeight={500}
                    setsLabel={setsLabelForRow(ex)}
                    onInfoClick={() => void handleOpenExerciseInfo(ex.exerciseId)}
                  />
                ))
              )}
            </div>

            {(showSavePreset || savedByMe) && (
              <div
                style={{
                  flexShrink: 0,
                  borderTop: `1px solid ${BORDER}`,
                  padding: '12px 16px',
                  paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
                  backgroundColor: '#0E1114',
                }}
              >
                {showSavePreset ? (
                  <Button type="button" variant="primary" fullWidth onClick={onSavePreset}>
                    Add to my presets
                  </Button>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      color: GREEN,
                      fontSize: '14px',
                      fontWeight: 600,
                      padding: '10px',
                      width: '100%',
                    }}
                  >
                    Saved to your presets
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <ExerciseInfoSheet
        exercise={infoDetail}
        open={infoOpen}
        loading={infoLoading}
        onClose={handleCloseExerciseInfo}
      />
    </>
  );
}
