'use client';

import React, { useState, useEffect } from 'react';
import { theme } from '@/lib/theme';
import { sendWorkoutPdfToBot } from '@/lib/api/exportWorkout';

interface Props {
  workoutId: string;
}

export default function DownloadWorkoutButton({ workoutId }: Props) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; isError: boolean } | null>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    setToast(null);
    try {
      await sendWorkoutPdfToBot(workoutId);
      setToast({ message: 'PDF sent to your Telegram chat', isError: false });
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Failed to send PDF',
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const iconColor = toast?.isError
    ? theme.colors.error
    : hovered
      ? theme.colors.textPrimary
      : theme.colors.textSecondary;

  const buttonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    padding: 8,
    cursor: loading ? 'default' : 'pointer',
    color: iconColor,
    borderRadius: 8,
    opacity: loading ? 0.6 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    transition: 'color 0.15s',
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Download PDF"
        disabled={loading}
        style={buttonStyle}
      >
        {loading ? (
          <>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={{ animation: 'nextrep-spin 0.8s linear infinite', flexShrink: 0 }}
            >
              <style>{`@keyframes nextrep-spin { to { transform: rotate(360deg); } }`}</style>
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 500 }}>Sending...</span>
          </>
        ) : (
          // Download icon: arrow pointing down into tray
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        )}
      </button>

      {toast && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 6,
            backgroundColor: theme.colors.card,
            border: `1px solid ${toast.isError ? theme.colors.error : theme.colors.primary}`,
            borderRadius: theme.radius.sm,
            padding: '7px 12px',
            whiteSpace: 'nowrap',
            fontSize: 12,
            fontWeight: 500,
            color: toast.isError ? theme.colors.error : theme.colors.success,
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
