'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { theme } from '@/lib/theme';
import type { TabId } from '@/lib/types';

interface Tab {
  id: TabId;
  label: string;
  path: string;
  icon: React.ReactNode;
}

const HomeIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const HistoryIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const ExercisesIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5h11" />
    <path d="M6.5 17.5h11" />
    <path d="M4 6.5a2.5 2.5 0 0 1 0-5h0a2.5 2.5 0 0 1 0 5" />
    <path d="M20 6.5a2.5 2.5 0 0 0 0-5h0a2.5 2.5 0 0 0 0 5" />
    <path d="M4 20a2.5 2.5 0 0 1 0-5h0a2.5 2.5 0 0 1 0 5" />
    <path d="M20 20a2.5 2.5 0 0 0 0-5h0a2.5 2.5 0 0 0 0 5" />
    <path d="M12 3v18" />
  </svg>
);

const AccountIcon = ({ color }: { color: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const tabs: Tab[] = [
  { id: 'home', label: 'Home', path: '/', icon: <HomeIcon color="currentColor" /> },
  { id: 'history', label: 'History', path: '/history', icon: <HistoryIcon color="currentColor" /> },
  { id: 'exercises', label: 'Exercises', path: '/exercises', icon: <ExercisesIcon color="currentColor" /> },
  { id: 'account', label: 'Account', path: '/account', icon: <AccountIcon color="currentColor" /> },
];

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  const isWorkoutRoute = pathname.startsWith('/workout');
  if (isWorkoutRoute) return null;

  const getActiveTab = (): TabId => {
    if (pathname === '/') return 'home';
    const segment = pathname.split('/')[1];
    if (['history', 'exercises', 'account'].includes(segment)) return segment as TabId;
    return 'home';
  };

  const activeTab = getActiveTab();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.colors.surface,
        borderTop: `1px solid ${theme.colors.border}`,
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '8px 0 env(safe-area-inset-bottom, 8px)',
        zIndex: 100,
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => router.push(tab.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? theme.colors.primary : theme.colors.textSecondary,
              padding: '8px 16px',
              minWidth: '64px',
              transition: 'color 0.15s ease',
            }}
          >
            {tab.icon}
            <span style={{ fontSize: '11px', fontWeight: isActive ? 600 : 400 }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
