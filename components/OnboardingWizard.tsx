'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Model from 'react-body-highlighter';
import type { IExerciseData, Muscle } from 'react-body-highlighter';
import { useProfile } from '@/lib/profile/context';
import {
  type OnboardingData,
} from '@/lib/api/client';
import { WorkoutLogExerciseRow } from '@/components/WorkoutLogExerciseRow';
import SetRow from '@/components/SetRow';
import RestTimer from '@/components/RestTimer';
import WeeklyVolumeChart, {
  type WeeklyVolumeChartData,
  type DayData,
} from '@/components/WeeklyVolumeChart';
import { theme } from '@/lib/theme';
import type { WorkoutSet } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────

type GoalKey = 'muscle_growth' | 'strength' | 'weight_loss' | 'endurance' | 'general_fitness';
type ExpKey = 'beginner' | 'intermediate' | 'advanced';
type SplitKey = 'full_body' | 'upper_lower' | 'push_pull_legs' | 'bro_split' | 'not_sure';

interface Draft {
  step: number;
  goal: GoalKey[];
  experienceLevel: ExpKey | null;
  splitPreference: SplitKey | null;
  trainingDaysPerWeek: number;
  heightCm: string;
  weightKg: string;
  age: string;
  benchPress: string;
  squat: string;
  deadlift: string;
  injuries: string[];
}

const DEFAULT_DRAFT: Draft = {
  step: 0,
  goal: [],
  experienceLevel: null,
  splitPreference: null,
  trainingDaysPerWeek: 4,
  heightCm: '',
  weightKg: '',
  age: '',
  benchPress: '',
  squat: '',
  deadlift: '',
  injuries: [],
};

const STORAGE_KEY = 'nextrep_onboarding_draft';

const DATA_PROGRESS_START = 5;
const DATA_PROGRESS_END = 11;
const TOTAL_DATA_STEPS = 7;
const FINISH_STEP = 13;

const GOALS: { key: GoalKey; label: string; emoji: string }[] = [
  { key: 'muscle_growth', label: 'Build Muscle', emoji: '🔥' },
  { key: 'strength', label: 'Increase Strength', emoji: '💪' },
  { key: 'endurance', label: 'Improve Fitness', emoji: '🧘' },
  { key: 'weight_loss', label: 'Lose Fat', emoji: '⚖️' },
  { key: 'general_fitness', label: 'Hybrid', emoji: '🏆' },
];

const GOAL_LABELS: Record<GoalKey, string> = {
  muscle_growth: 'muscle growth',
  strength: 'strength',
  endurance: 'endurance',
  weight_loss: 'weight loss',
  general_fitness: 'general fitness',
};


const EXPERIENCE_LEVELS: { key: ExpKey; label: string; sub: string; emoji: string }[] = [
  { key: 'beginner', label: 'Beginner', sub: '0–6 months', emoji: '🌱' },
  { key: 'intermediate', label: 'Intermediate', sub: '6 months–2 years', emoji: '⚡' },
  { key: 'advanced', label: 'Advanced', sub: '2+ years', emoji: '🎯' },
];

const SPLITS: { key: SplitKey; label: string; emoji: string }[] = [
  { key: 'full_body', label: 'Full Body', emoji: '🏋️' },
  { key: 'upper_lower', label: 'Upper / Lower', emoji: '🔀' },
  { key: 'push_pull_legs', label: 'Push Pull Legs', emoji: '↔️' },
  { key: 'bro_split', label: 'Bro Split', emoji: '💪' },
  { key: 'not_sure', label: "I don't know yet", emoji: '🤔' },
];

const INJURY_OPTIONS = [
  { key: 'shoulder', label: 'Shoulder', emoji: '🩹' },
  { key: 'knee', label: 'Knee', emoji: '🦵' },
  { key: 'lower_back', label: 'Lower Back', emoji: '🔙' },
  { key: 'elbow_wrist', label: 'Elbow / Wrist', emoji: '💛' },
  { key: 'ankle', label: 'Ankle', emoji: '🦶' },
  { key: 'none', label: 'None', emoji: '✅' },
];

const BG = '#0E1114';
const CARD_BG = 'linear-gradient(180deg, #1a2026 0%, #151b21 100%)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.08)';
const ACCENT = '#22c55e';
const TEXT_PRIMARY = '#f3f4f6';
const TEXT_MUTED = 'rgba(255,255,255,0.42)';
const TEXT_LABEL = 'rgba(255,255,255,0.5)';
const CARD_RADIUS = 16;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

function mergeMusclesInOrder(lines: readonly { muscles: readonly Muscle[] }[]): Muscle[] {
  const seen = new Set<string>();
  const out: Muscle[] = [];
  for (const line of lines) {
    for (const m of line.muscles) {
      if (!seen.has(m)) {
        seen.add(m);
        out.push(m);
      }
    }
  }
  return out;
}

type OnboardingExerciseSlot = {
  label: string;
  candidates: readonly string[];
  sets: number;
  muscles: readonly Muscle[];
};

async function resolveOnboardingExerciseSlots(
  slots: readonly OnboardingExerciseSlot[],
): Promise<Array<{ label: string; imageUrl: string | null; sets: number; muscles: Muscle[] }>> {
  const names = [...new Set(slots.flatMap((s) => [...s.candidates]))];
  let rows: Array<{ name: string; imageUrl: string | null }> = [];
  try {
    const res = await fetch(`/api/exercises?names=${encodeURIComponent(names.join(','))}`);
    if (res.ok) {
      const json = (await res.json()) as { data?: Array<{ name: string; imageUrl: string | null }> };
      rows = json.data ?? [];
    }
  } catch {
    /* ignore */
  }
  const byName = new Map(rows.map((r) => [r.name, r] as const));
  return slots.map((slot) => {
    let imageUrl: string | null = null;
    for (const c of slot.candidates) {
      const row = byName.get(c);
      if (row?.imageUrl) {
        imageUrl = row.imageUrl;
        break;
      }
    }
    if (imageUrl == null) {
      for (const c of slot.candidates) {
        const row = byName.get(c);
        if (row) {
          imageUrl = row.imageUrl ?? null;
          break;
        }
      }
    }
    return {
      label: slot.label,
      imageUrl,
      sets: slot.sets,
      muscles: [...slot.muscles],
    };
  });
}

