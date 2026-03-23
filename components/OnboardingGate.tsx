'use client';

import React from 'react';
import { useProfile } from '@/lib/profile/context';
import OnboardingWizard from '@/components/OnboardingWizard';

export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { isLoading, hasCompletedOnboarding } = useProfile();
  const showOnboarding = !isLoading && !hasCompletedOnboarding;

  return (
    <>
      {children}
      {showOnboarding ? <OnboardingWizard /> : null}
    </>
  );
}
