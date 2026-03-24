'use client';

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import Model from 'react-body-highlighter';
import type { IExerciseData, Muscle } from 'react-body-highlighter';

export interface MuscleMapProps {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  compact?: boolean;
  /** Compact layout without card frame/border (e.g. community preset embed). */
  plain?: boolean;
  /** Larger body diagrams (e.g. preset detail sheet on mobile). */
  large?: boolean;
}

const muscleMap: Record<string, string> = {
  Chest: 'chest',
  Biceps: 'biceps',
  Brachialis: 'biceps',
  Triceps: 'triceps',
  'Triceps Brachii': 'triceps',
  Lats: 'upper-back',
  Shoulders: 'front-deltoids',
  'Deltoid Anterior': 'front-deltoids',
  'Deltoid Posterior': 'back-deltoids',
  Quads: 'quadriceps',
  Hamstrings: 'hamstring',
  Glutes: 'gluteal',
  Calves: 'calves',
  Abs: 'abs',
  Trapezius: 'trapezius',
  Forearms: 'forearm',
  Obliques: 'obliques',
  'Lower Back': 'lower-back',
  Adductors: 'adductor',
  Abductors: 'abductors',
  'Pectoralis Major': 'chest',
  'Latissimus Dorsi': 'upper-back',
};

function slugForMuscleName(name: string): string | null {
  const direct = muscleMap[name];
  if (direct) return direct;
  const trimmed = name.trim();
  return muscleMap[trimmed] ?? null;
}

function dedupeSlugs(slugs: string[]): string[] {
  return [...new Set(slugs)];
}

function buildExerciseData(
  primaryNames: string[],
  secondaryNames: string[],
): IExerciseData[] {
  const primarySlugs = dedupeSlugs(
    primaryNames.map(slugForMuscleName).filter((s): s is string => Boolean(s)),
  );
  const primarySlugSet = new Set(primarySlugs);
  const secondarySlugs = dedupeSlugs(
    secondaryNames
      .map(slugForMuscleName)
      .filter((s): s is string => s != null && !primarySlugSet.has(s)),
  );

  const data: IExerciseData[] = [];
  if (primarySlugs.length > 0) {
    data.push({
      name: 'primary',
      muscles: primarySlugs as Muscle[],
      frequency: 2,
    });
  }
  if (secondarySlugs.length > 0) {
    data.push({
      name: 'secondary',
      muscles: secondarySlugs as Muscle[],
      frequency: 1,
    });
  }
  return data;
}

const CARD: React.CSSProperties = {
  background: '#151b21',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: 16,
  padding: 16,
};

const HIGHLIGHT = ['rgba(34,197,94,0.5)', 'rgba(34,197,94,0.9)'] as const;

class MuscleMapErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(_err: Error, _info: ErrorInfo) {
    /* silent */
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function Pill({
  label,
  dim,
}: {
  label: string;
  dim?: boolean;
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '6px 12px',
        borderRadius: 999,
        background: 'rgba(255,255,255,0.06)',
        color: dim ? 'rgba(255,255,255,0.55)' : '#fff',
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      {label}
    </span>
  );
}

function MuscleMapBody({
  primaryMuscles,
  secondaryMuscles,
  compact,
  plain,
  large,
}: MuscleMapProps) {
  const data = buildExerciseData(primaryMuscles, secondaryMuscles);
  if (data.length === 0) return null;

  const w = compact ? (large ? 82 : 60) : large ? 124 : 90;
  const h = compact ? (large ? 178 : 140) : large ? 280 : 200;

  const models = (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: compact ? 6 : large ? 14 : 10,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {!compact ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            FRONT
          </span>
        ) : null}
        <Model
          data={data}
          type="anterior"
          style={{ width: w, height: h }}
          highlightedColors={[...HIGHLIGHT]}
          bodyColor="#1C2526"
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        {!compact ? (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.35)',
            }}
          >
            BACK
          </span>
        ) : null}
        <Model
          data={data}
          type="posterior"
          style={{ width: w, height: h }}
          highlightedColors={[...HIGHLIGHT]}
          bodyColor="#1C2526"
        />
      </div>
    </div>
  );

  if (compact) {
    const wrapStyle: React.CSSProperties = plain
      ? {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexShrink: 0,
        }
      : {
          ...CARD,
          padding: '10px 12px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        };
    return <div style={wrapStyle}>{models}</div>;
  }

  return (
    <div style={CARD}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.45)',
          marginBottom: 14,
        }}
      >
        MUSCLES WORKED
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 20,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#fff',
                marginBottom: 8,
              }}
            >
              Primary
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {primaryMuscles.length === 0 ? (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>—</span>
              ) : (
                primaryMuscles.map((m) => <Pill key={m} label={m} />)
              )}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.45)',
                marginBottom: 8,
              }}
            >
              Secondary
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {secondaryMuscles.length === 0 ? (
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>—</span>
              ) : (
                secondaryMuscles.map((m) => <Pill key={m} label={m} dim />)
              )}
            </div>
          </div>
        </div>
        {models}
      </div>
    </div>
  );
}

export default function MuscleMap(props: MuscleMapProps) {
  return (
    <MuscleMapErrorBoundary>
      <MuscleMapBody {...props} />
    </MuscleMapErrorBoundary>
  );
}