// ─── Helpers ─────────────────────────────────────────────────

function draftToOnboardingData(d: Draft): OnboardingData {
  const benchPress = parseFloat(d.benchPress) || undefined;
  const squat = parseFloat(d.squat) || undefined;
  const deadlift = parseFloat(d.deadlift) || undefined;
  const hasBestLifts = benchPress || squat || deadlift;
  return {
    goal: d.goal[0] ?? 'general_fitness',
    experienceLevel: d.experienceLevel ?? 'beginner',
    splitPreference: d.splitPreference ?? 'not_sure',
    trainingDaysPerWeek: d.trainingDaysPerWeek,
    heightCm: parseInt(d.heightCm, 10) || null,
    weightKg: parseFloat(d.weightKg) || null,
    age: parseInt(d.age, 10) || null,
    bestLifts: hasBestLifts ? { benchPress, squat, deadlift } : null,
    injuries: d.injuries.filter((i) => i !== 'none'),
  };
}

function triggerSelectPop(el: HTMLElement | null) {
  if (!el) return;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = 'nr-onb-select-pop 0.2s ease';
}

// ─── Progress ────────────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  if (step < DATA_PROGRESS_START || step > DATA_PROGRESS_END) return null;
  const idx = step - DATA_PROGRESS_START + 1;
  const pct = (idx / TOTAL_DATA_STEPS) * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            color: TEXT_LABEL,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {idx} of {TOTAL_DATA_STEPS}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            borderRadius: 99,
            background: ACCENT,
            width: `${pct}%`,
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  );
}

function PrimaryBtn({
  onClick,
  disabled,
  children,
  style,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '18px 24px',
        background: disabled ? 'rgba(34,197,94,0.4)' : ACCENT,
        color: '#fff',
        border: 'none',
        borderRadius: CARD_RADIUS,
        fontSize: 17,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.2s, background 0.2s',
        letterSpacing: '0.01em',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function NumberInput({
  label,
  value,
  unit,
  placeholder,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  unit: string;
  placeholder: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label
        style={{
          color: TEXT_LABEL,
          fontSize: 12,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: CARD_BG,
          border: CARD_BORDER,
          borderRadius: 12,
          padding: '14px 16px',
        }}
      >
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: TEXT_PRIMARY,
            fontSize: 18,
            fontWeight: 700,
            outline: 'none',
            minWidth: 0,
            width: '100%',
          }}
        />
        <span style={{ color: TEXT_MUTED, fontSize: 14, fontWeight: 500, flexShrink: 0 }}>{unit}</span>
      </div>
    </div>
  );
}

function OptionCard({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => {
        triggerSelectPop(ref.current);
        onClick();
      }}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '16px 18px',
        background: selected ? 'rgba(34,197,94,0.12)' : CARD_BG,
        border: selected ? `1.5px solid ${ACCENT}` : CARD_BORDER,
        borderRadius: CARD_RADIUS,
        cursor: 'pointer',
        transition: 'border-color 0.2s, background 0.2s',
        textAlign: 'left',
        boxShadow: selected ? `0 0 0 1px ${ACCENT}22` : '0 2px 8px rgba(0,0,0,0.2)',
      }}
    >
      {children}
      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
        {selected ? (
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: ACCENT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : (
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.2)',
              background: 'transparent',
            }}
          />
        )}
      </div>
    </button>
  );
}

// ─── Step content wrapper (slide + fade) ─────────────────────

function StepAnim({
  stepKey,
  dir,
  children,
}: {
  stepKey: number;
  dir: 'fwd' | 'back';
  children: React.ReactNode;
}) {
  const name = dir === 'fwd' ? 'nr-onb-slide-in-right' : 'nr-onb-slide-in-left';
  return (
    <div
      key={stepKey}
      style={{
        flex: 1,
        animation: `${name} 0.28s ease-out`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Welcome ─────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '70vh',
        textAlign: 'center',
        gap: 0,
      }}
    >
      <div
        style={{
          marginBottom: 28,
          animation: 'nr-onb-fade-up 0.45s ease-out both',
        }}
      >
        <img
          src="/logo.png"
          alt="NextRep"
          width={80}
          height={80}
          style={{
            objectFit: 'contain',
            borderRadius: 20,
            animation: 'glowPulse 2.5s ease-in-out infinite',
          }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/nextrep-logo.png';
          }}
        />
      </div>
      <h1
        style={{
          color: TEXT_PRIMARY,
          fontSize: 32,
          fontWeight: 800,
          margin: '0 0 14px',
          lineHeight: 1.15,
          letterSpacing: '-0.01em',
          textTransform: 'uppercase',
          animation: 'nr-onb-fade-up 0.45s ease-out 0.15s both',
        }}
      >
        Welcome to<br />
        NextRep
      </h1>
      <p
        style={{
          color: TEXT_MUTED,
          fontSize: 16,
          margin: '0 0 28px',
          lineHeight: 1.6,
          maxWidth: 280,
          animation: 'nr-onb-fade-up 0.45s ease-out 0.3s both',
        }}
      >
        Let&apos;s set up your training profile in under a minute.
      </p>
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 40,
          flexWrap: 'wrap',
          justifyContent: 'center',
          animation: 'nr-onb-fade-up 0.45s ease-out 0.45s both',
        }}
      >
        {['Track', 'Progress', 'Map', 'Coach'].map((t) => (
          <span
            key={t}
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: TEXT_MUTED,
              padding: '6px 12px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            {t}
          </span>
        ))}
      </div>
      <div style={{ width: '100%', animation: 'nr-onb-fade-up 0.45s ease-out 0.45s both' }}>
        <PrimaryBtn onClick={onNext}>Get Started →</PrimaryBtn>
      </div>
    </div>
  );
}

