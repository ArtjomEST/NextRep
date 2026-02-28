'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/context';
import { theme } from '@/lib/theme';

export default function UserGreeting() {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return (
      <div style={{ padding: `${theme.spacing.md} 0` }}>
        <div
          style={{
            height: 28,
            width: 120,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.sm,
          }}
        />
      </div>
    );
  }

  const name = user?.firstName || user?.lastName || null;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const username = user?.username || null;

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: `${theme.spacing.md} 0`,
      }}
    >
      <div>
        <h1
          style={{
            color: theme.colors.textPrimary,
            fontSize: 24,
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {name ? `Hey, ${fullName}` : 'Hey, there'}
        </h1>
        {username && (
          <p
            style={{
              color: theme.colors.textMuted,
              fontSize: 13,
              margin: '2px 0 0',
            }}
          >
            @{username}
          </p>
        )}
        <p
          style={{
            color: theme.colors.textSecondary,
            fontSize: 14,
            margin: '4px 0 0 0',
          }}
        >
          Let&apos;s crush it today
        </p>
      </div>
    </div>
  );
}
