'use client';
import Link from 'next/link';
import Button from '@/components/Button';
import { theme } from '@/lib/theme';

interface Props {
  style?: React.CSSProperties;
}

export default function EmptyStatsOverlay({ style }: Props) {
  return (
    <>
      <style>{`
        @keyframes emptyStatsIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          background: 'rgba(14, 17, 20, 0.55)',
          borderRadius: 14,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          padding: 20,
          textAlign: 'center',
          animation: 'emptyStatsIn 0.3s ease',
          ...style,
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(34,197,94,0.7)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M6 4v16M18 4v16" />
          <path d="M6 8H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h4" />
          <path d="M18 8h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-4" />
          <line x1="6" y1="12" x2="18" y2="12" />
        </svg>
        <p style={{ fontSize: 14, fontWeight: 600, color: theme.colors.textPrimary, margin: 0 }}>
          No data yet
        </p>
        <p style={{ fontSize: 12, color: theme.colors.textSecondary, lineHeight: 1.4, margin: 0 }}>
          Complete your first workout
        </p>
        <Link href="/workout/new" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="sm">Start Workout</Button>
        </Link>
      </div>
    </>
  );
}