// ─── Demo weekly volume (feature slide 2) ────────────────────

const ONBOARDING_WEEK_DEMO: WeeklyVolumeChartData = (() => {
  const cells: ({ vol: number; name: string; dur: string; sets: number } | null)[] = [
    { vol: 5916, name: 'Chest + Triceps', dur: '58 мин', sets: 15 },
    null,
    { vol: 7875, name: 'Back + Biceps', dur: '52 мин', sets: 14 },
    null,
    { vol: 8200, name: 'Legs', dur: '61 мин', sets: 16 },
    null,
    null,
  ];
  const days: (DayData | null)[] = cells.map((c, i) => {
    if (!c) return null;
    const durationMinutes = parseInt(String(c.dur).replace(/\D/g, ''), 10) || 0;
    return {
      dayIndex: i,
      workoutId: `onb-demo-${i}`,
      name: c.name,
      volume: c.vol,
      sets: c.sets,
      durationMinutes,
    };
  });
  return {
    days,
    totalVolume: 21991,
    lastWeekVolume: 17200,
    sessionTarget: 3,
    todayIndex: 4,
  };
})();

// ─── Feature 1: Track reps + rest ─────────────────────────────

function FeatureTrackRepsSlide() {
  const noop = useCallback(() => {}, []);
  const demoSet1 = useMemo(
    (): WorkoutSet => ({
      id: 'onb-demo-set-1',
      weight: 80,
      reps: 8,
      completed: true,
      createdAt: new Date().toISOString(),
    }),
    [],
  );
  const demoSet2 = useMemo(
    (): WorkoutSet => ({
      id: 'onb-demo-set-2',
      weight: 75,
      reps: 6,
      completed: true,
      createdAt: new Date().toISOString(),
    }),
    [],
  );

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            marginBottom: 16,
          }}
        >
          ✓
        </div>
        <h2
          style={{
            color: TEXT_PRIMARY,
            fontSize: 26,
            fontWeight: 800,
            margin: '0 0 8px',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          Track every rep
        </h2>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>
          Log sets fast and stay on pace with a built-in rest timer.
        </p>
      </div>
      <div
        style={{
          backgroundColor: theme.colors.card,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: 14,
          padding: '12px 14px',
          marginBottom: 12,
        }}
      >
        <p
          style={{
            color: theme.colors.textMuted,
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            margin: '0 0 2px',
          }}
        >
          Sets
        </p>
        <div>
          <SetRow
            index={0}
            set={demoSet1}
            readOnly
            onUpdateWeight={noop}
            onUpdateReps={noop}
            onToggleComplete={noop}
            onRemove={noop}
          />
          <SetRow
            index={1}
            set={demoSet2}
            readOnly
            onUpdateWeight={noop}
            onUpdateReps={noop}
            onToggleComplete={noop}
            onRemove={noop}
          />
        </div>
      </div>
      <RestTimer
        visible
        embedded
        durationSeconds={90}
        suppressAutoDismiss
        workoutName="Push Day"
        exerciseName="Bench Press"
        setIndex={0}
        onAddSet={noop}
        onFinishExercise={noop}
        onDismiss={noop}
      />
    </>
  );
}

// ─── Feature 2: Progress bars ──────────────────────────────────

function FeatureProgressSlide() {
  const workoutDay = [true, false, true, false, true, false, false];
  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: 'rgba(59,130,246,0.12)',
            border: '1px solid rgba(59,130,246,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            marginBottom: 16,
          }}
        >
          📊
        </div>
        <h2
          style={{
            color: TEXT_PRIMARY,
            fontSize: 26,
            fontWeight: 800,
            margin: '0 0 8px',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          See your progress
        </h2>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>Weekly volume trends keep you honest week to week.</p>
      </div>
      <WeeklyVolumeChart initialData={ONBOARDING_WEEK_DEMO} entranceAnimation />
    </>
  );
}

// ─── Feature 3: Muscle map + workout log rows ─────────────────

const BODY_DEMO_SLOTS: readonly OnboardingExerciseSlot[] = [
  {
    label: 'Bench Press',
    candidates: ['Bench Press'],
    sets: 4,
    muscles: ['chest', 'triceps', 'front-deltoids'],
  },
  {
    label: 'Incline Bench Press',
    candidates: [
      'Incline Bench Press',
      'Incline Bench Press - Barbell',
      'Incline Bench Press - MP',
      'Incline Dumbbell Bench Press',
    ],
    sets: 4,
    muscles: ['chest', 'triceps', 'front-deltoids'],
  },
  {
    label: 'Butterfly (Chest Fly)',
    candidates: ['Butterfly (Chest Fly)', 'Butterfly', 'Chest Fly', 'Fly With Dumbbells'],
    sets: 3,
    muscles: ['chest', 'front-deltoids'],
  },
  {
    label: 'Deadlift',
    candidates: ['Deadlift', 'Deadlifts', 'Sumo Deadlift'],
    sets: 4,
    muscles: ['gluteal', 'hamstring', 'quadriceps', 'lower-back', 'upper-back'],
  },
];

