'use client';

import { useState } from 'react';
import { useProfile } from '@/lib/profile/context';
import { theme } from '@/lib/theme';
import { activateTrialApi, redeemPromoApi, createStarsInvoiceApi } from '@/lib/api/client';
import ProTrialOnboardingSheet from '@/components/ProTrialOnboardingSheet';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function ProSubscriptionCard() {
  const { isPro, proExpiresAt, trialEndsAt, trialUsed, refreshProfile, triggerTrialOnboarding } = useProfile();
  const [promoOpen, setPromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [starsLoading, setStarsLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const isTrialActive = !isPro && trialEndsAt != null && new Date(trialEndsAt) > new Date();
  const expiresStr = isPro && proExpiresAt ? formatDate(proExpiresAt) : null;
  const trialExpiresStr = isTrialActive && trialEndsAt ? formatDate(trialEndsAt) : null;

  async function handleTrial() {
    setTrialLoading(true);
    try {
      const result = await activateTrialApi();
      await refreshProfile();
      triggerTrialOnboarding(result.trialEndsAt);
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
      const tgWebApp = window.Telegram?.WebApp as {
        openInvoice?: (url: string, callback: (status: string) => void) => void;
      } | undefined;
      if (tgWebApp?.openInvoice) {
        tgWebApp.openInvoice(invoiceUrl, async (status: string) => {
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
      <>
        <div style={{
          background: 'linear-gradient(145deg, #0f2e1f 0%, #143d28 60%, #1C2228 100%)',
          border: '1px solid rgba(31,138,91,0.4)',
          borderRadius: 14,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#F3F4F6', fontSize: 15, fontWeight: 700 }}>
              NextRep PRO
            </span>
            <span style={{
              background: 'rgba(34,197,94,0.15)',
              border: '1px solid rgba(34,197,94,0.4)',
              color: '#22C55E',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 20,
            }}>
              ACTIVE
            </span>
          </div>
          {expiresStr && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#9CA3AF', fontSize: 13 }}>Active until</span>
              <span style={{ color: '#F3F4F6', fontSize: 13, fontWeight: 700 }}>{expiresStr}</span>
            </div>
          )}
          <button onClick={handleStars} disabled={starsLoading} style={{
            width: '100%',
            background: 'rgba(255,255,255,0.07)',
            border: 'none',
            borderRadius: 10,
            color: '#F3F4F6',
            fontSize: 14,
            fontWeight: 600,
            padding: '11px 16px',
            cursor: starsLoading ? 'wait' : 'pointer',
            opacity: starsLoading ? 0.6 : 1,
          }}>
            {starsLoading ? 'Opening…' : 'Extend (+30 days · 50 ⭐)'}
          </button>
          <button onClick={() => setShowInfo(true)} style={{
            background: 'none',
            border: 'none',
            color: '#9CA3AF',
            fontSize: 13,
            padding: '8px 0',
            cursor: 'pointer',
            textAlign: 'center',
            width: '100%',
          }}>
            Learn about PRO
          </button>
        </div>
        <ProTrialOnboardingSheet open={showInfo} onClose={() => setShowInfo(false)} mode="info" />
      </>
    );
  }

  // ── State 2: Trial active ─────────────────────────────────────
  if (isTrialActive) {
    return (
      <>
        <div style={{
          background: 'linear-gradient(145deg, #0f2e1f 0%, #143d28 60%, #1C2228 100%)',
          border: '1px solid rgba(31,138,91,0.4)',
          borderRadius: 14,
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: '#F3F4F6', fontSize: 15, fontWeight: 700 }}>
              NextRep PRO
            </span>
            <span style={{
              background: 'rgba(34,197,94,0.15)',
              border: '1px solid rgba(34,197,94,0.4)',
              color: '#22C55E',
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 20,
            }}>
              TRIAL
            </span>
          </div>
          {trialExpiresStr && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#9CA3AF', fontSize: 13 }}>Active until</span>
              <span style={{ color: '#F3F4F6', fontSize: 13, fontWeight: 700 }}>{trialExpiresStr}</span>
            </div>
          )}
          <button onClick={handleStars} disabled={starsLoading} style={{
            width: '100%',
            background: 'rgba(255,255,255,0.07)',
            border: 'none',
            borderRadius: 10,
            color: '#F3F4F6',
            fontSize: 14,
            fontWeight: 600,
            padding: '11px 16px',
            cursor: starsLoading ? 'wait' : 'pointer',
            opacity: starsLoading ? 0.6 : 1,
          }}>
            {starsLoading ? 'Opening…' : 'Extend (+30 days · 50 ⭐)'}
          </button>
          <button onClick={() => setShowInfo(true)} style={{
            background: 'none',
            border: 'none',
            color: '#9CA3AF',
            fontSize: 13,
            padding: '8px 0',
            cursor: 'pointer',
            textAlign: 'center',
            width: '100%',
          }}>
            Learn about PRO
          </button>
        </div>
        <ProTrialOnboardingSheet open={showInfo} onClose={() => setShowInfo(false)} mode="info" />
      </>
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
