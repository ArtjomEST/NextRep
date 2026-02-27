import type { Metadata, Viewport } from 'next';
import './globals.css';
import TabBar from '@/components/TabBar';

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
    <html lang="en">
      <body>
        <main
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            padding: '0 16px 80px',
            minHeight: '100vh',
          }}
        >
          {children}
        </main>
        <TabBar />
      </body>
    </html>
  );
}
