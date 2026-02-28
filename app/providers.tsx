'use client';

import React from 'react';
import { WorkoutProvider } from '@/lib/workout/state';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WorkoutProvider>
      {children}
    </WorkoutProvider>
  );
}
