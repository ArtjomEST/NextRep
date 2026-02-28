'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWorkout = pathname.startsWith('/workout');

  return (
    <main
      style={{
        maxWidth: '480px',
        margin: '0 auto',
        padding: isWorkout ? '0 16px 24px' : '0 16px 80px',
        minHeight: '100vh',
      }}
    >
      {children}
    </main>
  );
}
