'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import { useWorkout } from '@/lib/workout/state';
import {
  computeTotalVolume,
  computeTotalSets,
  computeDuration,
  computePRsPlaceholder,
} from '@/lib/workout/metrics';
import {
  saveWorkoutApi,
  uploadWorkoutPhotoApi,
  UploadPhotoError,
  fetchAiWorkoutReportApi,
  postAiWorkoutReportApi,
  type AiWorkoutReportScores,
} from '@/lib/api/client';
import AIReportWithGate from '@/components/AIReportWithGate';
import type { SaveWorkoutRequest } from '@/lib/api/types';
import StatCard from '@/components/StatCard';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { compressImage } from '@/lib/utils/compressImage';
import { aggregateMusclesFromExercises } from '@/lib/utils/muscleAggregator';
import MuscleMapWithGate from '@/components/MuscleMapWithGate';
import { useProfile } from '@/lib/profile/context';

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

export default function WorkoutSummaryPage() {
  const router = useRouter();
  const { draft, dispatch } = useWorkout();
  const { isPro } = useProfile();
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [savedWorkoutId, setSavedWorkoutId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const aiWorkoutProcessedRef = useRef<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiPayload, setAiPayload] = useState<{
    report: string;
    scores: AiWorkoutReportScores;
  } | null>(null);

  const stats = useMemo(
    () => ({
      duration: computeDuration(draft.startedAt, draft.endedAt),
      volume: computeTotalVolume(draft.exercises),
      sets: computeTotalSets(draft.exercises),
      prs: computePRsPlaceholder(draft.exercises),
    }),
    [draft],
  );

  const muscleSummary = useMemo(
    () =>
      aggregateMusclesFromExercises(
        draft.exercises.map((ex) => ({
          primaryMuscles: ex.primaryMuscles ?? [],
          secondaryMuscles: ex.secondaryMuscles ?? [],
        })),
      ),
    [draft.exercises],
  );

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    };
  }, [photoPreviewUrl]);

  useEffect(() => {
    if (!savedWorkoutId) return;
    if (!isPro) return;
    if (aiWorkoutProcessedRef.current === savedWorkoutId) return;
    aiWorkoutProcessedRef.current = savedWorkoutId;
    let cancelled = false;
    (async () => {
      setAiLoading(true);
      setAiError(null);
      setAiPayload(null);
      try {
        const existing = await fetchAiWorkoutReportApi(savedWorkoutId);
        if (cancelled) return;
        if (existing) {
          setAiPayload(existing);
          return;
        }
        const gen = await postAiWorkoutReportApi(savedWorkoutId);
        if (!cancelled) setAiPayload(gen);
      } catch (e) {
        if (!cancelled) {
          setAiError(
            e instanceof Error ? e.message : 'AI report unavailable',
          );
        }
      } finally {
        if (!cancelled) setAiLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [savedWorkoutId, isPro]);

  function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !f.type.startsWith('image/')) return;
    if (f.size > MAX_PHOTO_BYTES) {
      setError(
        'Photo is too large. Please choose an image under 4MB.',
      );
      return;
    }
    setError(null);
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(f);
    setPhotoPreviewUrl(URL.createObjectURL(f));
  }

  function clearPhoto() {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
  }

  async function handleSave() {
    if (saving || savedWorkoutId) return;
    setSaving(true);
    setError(null);
    setSaveNotice(null);

    try {
      let photoUrl: string | null = null;
      let uploadSkippedNotice: string | null = null;
      if (photoFile) {
        if (photoFile.size > MAX_PHOTO_BYTES) {
          setError(
            'Photo is too large. Please choose an image under 4MB.',
          );
          setSaving(false);
          return;
        }
        try {
          setCompressing(true);
          const compressed = await compressImage(photoFile);
          setCompressing(false);
          photoUrl = await uploadWorkoutPhotoApi(compressed);
        } catch (uploadErr) {
          setCompressing(false);
          if (uploadErr instanceof UploadPhotoError) {
            if (uploadErr.status === 413) {
              setError(
                'Photo is too large. Please choose a smaller image.',
              );
              setSaving(false);
              return;
            }
            if (uploadErr.status === 503) {
              photoUrl = null;
              uploadSkippedNotice =
                'Photo upload is unavailable right now. Your workout was saved without a photo.';
            } else {
              setError(uploadErr.message);
              setSaving(false);
              return;
            }
          } else {
            setError(
              uploadErr instanceof Error
                ? uploadErr.message
                : 'Photo upload failed',
            );
            setSaving(false);
            return;
          }
        }
      }

      const request: SaveWorkoutRequest = {
        name: draft.name,
        startedAt: draft.startedAt ?? undefined,
        endedAt: draft.endedAt ?? undefined,
        durationSec: stats.duration > 0 ? stats.duration * 60 : undefined,
        isPublic,
        photoUrl,
        exercises: draft.exercises.map((ex) => {
          if (ex.measurementType === 'cardio') {
            const cardioTimer = draft.cardioTimers[ex.id] ?? { elapsed: 0, params: {} };
            return {
              exerciseId: ex.exerciseId,
              order: ex.order,
              status: ex.status,
              sets: [{
                setIndex: 0,
                weight: null,
                reps: null,
                seconds: Math.round(cardioTimer.elapsed),
                completed: cardioTimer.elapsed > 0,
                cardioData: {
                  durationSec: Math.round(cardioTimer.elapsed),
                  ...cardioTimer.params,
                },
              }],
            };
          }
          return {
            exerciseId: ex.exerciseId,
            order: ex.order,
            status: ex.status,
            sets: ex.sets.map((s, idx) => ({
              setIndex: idx + 1,
              completed: s.completed,
              weight: s.weight || null,
              reps: s.reps || null,
              seconds: null,
            })),
          };
        }),
      };

      const result = await saveWorkoutApi(request);
      setSavedWorkoutId(result.workoutId);
      setSaveNotice(uploadSkippedNotice);
      dispatch({ type: 'RESET_DRAFT' });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save workout',
      );
    } finally {
      setSaving(false);
    }
  }

  function handleViewHistory() {
    if (savedWorkoutId) {
      router.push(`/history/${savedWorkoutId}`);
    } else {
      router.push('/history');
    }
  }

  function handleDone() {
    router.push('/');
  }

  function handleEdit() {
    router.push('/workout/active');
  }

  if (savedWorkoutId) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          paddingTop: '60px',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: 'rgba(34,197,94,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.success}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1
          style={{
            color: theme.colors.textPrimary,
            fontSize: '22px',
            fontWeight: 700,
            margin: 0,
          }}
        >
          Workout Saved!
        </h1>
        <p
          style={{
            color: theme.colors.textSecondary,
            fontSize: '14px',
            margin: 0,
            textAlign: 'center',
          }}
        >
          Your workout has been saved to your history.
        </p>
        {saveNotice && (
          <p
            style={{
              color: theme.colors.textMuted,
              fontSize: '13px',
              margin: '12px 0 0',
              textAlign: 'center',
              lineHeight: 1.45,
            }}
          >
            {saveNotice}
          </p>
        )}
        <div style={{ width: '100%', marginTop: 14 }}>
          <AIReportWithGate
            loading={aiLoading}
            error={aiError}
            report={aiPayload?.report ?? null}
            scores={aiPayload?.scores ?? null}
          />
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            width: '100%',
            marginTop: '12px',
          }}
        >
          <Button fullWidth size="lg" onClick={handleViewHistory}>
            View in History
          </Button>
          <Button variant="ghost" fullWidth onClick={handleDone}>
            Back to Home
          </Button>
        </div>
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
        paddingBottom: '24px',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'rgba(34,197,94,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.success}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1
          style={{
            color: theme.colors.textPrimary,
            fontSize: '22px',
            fontWeight: 700,
            margin: 0,
          }}
        >
          Workout Complete
        </h1>
        <p
          style={{
            color: theme.colors.textSecondary,
            fontSize: '14px',
            margin: '4px 0 0',
          }}
        >
          {draft.name}
        </p>
        <div
          style={{
            marginTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: theme.colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Visibility
          </span>
          <div
            role="group"
            aria-label="Workout visibility"
            style={{
              display: 'flex',
              borderRadius: theme.radius.md,
              overflow: 'hidden',
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '14px',
                backgroundColor: isPublic
                  ? theme.colors.primary
                  : theme.colors.surface,
                color: isPublic
                  ? theme.colors.textPrimary
                  : theme.colors.textMuted,
              }}
            >
              Public
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              style={{
                flex: 1,
                padding: '10px 12px',
                border: 'none',
                borderLeft: `1px solid ${theme.colors.border}`,
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '14px',
                backgroundColor: !isPublic
                  ? theme.colors.primary
                  : theme.colors.surface,
                color: !isPublic
                  ? theme.colors.textPrimary
                  : theme.colors.textMuted,
              }}
            >
              Private
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}
      >
        <StatCard label="Duration" value={`${stats.duration}`} unit="min" />
        <StatCard
          label="Volume"
          value={stats.volume.toLocaleString('en-US')}
          unit="kg"
        />
        <StatCard label="Sets" value={stats.sets} />
        <StatCard label="PRs" value={stats.prs} />
      </div>

      {(muscleSummary.primaryMuscles.length > 0 ||
        muscleSummary.secondaryMuscles.length > 0) && (
        <MuscleMapWithGate
          primaryMuscles={muscleSummary.primaryMuscles}
          secondaryMuscles={muscleSummary.secondaryMuscles}
          compact={false}
        />
      )}

      {/* Highlights */}
      <Card>
        <h3
          style={{
            color: theme.colors.textPrimary,
            fontSize: '15px',
            fontWeight: 600,
            margin: '0 0 12px',
          }}
        >
          Highlights
        </h3>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <HighlightRow
            icon="+"
            iconColor={theme.colors.success}
            text={`${stats.volume.toLocaleString('en-US')} kg total volume`}
          />
          {draft.exercises.length > 0 && (
            <HighlightRow
              icon="*"
              iconColor={theme.colors.warning}
              text={`${draft.exercises.length} exercises completed`}
            />
          )}
          <HighlightRow
            icon="~"
            iconColor={theme.colors.info}
            text={`${stats.sets} total sets`}
          />
        </div>
      </Card>

      {/* Optional photo */}
      <Card>
        <h3
          style={{
            color: theme.colors.textPrimary,
            fontSize: '15px',
            fontWeight: 600,
            margin: '0 0 12px',
          }}
        >
          Workout Photo
        </h3>
        {photoPreviewUrl && (
          <div style={{ marginBottom: '12px', position: 'relative' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreviewUrl}
              alt="Preview"
              style={{
                width: '100%',
                maxHeight: '200px',
                objectFit: 'cover',
                borderRadius: theme.radius.md,
                display: 'block',
              }}
            />
            <button
              type="button"
              onClick={clearPhoto}
              style={{
                marginTop: '8px',
                background: 'none',
                border: 'none',
                color: theme.colors.error,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Remove photo
            </button>
          </div>
        )}
        <label
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'center',
            padding: '12px 16px',
            borderRadius: theme.radius.md,
            border: `1px dashed ${theme.colors.border}`,
            color: theme.colors.textSecondary,
            fontSize: '14px',
            fontWeight: 600,
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {photoFile ? 'Change photo' : 'Choose photo'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onPickPhoto}
            disabled={saving}
            style={{ display: 'none' }}
          />
        </label>
      </Card>

      {/* Error */}
      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239,68,68,0.1)',
            border: `1px solid ${theme.colors.error}`,
            borderRadius: theme.radius.md,
            padding: '12px 16px',
            color: theme.colors.error,
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* CTAs */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          marginTop: '4px',
        }}
      >
        <Button fullWidth size="lg" onClick={handleSave} disabled={saving}>
          {compressing ? 'Compressing...' : saving ? 'Saving...' : 'Save Workout'}
        </Button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            variant="secondary"
            fullWidth
            onClick={handleEdit}
            disabled={saving}
          >
            Edit
          </Button>
          <Button variant="ghost" fullWidth onClick={handleDone}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

function HighlightRow({
  icon,
  iconColor,
  text,
}: {
  icon: string;
  iconColor: string;
  text: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          backgroundColor: `${iconColor}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          flexShrink: 0,
          color: iconColor,
          fontWeight: 700,
        }}
      >
        {icon}
      </span>
      <span
        style={{ color: theme.colors.textSecondary, fontSize: '14px' }}
      >
        {text}
      </span>
    </div>
  );
}
