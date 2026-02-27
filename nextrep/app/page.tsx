'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Button from '@/components/Button';
import WorkoutCard from '@/components/WorkoutCard';
import ProgressCard from '@/components/ProgressCard';
import Card from '@/components/Card';
import { mockUser, mockWorkouts } from '@/lib/mockData';
import { theme } from '@/lib/theme';
import { useWorkout } from '@/lib/workout/state';

export default function HomePage() {
  const router = useRouter();
  const { hasDraft, draft, savedWorkouts } = useWorkout();

  const latestSaved = savedWorkouts.length > 0 ? savedWorkouts[0] : null;
  const lastWorkout = latestSaved ?? mockWorkouts[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Header greeting={`Hey, ${mockUser.name}`} streak={mockUser.streak} />

      {/* Resume banner */}
      {hasDraft && (
        <Card
          style={{
            borderColor: theme.colors.primary,
            background: `linear-gradient(135deg, ${theme.colors.card} 0%, rgba(31,138,91,0.08) 100%)`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: theme.colors.textPrimary, fontSize: '15px', fontWeight: 600, margin: 0 }}>
                {draft.name}
              </p>
              <p style={{ color: theme.colors.textSecondary, fontSize: '13px', margin: '2px 0 0' }}>
                {draft.exercises.length} exercise{draft.exercises.length !== 1 ? 's' : ''} · {draft.status === 'active' ? 'In progress' : 'Planned'}
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => router.push(draft.status === 'active' ? '/workout/active' : '/workout/new')}
            >
              Resume
            </Button>
          </div>
        </Card>
      )}

      <Button fullWidth size="lg" onClick={() => router.push('/workout/new')}>
        Start Workout
      </Button>

      <section>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}
        >
          <h2
            style={{
              color: theme.colors.textPrimary,
              fontSize: '16px',
              fontWeight: 600,
              margin: 0,
            }}
          >
            Last Workout
          </h2>
          <span
            onClick={() => router.push('/history')}
            style={{
              color: theme.colors.textMuted,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            View all →
          </span>
        </div>
        <WorkoutCard workout={lastWorkout} />
      </section>

      <section>
        <ProgressCard />
      </section>
    </div>
  );
}
