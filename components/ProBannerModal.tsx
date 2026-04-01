'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useProfile } from '@/lib/profile/context';
import { theme } from '@/lib/theme';
import { activateTrialApi, createStarsInvoiceApi } from '@/lib/api/client';

const STORAGE_KEY = 'nextrep_launch_count';
const BANNER_EVERY = 15;

export default function ProBannerModal() {
  const { isPro, trialUsed, refreshProfile } = useProfile();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [starsLoading, setStarsLoading] = useState(false);

  useEffect(() => {
    if (isPro) return;
    if (pathname.startsWith('/workout/active')) return;

    try {
      const count = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10) + 1;
      localStorage.setItem(STORAGE_KEY, String(count));
      if (count > 1 && count % BANNER_EVERY === 0) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable — ignore
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleTrial() {
    setTrialLoading(true);
    try {
      await activateTrialApi();
      await refreshProfile();
      setVisible(false);
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
            setVisible(false);
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

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.7)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'flex-end',
      padding: '0 0 max(16px, env(safe-area-inset-bottom, 16px))',
    }}>
      <div style={{
        width: '100%',
        background: 'linear-gradient(145deg, #0f2e1f 0%, #143d28 40%, #165834 100%)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        border: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 20px',
        position: 'relative',
      }}>
        <button
          onClick={() => setVisible(false)}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'rgba(255,255,255,0.08)',
            border: 'none', borderRadius: '50%',
            width: 28, height: 28,
            color: 'rgba(255,255,255,0.6)',
            fontSize: 16, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Close"
        >
          ✕
        </button>

        <p style={{ color: 'rgba(180,220,190,0.9)', fontSize: 11, fontWeight: 700, margin: '0 0 8px', letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>
          NextRep PRO
        </p>
        <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 6px' }}>
          Level up your training
        </p>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: '0 0 20px', lineHeight: 1.5 }}>
          AI Coach · Workout scores · Muscle map · Unlimited presets
        </p>

        {!trialUsed && (
          <button onClick={handleTrial} disabled={trialLoading} style={{
            width: '100%',
            background: theme.colors.primary,
            border: 'none', borderRadius: 12,
            color: '#fff', fontSize: 16, fontWeight: 700,
            padding: '14px', cursor: trialLoading ? 'wait' : 'pointer',
            opacity: trialLoading ? 0.6 : 1,
            marginBottom: 10,
          }}>
            {trialLoading ? 'Activating…' : 'Try free for 7 days'}
          </button>
        )}

        <button onClick={handleStars} disabled={starsLoading} style={{
          width: '100%',
          background: trialUsed ? theme.colors.primary : 'transparent',
          border: trialUsed ? 'none' : '1px solid rgba(255,255,255,0.25)',
          borderRadius: 12,
          color: '#fff',
          fontSize: trialUsed ? 16 : 14,
          fontWeight: trialUsed ? 700 : 600,
          padding: '12px',
          cursor: starsLoading ? 'wait' : 'pointer',
          opacity: starsLoading ? 0.6 : 1,
          marginBottom: 12,
        }}>
          {starsLoading ? 'Opening…' : 'Get PRO · 50 ⭐ / month'}
        </button>

        <button onClick={() => setVisible(false)} style={{
          background: 'none', border: 'none',
          color: 'rgba(255,255,255,0.35)',
          fontSize: 13, cursor: 'pointer',
          width: '100%', padding: '4px',
        }}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
