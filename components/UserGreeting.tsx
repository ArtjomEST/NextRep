'use client';

import React, { useState, useEffect } from 'react';
import { getTelegramUser } from '@/lib/auth/client';
import { fetchMe } from '@/lib/api/client';
import { theme } from '@/lib/theme';

export default function UserGreeting() {
  const [name, setName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const tgUser = getTelegramUser();
    if (tgUser) {
      setName(tgUser.first_name);
      setUsername(tgUser.username ?? null);
    }

    fetchMe().then((me) => {
      if (me) {
        if (me.firstName) setName(me.firstName);
        if (me.username) setUsername(me.username);
      } else if (!tgUser) {
        setName('there');
      }
    });
  }, []);

  if (!mounted) {
    return (
      <div style={{ padding: `${theme.spacing.md} 0` }}>
        <div
          style={{
            height: '28px',
            width: '120px',
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.sm,
          }}
        />
      </div>
    );
  }

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
            fontSize: '24px',
            fontWeight: 700,
            margin: 0,
            lineHeight: 1.3,
          }}
        >
          {name ? `Hey, ${name}` : 'Hey'}
        </h1>
        {username && (
          <p
            style={{
              color: theme.colors.textMuted,
              fontSize: '13px',
              margin: '2px 0 0',
            }}
          >
            @{username}
          </p>
        )}
        <p
          style={{
            color: theme.colors.textSecondary,
            fontSize: '14px',
            margin: '4px 0 0 0',
          }}
        >
          Let&apos;s crush it today
        </p>
      </div>
    </div>
  );
}
