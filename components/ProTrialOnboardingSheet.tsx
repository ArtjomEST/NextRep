'use client';

import { useState, useEffect } from 'react';
import { theme } from '@/lib/theme';

export interface ProTrialOnboardingSheetProps {
  open: boolean;
  onClose: () => void;
  trialEndsAt?: string;
  mode?: 'onboarding' | 'info'; // default: 'onboarding'
}

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI Workout Analysis',
    desc: 'Detailed AI breakdown of every session — scores, insights, recovery tips.',
  },
  {
    icon: '💪',
    title: 'Muscle Map',
    desc: 'See exactly which muscles you trained, primary and secondary.',
  },
  {
    icon: '💬',
    title: 'AI Coach',
    desc: 'Chat with your personal coach for programming and form advice.',
  },
  {
    icon: '♾️',
    title: 'Unlimited Presets',
    desc: 'Save as many workout templates as you need.',
  },
];

function formatTrialEnd(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function ProTrialOnboardingSheet({
  open,
  onClose,
  trialEndsAt,
  mode = 'onboarding',
}: ProTrialOnboardingSheetProps) {
  const [slide, setSlide] = useState(0);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mount → trigger slide-up
  useEffect(() => {
    if (open) {
      setSlide(0);
      setMounted(true);
      // next frame → trigger animation
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

  const trialEndStr = formatTrialEnd(trialEndsAt ?? '');

  // Info mode: single features slide with "Got it" button
  if (mode === 'info') {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 500,
          background: theme.colors.bgPrimary,
          display: 'flex',
          flexDirection: 'column',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 24px 24px',
            minHeight: 0,
          }}
        >
          <Slide1 title="What's included in PRO" />
        </div>
        <div
          style={{
            padding: '16px 24px 40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 10,
              color: theme.colors.textSecondary,
              fontSize: 15,
              fontWeight: 600,
              padding: '11px 32px',
              cursor: 'pointer',
              letterSpacing: '0.01em',
            }}
          >
            Got it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 500,
        background: theme.colors.bgPrimary,
        display: 'flex',
        flexDirection: 'column',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        overflowY: 'auto',
      }}
    >
      {/* Slide content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px 24px',
          minHeight: 0,
        }}
      >
        {slide === 0 && <Slide0 trialEndStr={trialEndStr} />}
        {slide === 1 && <Slide1 />}
        {slide === 2 && <Slide2 onClose={onClose} />}
      </div>

      {/* Bottom navigation */}
      <div
        style={{
          padding: '16px 24px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {/* Dots */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: i === slide ? 20 : 6,
                height: 6,
                borderRadius: 3,
                background: i === slide ? theme.colors.primary : theme.colors.border,
                transition: 'width 0.25s ease, background 0.25s ease',
              }}
            />
          ))}
        </div>

        {/* Next button — hidden on last slide */}
        {slide < 2 && (
          <button
            type="button"
            onClick={() => setSlide((s) => s + 1)}
            style={{
              background: 'none',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: 10,
              color: theme.colors.textSecondary,
              fontSize: 15,
              fontWeight: 600,
              padding: '11px 32px',
              cursor: 'pointer',
              letterSpacing: '0.01em',
            }}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}

function Slide0({ trialEndStr }: { trialEndStr: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 16,
        maxWidth: 320,
      }}
    >
      <div style={{ fontSize: 56 }}>🎉</div>
      <h1
        style={{
          color: theme.colors.textPrimary,
          fontSize: 28,
          fontWeight: 800,
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        Welcome to NextRep PRO
      </h1>
      <p
        style={{
          color: theme.colors.textSecondary,
          fontSize: 15,
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        Your 7-day free trial is now active.
      </p>
      {trialEndStr && (
        <div
          style={{
            background: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 10,
            padding: '10px 20px',
            color: theme.colors.textPrimary,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Trial ends <span style={{ color: theme.colors.primary }}>{trialEndStr}</span>
        </div>
      )}
      <p
        style={{
          color: theme.colors.textMuted,
          fontSize: 13,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        Here's what you've unlocked:
      </p>
    </div>
  );
}

function Slide1({ title = 'PRO Features' }: { title?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        width: '100%',
        maxWidth: 360,
      }}
    >
      <h2
        style={{
          color: theme.colors.textPrimary,
          fontSize: 22,
          fontWeight: 800,
          margin: '0 0 4px',
          textAlign: 'center',
        }}
      >
        {title}
      </h2>
      {FEATURES.map((f) => (
        <div
          key={f.title}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            background: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 12,
            padding: '14px 16px',
          }}
        >
          <span style={{ fontSize: 24, flexShrink: 0, lineHeight: 1 }}>{f.icon}</span>
          <div>
            <div
              style={{
                color: theme.colors.textPrimary,
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 3,
              }}
            >
              {f.title}
            </div>
            <div
              style={{
                color: theme.colors.textSecondary,
                fontSize: 13,
                lineHeight: 1.5,
              }}
            >
              {f.desc}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Slide2({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 20,
        maxWidth: 320,
      }}
    >
      <div style={{ fontSize: 64 }}>🏋️</div>
      <h1
        style={{
          color: theme.colors.textPrimary,
          fontSize: 28,
          fontWeight: 800,
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        You're all set!
      </h1>
      <p
        style={{
          color: theme.colors.textSecondary,
          fontSize: 15,
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        All PRO features are unlocked and ready to use. Let's crush your next workout.
      </p>
      <button
        type="button"
        onClick={onClose}
        style={{
          background: theme.colors.primary,
          border: 'none',
          borderRadius: 12,
          color: '#fff',
          fontSize: 16,
          fontWeight: 700,
          padding: '14px 40px',
          cursor: 'pointer',
          marginTop: 8,
        }}
      >
        Start Training
      </button>
    </div>
  );
}
