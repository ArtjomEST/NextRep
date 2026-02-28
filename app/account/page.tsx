'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Card from '@/components/Card';
import { theme } from '@/lib/theme';
import { useAuth } from '@/lib/auth/context';
import { getTelegramUser } from '@/lib/auth/client';
import { fetchSettings, updateSettings, type UserSettings } from '@/lib/api/client';

const KG_TO_LB = 2.20462;

const GOAL_LABELS: Record<string, string> = {
  muscle_growth: 'Muscle Growth',
  strength: 'Strength',
  endurance: 'Endurance',
  weight_loss: 'Weight Loss',
  general_fitness: 'General Fitness',
};

const EXP_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

function StatDisplay({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: theme.colors.textMuted, fontSize: 12, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </p>
      <p style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: 700, margin: '4px 0 0 0' }}>
        {value}
        <span style={{ fontSize: 12, fontWeight: 400, color: theme.colors.textSecondary }}> {unit}</span>
      </p>
    </div>
  );
}

function StatInput({ label, value, unit, onChange }: { label: string; value: string; unit: string; onChange: (v: string) => void }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: theme.colors.textMuted, fontSize: 12, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.primary}`,
            borderRadius: 6,
            color: theme.colors.textPrimary,
            fontSize: 16,
            fontWeight: 700,
            textAlign: 'center',
            padding: '6px 4px',
            outline: 'none',
          }}
        />
        <span style={{ fontSize: 12, color: theme.colors.textSecondary }}>{unit}</span>
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
  const { user, isTelegram } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const [editWeight, setEditWeight] = useState('');
  const [editHeight, setEditHeight] = useState('');
  const [editAge, setEditAge] = useState('');

  const tgUser = typeof window !== 'undefined' ? getTelegramUser() : null;
  const photoUrl = tgUser?.photo_url ?? null;

  const units = settings?.units ?? 'kg';
  const isImperial = units === 'lb';

  useEffect(() => {
    fetchSettings()
      .then(setSettings)
      .catch((err) => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
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

  const handleLogout = () => {
    if (isTelegram && window.Telegram?.WebApp?.close) {
      window.Telegram.WebApp.close();
    } else {
      window.location.href = '/';
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 16 }}>
        <h1 style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: 700, margin: 0 }}>
          Account
        </h1>
        <Card>
          <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div
              style={{
                width: 28, height: 28,
                border: `3px solid ${theme.colors.border}`,
                borderTopColor: theme.colors.primary,
                borderRadius: '50%',
                animation: 'acct-spin 0.8s linear infinite',
              }}
            />
            <style>{`@keyframes acct-spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 16, paddingBottom: 100 }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
            padding: '10px 20px', borderRadius: theme.radius.sm,
            backgroundColor: theme.colors.card, border: `1px solid ${theme.colors.border}`,
            color: theme.colors.textPrimary, fontSize: 14, fontWeight: 500,
            zIndex: 10000, boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {toast}
        </div>
      )}

      <h1 style={{ color: theme.colors.textPrimary, fontSize: 24, fontWeight: 700, margin: 0 }}>
        Account
      </h1>

      {/* ── Profile Card ─────────────────────────────────────── */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={displayName}
              width={48}
              height={48}
              style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
          ) : (
            <div
              style={{
                width: 48, height: 48, borderRadius: '50%',
                backgroundColor: theme.colors.primary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 700, color: theme.colors.textPrimary, flexShrink: 0,
              }}
            >
              {initials}
            </div>
          )}

          <div style={{ minWidth: 0 }}>
            <h2 style={{ color: theme.colors.textPrimary, fontSize: 18, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </h2>
            {user?.username && (
              <p style={{ color: theme.colors.textMuted, fontSize: 13, margin: '2px 0 0' }}>
                @{user.username}
              </p>
            )}
            {subtitleParts.length > 0 && (
              <p style={{ color: theme.colors.textSecondary, fontSize: 13, margin: '2px 0 0' }}>
                {subtitleParts.join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* Body stats */}
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

        {/* Edit / Save / Cancel */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
          {editing ? (
            <>
              <button
                onClick={() => setEditing(false)}
                disabled={saving}
                style={{ ...btnBase, backgroundColor: 'transparent', color: theme.colors.textSecondary, border: `1px solid ${theme.colors.border}` }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdits}
                disabled={saving}
                style={{ ...btnBase, backgroundColor: theme.colors.primary, color: '#fff', opacity: saving ? 0.6 : 1 }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              onClick={startEditing}
              style={{ ...btnBase, backgroundColor: 'transparent', color: theme.colors.textSecondary, border: `1px solid ${theme.colors.border}` }}
            >
              Edit
            </button>
          )}
        </div>
      </Card>

      {/* ── Units Card ───────────────────────────────────────── */}
      <Card>
        <h3 style={{ color: theme.colors.textPrimary, fontSize: 15, fontWeight: 600, margin: '0 0 4px' }}>
          Units
        </h3>
        <div
          style={{
            display: 'flex', backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.sm, padding: 3, marginTop: 8,
          }}
        >
          {(['kg', 'lb'] as const).map((u) => (
            <button
              key={u}
              onClick={() => handleUnitsToggle(u)}
              style={{
                flex: 1, padding: 10,
                backgroundColor: units === u ? theme.colors.primary : 'transparent',
                color: units === u ? theme.colors.textPrimary : theme.colors.textSecondary,
                border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              {u === 'kg' ? 'KG' : 'LBS'}
            </button>
          ))}
        </div>
      </Card>

      {/* ── Settings Card ────────────────────────────────────── */}
      <Card style={{ padding: '4px 16px' }}>
        <SettingRow label="About NextRep" value="v1.0" />
        <div onClick={handleLogout} style={{ padding: '14px 0', cursor: 'pointer' }}>
          <span style={{ color: theme.colors.error, fontSize: 15 }}>Log Out</span>
        </div>
      </Card>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value?: string }) {
  return (
    <div
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 0', borderBottom: `1px solid ${theme.colors.border}`,
      }}
    >
      <span style={{ color: theme.colors.textPrimary, fontSize: 15 }}>{label}</span>
      {value && (
        <span style={{ color: theme.colors.textSecondary, fontSize: 14 }}>{value}</span>
      )}
    </div>
  );
}
