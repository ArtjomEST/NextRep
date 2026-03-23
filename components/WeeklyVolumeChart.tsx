'use client';

import React, { useEffect, useState, useRef } from 'react';
import { getAuthHeaders } from '@/lib/auth/client';
import Skeleton from '@/components/Skeleton';

export interface DayData {
  dayIndex: number;
  workoutId: string;
  name: string;
  volume: number;
  sets: number;
  durationMinutes: number;
}

export interface WeeklyVolumeChartData {
  days: (DayData | null)[];
  totalVolume: number;
  lastWeekVolume: number;
  sessionTarget: number;
  todayIndex: number;
}

/** @deprecated use WeeklyVolumeChartData */
type WeeklyVolumeData = WeeklyVolumeChartData;

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const DAY_FULL_NAMES = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

function fmtVol(v: number): string {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k kg` : `${v} kg`;
}

function fmtVolShort(v: number): string {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);
}

const CARD_STYLE: React.CSSProperties = {
  background: 'linear-gradient(180deg, #1a2026 0%, #151b21 100%)',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 14,
  padding: '16px 16px 12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  position: 'relative',
};

const BAR_MAX_H = 56;

export default function WeeklyVolumeChart({
  initialData,
}: {
  /** When set, skips API fetch and renders this data (e.g. onboarding demo). */
  initialData?: WeeklyVolumeChartData | null;
} = {}) {
  const [data, setData] = useState<WeeklyVolumeData | null>(
    initialData !== undefined ? initialData : null,
  );
  const [loading, setLoading] = useState(initialData === undefined);
  const [activeDay, setActiveDay] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialData !== undefined) {
      setData(initialData);
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const res = await fetch('/api/workouts/weekly-volume', {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // silently fail — chart just shows empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [initialData]);

  useEffect(() => {
    if (activeDay === null) return;
    function onOutside(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setActiveDay(null);
      }
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [activeDay]);

  if (loading) {
    return (
      <div style={CARD_STYLE}>
        <Skeleton height={156} />
      </div>
    );
  }

  const days = data?.days ?? (Array(7).fill(null) as null[]);
  const totalVolume = data?.totalVolume ?? 0;
  const lastWeekVolume = data?.lastWeekVolume ?? 0;
  const sessionTarget = data?.sessionTarget ?? 3;
  const todayIndex = data?.todayIndex ?? ((new Date().getDay() + 6) % 7);

  const sessionsDone = days.filter((d) => d !== null).length;

  const pctChange =
    lastWeekVolume > 0
      ? Math.round(((totalVolume - lastWeekVolume) / lastWeekVolume) * 100)
      : null;

  const maxVol = Math.max(...days.map((d) => d?.volume ?? 0), 1);

  const bestDay = days.reduce<DayData | null>((best, d) => {
    if (!d) return best;
    if (!best || d.volume > best.volume) return d;
    return best;
  }, null);

  const avgPerSession = sessionsDone > 0 ? Math.round(totalVolume / sessionsDone) : 0;

  return (
    <div ref={cardRef} style={CARD_STYLE}>
      {/* ── Header row ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 2,
        }}
      >
        <span
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: 13,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          This Week
        </span>
        <span style={{ color: '#22C55E', fontSize: 13, fontWeight: 600 }}>
          {sessionsDone}/{sessionTarget} done{sessionsDone >= sessionTarget ? ' ✓' : ''}
        </span>
      </div>

      {/* ── Total volume + % change ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            color: '#F3F4F6',
            fontSize: 20,
            fontWeight: 800,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {fmtVol(totalVolume)}
        </span>
        {pctChange !== null && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: pctChange >= 0 ? '#22C55E' : '#EF4444',
            }}
          >
            {pctChange >= 0 ? '↑' : '↓'} {pctChange >= 0 ? '+' : ''}
            {pctChange}% vs last week
          </span>
        )}
      </div>

      {/* ── Bar chart ── */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 5,
            height: BAR_MAX_H,
          }}
        >
          {days.map((day, i) => {
            const hasWorkout = day !== null;
            const isToday = i === todayIndex;
            const isPast = i < todayIndex;
            const isActive = activeDay === i;
            const barH = hasWorkout
              ? Math.max(Math.round((day.volume / maxVol) * BAR_MAX_H), 4)
              : 0;

            let barColor: string;
            if (isToday) barColor = 'rgba(34,197,94,0.95)';
            else if (isPast) barColor = 'rgba(34,197,94,0.5)';
            else barColor = 'rgba(34,197,94,0.3)';

            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                  position: 'relative',
                  cursor: hasWorkout ? 'pointer' : 'default',
                }}
                onClick={() => {
                  if (!hasWorkout) return;
                  setActiveDay(activeDay === i ? null : i);
                }}
              >
                {/* Tooltip */}
                {isActive && day && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 'calc(100% + 8px)',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <div
                      style={{
                        background: '#1C2228',
                        border: '1px solid rgba(34,197,94,0.6)',
                        borderRadius: 8,
                        padding: '8px 10px',
                        whiteSpace: 'nowrap',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#F3F4F6',
                        }}
                      >
                        {day.name}
                      </p>
                      <p
                        style={{
                          margin: '3px 0 0',
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#22C55E',
                        }}
                      >
                        Volume: {fmtVolShort(day.volume)} kg
                      </p>
                      <p
                        style={{
                          margin: '2px 0 0',
                          fontSize: 10,
                          color: '#6B7280',
                        }}
                      >
                        {day.sets} sets · {day.durationMinutes} мин
                      </p>
                    </div>
                    {/* Downward arrow */}
                    <div
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: '5px solid transparent',
                        borderRight: '5px solid transparent',
                        borderTop: '6px solid rgba(34,197,94,0.6)',
                      }}
                    />
                  </div>
                )}

                {/* Bar or empty-day line */}
                {hasWorkout ? (
                  <div
                    style={{
                      width: '100%',
                      height: barH,
                      background: barColor,
                      borderRadius: '4px 4px 0 0',
                      opacity: isActive ? 0.7 : 1,
                      transform: isActive ? 'scaleY(1.05)' : 'scaleY(1)',
                      transformOrigin: 'bottom',
                      transition: 'opacity 0.15s ease, transform 0.15s ease',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: 2,
                      background: isToday
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(255,255,255,0.1)',
                      borderRadius: 1,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Day labels row */}
        <div style={{ display: 'flex', gap: 5, marginTop: 7 }}>
          {days.map((day, i) => {
            const isToday = i === todayIndex;
            const hasWorkout = day !== null;
            const color = isToday
              ? '#F3F4F6'
              : hasWorkout
                ? 'rgba(255,255,255,0.55)'
                : 'rgba(255,255,255,0.2)';
            const fontWeight = isToday ? 700 : 600;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 10,
                  color,
                  fontWeight,
                }}
              >
                {DAY_LABELS[i]}
              </div>
            );
          })}
        </div>
      </div>

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: 'rgba(255,255,255,0.06)',
          margin: '10px 0',
        }}
      />

      {/* Footer */}
      {sessionsDone > 0 && bestDay ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 9,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Best day
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 11, fontWeight: 700 }}>
              <span style={{ color: '#F3F4F6' }}>
                {DAY_FULL_NAMES[bestDay.dayIndex]}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>·</span>
              <span style={{ color: '#22C55E' }}>{fmtVolShort(bestDay.volume)} kg</span>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                margin: 0,
                fontSize: 9,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              Avg / session
            </p>
            <p
              style={{
                margin: '3px 0 0',
                fontSize: 11,
                fontWeight: 700,
                color: '#F3F4F6',
              }}
            >
              {fmtVol(avgPerSession)}
            </p>
          </div>
        </div>
      ) : (
        <p
          style={{
            textAlign: 'center',
            margin: 0,
            fontSize: 11,
            color: '#6B7280',
          }}
        >
          Start your first workout this week
        </p>
      )}
    </div>
  );
}
