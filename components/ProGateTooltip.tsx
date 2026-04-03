'use client';

import { useEffect, useState } from 'react';
import { theme } from '@/lib/theme';
import { useProUpgrade } from '@/app/providers';

export default function ProGateTooltip() {
  const { openProUpgradeSheet } = useProUpgrade();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => {
      setVisible(true);
      setTimeout(() => setVisible(false), 3000);
    };
    window.addEventListener('progate', handler);
    return () => window.removeEventListener('progate', handler);
  }, []);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'max(80px, calc(env(safe-area-inset-bottom, 0px) + 80px))',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: theme.colors.card,
      border: `1px solid ${theme.colors.primary}`,
      borderRadius: theme.radius.md,
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ color: theme.colors.textPrimary, fontSize: 13, fontWeight: 500 }}>
        Available in PRO
      </span>
      <button
        onClick={() => { setVisible(false); openProUpgradeSheet(); }}
        style={{
          background: theme.colors.primary,
          border: 'none',
          borderRadius: 6,
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          padding: '4px 10px',
          cursor: 'pointer',
        }}
      >
        Upgrade →
      </button>
    </div>
  );
}
