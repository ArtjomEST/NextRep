'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkout } from '@/lib/workout/state';
import LegendsWorkoutCard from '@/components/LegendsWorkoutCard';
import { LEGEND_WORKOUTS } from '@/lib/legends/data';
import { resolveLegendExercises } from '@/lib/legends/resolve';
import type { LegendWorkout } from '@/lib/legends/data';
import { ui } from '@/lib/ui-styles';

export default function LegendsWorkoutSlider() {
  const router = useRouter();
  const { dispatch } = useWorkout();
  const [applyingId, setApplyingId] = useState<string | null>(null);

  async function handleUsePreset(legend: LegendWorkout) {
    setApplyingId(legend.id);
    try {
      const exercises = await resolveLegendExercises(legend.exerciseNames);
      const workoutName = `${legend.name} — ${legend.subtitle}`;
      dispatch({ type: 'RESET_DRAFT' });
      dispatch({ type: 'SET_NAME', name: workoutName });
      for (const ex of exercises) {
        dispatch({ type: 'ADD_EXERCISE', exercise: ex });
      }
      router.push('/workout/new');
    } catch {
      // silent
    } finally {
      setApplyingId(null);
    }
  }

  return (
    <section>
      <h2 style={{
        color: ui.textLabel,
        fontSize: 15,
        fontWeight: 700,
        margin: '0 0 14px',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>
        Legends Workouts
      </h2>

      <div style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        overflowY: 'visible',
        scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
        paddingRight: 16,
        paddingBottom: 8,
        /* убираем скроллбар визуально */
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}>
        {LEGEND_WORKOUTS.map((legend) => (
          <div
            key={legend.id}
            style={{
              flex: '0 0 90%',   /* 90% = видна часть следующей карточки */
              minWidth: '90%',
              scrollSnapAlign: 'start',
              scrollSnapStop: 'always',
            }}
          >
            <LegendsWorkoutCard
              legend={legend}
              onUsePreset={handleUsePreset}
              applying={applyingId === legend.id}
            />
          </div>
        ))}
      </div>
    </section>
  );
}