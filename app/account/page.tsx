'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useProfile } from '@/lib/profile/context';
import { getTelegramUser, getAuthHeaders } from '@/lib/auth/client';
import { fetchSettings, updateSettings, fetchPresetsApi, deletePresetApi, fetchDeloadStatusApi, dismissDeloadApi, restoreDeloadApi, type UserSettings } from '@/lib/api/client';
import type { Preset } from '@/lib/api/types';
import { ui } from '@/lib/ui-styles';
import ProLockBadge from '@/components/ProLockBadge';
import ProSubscriptionCard from '@/components/ProSubscriptionCard';
import { triggerProGate } from '@/lib/pro/helpers';

const KG_TO_LB = 2.20462;

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
  push_pull_legs: 'Push Pull Legs',
  bro_split: 'Bro Split',
  not_sure: 'Not sure yet',
};

const INJURY_LABELS: Record<string, string> = {
  shoulder: 'Shoulder',
  knee: 'Knee',
  lower_back: 'Lower Back',
  elbow_wrist: 'Elbow / Wrist',
  ankle: 'Ankle',
};

function StatDisplay({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: ui.textMuted, fontSize: 12, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </p>
      <p style={{ color: ui.textPrimary, fontSize: 18, fontWeight: 800, margin: '4px 0 0 0' }}>
        {value}
        <span style={{ fontSize: 12, fontWeight: 400, color: ui.textLabel }}> {unit}</span>
      </p>
    </div>
  );
}

function StatInput({ label, value, unit, onChange }: { label: string; value: string; unit: string; onChange: (v: string) => void }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: ui.textMuted, fontSize: 12, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2, marginTop: 4 }}>
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          style={{
            width: 56,
            background: ui.cardBg,
            border: `1px solid ${ui.accent}`,
            borderRadius: 8,
            color: ui.textPrimary,
            fontSize: 16,
            fontWeight: 700,
            textAlign: 'center',
            padding: '6px 4px',
            outline: 'none',
          }}
        />
        <span style={{ fontSize: 12, color: ui.textLabel }}>{unit}</span>
      </div>
    </div>
  );
}

const btnBase: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 8,
  border: 'none',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'opacity 0.15s',
};

