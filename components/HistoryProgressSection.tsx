'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/Card';
import { theme } from '@/lib/theme';
import {
  fetchProgressExercisesApi,
  fetchProgressExerciseDetailApi,
  fetchSettings,
  type ProgressExercise,
  type ProgressExerciseDetail,
} from '@/lib/api/client';

const KG_TO_LB = 2.20462;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function HistoryProgressSection() {
  const router = useRouter();
  const [exercises, setExercises] = useState<ProgressExercise[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ProgressExerciseDetail | null>(null);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [units, setUnits] = useState<'kg' | 'lb'>('kg');

  const loadExercises = useCallback(async () => {
    setLoadingExercises(true);
    setError(null);
    try {
      const [exList, settings] = await Promise.all([
        fetchProgressExercisesApi(),
        fetchSettings().catch(() => null),
      ]);
      setExercises(exList);
      if (settings?.units) setUnits(settings.units);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercises');
    } finally {
      setLoadingExercises(false);
    }
  }, []);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    setError(null);
    fetchProgressExerciseDetailApi(selectedId)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  const weightUnit = units === 'lb' ? 'lbs' : 'kg';
  const toDisplayWeight = (kg: number) =>
    units === 'lb' ? Math.round(kg * KG_TO_LB) : kg;

  return (
    <section style={{ marginTop: 8 }}>
      <h2
        style={{
          color: theme.colors.textPrimary,
          fontSize: '16px',
          fontWeight: 600,
          margin: '0 0 12px 0',
        }}
      >
        Track your progress
      </h2>

      {/* Dropdown */}
      <div style={{ marginBottom: 16 }}>
        <select
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(e.target.value || null)}
          style={{
            width: '100%',
            padding: '12px 16px',
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.sm,
            color: theme.colors.textPrimary,
            fontSize: 14,
            cursor: 'pointer',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: 36,
          }}
        >
          <option value="">Select an exercise</option>
          {exercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
              {ex.category ? ` (${ex.category})` : ''}
            </option>
          ))}
        </select>

        {loadingExercises && (
          <div
            style={{
              height: 48,
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radius.sm,
              marginTop: 8,
            }}
          />
        )}

        {exercises.length === 0 && !loadingExercises && (
          <p
            style={{
              color: theme.colors.textMuted,
              fontSize: 13,
              margin: '8px 0 0',
            }}
          >
            Complete workouts to see exercises here.
          </p>
        )}
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239,68,68,0.1)',
            border: `1px solid ${theme.colors.error}`,
            borderRadius: theme.radius.md,
            padding: '12px 16px',
            color: theme.colors.error,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {loadingDetail && selectedId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 100,
                backgroundColor: theme.colors.card,
                borderRadius: theme.radius.md,
                border: `1px solid ${theme.colors.border}`,
              }}
            />
          ))}
        </div>
      )}

      {!loadingDetail && detail && selectedId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Block A — PR Card */}
          {detail.pr && (
            <Card>
              <p
                style={{
                  color: theme.colors.textMuted,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  margin: '0 0 8px',
                }}
              >
                Best Performance
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'baseline' }}>
                {detail.pr.bestWeight != null && (
                  <span
                    style={{
                      color: theme.colors.textPrimary,
                      fontSize: 28,
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {toDisplayWeight(detail.pr.bestWeight)} {weightUnit}
                  </span>
                )}
                {detail.pr.bestReps != null && detail.measurementType === 'weight_reps' && (
                  <span
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: 18,
                      fontWeight: 600,
                    }}
                  >
                    × {detail.pr.bestReps} reps
                  </span>
                )}
                {detail.pr.bestReps != null && detail.measurementType === 'reps_only' && (
                  <span
                    style={{
                      color: theme.colors.textPrimary,
                      fontSize: 28,
                      fontWeight: 800,
                    }}
                  >
                    {detail.pr.bestReps} reps
                  </span>
                )}
                {detail.pr.bestSeconds != null && (
                  <span
                    style={{
                      color: theme.colors.textPrimary,
                      fontSize: 28,
                      fontWeight: 800,
                    }}
                  >
                    {detail.pr.bestSeconds} sec
                  </span>
                )}
                {detail.pr.bestVolume != null && detail.measurementType === 'weight_reps' && (
                  <span
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: 14,
                      marginLeft: 8,
                    }}
                  >
                    {toDisplayWeight(detail.pr.bestVolume)} {weightUnit} vol
                  </span>
                )}
              </div>
              <p
                style={{
                  color: theme.colors.textMuted,
                  fontSize: 12,
                  margin: '8px 0 0',
                }}
              >
                {formatDate(detail.pr.date)}
              </p>
            </Card>
          )}

          {/* Block B — Last 5 Sessions */}
          {detail.last5.length > 0 && (
            <Card>
              <p
                style={{
                  color: theme.colors.textMuted,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  margin: '0 0 12px',
                }}
              >
                Last 5 Sessions
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {detail.last5.map((s) => {
                  let bestSummary = '';
                  if (s.bestWeight != null && s.bestReps != null) {
                    bestSummary = `${toDisplayWeight(s.bestWeight)} ${weightUnit} × ${s.bestReps} reps`;
                  } else if (s.bestReps != null) {
                    bestSummary = `${s.bestReps} reps`;
                  } else if (s.bestSeconds != null) {
                    bestSummary = `${s.bestSeconds} sec`;
                  }
                  return (
                    <div
                      key={s.workoutId}
                      onClick={() => router.push(`/history/${s.workoutId}`)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 0',
                        borderBottom: `1px solid ${theme.colors.border}`,
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            color: theme.colors.textPrimary,
                            fontSize: 14,
                            fontWeight: 600,
                          }}
                        >
                          {formatDate(s.date)}
                        </span>
                        {bestSummary && (
                          <span
                            style={{
                              color: theme.colors.textSecondary,
                              fontSize: 13,
                              marginLeft: 8,
                            }}
                          >
                            {bestSummary}
                          </span>
                        )}
                      </div>
                      {s.volume > 0 && (
                        <span
                          style={{
                            color: theme.colors.textMuted,
                            fontSize: 12,
                          }}
                        >
                          {toDisplayWeight(s.volume)} {weightUnit}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Block C — Progress Card */}
          {detail.progress30d && (
            <Card
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}18, ${theme.colors.primaryHover}12)`,
                borderColor: theme.colors.primary,
              }}
            >
              <p
                style={{
                  color: theme.colors.textMuted,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  margin: '0 0 8px',
                }}
              >
                Progress
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
                {detail.progress30d.deltaWeight != null && (
                  <span
                    style={{
                      color: detail.progress30d.deltaWeight >= 0 ? theme.colors.success : theme.colors.error,
                      fontSize: 32,
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {detail.progress30d.deltaWeight >= 0 ? '+' : ''}
                    {toDisplayWeight(detail.progress30d.deltaWeight)} {weightUnit}
                  </span>
                )}
                {detail.progress30d.deltaReps != null && (
                  <span
                    style={{
                      color: detail.progress30d.deltaReps >= 0 ? theme.colors.success : theme.colors.error,
                      fontSize: 32,
                      fontWeight: 800,
                    }}
                  >
                    {detail.progress30d.deltaReps >= 0 ? '+' : ''}
                    {detail.progress30d.deltaReps} reps
                  </span>
                )}
                {detail.progress30d.deltaSeconds != null && (
                  <span
                    style={{
                      color: detail.progress30d.deltaSeconds >= 0 ? theme.colors.success : theme.colors.error,
                      fontSize: 32,
                      fontWeight: 800,
                    }}
                  >
                    {detail.progress30d.deltaSeconds >= 0 ? '+' : ''}
                    {detail.progress30d.deltaSeconds} sec
                  </span>
                )}
              </div>
              <p
                style={{
                  color: theme.colors.textSecondary,
                  fontSize: 13,
                  margin: '4px 0 0',
                }}
              >
                {detail.progress30d.label}
              </p>
              {detail.progress30d.deltaVolume != null && detail.progress30d.deltaVolume > 0 && (
                <p
                  style={{
                    color: theme.colors.textMuted,
                    fontSize: 12,
                    margin: '2px 0 0',
                  }}
                >
                  +{Math.round(detail.progress30d.deltaVolume)}% volume
                </p>
              )}
            </Card>
          )}

          {!detail.pr && detail.last5.length === 0 && !detail.progress30d && (
            <p
              style={{
                color: theme.colors.textMuted,
                fontSize: 14,
                textAlign: 'center',
                padding: 24,
              }}
            >
              No data yet for this exercise.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
