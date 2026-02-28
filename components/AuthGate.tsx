'use client';

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth/context';
import { theme } from '@/lib/theme';

function LoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: theme.colors.bgPrimary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          border: `3px solid ${theme.colors.border}`,
          borderTopColor: theme.colors.primary,
          borderRadius: '50%',
          animation: 'auth-spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes auth-spin { to { transform: rotate(360deg); } }`}</style>
      <p style={{ color: theme.colors.textSecondary, fontSize: 14, marginTop: 20 }}>
        Loading...
      </p>
    </div>
  );
}

function AppLogo() {
  const [imgError, setImgError] = useState(false);

  if (!imgError) {
    return (
      <img
        src="/nextrep-avatar.png"
        alt="NextRep"
        width={80}
        height={80}
        onError={() => setImgError(true)}
        style={{
          borderRadius: 20,
          marginBottom: 24,
          flexShrink: 0,
          objectFit: 'cover',
          boxShadow: `0 8px 32px ${theme.colors.primary}40`,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: 20,
        background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        flexShrink: 0,
        boxShadow: `0 8px 32px ${theme.colors.primary}40`,
      }}
    >
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5h11" />
        <path d="M6.5 17.5h11" />
        <path d="M4 6.5a2.5 2.5 0 0 1 0-5h0a2.5 2.5 0 0 1 0 5" />
        <path d="M20 6.5a2.5 2.5 0 0 0 0-5h0a2.5 2.5 0 0 0 0 5" />
        <path d="M4 20a2.5 2.5 0 0 1 0-5h0a2.5 2.5 0 0 1 0 5" />
        <path d="M20 20a2.5 2.5 0 0 0 0-5h0a2.5 2.5 0 0 0 0 5" />
        <path d="M12 3v18" />
      </svg>
    </div>
  );
}

function AuthScreen() {
  const { link, isTelegram, refetch, errorMessage } = useAuth();
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const handleAuth = useCallback(async () => {
    if (!isTelegram) return;

    const tg = window.Telegram?.WebApp;

    if (tg?.showConfirm) {
      tg.showConfirm('Link your Telegram account to NextRep?', async (confirmed) => {
        if (!confirmed) return;
        setLinking(true);
        setLinkError(null);
        const ok = await link();
        setLinking(false);
        if (ok) {
          tg.showAlert?.('Account linked!');
        } else {
          setLinkError('Failed to link account. Please try again.');
        }
      });
    } else {
      setLinking(true);
      setLinkError(null);
      const ok = await link();
      setLinking(false);
      if (!ok) {
        setLinkError('Failed to link account. Please try again.');
      }
    }
  }, [isTelegram, link]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: theme.colors.bgPrimary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '0 32px',
        overflow: 'auto',
      }}
    >
      <AppLogo />

      <h1 style={{ color: theme.colors.textPrimary, fontSize: 28, fontWeight: 700, margin: 0, textAlign: 'center' }}>
        NextRep
      </h1>

      <p style={{ color: theme.colors.textSecondary, fontSize: 15, margin: '8px 0 0', textAlign: 'center', lineHeight: 1.5 }}>
        Workout tracker. Save sessions. Track progress.
      </p>

      {/* Feature pills */}
      <div style={{ display: 'flex', gap: 8, marginTop: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['Workouts', 'History', 'Stats'].map((f) => (
          <span
            key={f}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              backgroundColor: theme.colors.surface,
              color: theme.colors.textSecondary,
              fontSize: 13,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            {f}
          </span>
        ))}
      </div>

      <div style={{ width: 40, height: 1, backgroundColor: theme.colors.border, margin: '32px 0' }} />

      {isTelegram ? (
        <>
          <button
            onClick={handleAuth}
            disabled={linking}
            style={{
              width: '100%',
              maxWidth: 320,
              padding: '16px 24px',
              borderRadius: theme.radius.md,
              border: 'none',
              background: linking
                ? theme.colors.primaryPressed
                : `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
              color: '#fff',
              fontSize: 16,
              fontWeight: 600,
              cursor: linking ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'opacity 0.15s',
              opacity: linking ? 0.7 : 1,
            }}
          >
            {linking ? (
              <>
                <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'auth-spin 0.8s linear infinite' }} />
                Linking...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.95 8.15l-1.98 9.33c-.15.67-.54.83-1.1.52l-3.03-2.24-1.46 1.41c-.16.16-.3.3-.61.3l.22-3.07 5.57-5.03c.24-.22-.05-.33-.38-.13l-6.88 4.33-2.97-.93c-.64-.2-.66-.64.14-.95l11.6-4.47c.54-.2 1.01.13.83.93z" />
                </svg>
                Authenticate with Telegram
              </>
            )}
          </button>

          {linkError && (
            <p style={{ color: theme.colors.error, fontSize: 13, marginTop: 12, textAlign: 'center' }}>
              {linkError}
            </p>
          )}
        </>
      ) : (
        <div
          style={{
            textAlign: 'center',
            padding: '20px 24px',
            borderRadius: theme.radius.md,
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            maxWidth: 320,
            width: '100%',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={theme.colors.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p style={{ color: theme.colors.textPrimary, fontSize: 15, fontWeight: 600, margin: '0 0 6px' }}>
            Open inside Telegram
          </p>
          <p style={{ color: theme.colors.textSecondary, fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            This app works as a Telegram Mini App. Open it from the Telegram bot to continue.
          </p>
        </div>
      )}

      {errorMessage && (
        <p style={{ color: theme.colors.textMuted, fontSize: 12, marginTop: 16, textAlign: 'center' }}>
          {errorMessage}
        </p>
      )}

      <button
        onClick={() => refetch()}
        style={{
          marginTop: 20,
          background: 'none',
          border: 'none',
          color: theme.colors.textMuted,
          fontSize: 13,
          cursor: 'pointer',
          textDecoration: 'underline',
          padding: 8,
        }}
      >
        Retry
      </button>
    </div>
  );
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { status, isLinked, isTelegram, link } = useAuth();
  const mainBtnRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!isTelegram || status !== 'authenticated' || isLinked) {
      try {
        const tg = window.Telegram?.WebApp;
        if (tg?.MainButton?.isVisible) tg.MainButton.hide();
      } catch { /* SDK not loaded */ }
      return;
    }

    const tg = window.Telegram?.WebApp;
    if (!tg?.MainButton) return;

    const handler = async () => {
      tg.MainButton!.showProgress(true);
      const ok = await link();
      tg.MainButton!.hideProgress();
      if (ok) {
        tg.MainButton!.hide();
        tg.showAlert?.('Account linked!');
      }
    };

    mainBtnRef.current = handler;
    tg.MainButton.text = 'Link Account';
    tg.MainButton.show();
    tg.MainButton.onClick(handler);

    return () => {
      if (mainBtnRef.current) {
        tg.MainButton?.offClick(mainBtnRef.current);
      }
      tg.MainButton?.hide();
    };
  }, [isTelegram, status, isLinked, link]);

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev && !isTelegram && status === 'authenticated') {
    return <>{children}</>;
  }

  if (status === 'unauthenticated' || !isLinked) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}
