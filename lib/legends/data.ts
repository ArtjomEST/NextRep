/**
 * Legend workout definitions for the Legends Workouts section.
 * Add new entries (e.g. Ronnie Coleman, Jay Cutler) to LEGEND_WORKOUTS.
 */

export interface LegendWorkout {
  id: string;
  name: string;
  subtitle: string;
  tags: string[];
  difficulty: string;
  image: string;
  /** Display traits with optional icon key */
  traits: { label: string; icon?: 'target' | 'lightning' }[];
  /** Exercise names in order; resolved to DB exercises when applying preset */
  exerciseNames: string[];
  description?: string;
}

export const LEGEND_WORKOUTS: LegendWorkout[] = [
  {
    id: 'arnold-classic-mass',
    name: 'Arnold Schwarzenegger',
    subtitle: 'Classic Mass Workout',
    tags: ['Legend preset', 'Mass', 'Advanced'],
    difficulty: 'Advanced',
    image: '/legends/arnold-classic-mass.png',
    traits: [
      { label: 'High Volume', icon: 'target' },
      { label: 'Power', icon: 'lightning' },
    ],
    exerciseNames: [
      'Barbell Bench Press',
      'Incline Bench Press',
      'Dumbbell Flyes',
      'Pull-Ups',
      'Barbell Rows',
      'Deadlifts',
      'Barbell Curls',
      'Skull Crushers',
      'Concentration Curls',
    ],
    description: 'Classic mass-building split inspired by Arnold’s golden era.',
  },
  {
    id: 'ronnie-monster-legs',
    name: 'Ronnie Coleman',
    subtitle: 'Monster Leg Workout',
    tags: ['Legend preset', 'Legs', 'Advanced'],
    difficulty: 'Advanced',
    image:
      '/legends/ronnie-monster-legs.png',
    traits: [
      { label: 'High Volume', icon: 'target' },
      { label: 'Strength', icon: 'lightning' },
    ],
    exerciseNames: [
      'Back Squat',
      'Leg Press',
      'Hack Squat',
      'Leg Extension',
      'Lying Leg Curl',
      'Walking Lunge',
    ],
    description: 'High-volume strength-focused leg day inspired by Ronnie Coleman.',
  },
];
