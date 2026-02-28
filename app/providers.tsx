'use client';

import React from 'react';
import { WorkoutProvider } from '@/lib/workout/state';
import TelegramLinkButton from '@/components/TelegramLinkButton';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WorkoutProvider>
      {children}
      <TelegramLinkButton />
    </WorkoutProvider>
  );
}
