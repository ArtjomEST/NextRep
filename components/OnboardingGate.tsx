'use client';

import React from 'react';

// Onboarding temporarily disabled — all users go straight to the app.
export default function OnboardingGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
