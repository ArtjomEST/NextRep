'use client';

import React, { useState, useEffect } from 'react';
import { theme } from '@/lib/theme';
import { downloadWorkoutPdf } from '@/lib/api/exportWorkout';

interface Props {
  workoutId: string;
}

export default function DownloadWorkoutButton({ workoutId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState(false);

  // Auto-clear error after 3 seconds
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 3000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await downloadWorkoutPdf(workoutId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setLoading(false);
    }
  };

  const iconColor = error
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
    transition: 'color 0.15s',
    position: 'relative',
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
          // Spinner
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ animation: 'nextrep-spin 0.8s linear infinite' }}
          >
            <style>{`@keyframes nextrep-spin { to { transform: rotate(360deg); } }`}</style>
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        ) : (
          // Download icon: arrow down with tray
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

      {/* Error tooltip */}
      {error && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.error}`,
            borderRadius: theme.radius.sm,
            padding: '6px 10px',
            whiteSpace: 'nowrap',
            fontSize: 12,
            color: theme.colors.error,
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
