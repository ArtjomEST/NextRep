'use client';

import React, { useState } from 'react';
import Card from '@/components/Card';
import { theme } from '@/lib/theme';
import { mockUser } from '@/lib/mockData';

interface SettingRowProps {
  label: string;
  value?: string;
  hasChevron?: boolean;
}

function SettingRow({ label, value, hasChevron = true }: SettingRowProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px 0',
        borderBottom: `1px solid ${theme.colors.border}`,
        cursor: 'pointer',
      }}
    >
      <span style={{ color: theme.colors.textPrimary, fontSize: '15px' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {value && (
          <span style={{ color: theme.colors.textSecondary, fontSize: '14px' }}>{value}</span>
        )}
        {hasChevron && (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.colors.textMuted}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        )}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const [units, setUnits] = useState<'kg' | 'lbs'>(mockUser.units);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '16px' }}>
      <h1
        style={{
          color: theme.colors.textPrimary,
          fontSize: '24px',
          fontWeight: 700,
          margin: 0,
        }}
      >
        Account
      </h1>

      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: theme.colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 700,
              color: theme.colors.textPrimary,
              flexShrink: 0,
            }}
          >
            {mockUser.name[0]}
          </div>
          <div>
            <h2
              style={{
                color: theme.colors.textPrimary,
                fontSize: '18px',
                fontWeight: 600,
                margin: 0,
              }}
            >
              {mockUser.name}
            </h2>
            <p
              style={{
                color: theme.colors.textSecondary,
                fontSize: '13px',
                margin: '2px 0 0 0',
              }}
            >
              {mockUser.experienceLevel.charAt(0).toUpperCase() + mockUser.experienceLevel.slice(1)} · {mockUser.goal}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: theme.colors.textMuted, fontSize: '12px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Weight</p>
            <p style={{ color: theme.colors.textPrimary, fontSize: '18px', fontWeight: 700, margin: '4px 0 0 0' }}>
              {mockUser.weight}<span style={{ fontSize: '12px', fontWeight: 400, color: theme.colors.textSecondary }}> {units}</span>
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: theme.colors.textMuted, fontSize: '12px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Height</p>
            <p style={{ color: theme.colors.textPrimary, fontSize: '18px', fontWeight: 700, margin: '4px 0 0 0' }}>
              {mockUser.height}<span style={{ fontSize: '12px', fontWeight: 400, color: theme.colors.textSecondary }}> cm</span>
            </p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: theme.colors.textMuted, fontSize: '12px', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Age</p>
            <p style={{ color: theme.colors.textPrimary, fontSize: '18px', fontWeight: 700, margin: '4px 0 0 0' }}>
              {mockUser.age}<span style={{ fontSize: '12px', fontWeight: 400, color: theme.colors.textSecondary }}> yr</span>
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h3
          style={{
            color: theme.colors.textPrimary,
            fontSize: '15px',
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Units
        </h3>
        <div
          style={{
            display: 'flex',
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.sm,
            padding: '3px',
            marginTop: '8px',
          }}
        >
          {(['kg', 'lbs'] as const).map((u) => (
            <button
              key={u}
              onClick={() => setUnits(u)}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: units === u ? theme.colors.primary : 'transparent',
                color: units === u ? theme.colors.textPrimary : theme.colors.textSecondary,
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {u.toUpperCase()}
            </button>
          ))}
        </div>
      </Card>

      <Card style={{ padding: '4px 16px' }}>
        <SettingRow label="Notifications" value="On" />
        <SettingRow label="Language" value="English" />
        <SettingRow label="Privacy" />
        <SettingRow label="Help & Support" />
        <SettingRow label="About NextRep" />
        <div
          style={{
            padding: '14px 0',
            cursor: 'pointer',
          }}
        >
          <span style={{ color: theme.colors.error, fontSize: '15px' }}>Log Out</span>
        </div>
      </Card>
    </div>
  );
}
