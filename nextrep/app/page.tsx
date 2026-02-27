import Header from '@/components/Header';
import Button from '@/components/Button';
import WorkoutCard from '@/components/WorkoutCard';
import ProgressCard from '@/components/ProgressCard';
import { mockUser, mockWorkouts } from '@/lib/mockData';
import { theme } from '@/lib/theme';

export default function HomePage() {
  const lastWorkout = mockWorkouts[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Header greeting={`Hey, ${mockUser.name}`} streak={mockUser.streak} />

      <Button fullWidth size="lg">
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
            style={{
              color: theme.colors.textMuted,
              fontSize: '13px',
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
