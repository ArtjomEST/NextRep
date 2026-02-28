import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';
import TabBar from '@/components/TabBar';
import { Providers } from './providers';
import { LayoutShell } from './layout-shell';

export const metadata: Metadata = {
  title: 'NextRep — Workout Tracker',
  description: 'Track your workouts, monitor progress, and crush your goals.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0E1114',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <Providers>
          <LayoutShell>{children}</LayoutShell>
          <TabBar />
        </Providers>
      </body>
    </html>
  );
}
