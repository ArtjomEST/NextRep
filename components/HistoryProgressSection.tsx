'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ui } from '@/lib/ui-styles';
import {
  fetchProgressExercisesApi,
  fetchProgressExerciseDetailApi,
  fetchSettings,
  type ProgressExercise,
  type ProgressExerciseDetail,
  type ChartDataPoint,
} from '@/lib/api/client';

const KG_TO_LB = 2.20462;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatAxisDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function formatYLabel(v: number, metric: 'weight' | 'volume' | '1rm'): string {
  if (metric === 'volume') {
    return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`;
  }
  return `${Math.round(v)}kg`;
}

function getValue(point: ChartDataPoint, metric: 'weight' | 'volume' | '1rm'): number {
  if (metric === 'weight') return point.bestWeight;
  if (metric === 'volume') return point.volume;
  if (metric === '1rm') return point.estimatedOneRM ?? point.bestWeight;
  return 0;
}

function buildPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1].x + pts[i].x) / 2;
    d += ` C ${cpx} ${pts[i - 1].y} ${cpx} ${pts[i].y} ${pts[i].x} ${pts[i].y}`;
  }
  return d;
}

const GAP_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

interface PlotPoint {
  x: number;
  y: number;
  date: string;
  value: number;
  originalIndex: number;
}

function splitSegments(pts: PlotPoint[]): PlotPoint[][] {
  if (pts.length === 0) return [];
  const segments: PlotPoint[][] = [];
  let current: PlotPoint[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const prevMs = new Date(pts[i - 1].date).getTime();
    const currMs = new Date(pts[i].date).getTime();
    if (currMs - prevMs > GAP_DAYS_MS) {
      segments.push(current);
      current = [pts[i]];
    } else {
      current.push(pts[i]);
    }
  }
  segments.push(current);
  return segments;
}

interface ChartProps {
  chartData: ChartDataPoint[];
  metric: 'weight' | 'volume' | '1rm';
}

function ProgressChart({ chartData, metric }: ChartProps) {
  const [tooltip, setTooltip] = useState<{ index: number } | null>(null);

  const padding = { top: 16, right: 16, bottom: 28, left: 44 };
  const svgWidth = 320;
  const svgHeight = 150;
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  const validPoints = chartData
    .map((p, i) => ({ point: p, value: getValue(p, metric), idx: i }))
    .filter((p) => p.value > 0);

  if (validPoints.length === 0) {
    return (
      <p style={{ color: ui.textMuted, fontSize: 12, textAlign: 'center', marginBottom: 12 }}>
        No data available for this metric
      </p>
    );
  }

  const values = validPoints.map((p) => p.value);
  let yMin = Math.min(...values) * 0.9;
  let yMax = Math.max(...values) * 1.1;
  if (yMin === yMax) {
    yMin *= 0.8;
    yMax *= 1.2;
  }

  const toYPx = (v: number) =>
    padding.top + (1 - (v - yMin) / (yMax - yMin)) * chartHeight;

  const toXPx = (i: number) =>
    padding.left + (i / Math.max(validPoints.length - 1, 1)) * chartWidth;

  const plotPoints: PlotPoint[] = validPoints.map((p, i) => ({
    x: toXPx(i),
    y: toYPx(p.value),
    date: p.point.date,
    value: p.value,
    originalIndex: i,
  }));

  const maxValue = Math.max(...values);
  const prIndex = plotPoints.findIndex((p) => p.value === maxValue);

  const yMid = (yMin + yMax) / 2;
  const yLabels = [
    { v: yMax, y: toYPx(yMax) },
    { v: yMid, y: toYPx(yMid) },
    { v: yMin, y: toYPx(yMin) },
  ];

  const segments = splitSegments(plotPoints);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const scaleX = svgWidth / rect.width;
    const offsetX = (e.clientX - rect.left) * scaleX;
    let nearest: { index: number; dist: number } | null = null;
    for (let i = 0; i < plotPoints.length; i++) {
      const dist = Math.abs(plotPoints[i].x - offsetX);
      if (dist < 40 && (nearest === null || dist < nearest.dist)) {
        nearest = { index: i, dist };
      }
    }
    if (nearest !== null) {
      setTooltip((prev) => (prev?.index === nearest!.index ? null : { index: nearest!.index }));
    } else {
      setTooltip(null);
    }
  };

  const tooltipPoint = tooltip !== null ? plotPoints[tooltip.index] : null;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      width="100%"
      style={{ display: 'block', marginBottom: 12 }}
      onClick={handleSvgClick}
      onMouseLeave={() => setTooltip(null)}
    >
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(34,197,94,0.15)" />
          <stop offset="100%" stopColor="rgba(34,197,94,0)" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yLabels.map((lbl, i) => (
        <line
          key={i}
          x1={padding.left}
          y1={lbl.y}
          x2={svgWidth - padding.right}
          y2={lbl.y}
          stroke="#1F2937"
          strokeWidth={0.5}
        />
      ))}

      {/* Y-axis labels */}
      {yLabels.map((lbl, i) => (
        <text
          key={i}
          x={0}
          y={lbl.y + 3}
          textAnchor="start"
          fontSize={9}
          fill="#4B5563"
        >
          {formatYLabel(lbl.v, metric)}
        </text>
      ))}

      {/* X-axis labels — first, middle, last */}
      {plotPoints.length >= 1 && (() => {
        const xLabelIndices = plotPoints.length === 1
          ? [0]
          : [0, Math.floor((plotPoints.length - 1) / 2), plotPoints.length - 1];
        const unique = [...new Set(xLabelIndices)];
        return unique.map((idx) => (
          <text
            key={idx}
            x={plotPoints[idx].x}
            y={svgHeight - 6}
            textAnchor="middle"
            fontSize={9}
            fill="#4B5563"
          >
            {formatAxisDate(plotPoints[idx].date)}
          </text>
        ));
      })()}

      {/* Area fills per segment */}
      {segments.map((seg, si) => {
        if (seg.length < 2) return null;
        const linePath = buildPath(seg);
        const firstX = seg[0].x;
        const lastX = seg[seg.length - 1].x;
        const bottomY = padding.top + chartHeight;
        const areaPath = `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
        return (
          <path
            key={`area-${si}`}
            d={areaPath}
            fill="url(#chartGrad)"
            stroke="none"
          />
        );
      })}

      {/* Line paths per segment */}
      {segments.map((seg, si) => {
        if (seg.length < 2) return null;
        return (
          <path
            key={`line-${si}`}
            d={buildPath(seg)}
            fill="none"
            stroke="#22C55E"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}

      {/* Data points */}
      {plotPoints.map((p, i) => {
        const isPR = i === prIndex;
        return (
          <g key={i}>
            {isPR && (
              <text
                x={p.x}
                y={p.y - 10}
                textAnchor="middle"
                fontSize={9}
                fill="#22C55E"
              >
                ★
              </text>
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={isPR ? 5.5 : 3.5}
              fill="#22C55E"
              stroke="#0E1114"
              strokeWidth={2}
            />
          </g>
        );
      })}

      {/* Tooltip */}
      {tooltipPoint && (() => {
        const isRightHalf = tooltipPoint.x > svgWidth / 2;
        const tooltipW = 110;
        const tooltipH = 52;
        const tooltipX = isRightHalf
          ? tooltipPoint.x - 118
          : tooltipPoint.x + 8;
        const tooltipY = Math.max(0, tooltipPoint.y - 60);
        const dateStr = new Date(tooltipPoint.date).toLocaleDateString('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        const valStr = formatYLabel(tooltipPoint.value, metric);
        return (
          <foreignObject x={tooltipX} y={tooltipY} width={tooltipW} height={tooltipH}>
            <div
              style={{
                background: '#1C2228',
                border: '1px solid #1F2937',
                borderRadius: 6,
                padding: '6px 8px',
                color: '#fff',
                fontSize: 11,
                lineHeight: 1.5,
                width: tooltipW - 2,
                boxSizing: 'border-box',
              }}
            >
              <div style={{ color: '#9CA3AF', fontSize: 10 }}>{dateStr}</div>
              <div style={{ color: '#22C55E', fontWeight: 700, fontSize: 13 }}>{valStr}</div>
            </div>
          </foreignObject>
        );
      })()}
    </svg>
  );
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
  const [days, setDays] = useState<30 | 60 | 90>(30);
  const [metric, setMetric] = useState<'weight' | 'volume' | '1rm'>('weight');
  const chartCacheRef = useRef<Map<number, ProgressExerciseDetail>>(new Map());

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

  // Reset cache and detail when selected exercise changes
  useEffect(() => {
    chartCacheRef.current = new Map();
    setDays(30);
    setMetric('weight');
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    setError(null);
    fetchProgressExerciseDetailApi(selectedId, 30)
      .then((d) => {
        chartCacheRef.current.set(30, d);
        setDetail(d);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoadingDetail(false));
  }, [selectedId]);

  // Fetch on days change (use cache if available)
  useEffect(() => {
    if (!selectedId) return;
    if (chartCacheRef.current.has(days)) {
      setDetail(chartCacheRef.current.get(days)!);
      return;
    }
    setLoadingDetail(true);
    setError(null);
    fetchProgressExerciseDetailApi(selectedId, days)
      .then((d) => {
        chartCacheRef.current.set(days, d);
        setDetail(d);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoadingDetail(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  // Fall back metric if Est. 1RM becomes hidden
  useEffect(() => {
    if (detail && detail.measurementType !== 'weight_reps' && metric === '1rm') {
      setMetric('weight');
    }
  }, [detail, metric]);

  const weightUnit = units === 'lb' ? 'lbs' : 'kg';
  const toDisplayWeight = (kg: number) =>
    units === 'lb' ? Math.round(kg * KG_TO_LB) : kg;

  const cardStyle: React.CSSProperties = {
    background: ui.cardBg,
    border: ui.cardBorder,
    borderRadius: ui.cardRadius,
    padding: 18,
    boxShadow: ui.cardShadow,
  };

  const pillStyle = (active: boolean): React.CSSProperties => ({
    background: active ? ui.accent : 'transparent',
    color: active ? '#0E1114' : ui.textMuted,
    border: active ? 'none' : ui.cardBorder,
    borderRadius: 20,
    padding: '5px 14px',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    outline: 'none',
    transition: 'background 0.15s, color 0.15s',
  });

  const showOneRM = detail?.measurementType === 'weight_reps';

  return (
    <section style={{ marginTop: 8 }}>
      <h2
        style={{
          color: ui.textLabel,
          fontSize: 15,
          fontWeight: 700,
          margin: '0 0 12px 0',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        }}
      >
        Track your progress
      </h2>

      {/* Exercise dropdown */}
      <div style={{ marginBottom: 16 }}>
        <select
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(e.target.value || null)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: ui.cardBg,
            border: ui.cardBorder,
            borderRadius: ui.cardRadius,
            color: ui.textPrimary,
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
          <div style={{ height: 48, background: ui.cardBg, borderRadius: ui.cardRadius, marginTop: 8 }} />
        )}

        {exercises.length === 0 && !loadingExercises && (
          <p style={{ color: ui.textMuted, fontSize: 13, margin: '8px 0 0' }}>
            Complete workouts to see exercises here.
          </p>
        )}
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239,68,68,0.1)',
            border: `1px solid ${ui.error}`,
            borderRadius: ui.cardRadius,
            padding: '12px 16px',
            color: ui.error,
            fontSize: 14,
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {selectedId && (
        <>
          {/* Period switcher */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            {([30, 60, 90] as const).map((d) => (
              <button key={d} style={pillStyle(days === d)} onClick={() => setDays(d)}>
                {d}d
              </button>
            ))}
          </div>

          {/* Metric switcher */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button style={pillStyle(metric === 'weight')} onClick={() => setMetric('weight')}>
              Max weight
            </button>
            <button style={pillStyle(metric === 'volume')} onClick={() => setMetric('volume')}>
              Volume
            </button>
            {showOneRM && (
              <button style={pillStyle(metric === '1rm')} onClick={() => setMetric('1rm')}>
                Est. 1RM
              </button>
            )}
          </div>

          {/* Chart area */}
          {loadingDetail ? (
            <>
              <div
                style={{
                  height: 150,
                  borderRadius: 8,
                  marginBottom: 12,
                  background: 'rgba(255,255,255,0.04)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
            </>
          ) : detail && detail.chartData.length < 2 ? (
            <div
              style={{
                height: 150,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 8,
                marginBottom: 12,
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <p style={{ color: ui.textMuted, fontSize: 13, textAlign: 'center', padding: '0 20px' }}>
                Log at least 2 sessions with this exercise to see the chart
              </p>
            </div>
          ) : detail ? (
            <ProgressChart chartData={detail.chartData} metric={metric} />
          ) : null}
        </>
      )}

      {loadingDetail && selectedId && !detail && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 100, ...cardStyle }} />
          ))}
        </div>
      )}

      {!loadingDetail && detail && selectedId && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {detail.pr && (
            <div style={cardStyle}>
              <p style={{ color: ui.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' }}>
                Best Performance
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'baseline' }}>
                {detail.pr.bestWeight != null && (
                  <span style={{ color: ui.textPrimary, fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>
                    {toDisplayWeight(detail.pr.bestWeight)} {weightUnit}
                  </span>
                )}
                {detail.pr.bestReps != null && detail.measurementType === 'weight_reps' && (
                  <span style={{ color: ui.textLabel, fontSize: 18, fontWeight: 600 }}>× {detail.pr.bestReps} reps</span>
                )}
                {detail.pr.bestReps != null && detail.measurementType === 'reps_only' && (
                  <span style={{ color: ui.textPrimary, fontSize: 28, fontWeight: 800 }}>{detail.pr.bestReps} reps</span>
                )}
                {detail.pr.bestSeconds != null && (
                  <span style={{ color: ui.textPrimary, fontSize: 28, fontWeight: 800 }}>{detail.pr.bestSeconds} sec</span>
                )}
                {detail.pr.bestVolume != null && detail.measurementType === 'weight_reps' && (
                  <span style={{ color: ui.textLabel, fontSize: 14, marginLeft: 8 }}>
                    {toDisplayWeight(detail.pr.bestVolume)} {weightUnit} vol
                  </span>
                )}
              </div>
              <p style={{ color: ui.textMuted, fontSize: 12, margin: '8px 0 0' }}>{formatDate(detail.pr.date)}</p>
            </div>
          )}

          {detail.last5.length > 0 && (
            <div style={cardStyle}>
              <p style={{ color: ui.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px' }}>
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
                        borderBottom: ui.cardBorder,
                        cursor: 'pointer',
                      }}
                    >
                      <div>
                        <span style={{ color: ui.textPrimary, fontSize: 14, fontWeight: 600 }}>{formatDate(s.date)}</span>
                        {bestSummary && (
                          <span style={{ color: ui.textLabel, fontSize: 13, marginLeft: 8 }}>{bestSummary}</span>
                        )}
                      </div>
                      {s.volume > 0 && (
                        <span style={{ color: ui.textMuted, fontSize: 12 }}>{toDisplayWeight(s.volume)} {weightUnit}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {detail.progress30d && (
            <div
              style={{
                ...cardStyle,
                background: `linear-gradient(135deg, ${ui.accentSoft}, rgba(34,197,94,0.12))`,
                borderColor: ui.accent,
              }}
            >
              <p style={{ color: ui.textMuted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px' }}>
                Progress
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'baseline' }}>
                {detail.progress30d.deltaWeight != null && (
                  <span
                    style={{
                      color: detail.progress30d.deltaWeight >= 0 ? ui.success : ui.error,
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
                      color: detail.progress30d.deltaReps >= 0 ? ui.success : ui.error,
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
                      color: detail.progress30d.deltaSeconds >= 0 ? ui.success : ui.error,
                      fontSize: 32,
                      fontWeight: 800,
                    }}
                  >
                    {detail.progress30d.deltaSeconds >= 0 ? '+' : ''}
                    {detail.progress30d.deltaSeconds} sec
                  </span>
                )}
              </div>
              <p style={{ color: ui.textLabel, fontSize: 13, margin: '4px 0 0' }}>{detail.progress30d.label}</p>
              {detail.progress30d.deltaVolume != null && detail.progress30d.deltaVolume > 0 && (
                <p style={{ color: ui.textMuted, fontSize: 12, margin: '2px 0 0' }}>
                  +{Math.round(detail.progress30d.deltaVolume)}% volume
                </p>
              )}
            </div>
          )}

          {!detail.pr && detail.last5.length === 0 && !detail.progress30d && (
            <p style={{ color: ui.textMuted, fontSize: 14, textAlign: 'center', padding: 24 }}>
              No data yet for this exercise.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