function FeatureMuscleSlide() {
  const reducedMotion = usePrefersReducedMotion();
  const [resolved, setResolved] = useState<
    Array<{ label: string; imageUrl: string | null; sets: number; muscles: Muscle[] }> | null
  >(null);
  const [litIndex, setLitIndex] = useState(0);
  const muscleAnimTimerRef = useRef<number | null>(null);
  const muscleAnimIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await resolveOnboardingExerciseSlots(BODY_DEMO_SLOTS);
      if (!cancelled) setResolved(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const mergedSlugs = useMemo(() => {
    if (!resolved?.length) return [];
    return mergeMusclesInOrder(resolved);
  }, [resolved]);

  useEffect(() => {
    if (muscleAnimTimerRef.current) {
      clearTimeout(muscleAnimTimerRef.current);
      muscleAnimTimerRef.current = null;
    }
    if (muscleAnimIntervalRef.current) {
      clearInterval(muscleAnimIntervalRef.current);
      muscleAnimIntervalRef.current = null;
    }
    if (!mergedSlugs.length) return;
    if (reducedMotion) {
      setLitIndex(mergedSlugs.length);
      return;
    }
    setLitIndex(0);
    muscleAnimTimerRef.current = window.setTimeout(() => {
      let i = 0;
      muscleAnimIntervalRef.current = window.setInterval(() => {
        i += 1;
        setLitIndex(Math.min(i, mergedSlugs.length));
        if (i >= mergedSlugs.length && muscleAnimIntervalRef.current) {
          clearInterval(muscleAnimIntervalRef.current);
          muscleAnimIntervalRef.current = null;
        }
      }, 100);
    }, 400);
    return () => {
      if (muscleAnimTimerRef.current) clearTimeout(muscleAnimTimerRef.current);
      if (muscleAnimIntervalRef.current) clearInterval(muscleAnimIntervalRef.current);
    };
  }, [mergedSlugs, reducedMotion, mergedSlugs.length]);

  const modelData: IExerciseData[] | undefined =
    mergedSlugs.length > 0 && litIndex > 0
      ? [{ name: 'primary', muscles: mergedSlugs.slice(0, litIndex), frequency: 2 }]
      : undefined;

  const mapGlow =
    litIndex > 0 && !reducedMotion ? 'nr-onb-muscle-glow 2.2s ease-in-out infinite' : undefined;

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'linear-gradient(135deg, rgba(31,138,91,0.15) 0%, rgba(31,138,91,0.08) 100%)',
        border: '1px solid rgba(31,138,91,0.3)',
        borderRadius: 6,
        padding: '6px 12px',
        marginBottom: 12,
        alignSelf: 'flex-start',
      }}>
        <span style={{ fontSize: 12 }}>✨</span>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#1F8A5B',
          letterSpacing: '0.04em',
          textTransform: 'uppercase' as const,
        }}>
          PRO Feature
        </span>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: 'rgba(168,85,247,0.12)',
            border: '1px solid rgba(168,85,247,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            marginBottom: 16,
          }}
        >
          🫀
        </div>
        <h2
          style={{
            color: TEXT_PRIMARY,
            fontSize: 26,
            fontWeight: 800,
            margin: '0 0 8px',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          Know your body
        </h2>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>See which muscles you hit on every session.</p>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            color: TEXT_MUTED,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 8,
          }}
        >
          Workout log
        </div>
        <div
          className="nr-onb-hscroll"
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            paddingBottom: 6,
            marginLeft: -2,
            marginRight: -2,
            paddingLeft: 2,
            paddingRight: 2,
          }}
        >
          {(resolved ??
            BODY_DEMO_SLOTS.map((s) => ({
              label: s.label,
              sets: s.sets,
              imageUrl: null as string | null,
              muscles: [...s.muscles],
            }))).map((line) => (
            <div
              key={line.label}
              style={{
                flex: '0 0 148px',
                scrollSnapAlign: 'center',
                background: CARD_BG,
                border: CARD_BORDER,
                borderRadius: 14,
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: 104,
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {line.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={line.imageUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ color: TEXT_MUTED, fontSize: 11 }}>…</span>
                )}
              </div>
              <div
                style={{
                  color: TEXT_PRIMARY,
                  fontSize: 13,
                  fontWeight: 700,
                  lineHeight: 1.25,
                  minHeight: 36,
                }}
              >
                {line.label}
              </div>
              <div style={{ color: TEXT_LABEL, fontSize: 12, fontWeight: 600 }}>{line.sets} sets</div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: 16,
          background: CARD_BG,
          border: CARD_BORDER,
          borderRadius: 14,
          gap: 12,
        }}
      >
        {resolved && mergedSlugs.length > 0 ? (
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                animation: mapGlow,
              }}
            >
              <Model
                data={modelData}
                type="anterior"
                style={{ width: 72, height: 160 }}
                highlightedColors={['rgba(34,197,94,0.45)', 'rgba(34,197,94,0.92)']}
                bodyColor="#1C2526"
              />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                animation: mapGlow,
              }}
            >
              <Model
                data={modelData}
                type="posterior"
                style={{ width: 72, height: 160 }}
                highlightedColors={['rgba(34,197,94,0.45)', 'rgba(34,197,94,0.92)']}
                bodyColor="#1C2526"
              />
            </div>
          </>
        ) : (
          <div style={{ color: TEXT_MUTED, fontSize: 13 }}>Loading…</div>
        )}
      </div>
    </>
  );
}

// ─── Feature 4: AI chat mock ─────────────────────────────────

const AI_COACH_SLOTS: readonly OnboardingExerciseSlot[] = [
  { label: 'Bench Press', candidates: ['Bench Press'], sets: 3, muscles: [] },
  {
    label: 'Incline Bench Press',
    candidates: ['Incline Bench Press', 'Incline Bench Press - Barbell', 'Incline Bench Press - MP'],
    sets: 3,
    muscles: [],
  },
  {
    label: 'Chest Fly',
    candidates: ['Butterfly', 'Chest Fly', 'Fly With Dumbbells', 'Cable Fly'],
    sets: 3,
    muscles: [],
  },
  {
    label: 'Cable Crossover',
    candidates: ['Cable Crossover', 'Cable Cross-over', 'Cable Fly'],
    sets: 3,
    muscles: [],
  },
];

