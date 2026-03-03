'use client';

import React from 'react';
import { WorkoutProvider } from '@/lib/workout/state';
import { AuthProvider } from '@/lib/auth/context';
import { ProfileProvider } from '@/lib/profile/context';
import AuthGate from '@/components/AuthGate';
import OnboardingGate from '@/components/OnboardingGate';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>
        <ProfileProvider>
          <OnboardingGate>
            <WorkoutProvider>
              {children}
            </WorkoutProvider>
          </OnboardingGate>
        </ProfileProvider>
      </AuthGate>
    </AuthProvider>
  );
}