export default function AccountPage() {
  const router = useRouter();
  const { user, isTelegram } = useAuth();
  const { profile, updateProfile, isPro, refreshProfile } = useProfile();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetsError, setPresetsError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const [editWeight, setEditWeight] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editAge, setEditAge] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [editingTraining, setEditingTraining] = useState(false);
  const [savingTraining, setSavingTraining] = useState(false);
  const [replayingOnboarding, setReplayingOnboarding] = useState(false);
  const [cancellingPro, setCancellingPro] = useState(false);
  const [deloadHidden, setDeloadHidden] = useState<boolean>(false);
  const [deloadHiddenLoaded, setDeloadHiddenLoaded] = useState(false);
  const [editDays, setEditDays] = useState<number>(4);
  const [editBench, setEditBench] = useState('');
  const [editSquat, setEditSquat] = useState('');
  const [editDeadlift, setEditDeadlift] = useState('');
  const [editInjuries, setEditInjuries] = useState<string[]>([]);

  useEffect(() => {
    const tgUser = getTelegramUser();
    setPhotoUrl(tgUser?.photo_url ?? null);
  }, []);

  const units = settings?.units ?? 'kg';
  const isImperial = units === 'lb';

  useEffect(() => {
    Promise.all([
      fetchSettings().catch((err) => { console.error('Failed to load settings:', err); return null; }),
      fetchPresetsApi().catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Failed to load presets';
        setPresetsError(msg);
        return [] as Preset[];
      }),
    ]).then(([s, p]) => {
      if (s) setSettings(s as UserSettings);
      if (Array.isArray(p)) setPresets(p);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchDeloadStatusApi()
      .then((data) => {
        setDeloadHidden(data.hidden);
        setDeloadHiddenLoaded(true);
      })
      .catch(() => setDeloadHiddenLoaded(true));
  }, []);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  const displayWeight = useCallback(
    (wKg: string | null): string => {
      if (!wKg) return '—';
      const kg = parseFloat(wKg);
      if (isNaN(kg)) return '—';
      return isImperial ? Math.round(kg * KG_TO_LB).toString() : kg.toString();
    },
    [isImperial],
  );

  const weightUnit = isImperial ? 'lbs' : 'kg';

  const startEditing = () => {
    const w = settings?.weightKg ? parseFloat(settings.weightKg) : NaN;
    if (isImperial && !isNaN(w)) {
      setEditWeight(Math.round(w * KG_TO_LB).toString());
    } else if (!isNaN(w)) {
      setEditWeight(w.toString());
    } else {
      setEditWeight('');
    }
    setEditHeight(settings?.heightCm?.toString() ?? '');
    setEditAge(settings?.age?.toString() ?? '');
    setEditing(true);
  };

  const saveEdits = async () => {
    setSaving(true);
    try {
      let weightKg: number | null = null;
      if (editWeight.trim()) {
        const v = parseFloat(editWeight);
        if (isNaN(v) || v < 20 || v > 700) {
          flash(`Weight must be 20–700 ${weightUnit}`);
          setSaving(false);
          return;
        }
        weightKg = isImperial ? parseFloat((v / KG_TO_LB).toFixed(1)) : v;
      }

      let heightCm: number | null = null;
      if (editHeight.trim()) {
        const v = parseInt(editHeight, 10);
        if (isNaN(v) || v < 50 || v > 300) {
          flash('Height must be 50–300 cm');
          setSaving(false);
          return;
        }
        heightCm = v;
      }

      let age: number | null = null;
      if (editAge.trim()) {
        const v = parseInt(editAge, 10);
        if (isNaN(v) || v < 10 || v > 120) {
          flash('Age must be 10–120');
          setSaving(false);
          return;
        }
        age = v;
      }

      const updated = await updateSettings({
        weightKg: weightKg != null ? String(weightKg) : null,
        heightCm,
        age,
      });
      setSettings(updated);
      setEditing(false);
      flash('Saved');
    } catch (err) {
      flash('Failed to save');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUnitsToggle = async (next: 'kg' | 'lb') => {
    if (next === units) return;
    const prev = units;
    setSettings((s) => (s ? { ...s, units: next } : s));
    try {
      const updated = await updateSettings({ units: next });
      setSettings(updated);
    } catch {
      setSettings((s) => (s ? { ...s, units: prev } : s));
      flash('Failed to update units');
    }
  };

  const startEditingTraining = () => {
    setEditDays(profile?.trainingDaysPerWeek ?? 4);
    setEditBench(profile?.bestLifts?.benchPress?.toString() ?? '');
    setEditSquat(profile?.bestLifts?.squat?.toString() ?? '');
    setEditDeadlift(profile?.bestLifts?.deadlift?.toString() ?? '');
    setEditInjuries(profile?.injuries ?? []);
    setEditingTraining(true);
  };

  const saveTrainingEdits = async () => {
    setSavingTraining(true);
    try {
      const benchPress = parseFloat(editBench) || undefined;
      const squat = parseFloat(editSquat) || undefined;
      const deadlift = parseFloat(editDeadlift) || undefined;
      const hasBestLifts = benchPress || squat || deadlift;

      await updateProfile({
        trainingDaysPerWeek: editDays,
        bestLifts: hasBestLifts ? { benchPress, squat, deadlift } : null,
        injuries: editInjuries.filter((i) => i !== 'none'),
      });
      setEditingTraining(false);
      flash('Saved');
    } catch {
      flash('Failed to save');
    } finally {
      setSavingTraining(false);
    }
  };

  const toggleInjury = (key: string) => {
    if (key === 'none') {
      setEditInjuries(['none']);
      return;
    }
    setEditInjuries((prev) => {
      const without = prev.filter((k) => k !== 'none');
      return without.includes(key) ? without.filter((k) => k !== key) : [...without, key];
    });
  };

  const handleLogout = () => {
    if (isTelegram && window.Telegram?.WebApp?.close) {
      window.Telegram.WebApp.close();
    } else {
      window.location.href = '/';
    }
  };

  const replayOnboarding = async () => {
    setReplayingOnboarding(true);
    try {
      try {
        localStorage.removeItem('nextrep_onboarding_draft');
      } catch {
        /* ignore */
      }
      await updateProfile({ onboardingCompleted: false });
      flash('Onboarding opened — finish it to save again.');
    } catch {
      flash('Could not replay onboarding');
    } finally {
      setReplayingOnboarding(false);
    }
  };

  const cancelPro = async () => {
    setCancellingPro(true);
    try {
      const res = await fetch('/api/dev/cancel-pro', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed');
      await refreshProfile();
      flash('PRO cancelled');
    } catch {
      flash('Could not cancel PRO');
    } finally {
      setCancellingPro(false);
    }
  };

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const initials = displayName.charAt(0).toUpperCase();
  const subtitleParts = [
    settings?.experienceLevel ? EXP_LABELS[settings.experienceLevel] ?? settings.experienceLevel : '',
    settings?.goal ? GOAL_LABELS[settings.goal] ?? settings.goal : '',
  ].filter(Boolean);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: ui.gap, paddingTop: 16 }}>
        <h1 style={{ color: ui.textPrimary, fontSize: 24, fontWeight: 800, margin: 0 }}>
          Account
        </h1>
        <div
          style={{
            background: ui.cardBg,
            border: ui.cardBorder,
            borderRadius: ui.cardRadius,
            padding: 24,
            boxShadow: ui.cardShadow,
          }}
        >
          <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                width: 28, height: 28,
                border: `3px solid rgba(255,255,255,0.1)`,
                borderTopColor: ui.accent,
                borderRadius: '50%',
                animation: 'acct-spin 0.8s linear infinite',
              }}
            />
            <style>{`@keyframes acct-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: ui.gap, paddingTop: 16, paddingBottom: 100 }}>
      {toast && (
        <div
          style={{
            position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
            padding: '10px 20px', borderRadius: ui.cardRadius,
            background: ui.cardBg, border: ui.cardBorder,
            color: ui.textPrimary, fontSize: 14, fontWeight: 500,
            zIndex: 10000, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {toast}
        </div>
      )}

      <h1 style={{ color: ui.textPrimary, fontSize: 24, fontWeight: 800, margin: 0 }}>
        Account
      </h1>

      <div id="pro">
        <ProSubscriptionCard />
      </div>

      <div
        style={{
          background: ui.cardBg,
          border: ui.cardBorder,
          borderRadius: ui.cardRadius,
          padding: 18,
          boxShadow: ui.cardShadow,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          {photoUrl ? (
            <img src={photoUrl} alt={displayName} width={48} height={48} style={{ borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div
              style={{
                width: 48, height: 48, borderRadius: 12,
                background: ui.heroGradient,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 800, color: ui.textPrimary, flexShrink: 0,
              }}
            >
              {initials}
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <h2 style={{ color: ui.textPrimary, fontSize: 18, fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </h2>
            {user?.username && (
              <p style={{ color: ui.textMuted, fontSize: 13, margin: '2px 0 0' }}>@{user.username}</p>
            )}
            {subtitleParts.length > 0 && (
              <p style={{ color: ui.textLabel, fontSize: 13, margin: '2px 0 0' }}>{subtitleParts.join(' · ')}</p>
            )}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {editing ? (
            <>
              <StatInput label="Weight" value={editWeight} unit={weightUnit} onChange={setEditWeight} />
              <StatInput label="Height" value={editHeight} unit="cm" onChange={setEditHeight} />
              <StatInput label="Age" value={editAge} unit="yr" onChange={setEditAge} />
            </>
          ) : (
            <>
              <StatDisplay label="Weight" value={displayWeight(settings?.weightKg ?? null)} unit={weightUnit} />
              <StatDisplay label="Height" value={settings?.heightCm?.toString() ?? '—'} unit="cm" />
              <StatDisplay label="Age" value={settings?.age?.toString() ?? '—'} unit="yr" />
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                style={{ ...btnBase, background: 'transparent', color: ui.textLabel, border: ui.cardBorder }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdits}
                disabled={saving}
                style={{ ...btnBase, background: ui.accent, color: '#fff', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={startEditing}
              style={{ ...btnBase, background: 'transparent', color: ui.textLabel, border: ui.cardBorder }}
            >
              Edit
            </button>
          )}
        </div>
      </div>

      {/* ─── Training Profile ─── */}
      <div
        style={{
          background: ui.cardBg,
          border: ui.cardBorder,
          borderRadius: ui.cardRadius,
          padding: 18,
          boxShadow: ui.cardShadow,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ color: ui.textPrimary, fontSize: 15, fontWeight: 700, margin: 0 }}>
            Training Profile
          </h3>
          {!editingTraining && (
            <button
              onClick={startEditingTraining}
              style={{ ...btnBase, background: 'transparent', color: ui.textLabel, border: ui.cardBorder, fontSize: 12 }}
            >
              Edit
            </button>
          )}
        </div>

        {/* Goal + Experience + Split - read-only pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Goal', val: profile?.goal ? (GOAL_LABELS[profile.goal] ?? profile.goal) : null },
            { label: 'Level', val: profile?.experienceLevel ? (EXP_LABELS[profile.experienceLevel] ?? profile.experienceLevel) : null },
            { label: 'Split', val: profile?.splitPreference ? (SPLIT_LABELS[profile.splitPreference] ?? profile.splitPreference) : null },
          ].map(({ label, val }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.05)', border: ui.cardBorder, borderRadius: 8, padding: '8px 12px' }}>
              <div style={{ color: ui.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
              <div style={{ color: ui.textPrimary, fontSize: 14, fontWeight: 600, marginTop: 2 }}>{val ?? '—'}</div>
            </div>
          ))}
        </div>

        {/* Days per week */}
        {editingTraining ? (
          <>
            <div style={{ marginBottom: 14 }}>
              <p style={{ color: ui.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                Days per Week
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button
                  onClick={() => setEditDays((d) => Math.max(2, d - 1))}
                  disabled={editDays <= 2}
                  style={{ ...btnBase, background: 'rgba(255,255,255,0.06)', border: ui.cardBorder, color: ui.textPrimary, width: 36, height: 36, padding: 0, opacity: editDays <= 2 ? 0.3 : 1 }}
                >
                  −
                </button>
                <span style={{ color: ui.textPrimary, fontSize: 22, fontWeight: 800, minWidth: 32, textAlign: 'center' }}>{editDays}</span>
                <button
                  onClick={() => setEditDays((d) => Math.min(6, d + 1))}
                  disabled={editDays >= 6}
                  style={{ ...btnBase, background: 'rgba(255,255,255,0.06)', border: ui.cardBorder, color: ui.textPrimary, width: 36, height: 36, padding: 0, opacity: editDays >= 6 ? 0.3 : 1 }}
                >
                  +
                </button>
                <span style={{ color: ui.textMuted, fontSize: 13 }}>days / week</span>
              </div>
            </div>

            {/* Best Lifts */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ color: ui.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                Best Lifts (kg)
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Bench', value: editBench, set: setEditBench },
                  { label: 'Squat', value: editSquat, set: setEditSquat },
                  { label: 'Deadlift', value: editDeadlift, set: setEditDeadlift },
                ].map(({ label, value, set }) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <p style={{ color: ui.textMuted, fontSize: 10, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                    <input
                      type="number"
                      inputMode="decimal"
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      placeholder="0"
                      style={{
                        width: '100%', background: ui.cardBg, border: `1px solid ${ui.accent}`,
                        borderRadius: 8, color: ui.textPrimary, fontSize: 16, fontWeight: 700,
                        textAlign: 'center', padding: '8px 4px', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Injuries */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ color: ui.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                Injuries / Restrictions
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  { key: 'shoulder', label: 'Shoulder' },
                  { key: 'knee', label: 'Knee' },
                  { key: 'lower_back', label: 'Lower Back' },
                  { key: 'elbow_wrist', label: 'Elbow/Wrist' },
                  { key: 'ankle', label: 'Ankle' },
                  { key: 'none', label: 'None' },
                ].map(({ key, label }) => {
                  const sel = editInjuries.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => toggleInjury(key)}
                      style={{
                        padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        background: sel ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.04)',
                        border: sel ? `1.5px solid ${ui.accent}` : ui.cardBorder,
                        color: sel ? ui.textPrimary : ui.textLabel,
                        transition: 'border-color 0.2s, background 0.2s',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingTraining(false)} disabled={savingTraining} style={{ ...btnBase, background: 'transparent', color: ui.textLabel, border: ui.cardBorder }}>
                Cancel
              </button>
              <button onClick={saveTrainingEdits} disabled={savingTraining} style={{ ...btnBase, background: ui.accent, color: '#fff', opacity: savingTraining ? 0.6 : 1 }}>
                {savingTraining ? 'Saving...' : 'Save'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Days per week display */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.05)', border: ui.cardBorder, borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ color: ui.textMuted, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Days/Week</div>
                <div style={{ color: ui.textPrimary, fontSize: 14, fontWeight: 600, marginTop: 2 }}>{profile?.trainingDaysPerWeek ?? '—'}</div>
              </div>
            </div>

            {/* Best lifts display */}
            {profile?.bestLifts && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ color: ui.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                  Best Lifts
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Bench', val: profile.bestLifts.benchPress },
                    { label: 'Squat', val: profile.bestLifts.squat },
                    { label: 'Deadlift', val: profile.bestLifts.deadlift },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 4px' }}>
                      <div style={{ color: ui.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                      <div style={{ color: ui.textPrimary, fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                        {val ? `${val}` : '—'}<span style={{ fontSize: 11, color: ui.textMuted }}>{val ? ' kg' : ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Injuries display */}
            {profile?.injuries && profile.injuries.length > 0 && (
              <div>
                <p style={{ color: ui.textMuted, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                  Restrictions
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {profile.injuries.map((inj) => (
                    <span
                      key={inj}
                      style={{
                        padding: '5px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                        background: 'rgba(255,255,255,0.06)', border: ui.cardBorder, color: ui.textLabel,
                      }}
                    >
                      {INJURY_LABELS[inj] ?? inj}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div
        style={{
          background: ui.cardBg,
          border: ui.cardBorder,
          borderRadius: ui.cardRadius,
          padding: 18,
          boxShadow: ui.cardShadow,
        }}
      >
        <h3 style={{ color: ui.textPrimary, fontSize: 15, fontWeight: 700, margin: '0 0 8px' }}>
          Units
        </h3>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: 3, marginTop: 8 }}>
          {(['kg', 'lb'] as const).map((u) => (
            <button
              key={u}
              onClick={() => handleUnitsToggle(u)}
              style={{
                flex: 1, padding: 10,
                background: units === u ? ui.accent : 'transparent',
                color: units === u ? ui.textPrimary : ui.textLabel,
                border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {u === 'kg' ? 'KG' : 'LBS'}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{
          background: ui.cardBg,
          border: ui.cardBorder,
          borderRadius: ui.cardRadius,
          padding: 18,
          boxShadow: ui.cardShadow,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ color: ui.textPrimary, fontSize: 15, fontWeight: 700, margin: 0 }}>
            Workout Presets
          </h3>
          {(() => {
            const presetLimitReached = !isPro && presets.length >= 3;
            return (
              <button
                onClick={presetLimitReached ? triggerProGate : () => router.push('/account/presets/new')}
                style={{
                  background: presetLimitReached ? 'transparent' : ui.accent,
                  color: ui.textPrimary,
                  border: presetLimitReached ? `1px solid ${ui.accent}` : 'none',
                  borderRadius: 8,
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: presetLimitReached ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Create Preset
                {presetLimitReached && <ProLockBadge />}
              </button>
            );
          })()}
        </div>
        {presetsError && (
          <p style={{ color: ui.error, fontSize: 13, margin: '0 0 8px' }}>
            {presetsError.includes('401') || presetsError.includes('Authentication')
              ? 'Sign in via Telegram to manage your presets.'
              : presetsError}
          </p>
        )}
        {!presetsError && presets.length === 0 ? (
          <p style={{ color: ui.textMuted, fontSize: 13, margin: 0 }}>
            No presets. Create a template to quickly start workouts with pre-filled exercises.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {presets.map((preset) => (
              <div
                key={preset.id}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: ui.cardBorder,
                  borderRadius: 8,
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ color: ui.textPrimary, fontSize: 14, fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {preset.name}
                  </span>
                  <span style={{ color: ui.textMuted, fontSize: 12 }}>
                    {preset.exerciseIds.length} exercise{preset.exerciseIds.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(`/account/presets/new?id=${preset.id}`)}
                  disabled={deletingId !== null}
                  style={{
                    background: 'transparent',
                    border: ui.cardBorder,
                    borderRadius: 6,
                    color: ui.textLabel,
                    padding: '5px 10px',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: deletingId !== null ? 'wait' : 'pointer',
                  }}
                  title="Edit preset"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (deletingId) return;
                    setDeletingId(preset.id);
                    try {
                      await deletePresetApi(preset.id);
                      setPresets((prev) => prev.filter((p) => p.id !== preset.id));
                    } catch {
                      flash('Failed to delete preset');
                    } finally {
                      setDeletingId(null);
                    }
                  }}
                  disabled={deletingId !== null}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: ui.error,
                    padding: 8,
                    margin: '-8px -8px -8px 0',
                    cursor: deletingId !== null ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Delete preset"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Recovery Status Card toggle ───────────────────────────── */}
      {deloadHiddenLoaded && (
        <div
          style={{
            background: ui.cardBg,
            border: ui.cardBorder,
            borderRadius: ui.cardRadius,
            padding: 18,
            boxShadow: ui.cardShadow,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ color: ui.textPrimary, fontSize: 15, fontWeight: 700, margin: '0 0 4px' }}>
                Recovery Status Card
              </h3>
              <p style={{ color: ui.textMuted, fontSize: 13, margin: 0, lineHeight: 1.4 }}>
                Show deload recommendations on home screen
              </p>
            </div>
            <button
              role="switch"
              aria-checked={!deloadHidden}
              onClick={async () => {
                const newHidden = !deloadHidden;
                setDeloadHidden(newHidden);
                try {
                  if (newHidden) {
                    await dismissDeloadApi();
                  } else {
                    await restoreDeloadApi();
                  }
                } catch {
                  setDeloadHidden(!newHidden);
                }
              }}
              style={{
                flexShrink: 0,
                width: 44,
                height: 24,
                borderRadius: 12,
                border: 'none',
                background: deloadHidden ? 'rgba(255,255,255,0.12)' : ui.accent,
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: deloadHidden ? 2 : 22,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                }}
              />
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          background: ui.cardBg,
          border: ui.cardBorder,
          borderRadius: ui.cardRadius,
          padding: 18,
          boxShadow: ui.cardShadow,
        }}
      >
        <h3 style={{ color: ui.textPrimary, fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>
          Onboarding
        </h3>
        <p style={{ color: ui.textMuted, fontSize: 13, margin: '0 0 14px', lineHeight: 1.45 }}>
          Open the setup flow again to preview it. Your profile stays until you complete the last step.
        </p>
        <button
          type="button"
          onClick={() => void replayOnboarding()}
          disabled={replayingOnboarding}
          style={{
            ...btnBase,
            width: '100%',
            background: 'transparent',
            color: ui.accent,
            border: `1px solid ${ui.accent}`,
            opacity: replayingOnboarding ? 0.6 : 1,
            cursor: replayingOnboarding ? 'wait' : 'pointer',
          }}
        >
          {replayingOnboarding ? 'Opening…' : 'Replay onboarding'}
        </button>
        {(process.env.NODE_ENV === 'development' || isPro) && (
          <button
            type="button"
            onClick={() => void cancelPro()}
            disabled={cancellingPro}
            style={{
              ...btnBase,
              width: '100%',
              marginTop: 8,
              background: 'transparent',
              color: '#EF4444',
              border: '1px solid #EF4444',
              opacity: cancellingPro ? 0.6 : 1,
              cursor: cancellingPro ? 'wait' : 'pointer',
            }}
          >
            {cancellingPro ? 'Cancelling…' : 'Cancel PRO (Dev)'}
          </button>
        )}
      </div>

      <div
        style={{
          background: ui.cardBg,
          border: ui.cardBorder,
          borderRadius: ui.cardRadius,
          padding: '4px 18px',
          boxShadow: ui.cardShadow,
        }}
      >
        <SettingRow label="About NextRep" value="v1.1" />
        <div onClick={handleLogout} style={{ padding: '14px 0', cursor: 'pointer' }}>
          <span style={{ color: '#EF4444', fontSize: 15 }}>Log Out</span>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value?: string }) {
  return (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 0', borderBottom: ui.cardBorder,
      }}
    >
      <span style={{ color: ui.textPrimary, fontSize: 15 }}>{label}</span>
      {value && <span style={{ color: ui.textLabel, fontSize: 14 }}>{value}</span>}
    </div>
  );
}