function FeatureAiCoachSlide() {
  const reducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState(0);
  const [resolvedAi, setResolvedAi] = useState<
    Array<{ label: string; imageUrl: string | null; sets: number }> | null
  >(null);

  useEffect(() => {
    const a = window.setTimeout(() => setPhase(1), 400);
    const b = window.setTimeout(() => setPhase(2), 1200);
    const c = window.setTimeout(() => setPhase(3), 1200 + 1500);
    const d = window.setTimeout(() => setPhase(4), 1200 + 1500 + 500);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
      clearTimeout(c);
      clearTimeout(d);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await resolveOnboardingExerciseSlots(AI_COACH_SLOTS);
      if (!cancelled) {
        setResolvedAi(rows.map((r) => ({ label: r.label, imageUrl: r.imageUrl, sets: r.sets })));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        background: 'linear-gradient(135deg, rgba(31,138,91,0.15) 0%, rgba(31,138,91,0.08) 100%)',
        border: '1px solid rgba(31,138,91,0.3)',
        borderRadius: 6,
        padding: '6px 12px',
        marginBottom: 12,
        alignSelf: 'flex-start',
      }}>
        <span style={{ fontSize: 12 }}>✨</span>
        <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#1F8A5B',
          letterSpacing: '0.04em',
          textTransform: 'uppercase' as const,
        }}>
          PRO Feature
        </span>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: 'rgba(34,197,94,0.12)',
            border: '1px solid rgba(34,197,94,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            marginBottom: 16,
          }}
        >
          🤖
        </div>
        <h2
          style={{
            color: TEXT_PRIMARY,
            fontSize: 26,
            fontWeight: 800,
            margin: '0 0 8px',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          Your AI Coach
        </h2>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>Ask Alex for workouts, tweaks, and programming help.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {phase >= 1 && (
          <div
            style={{
              alignSelf: 'flex-end',
              maxWidth: '92%',
              padding: '10px 14px',
              borderRadius: 14,
              background: 'rgba(34,197,94,0.18)',
              border: '1px solid rgba(34,197,94,0.35)',
              color: TEXT_PRIMARY,
              fontSize: 14,
              animation: reducedMotion ? undefined : 'nr-onb-slide-in-right 0.35s ease-out',
            }}
          >
            Create me a push day workout
          </div>
        )}
        {phase === 2 && (
          <div
            style={{
              alignSelf: 'flex-start',
              padding: '10px 14px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.06)',
              border: CARD_BORDER,
              display: 'flex',
              gap: 4,
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: TEXT_MUTED,
                  animation: reducedMotion ? undefined : 'nr-onb-dot 1s ease-in-out infinite',
                  animationDelay: reducedMotion ? undefined : `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        )}
        {phase >= 3 && (
          <div
            style={{
              alignSelf: 'flex-start',
              maxWidth: '92%',
              padding: '10px 14px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.08)',
              border: CARD_BORDER,
              color: TEXT_PRIMARY,
              fontSize: 14,
              animation: reducedMotion ? undefined : 'nr-onb-slide-in-left 0.35s ease-out',
            }}
          >
            I&apos;ve built you a Push Day preset! 💪
          </div>
        )}
        {phase >= 4 && (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: `1px solid ${ACCENT}`,
              background: 'rgba(34,197,94,0.08)',
              animation: reducedMotion ? undefined : 'nr-onb-fade-up 0.4s ease-out',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: ACCENT,
                marginBottom: 10,
              }}
            >
              Chest Day · {AI_COACH_SLOTS.length} exercises
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(resolvedAi ?? AI_COACH_SLOTS.map((s) => ({ label: s.label, imageUrl: null as string | null, sets: s.sets }))).map((row) => (
                <WorkoutLogExerciseRow
                  key={row.label}
                  exerciseImageUrl={row.imageUrl}
                  exerciseName={row.label}
                  completedSets={row.sets}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── Data steps (existing) ───────────────────────────────────

function GoalStep({ value, onChange }: { value: GoalKey[]; onChange: (v: GoalKey[]) => void }) {
  const toggle = (key: GoalKey) => {
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  };
  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
        <h2
          style={{
            color: TEXT_PRIMARY,
            fontSize: 26,
            fontWeight: 800,
            margin: '0 0 8px',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          What are your
          <br />
          main goals?
        </h2>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>Pick as many as you like — we&apos;ll tailor your experience.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {GOALS.map((g) => (
          <OptionCard key={g.key} selected={value.includes(g.key)} onClick={() => toggle(g.key)}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{g.emoji}</span>
            <span style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: 600 }}>{g.label}</span>
          </OptionCard>
        ))}
      </div>
    </>
  );
}

function ExperienceStep({ value, onChange }: { value: ExpKey | null; onChange: (v: ExpKey) => void }) {
  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📈</div>
        <h2
          style={{
            color: TEXT_PRIMARY,
            fontSize: 26,
            fontWeight: 800,
            margin: '0 0 8px',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          Your Training
          <br />
          Experience
        </h2>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>Be honest — we&apos;ll match the program to your level.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {EXPERIENCE_LEVELS.map((e) => (
          <OptionCard key={e.key} selected={value === e.key} onClick={() => onChange(e.key)}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{e.emoji}</span>
            <div>
              <div style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: 600 }}>{e.label}</div>
              <div style={{ color: TEXT_MUTED, fontSize: 12, marginTop: 2 }}>{e.sub}</div>
            </div>
          </OptionCard>
        ))}
      </div>
    </>
  );
}

function SplitStep({ value, onChange }: { value: SplitKey | null; onChange: (v: SplitKey) => void }) {
  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
        <h2
          style={{
            color: TEXT_PRIMARY,
            fontSize: 26,
            fontWeight: 800,
            margin: '0 0 8px',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          How do you
          <br />
          usually train?
        </h2>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>Your preferred training split.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {SPLITS.map((s) => (
          <OptionCard key={s.key} selected={value === s.key} onClick={() => onChange(s.key)}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{s.emoji}</span>
            <span style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: 600 }}>{s.label}</span>
          </OptionCard>
        ))}
      </div>
    </>
  );
}

function DaysStep({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const segments = [2, 3, 4, 5, 6];
  return (
    <>
      <div style={{ marginBottom: 36 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
        <h2
          style={{
            color: TEXT_PRIMARY,
            fontSize: 26,
            fontWeight: 800,
            margin: '0 0 8px',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          Days per Week?
        </h2>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>How many days can you commit to training?</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button
            type="button"
            onClick={() => onChange(Math.max(2, value - 1))}
            disabled={value <= 2}
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: CARD_BG,
              border: CARD_BORDER,
              color: TEXT_PRIMARY,
              fontSize: 24,
              fontWeight: 700,
              cursor: value <= 2 ? 'not-allowed' : 'pointer',
              opacity: value <= 2 ? 0.3 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.2s',
            }}
          >
            −
          </button>
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: TEXT_PRIMARY, fontSize: 64, fontWeight: 800, lineHeight: 1 }}>{value}</span>
            <div style={{ color: TEXT_MUTED, fontSize: 14, marginTop: 4 }}>days / week</div>
          </div>
          <button
            type="button"
            onClick={() => onChange(Math.min(6, value + 1))}
            disabled={value >= 6}
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: CARD_BG,
              border: CARD_BORDER,
              color: TEXT_PRIMARY,
              fontSize: 24,
              fontWeight: 700,
              cursor: value >= 6 ? 'not-allowed' : 'pointer',
              opacity: value >= 6 ? 0.3 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'opacity 0.2s',
            }}
          >
            +
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {segments.map((d) => (
            <div
              key={d}
              role="presentation"
              onClick={() => onChange(d)}
              style={{
                width: 36,
                height: 6,
                borderRadius: 99,
                background: d <= value ? ACCENT : 'rgba(255,255,255,0.12)',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function AboutYouStep({ draft, onChange }: { draft: Draft; onChange: (field: keyof Draft, val: string) => void }) {
  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>📏</div>
        <h2
          style={{
            color: TEXT_PRIMARY,
            fontSize: 26,
            fontWeight: 800,
            margin: '0 0 8px',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          About You
        </h2>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>Helps calculate volume and track progress.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <NumberInput label="Height" value={draft.heightCm} unit="cm" placeholder="180" min={50} max={300} onChange={(v) => onChange('heightCm', v)} />
        <NumberInput label="Weight" value={draft.weightKg} unit="kg" placeholder="80" min={20} max={700} onChange={(v) => onChange('weightKg', v)} />
        <NumberInput label="Age" value={draft.age} unit="yr" placeholder="25" min={10} max={120} onChange={(v) => onChange('age', v)} />
      </div>
    </>
  );
}

function BestLiftsStep({
  draft,
  onChange,
  onSkip,
}: {
  draft: Draft;
  onChange: (field: keyof Draft, val: string) => void;
  onSkip: () => void;
}) {
  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🏋️</div>
        <h2
          style={{
            color: TEXT_PRIMARY,
            fontSize: 26,
            fontWeight: 800,
            margin: '0 0 4px',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          Your Best Lifts
        </h2>
        <span
          style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.08)',
            color: TEXT_MUTED,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            padding: '3px 8px',
            borderRadius: 6,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Optional
        </span>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>Your 1-rep max estimates or recent best.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <NumberInput label="Bench Press" value={draft.benchPress} unit="kg" placeholder="0" min={0} max={500} onChange={(v) => onChange('benchPress', v)} />
        <NumberInput label="Squat" value={draft.squat} unit="kg" placeholder="0" min={0} max={500} onChange={(v) => onChange('squat', v)} />
        <NumberInput label="Deadlift" value={draft.deadlift} unit="kg" placeholder="0" min={0} max={500} onChange={(v) => onChange('deadlift', v)} />
      </div>
      <button
        type="button"
        onClick={onSkip}
        style={{
          marginTop: 16,
          background: 'none',
          border: 'none',
          color: TEXT_MUTED,
          fontSize: 14,
          cursor: 'pointer',
          textDecoration: 'underline',
          textDecorationColor: 'rgba(255,255,255,0.2)',
          padding: '8px 0',
        }}
      >
        Skip for now
      </button>
    </>
  );
}

function InjuryChip({
  opt,
  sel,
  onToggle,
}: {
  opt: (typeof INJURY_OPTIONS)[number];
  sel: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => {
        triggerSelectPop(ref.current);
        onToggle();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 16px',
        borderRadius: 12,
        background: sel ? 'rgba(34,197,94,0.12)' : CARD_BG,
        border: sel ? `1.5px solid ${ACCENT}` : CARD_BORDER,
        color: sel ? TEXT_PRIMARY : TEXT_LABEL,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'border-color 0.2s, background 0.2s, color 0.2s',
      }}
    >
      <span>{opt.emoji}</span>
      {opt.label}
    </button>
  );
}

function InjuriesStep({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (key: string) => {
    if (key === 'none') {
      onChange(['none']);
      return;
    }
    const without = value.filter((k) => k !== 'none');
    if (without.includes(key)) {
      onChange(without.filter((k) => k !== key));
    } else {
      onChange([...without, key]);
    }
  };
  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🩺</div>
        <h2
          style={{
            color: TEXT_PRIMARY,
            fontSize: 26,
            fontWeight: 800,
            margin: '0 0 8px',
            textTransform: 'uppercase',
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          Any injuries or
          <br />
          restrictions?
        </h2>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>We&apos;ll avoid exercises that could cause harm.</p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {INJURY_OPTIONS.map((opt) => (
          <InjuryChip
            key={opt.key}
            opt={opt}
            sel={value.includes(opt.key)}
            onToggle={() => toggle(opt.key)}
          />
        ))}
      </div>
    </>
  );
}

// ─── First preset ────────────────────────────────────────────

function FirstPresetStep({
  onSkip,
  onManual,
}: {
  onSkip: () => void;
  onManual: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
        <h2 style={{ color: TEXT_PRIMARY, fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Almost there!</h2>
        <p style={{ color: TEXT_MUTED, fontSize: 15, margin: 0, lineHeight: 1.5 }}>
          Create your first workout
          <br />
          <span style={{ fontSize: 14 }}>
            Let&apos;s build your first preset based
            <br />
            on your goals and split.
          </span>
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            type="button"
            onClick={onManual}
            style={{
              padding: '16px 18px',
              borderRadius: CARD_RADIUS,
              border: `2px solid ${ACCENT}`,
              background: 'rgba(34,197,94,0.08)',
              color: TEXT_PRIMARY,
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            ✏️ Build manually
          </button>
          <button
            type="button"
            onClick={onSkip}
            style={{
              background: 'none',
              border: 'none',
              color: TEXT_MUTED,
              fontSize: 14,
              cursor: 'pointer',
              padding: 8,
            }}
          >
            Skip for now →
          </button>
        </div>
    </div>
  );
}

// ─── Finish ───────────────────────────────────────────────────

function FinishStep({ draft, celebrate }: { draft: Draft; celebrate: boolean }) {
  const GOAL_LABELS_F: Record<string, string> = {
    muscle_growth: 'Build Muscle',
    strength: 'Increase Strength',
    endurance: 'Improve Fitness',
    weight_loss: 'Lose Fat',
    general_fitness: 'Hybrid',
  };
  const EXP_LABELS: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };
  const SPLIT_LABELS: Record<string, string> = {
    full_body: 'Full Body',
    upper_lower: 'Upper / Lower',
    push_pull_legs: 'PPL',
    bro_split: 'Bro Split',
    not_sure: '?',
  };

  const emojis = ['💪', '🔥', '⚡', '🏆', '💯', '🎯'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 16, position: 'relative' }}>
      {celebrate && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '40%',
            width: 0,
            height: 0,
            pointerEvents: 'none',
          }}
        >
          {emojis.map((e, i) => (
            <span
              key={e}
              style={{
                position: 'absolute',
                fontSize: 28,
                left: 0,
                top: 0,
                animation: `nr-onb-burst-${i} 1s ease-out forwards`,
              }}
            >
              {e}
            </span>
          ))}
        </div>
      )}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 18,
          marginBottom: 24,
          background: 'rgba(34,197,94,0.12)',
          border: '1.5px solid rgba(34,197,94,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
        }}
      >
        🚀
      </div>
      <h2
        style={{
          color: TEXT_PRIMARY,
          fontSize: 28,
          fontWeight: 800,
          margin: '0 0 8px',
          textTransform: 'uppercase',
          letterSpacing: '-0.01em',
        }}
      >
        You&apos;re all set.
      </h2>
      <p style={{ color: TEXT_MUTED, fontSize: 15, margin: '0 0 28px', lineHeight: 1.6 }}>
        Your profile is ready. Let&apos;s build something great.
      </p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 8, width: '100%', justifyContent: 'center' }}>
        {[
          { label: 'Split', value: draft.splitPreference ? SPLIT_LABELS[draft.splitPreference] ?? draft.splitPreference : '—' },
          { label: 'Per Week', value: `${draft.trainingDaysPerWeek}×` },
          { label: 'Level', value: draft.experienceLevel ? (EXP_LABELS[draft.experienceLevel]?.slice(0, 6) ?? '—') : '—' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              flex: 1,
              background: CARD_BG,
              border: CARD_BORDER,
              borderRadius: 12,
              padding: '14px 10px',
            }}
          >
            <div style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: 800 }}>{item.value}</div>
            <div
              style={{
                color: TEXT_MUTED,
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginTop: 4,
              }}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
      {draft.goal.length > 0 && (
        <div style={{ color: TEXT_MUTED, fontSize: 13, marginTop: 4 }}>
          Goals:{' '}
          <span style={{ color: ACCENT, fontWeight: 600 }}>
            {draft.goal.map((g) => GOAL_LABELS_F[g] ?? g).join(' · ')}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main wizard ─────────────────────────────────────────────

export default function OnboardingWizard() {
  const router = useRouter();
  const { updateProfile } = useProfile();

  const [draft, setDraft] = useState<Draft>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return { ...DEFAULT_DRAFT, ...JSON.parse(saved) };
      } catch {
        /* ignore */
      }
    }
    return DEFAULT_DRAFT;
  });

  const [saving, setSaving] = useState(false);
  const [savingMid, setSavingMid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const navDir = useRef<'fwd' | 'back'>('fwd');
  const [finishBurst, setFinishBurst] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
  }, [draft]);

  useEffect(() => {
    if (draft.step === FINISH_STEP) {
      setFinishBurst(true);
    }
  }, [draft.step]);

  const setField = useCallback(<K extends keyof Draft>(field: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const goTo = useCallback((step: number, dir: 'fwd' | 'back') => {
    navDir.current = dir;
    setAnimKey((k) => k + 1);
    setDraft((prev) => ({ ...prev, step }));
  }, []);

  const goNext = useCallback(() => {
    navDir.current = 'fwd';
    setAnimKey((k) => k + 1);
    setDraft((prev) => ({ ...prev, step: prev.step + 1 }));
  }, []);

  const goBack = useCallback(() => {
    navDir.current = 'back';
    setAnimKey((k) => k + 1);
    setDraft((prev) => ({ ...prev, step: Math.max(0, prev.step - 1) }));
  }, []);

  const canContinue = (): boolean => {
    const s = draft.step;
    switch (s) {
      case 5:
        return draft.goal.length > 0;
      case 6:
        return draft.experienceLevel !== null;
      case 7:
        return draft.splitPreference !== null;
      case 8:
        return draft.trainingDaysPerWeek >= 2 && draft.trainingDaysPerWeek <= 6;
      case 9: {
        const h = parseInt(draft.heightCm, 10);
        const w = parseFloat(draft.weightKg);
        const a = parseInt(draft.age, 10);
        if (draft.heightCm && (isNaN(h) || h < 50 || h > 300)) return false;
        if (draft.weightKg && (isNaN(w) || w < 20 || w > 700)) return false;
        if (draft.age && (isNaN(a) || a < 10 || a > 120)) return false;
        return true;
      }
      case 10:
        return true;
      case 11:
        return true;
      default:
        return true;
    }
  };

  async function continueFromInjuries() {
    setSavingMid(true);
    setError(null);
    try {
      const payload = draftToOnboardingData(draft);
      await updateProfile({ ...payload, onboardingCompleted: false });
      goTo(12, 'fwd');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSavingMid(false);
    }
  }

  async function completeOnboarding() {
    setSaving(true);
    setError(null);
    try {
      await updateProfile({ onboardingCompleted: true });
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finish');
    } finally {
      setSaving(false);
    }
  }

  function handlePrimaryContinue() {
    if (draft.step === 11) {
      void continueFromInjuries();
      return;
    }
    goNext();
  }

  const { step } = draft;
  const dir = navDir.current;

  const showBack = step > 0 && step < FINISH_STEP;
  const showProgress = step >= DATA_PROGRESS_START && step <= DATA_PROGRESS_END;
  const showStickyBottom = step !== 0 && step !== 12;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: BG,
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          flex: 1,
          maxWidth: 480,
          width: '100%',
          margin: '0 auto',
          padding: '16px 20px 120px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {showBack && (
          <button
            type="button"
            onClick={goBack}
            style={{
              alignSelf: 'flex-start',
              background: 'none',
              border: 'none',
              color: TEXT_MUTED,
              cursor: 'pointer',
              fontSize: 22,
              padding: '8px 8px 8px 0',
              marginBottom: 4,
              lineHeight: 1,
            }}
          >
            ←
          </button>
        )}
        {showProgress && <ProgressBar step={step} />}
        <StepAnim stepKey={animKey} dir={dir}>
          {step === 0 && <WelcomeStep onNext={() => goTo(1, 'fwd')} />}
          {step === 1 && <FeatureTrackRepsSlide />}
          {step === 2 && <FeatureProgressSlide />}
          {step === 3 && <FeatureMuscleSlide />}
          {step === 4 && <FeatureAiCoachSlide />}
          {step === 5 && <GoalStep value={draft.goal} onChange={(v) => setField('goal', v)} />}
          {step === 6 && (
            <ExperienceStep value={draft.experienceLevel} onChange={(v) => setField('experienceLevel', v)} />
          )}
          {step === 7 && (
            <SplitStep value={draft.splitPreference} onChange={(v) => setField('splitPreference', v)} />
          )}
          {step === 8 && (
            <DaysStep value={draft.trainingDaysPerWeek} onChange={(v) => setField('trainingDaysPerWeek', v)} />
          )}
          {step === 9 && (
            <AboutYouStep
              draft={draft}
              onChange={(field, val) => setField(field, val as Draft[typeof field])}
            />
          )}
          {step === 10 && (
            <BestLiftsStep
              draft={draft}
              onChange={(field, val) => setField(field, val as Draft[typeof field])}
              onSkip={goNext}
            />
          )}
          {step === 11 && <InjuriesStep value={draft.injuries} onChange={(v) => setField('injuries', v)} />}
          {step === 12 && (
            <FirstPresetStep
              onSkip={() => goTo(FINISH_STEP, 'fwd')}
              onManual={() => {
                void (async () => {
                  try {
                    await updateProfile({ onboardingCompleted: true });
                  } catch {
                    /* still navigate */
                  }
                  router.push('/account/presets/new');
                })();
              }}
            />
          )}
          {step === FINISH_STEP && <FinishStep draft={draft} celebrate={finishBurst} />}
        </StepAnim>
      </div>

      {showStickyBottom && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '16px 20px 32px',
            background: `linear-gradient(to top, ${BG} 70%, transparent)`,
            maxWidth: 480,
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          {error && (
            <p style={{ color: '#EF4444', fontSize: 13, margin: '0 0 10px', textAlign: 'center' }}>{error}</p>
          )}
          {step < FINISH_STEP ? (
            <PrimaryBtn onClick={handlePrimaryContinue} disabled={savingMid || !canContinue()}>
              {step === 11 && savingMid ? 'Saving…' : 'Continue →'}
            </PrimaryBtn>
          ) : (
            <PrimaryBtn onClick={() => void completeOnboarding()} disabled={saving}>
              {saving ? 'Finishing…' : "✨ Let's go"}
            </PrimaryBtn>
          )}
        </div>
      )}

      <style>{`
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(34,197,94,0.25), 0 0 0 0 rgba(34,197,94,0.1); }
          50% { box-shadow: 0 0 40px rgba(34,197,94,0.5), 0 0 0 12px rgba(34,197,94,0.05); }
        }
        @keyframes nr-onb-muscle-glow {
          0%, 100% { filter: drop-shadow(0 0 4px rgba(34,197,94,0.38)); }
          50% { filter: drop-shadow(0 0 14px rgba(34,197,94,0.72)); }
        }
        .nr-onb-hscroll {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .nr-onb-hscroll::-webkit-scrollbar { display: none; }
        @keyframes nr-onb-fade-up {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes nr-onb-slide-in-right {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes nr-onb-slide-in-left {
          from { opacity: 0; transform: translateX(-24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes nr-onb-select-pop {
          0% { transform: scale(1); }
          40% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes nr-onb-bar-grow {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes nr-onb-rest-tick {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }
        @keyframes nr-onb-dot {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }
        @keyframes nr-onb-burst-0 {
          to { opacity: 0; transform: translate(-40px, -70px); }
        }
        @keyframes nr-onb-burst-1 {
          to { opacity: 0; transform: translate(50px, -60px); }
        }
        @keyframes nr-onb-burst-2 {
          to { opacity: 0; transform: translate(-55px, 40px); }
        }
        @keyframes nr-onb-burst-3 {
          to { opacity: 0; transform: translate(45px, 50px); }
        }
        @keyframes nr-onb-burst-4 {
          to { opacity: 0; transform: translate(0, -80px); }
        }
        @keyframes nr-onb-burst-5 {
          to { opacity: 0; transform: translate(-30px, 55px); }
        }
      `}</style>
    </div>
  );
}
