'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/lib/profile/context';
import type { OnboardingData } from '@/lib/api/client';

// ─── Types ────────────────────────────────────────────────────

type GoalKey = 'muscle_growth' | 'strength' | 'weight_loss' | 'endurance' | 'general_fitness';
type ExpKey = 'beginner' | 'intermediate' | 'advanced';
type SplitKey = 'full_body' | 'upper_lower' | 'push_pull_legs' | 'bro_split' | 'not_sure';

interface Draft {
  step: number;
  goal: GoalKey | null;
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
  goal: null,
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

// ─── Data ─────────────────────────────────────────────────────

const GOALS: { key: GoalKey; label: string; emoji: string }[] = [
  { key: 'muscle_growth', label: 'Build Muscle', emoji: '🔥' },
  { key: 'strength', label: 'Increase Strength', emoji: '💪' },
  { key: 'endurance', label: 'Improve Fitness', emoji: '🧘' },
  { key: 'weight_loss', label: 'Lose Fat', emoji: '⚖️' },
  { key: 'general_fitness', label: 'Hybrid', emoji: '🏆' },
];

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

// Steps: 0=Welcome, 1=Goal, 2=Exp, 3=Split, 4=Days, 5=AboutYou, 6=BestLifts, 7=Injuries, 8=Finish
const TOTAL_STEPS = 7; // data-collection steps (1–7), not counting welcome/finish

// ─── Styles ───────────────────────────────────────────────────

const BG = '#0E1114';
const CARD_BG = 'linear-gradient(180deg, #1a2026 0%, #151b21 100%)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.08)';
const ACCENT = '#22c55e';
const TEXT_PRIMARY = '#f3f4f6';
const TEXT_MUTED = 'rgba(255,255,255,0.42)';
const TEXT_LABEL = 'rgba(255,255,255,0.5)';
const CARD_RADIUS = 16;

// ─── Sub-components ───────────────────────────────────────────

function ProgressBar({ step }: { step: number }) {
  if (step === 0 || step === 8) return null;
  const pct = (step / TOTAL_STEPS) * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: TEXT_LABEL, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {step} of {TOTAL_STEPS}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          borderRadius: 99,
          background: ACCENT,
          width: `${pct}%`,
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        }} />
      </div>
    </div>
  );
}

function OptionCard({
  selected, onClick, children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
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
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ) : (
          <div style={{
            width: 22, height: 22, borderRadius: '50%',
            border: '1.5px solid rgba(255,255,255,0.2)', background: 'transparent',
          }} />
        )}
      </div>
    </button>
  );
}

