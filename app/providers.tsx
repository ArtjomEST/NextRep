'use client';

import React from 'react';
import { WorkoutProvider } from '@/lib/workout/state';
import { AuthProvider } from '@/lib/auth/context';
import { ProfileProvider, useProfile } from '@/lib/profile/context';
import AuthGate from '@/components/AuthGate';
import OnboardingGate from '@/components/OnboardingGate';
import ProTrialOnboardingSheet from '@/components/ProTrialOnboardingSheet';

function GlobalSheets({ children }: { children: React.ReactNode }) {
  const { showTrialOnboarding, trialOnboardingEndsAt, dismissTrialOnboarding } = useProfile();
  return (
    <>
      {children}
      <ProTrialOnboardingSheet
        open={showTrialOnboarding}
        onClose={dismissTrialOnboarding}
        trialEndsAt={trialOnboardingEndsAt ?? ''}
      />
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>
        <ProfileProvider>
          <GlobalSheets>
            <OnboardingGate>
              <WorkoutProvider>
                {children}
              </WorkoutProvider>
            </OnboardingGate>
          </GlobalSheets>
        </ProfileProvider>
      </AuthGate>
    </AuthProvider>
  );
}
