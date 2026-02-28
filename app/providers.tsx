'use client';

import React from 'react';
import { WorkoutProvider } from '@/lib/workout/state';
import { AuthProvider } from '@/lib/auth/context';
import AuthGate from '@/components/AuthGate';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>
        <WorkoutProvider>
          {children}
        </WorkoutProvider>
      </AuthGate>
    </AuthProvider>
  );
}
