'use client';

import dynamic from 'next/dynamic';
import type { MuscleMapProps } from '@/components/MuscleMap';

const MuscleMap = dynamic(() => import('@/components/MuscleMap'), {
  ssr: false,
  loading: () => null,
});

export default function MuscleMapLazy(props: MuscleMapProps) {
  return <MuscleMap {...props} />;
}
