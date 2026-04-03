'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/lib/profile/context';
import { theme } from '@/lib/theme';
import { activateTrialApi, createStarsInvoiceApi } from '@/lib/api/client';

export interface ProUpgradeSheetProps {
  open: boolean;
  onClose: () => void;
}

const FEATURES = [
  'AI Workout Coach',
  'Muscle Map',
  'AI Workout Reports',
  'Unlimited Presets',
];

export default function ProUpgradeSheet({ open, onClose }: ProUpgradeSheetProps) {
  const { trialUsed, refreshProfile, triggerTrialOnboarding } = useProfile();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [starsLoading, setStarsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!mounted) return null;

  async function handleTrial() {
    setTrialLoading(true);
    try {
      const result = await activateTrialApi();
      await refreshProfile();
      onClose();
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
            onClose();
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

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: visible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-end',
        transition: 'background 0.3s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: theme.colors.surface,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          border: `1px solid ${theme.colors.border}`,
          borderBottom: 'none',
          padding: '24px 20px max(32px, calc(env(safe-area-inset-bottom, 0px) + 24px))',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            borderRadius: '50%',
            width: 28,
            height: 28,
            color: theme.colors.textSecondary,
            fontSize: 16,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Close"
        >
          ✕
        </button>

        <p style={{
          color: theme.colors.textPrimary,
          fontSize: 20,
          fontWeight: 800,
          margin: '0 0 20px',
        }}>
          Unlock NextRep PRO
        </p>

        {/* Features list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {FEATURES.map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                color: theme.colors.primary,
                fontSize: 16,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                ✓
              </span>
              <span style={{
                color: theme.colors.textPrimary,
                fontSize: 15,
              }}>
                {f}
              </span>
            </div>
          ))}
        </div>

        {/* Try free */}
        {!trialUsed && (
          <button
            onClick={handleTrial}
            disabled={trialLoading}
            style={{
              width: '100%',
              background: theme.colors.primary,
              border: 'none',
              borderRadius: 12,
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              padding: '14px',
              cursor: trialLoading ? 'wait' : 'pointer',
              opacity: trialLoading ? 0.6 : 1,
              marginBottom: 8,
            }}
          >
            {trialLoading ? 'Activating…' : 'Try 7 Days Free'}
          </button>
        )}

        {/* Get PRO */}
        <button
          onClick={handleStars}
          disabled={starsLoading}
          style={{
            width: '100%',
            background: trialUsed ? theme.colors.primary : 'transparent',
            border: trialUsed ? 'none' : `1px solid ${theme.colors.border}`,
            borderRadius: 12,
            color: '#fff',
            fontSize: trialUsed ? 16 : 14,
            fontWeight: trialUsed ? 700 : 600,
            padding: '12px',
            cursor: starsLoading ? 'wait' : 'pointer',
            opacity: starsLoading ? 0.6 : 1,
            marginTop: 8,
          }}
        >
          {starsLoading ? 'Opening…' : 'Get PRO · 50 ⭐ / month'}
        </button>
      </div>
    </div>
  );
}
