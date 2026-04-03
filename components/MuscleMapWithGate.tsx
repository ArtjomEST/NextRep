'use client';

import { useProfile } from '@/lib/profile/context';
import { theme } from '@/lib/theme';
import MuscleMapLazy from '@/components/MuscleMapLazy';
import { triggerProGate } from '@/lib/pro/helpers';

interface MuscleMapWithGateProps {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  compact?: boolean;
}

export default function MuscleMapWithGate({ primaryMuscles, secondaryMuscles, compact }: MuscleMapWithGateProps) {
  const { isPro } = useProfile();

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        filter: isPro ? 'none' : 'blur(6px)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        <MuscleMapLazy
          primaryMuscles={primaryMuscles}
          secondaryMuscles={secondaryMuscles}
          compact={compact}
        />
      </div>

      {!isPro && (
        <div
          onClick={triggerProGate}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(14,17,20,0.55)',
            backdropFilter: 'blur(2px)',
            borderRadius: theme.radius.md,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 20 }}>🔒</span>
          <span style={{
            color: theme.colors.textPrimary,
            fontSize: 14,
            fontWeight: 600,
          }}>
            Unlock with PRO
          </span>
          <span style={{
            color: theme.colors.textSecondary,
            fontSize: 12,
          }}>
            Tap to upgrade
          </span>
        </div>
      )}
    </div>
  );
}
