'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/lib/profile/context';
import { theme } from '@/lib/theme';
import AIWorkoutReportCard from '@/components/AIWorkoutReportCard';
import { activateTrialApi } from '@/lib/api/client';
import type { AiWorkoutReportScores } from '@/lib/api/client';

interface AIReportWithGateProps {
  loading: boolean;
  error: string | null;
  report: string | null;
  scores: AiWorkoutReportScores | null;
}

export default function AIReportWithGate({
  loading,
  error,
  report,
  scores,
}: AIReportWithGateProps) {
  const { isPro, trialUsed, refreshProfile, triggerTrialOnboarding } = useProfile();
  const router = useRouter();
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialError, setTrialError] = useState<string | null>(null);

  async function handleTrial(e: React.MouseEvent) {
    e.stopPropagation();
    setTrialLoading(true);
    setTrialError(null);
    try {
      const result = await activateTrialApi();
      await refreshProfile();
      triggerTrialOnboarding(result.trialEndsAt);
    } catch (err) {
      setTrialError(err instanceof Error ? err.message : 'Failed to activate trial');
    } finally {
      setTrialLoading(false);
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Blurred content behind lock overlay */}
      <div
        style={{
          filter: isPro ? 'none' : 'blur(6px)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <AIWorkoutReportCard
          loading={loading}
          error={error}
          report={report}
          scores={scores}
        />
      </div>

      {/* Lock overlay for non-pro users */}
      {!isPro && (
        <div
          onClick={() => router.push('/account#pro')}
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
          {trialUsed ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                router.push('/account#pro');
              }}
              style={{
                background: theme.colors.primary,
                color: 'white',
                borderRadius: 10,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Unlock with PRO
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleTrial}
                disabled={trialLoading}
                style={{
                  background: theme.colors.primary,
                  color: 'white',
                  borderRadius: 10,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 700,
                  border: 'none',
                  cursor: trialLoading ? 'wait' : 'pointer',
                  opacity: trialLoading ? 0.6 : 1,
                }}
              >
                {trialLoading ? 'Activating…' : 'Activate 7-day free trial'}
              </button>
              {trialError && (
                <span style={{ color: '#EF4444', fontSize: 13 }}>{trialError}</span>
              )}
            </>
          )}
          <span
            style={{
              color: theme.colors.textSecondary,
              fontSize: 12,
            }}
          >
            Full AI analysis of every workout
          </span>
        </div>
      )}
    </div>
  );
}