function PrimaryBtn({
  onClick, disabled, children, style,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <button
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
  label, value, unit, placeholder, onChange, min, max,
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
      <label style={{ color: TEXT_LABEL, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: CARD_BG, border: CARD_BORDER, borderRadius: 12, padding: '14px 16px' }}>
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

// ─── Steps ────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', textAlign: 'center', gap: 0 }}>
      <div style={{ marginBottom: 32 }}>
        <img
          src="/nextrep-logo.png"
          alt="NextRep"
          width={96}
          height={96}
          style={{ objectFit: 'contain', filter: 'drop-shadow(0 8px 32px rgba(34,197,94,0.35))' }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
      <h1 style={{
        color: TEXT_PRIMARY, fontSize: 32, fontWeight: 800, margin: '0 0 14px',
        lineHeight: 1.15, letterSpacing: '-0.01em',
        textTransform: 'uppercase',
      }}>
        Welcome to<br />NextRep
      </h1>
      <p style={{ color: TEXT_MUTED, fontSize: 16, margin: '0 0 48px', lineHeight: 1.6, maxWidth: 280 }}>
        Let&apos;s set up your training profile in under a minute.
      </p>
      <PrimaryBtn onClick={onNext}>
        Get Started →
      </PrimaryBtn>
    </div>
  );
}

function GoalStep({ value, onChange }: { value: GoalKey | null; onChange: (v: GoalKey) => void }) {
  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
        <h2 style={{ color: TEXT_PRIMARY, fontSize: 26, fontWeight: 800, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          What is your<br />main goal?
        </h2>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>
          We&apos;ll personalize your experience around it.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {GOALS.map((g) => (
          <OptionCard key={g.key} selected={value === g.key} onClick={() => onChange(g.key)}>
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
        <h2 style={{ color: TEXT_PRIMARY, fontSize: 26, fontWeight: 800, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          Your Training<br />Experience
        </h2>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>
          Be honest — we&apos;ll match the program to your level.
        </p>
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
        <h2 style={{ color: TEXT_PRIMARY, fontSize: 26, fontWeight: 800, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          How do you<br />usually train?
        </h2>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>
          Your preferred training split.
        </p>
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
        <h2 style={{ color: TEXT_PRIMARY, fontSize: 26, fontWeight: 800, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          Days per Week?
        </h2>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>
          How many days can you commit to training?
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button
            onClick={() => onChange(Math.max(2, value - 1))}
            disabled={value <= 2}
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: CARD_BG, border: CARD_BORDER,
              color: TEXT_PRIMARY, fontSize: 24, fontWeight: 700,
              cursor: value <= 2 ? 'not-allowed' : 'pointer',
              opacity: value <= 2 ? 0.3 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'opacity 0.2s',
            }}
          >
            −
          </button>
          <div style={{ textAlign: 'center' }}>
            <span style={{ color: TEXT_PRIMARY, fontSize: 64, fontWeight: 800, lineHeight: 1 }}>
              {value}
            </span>
            <div style={{ color: TEXT_MUTED, fontSize: 14, marginTop: 4 }}>days / week</div>
          </div>
          <button
            onClick={() => onChange(Math.min(6, value + 1))}
            disabled={value >= 6}
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: CARD_BG, border: CARD_BORDER,
              color: TEXT_PRIMARY, fontSize: 24, fontWeight: 700,
              cursor: value >= 6 ? 'not-allowed' : 'pointer',
              opacity: value >= 6 ? 0.3 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
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
              onClick={() => onChange(d)}
              style={{
                width: 36, height: 6, borderRadius: 99,
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
        <h2 style={{ color: TEXT_PRIMARY, fontSize: 26, fontWeight: 800, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          About You
        </h2>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>
          Helps calculate volume and track progress.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <NumberInput label="Height" value={draft.heightCm} unit="cm" placeholder="180" min={50} max={300} onChange={(v) => onChange('heightCm', v)} />
        <NumberInput label="Weight" value={draft.weightKg} unit="kg" placeholder="80" min={20} max={700} onChange={(v) => onChange('weightKg', v)} />
        <NumberInput label="Age" value={draft.age} unit="yr" placeholder="25" min={10} max={120} onChange={(v) => onChange('age', v)} />
      </div>
    </>
  );
}

function BestLiftsStep({ draft, onChange, onSkip }: { draft: Draft; onChange: (field: keyof Draft, val: string) => void; onSkip: () => void }) {
  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🏋️</div>
        <h2 style={{ color: TEXT_PRIMARY, fontSize: 26, fontWeight: 800, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          Your Best Lifts
        </h2>
        <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.08)', color: TEXT_MUTED, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', marginBottom: 8 }}>
          Optional
        </span>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>
          Your 1-rep max estimates or recent best.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <NumberInput label="Bench Press" value={draft.benchPress} unit="kg" placeholder="0" min={0} max={500} onChange={(v) => onChange('benchPress', v)} />
        <NumberInput label="Squat" value={draft.squat} unit="kg" placeholder="0" min={0} max={500} onChange={(v) => onChange('squat', v)} />
        <NumberInput label="Deadlift" value={draft.deadlift} unit="kg" placeholder="0" min={0} max={500} onChange={(v) => onChange('deadlift', v)} />
      </div>
      <button
        onClick={onSkip}
        style={{ marginTop: 16, background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 14, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'rgba(255,255,255,0.2)', padding: '8px 0' }}
      >
        Skip for now
      </button>
    </>
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
        <h2 style={{ color: TEXT_PRIMARY, fontSize: 26, fontWeight: 800, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
          Any injuries or<br />restrictions?
        </h2>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: 0 }}>
          We&apos;ll avoid exercises that could cause harm.
        </p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {INJURY_OPTIONS.map((opt) => {
          const sel = value.includes(opt.key);
          return (
            <button
              key={opt.key}
              onClick={() => toggle(opt.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 16px', borderRadius: 12,
                background: sel ? 'rgba(34,197,94,0.12)' : CARD_BG,
                border: sel ? `1.5px solid ${ACCENT}` : CARD_BORDER,
                color: sel ? TEXT_PRIMARY : TEXT_LABEL,
                fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
                transition: 'border-color 0.2s, background 0.2s, color 0.2s',
              }}
            >
              <span>{opt.emoji}</span>
              {opt.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

function FinishStep({ draft }: { draft: Draft }) {
  const GOAL_LABELS: Record<string, string> = {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 16 }}>
      <div style={{
        width: 72, height: 72, borderRadius: 18, marginBottom: 24,
        background: 'rgba(34,197,94,0.12)', border: `1.5px solid rgba(34,197,94,0.3)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
      }}>
        🚀
      </div>
      <h2 style={{ color: TEXT_PRIMARY, fontSize: 28, fontWeight: 800, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
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
          <div key={item.label} style={{
            flex: 1, background: CARD_BG, border: CARD_BORDER,
            borderRadius: 12, padding: '14px 10px',
          }}>
            <div style={{ color: TEXT_PRIMARY, fontSize: 16, fontWeight: 800 }}>{item.value}</div>
            <div style={{ color: TEXT_MUTED, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>
      {draft.goal && (
        <div style={{ color: TEXT_MUTED, fontSize: 13, marginTop: 4 }}>
          Goal: <span style={{ color: ACCENT, fontWeight: 600 }}>{GOAL_LABELS[draft.goal] ?? draft.goal}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function OnboardingWizard() {
  const { saveProfile } = useProfile();

  const [draft, setDraft] = useState<Draft>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return { ...DEFAULT_DRAFT, ...JSON.parse(saved) };
      } catch { /* ignore */ }
    }
    return DEFAULT_DRAFT;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);

  // Persist draft to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch { /* ignore */ }
  }, [draft]);

  const setField = useCallback(<K extends keyof Draft>(field: K, value: Draft[K]) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }, []);

  const goTo = useCallback((step: number) => {
    setAnimKey((k) => k + 1);
    setDraft((prev) => ({ ...prev, step }));
  }, []);

  const goNext = useCallback(() => goTo(draft.step + 1), [draft.step, goTo]);
  const goBack = useCallback(() => goTo(draft.step - 1), [draft.step, goTo]);

  const canContinue = (): boolean => {
    switch (draft.step) {
      case 1: return draft.goal !== null;
      case 2: return draft.experienceLevel !== null;
      case 3: return draft.splitPreference !== null;
      case 4: return draft.trainingDaysPerWeek >= 2 && draft.trainingDaysPerWeek <= 6;
      case 5: {
        const h = parseInt(draft.heightCm, 10);
        const w = parseFloat(draft.weightKg);
        const a = parseInt(draft.age, 10);
        if (draft.heightCm && (isNaN(h) || h < 50 || h > 300)) return false;
        if (draft.weightKg && (isNaN(w) || w < 20 || w > 700)) return false;
        if (draft.age && (isNaN(a) || a < 10 || a > 120)) return false;
        return true;
      }
      case 6: return true; // optional
      case 7: return true; // multi-select (any state is valid)
      default: return true;
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    setError(null);
    try {
      const benchPress = parseFloat(draft.benchPress) || undefined;
      const squat = parseFloat(draft.squat) || undefined;
      const deadlift = parseFloat(draft.deadlift) || undefined;
      const hasBestLifts = benchPress || squat || deadlift;

      const data: OnboardingData = {
        goal: draft.goal ?? 'general_fitness',
        experienceLevel: draft.experienceLevel ?? 'beginner',
        splitPreference: draft.splitPreference ?? 'not_sure',
        trainingDaysPerWeek: draft.trainingDaysPerWeek,
        heightCm: parseInt(draft.heightCm, 10) || null,
        weightKg: parseFloat(draft.weightKg) || null,
        age: parseInt(draft.age, 10) || null,
        bestLifts: hasBestLifts ? { benchPress, squat, deadlift } : null,
        injuries: draft.injuries.filter((i) => i !== 'none'),
      };

      await saveProfile(data);

      // Clear draft from localStorage after successful save
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    } catch (err) {
      setError('Failed to save profile. Please try again.');
      console.error('[OnboardingWizard] save error:', err);
      setSaving(false);
    }
  };

  const handleSkipLifts = () => {
    setDraft((prev) => ({ ...prev, benchPress: '', squat: '', deadlift: '' }));
    goNext();
  };

  const { step } = draft;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: BG, zIndex: 9000,
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      <div style={{
        flex: 1,
        maxWidth: 480,
        width: '100%',
        margin: '0 auto',
        padding: '16px 20px 120px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Back button */}
        {step > 0 && step < 8 && (
          <button
            onClick={goBack}
            style={{
              alignSelf: 'flex-start',
              background: 'none', border: 'none',
              color: TEXT_MUTED, cursor: 'pointer',
              fontSize: 22, padding: '8px 8px 8px 0',
              marginBottom: 4, lineHeight: 1,
            }}
          >
            ←
          </button>
        )}

        {/* Progress bar */}
        <ProgressBar step={step} />

        {/* Animated step content */}
        <div
          key={animKey}
          style={{
            flex: 1,
            animation: 'onb-fade-in 0.25s ease-out',
          }}
        >
          {step === 0 && <WelcomeStep onNext={goNext} />}
          {step === 1 && <GoalStep value={draft.goal} onChange={(v) => setField('goal', v)} />}
          {step === 2 && <ExperienceStep value={draft.experienceLevel} onChange={(v) => setField('experienceLevel', v)} />}
          {step === 3 && <SplitStep value={draft.splitPreference} onChange={(v) => setField('splitPreference', v)} />}
          {step === 4 && <DaysStep value={draft.trainingDaysPerWeek} onChange={(v) => setField('trainingDaysPerWeek', v)} />}
          {step === 5 && (
            <AboutYouStep
              draft={draft}
              onChange={(field, val) => setField(field, val as Draft[typeof field])}
            />
          )}
          {step === 6 && (
            <BestLiftsStep
              draft={draft}
              onChange={(field, val) => setField(field, val as Draft[typeof field])}
              onSkip={handleSkipLifts}
            />
          )}
          {step === 7 && <InjuriesStep value={draft.injuries} onChange={(v) => setField('injuries', v)} />}
          {step === 8 && <FinishStep draft={draft} />}
        </div>
      </div>

      {/* Sticky bottom action bar */}
      {step !== 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
          padding: '16px 20px 32px',
          background: `linear-gradient(to top, ${BG} 70%, transparent)`,
          maxWidth: 480,
          width: '100%',
          boxSizing: 'border-box',
        } as React.CSSProperties}>
          {error && (
            <p style={{ color: '#EF4444', fontSize: 13, margin: '0 0 10px', textAlign: 'center' }}>
              {error}
            </p>
          )}
          {step < 8 ? (
            <PrimaryBtn
              onClick={goNext}
              disabled={!canContinue()}
            >
              Continue →
            </PrimaryBtn>
          ) : (
            <PrimaryBtn
              onClick={handleFinish}
              disabled={saving}
            >
              {saving ? 'Setting up…' : '✨ Let\'s go'}
            </PrimaryBtn>
          )}
        </div>
      )}

      <style>{`
        @keyframes onb-fade-in {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
