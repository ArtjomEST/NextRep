'use client';

import React, { createContext, useContext, useState } from 'react';
import { WorkoutProvider } from '@/lib/workout/state';
import { AuthProvider } from '@/lib/auth/context';
import { ProfileProvider, useProfile } from '@/lib/profile/context';
import AuthGate from '@/components/AuthGate';
import OnboardingGate from '@/components/OnboardingGate';
import ProTrialOnboardingSheet from '@/components/ProTrialOnboardingSheet';
import ProUpgradeSheet from '@/components/ProUpgradeSheet';

interface ProUpgradeContextValue {
  openProUpgradeSheet: () => void;
  closeProUpgradeSheet: () => void;
}

const ProUpgradeContext = createContext<ProUpgradeContextValue>({
  openProUpgradeSheet: () => {},
  closeProUpgradeSheet: () => {},
});

export function useProUpgrade(): ProUpgradeContextValue {
  return useContext(ProUpgradeContext);
}

function GlobalSheets({ children }: { children: React.ReactNode }) {
  const { showTrialOnboarding, trialOnboardingEndsAt, dismissTrialOnboarding } = useProfile();
  const [proUpgradeOpen, setProUpgradeOpen] = useState(false);

  return (
    <ProUpgradeContext.Provider value={{
      openProUpgradeSheet: () => setProUpgradeOpen(true),
      closeProUpgradeSheet: () => setProUpgradeOpen(false),
    }}>
      {children}
      <ProTrialOnboardingSheet
        open={showTrialOnboarding}
        onClose={dismissTrialOnboarding}
        trialEndsAt={trialOnboardingEndsAt ?? ''}
      />
      <ProUpgradeSheet open={proUpgradeOpen} onClose={() => setProUpgradeOpen(false)} />
    </ProUpgradeContext.Provider>
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
