'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/context';
import { useProfile } from '@/lib/profile/context';
import OnboardingWizard from './OnboardingWizard';

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { status, isLinked } = useAuth();
  const { isLoading, hasCompletedOnboarding } = useProfile();

  // Only gate authenticated and linked users
  if (status !== 'authenticated' || !isLinked) {
    return <>{children}</>;
  }

  // Still fetching profile
  if (isLoading) {
    return <>{children}</>;
  }

  // Onboarding incomplete — show wizard
  if (!hasCompletedOnboarding) {
    return <OnboardingWizard />;
  }

  return <>{children}</>;
}
