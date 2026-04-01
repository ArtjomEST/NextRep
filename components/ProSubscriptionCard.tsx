'use client';

import { useState } from 'react';
import { useProfile } from '@/lib/profile/context';
import { theme } from '@/lib/theme';
import { activateTrialApi, redeemPromoApi, createStarsInvoiceApi } from '@/lib/api/client';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProSubscriptionCard() {
  const { isPro, proExpiresAt, trialEndsAt, trialUsed, refreshProfile } = useProfile();
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [starsLoading, setStarsLoading] = useState(false);

  const isTrialActive = !isPro && trialEndsAt != null && new Date(trialEndsAt) > new Date();
  const expiresStr = isPro && proExpiresAt ? formatDate(proExpiresAt) : null;
  const trialExpiresStr = isTrialActive && trialEndsAt ? formatDate(trialEndsAt) : null;

  async function handleTrial() {
    setTrialLoading(true);
    try {
      await activateTrialApi();
      await refreshProfile();
    } catch {
      // silent
    } finally {
      setTrialLoading(false);
    }
  }

  async function handleStars() {
    setStarsLoading(true);
    try {
      const { invoiceUrl } = await createStarsInvoiceApi();
      if (window.Telegram?.WebApp?.openInvoice) {
        window.Telegram.WebApp.openInvoice(invoiceUrl, async (status: string) => {
          if (status === 'paid') {
            await refreshProfile();
          }
        });
      } else {
        window.open(invoiceUrl, '_blank');
      }
    } catch {
      // silent
    } finally {
      setStarsLoading(false);
    }
  }

  async function handlePromo() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      await redeemPromoApi(promoCode.trim());
      setPromoSuccess(true);
      setPromoCode('');
      await refreshProfile();
    } catch (e) {
      setPromoError(e instanceof Error ? e.message : 'Invalid code');
    } finally {
      setPromoLoading(false);
    }
  }

  // ── State 1: PRO active ───────────────────────────────────────
  if (isPro) {
    return (
      <div style={{
        background: theme.colors.card,
        border: `1.5px solid ${theme.colors.primary}`,
        borderRadius: 16,
        padding: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: 700 }}>
            NextRep PRO
          </span>
          <span style={{
            background: theme.colors.primary,
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
          }}>
            ACTIVE
          </span>
        </div>
        {expiresStr && (
          <p style={{ color: theme.colors.textSecondary, fontSize: 13, margin: '0 0 14px' }}>
            Expires {expiresStr}
          </p>
        )}
        <button onClick={handleStars} disabled={starsLoading} style={{
          width: '100%',
          background: 'transparent',
          border: `1px solid ${theme.colors.primary}`,
          borderRadius: 10,
          color: theme.colors.primary,
          fontSize: 14,
          fontWeight: 600,
          padding: '11px 16px',
          cursor: starsLoading ? 'wait' : 'pointer',
          opacity: starsLoading ? 0.6 : 1,
        }}>
          {starsLoading ? 'Opening…' : 'Extend (+30 days · 50 ⭐)'}
        </button>
      </div>
    );
  }

  // ── State 2: Trial active ─────────────────────────────────────
  if (isTrialActive) {
    return (
      <div style={{
        background: theme.colors.card,
        border: `1.5px solid ${theme.colors.primary}`,
        borderRadius: 16,
        padding: 18,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: theme.colors.textPrimary, fontSize: 16, fontWeight: 700 }}>
            NextRep PRO
          </span>
          <span style={{
            background: 'rgba(34,197,94,0.2)',
            color: theme.colors.success,
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 6,
            letterSpacing: '0.06em',
            textTransform: 'uppercase' as const,
          }}>
            TRIAL
          </span>
        </div>
        <p style={{ color: theme.colors.textSecondary, fontSize: 13, margin: '0 0 14px' }}>
          Trial ends {trialExpiresStr}. Upgrade to keep PRO.
        </p>
        <button onClick={handleStars} disabled={starsLoading} style={{
          width: '100%',
          background: theme.colors.primary,
          border: 'none',
          borderRadius: 10,
          color: '#fff',
          fontSize: 14,
          fontWeight: 700,
          padding: '13px 16px',
          cursor: starsLoading ? 'wait' : 'pointer',
          opacity: starsLoading ? 0.6 : 1,
        }}>
          {starsLoading ? 'Opening…' : 'Upgrade to PRO · 50 ⭐'}
        </button>
      </div>
    );
  }

  // ── States 3 & 4: Free (trial unused / used) ──────────────────
  return (
    <div style={{
      background: 'linear-gradient(145deg, #0f2e1f 0%, #143d28 40%, #165834 100%)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 16,
      padding: 18,
    }}>
      <p style={{ color: 'rgba(180,220,190,0.9)', fontSize: 11, fontWeight: 700, margin: '0 0 8px', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
        NextRep PRO
      </p>
      <p style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>
        Unlock AI Coach
      </p>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 16px' }}>
        AI chat · Workout scores · Muscle map · Unlimited presets
      </p>

      {!trialUsed && (
        <button onClick={handleTrial} disabled={trialLoading} style={{
          width: '100%',
          background: theme.colors.primary,
          border: 'none',
          borderRadius: 10,
          color: '#fff',
          fontSize: 15,
          fontWeight: 700,
          padding: '13px 16px',
          cursor: trialLoading ? 'wait' : 'pointer',
          opacity: trialLoading ? 0.6 : 1,
          marginBottom: 10,
        }}>
          {trialLoading ? 'Activating…' : 'Try free for 7 days'}
        </button>
      )}

      <button onClick={handleStars} disabled={starsLoading} style={{
        width: '100%',
        background: trialUsed ? theme.colors.primary : 'transparent',
        border: trialUsed ? 'none' : '1px solid rgba(255,255,255,0.3)',
        borderRadius: 10,
        color: '#fff',
        fontSize: trialUsed ? 15 : 14,
        fontWeight: trialUsed ? 700 : 600,
        padding: '11px 16px',
        cursor: starsLoading ? 'wait' : 'pointer',
        opacity: starsLoading ? 0.6 : 1,
        marginBottom: 12,
      }}>
        {starsLoading ? 'Opening…' : 'Get PRO · 50 ⭐ / month'}
      </button>

      {!promoOpen ? (
        <button onClick={() => setPromoOpen(true)} style={{
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.45)', fontSize: 12,
          cursor: 'pointer', padding: 0, width: '100%',
        }}>
          Have a promo code?
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={promoCode}
            onChange={e => setPromoCode(e.target.value)}
            placeholder="Enter code"
            autoFocus
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.08)',
              border: `1px solid ${promoError ? theme.colors.error : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 8,
              color: '#fff',
              fontSize: 14,
              padding: '9px 12px',
              outline: 'none',
            }}
          />
          <button onClick={handlePromo} disabled={promoLoading} style={{
            background: theme.colors.primary,
            border: 'none',
            borderRadius: 8,
            color: '#fff',
            fontSize: 13,
            fontWeight: 700,
            padding: '9px 14px',
            cursor: promoLoading ? 'wait' : 'pointer',
            opacity: promoLoading ? 0.6 : 1,
            flexShrink: 0,
          }}>
            {promoLoading ? '…' : 'Apply'}
          </button>
        </div>
      )}
      {promoError && (
        <p style={{ color: theme.colors.error, fontSize: 12, margin: '6px 0 0' }}>{promoError}</p>
      )}
      {promoSuccess && (
        <p style={{ color: theme.colors.success, fontSize: 12, margin: '6px 0 0' }}>✓ PRO activated!</p>
      )}
    </div>
  );
}
