'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { fetchExerciseDetailApi } from '@/lib/api/client';
import type { ExerciseDetail } from '@/lib/api/types';
import { ui } from '@/lib/ui-styles';

export default function ExerciseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [exercise, setExercise] = useState<ExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchExerciseDetailApi(id)
      .then(setExercise)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: ui.gap,
          paddingTop: 16,
          paddingBottom: 24,
        }}
      >
        <div style={{ height: 40, background: ui.cardBg, borderRadius: ui.cardRadius, width: 120 }} />
        <div style={{ height: 200, background: ui.cardBg, borderRadius: ui.cardRadius, border: ui.cardBorder }} />
        <div style={{ height: 24, background: ui.cardBg, borderRadius: ui.cardRadius, width: '60%' }} />
        <div style={{ height: 120, background: ui.cardBg, borderRadius: ui.cardRadius, border: ui.cardBorder }} />
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <p style={{ color: '#EF4444', fontSize: 15, marginBottom: 16 }}>
          {error ?? 'Exercise not found'}
        </p>
        <button
          onClick={() => router.push('/exercises')}
          style={{
            background: 'none',
            border: 'none',
            color: ui.accent,
            fontSize: 15,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Back to Exercises
        </button>
      </div>
    );
  }

  const allMuscles = [
    ...exercise.primaryMuscles,
    ...exercise.secondaryMuscles,
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: ui.gap,
        paddingTop: 16,
        paddingBottom: 24,
      }}
    >
      <button
        onClick={() => router.push('/exercises')}
        style={{
          background: 'none',
          border: 'none',
          color: ui.textLabel,
          fontSize: 15,
          cursor: 'pointer',
          padding: '4px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          alignSelf: 'flex-start',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Exercises
      </button>

      <h1 style={{ color: ui.textPrimary, fontSize: 22, fontWeight: 800, margin: 0 }}>
        {exercise.name}
      </h1>

      <div
        style={{
          width: '100%',
          aspectRatio: '16/10',
          borderRadius: ui.cardRadius,
          overflow: 'hidden',
          background: ui.cardBg,
          border: ui.cardBorder,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {exercise.imageUrl ? (
          <img src={exercise.imageUrl} alt={exercise.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: ui.textMuted }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.5 6.5h11v11h-11z" />
              <circle cx="9" cy="9" r="1" />
              <path d="M17.5 17.5L14 13l-3 4-2-2-2.5 2.5" />
            </svg>
            <span style={{ fontSize: 13 }}>No image available</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {exercise.category && (
          <Badge label={exercise.category} bgColor="rgba(255,255,255,0.06)" textColor={ui.textLabel} bordered />
        )}
        {allMuscles.map((m) => (
          <Badge key={m} label={m} bgColor={ui.accentSoft} textColor={ui.accent} />
        ))}
        {exercise.equipment.map((eq) => (
          <Badge key={eq} label={eq} bgColor="rgba(59,130,246,0.12)" textColor="#3B82F6" />
        ))}
      </div>

      <div
        style={{
          background: ui.cardBg,
          border: ui.cardBorder,
          borderRadius: ui.cardRadius,
          padding: 18,
          boxShadow: ui.cardShadow,
        }}
      >
        <h3 style={{ color: ui.textPrimary, fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>
          How to Perform
        </h3>
        {exercise.instructions.length > 0 ? (
          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {exercise.instructions.map((step, i) => (
              <li key={i} style={{ color: ui.textLabel, fontSize: 14, lineHeight: 1.5 }}>
                {step}
              </li>
            ))}
          </ol>
        ) : (
          <p style={{ color: ui.textMuted, fontSize: 14, margin: 0, fontStyle: 'italic' }}>
            No instructions available for this exercise yet.
          </p>
        )}
      </div>

      {/* Quick facts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}
      >
        <FactCard label="Category" value={exercise.category ?? '—'} />
        <FactCard
          label="Muscles"
          value={
            allMuscles.length > 0
              ? allMuscles.slice(0, 3).join(', ')
              : '—'
          }
        />
        <FactCard
          label="Equipment"
          value={
            exercise.equipment.length > 0
              ? exercise.equipment.join(', ')
              : 'Bodyweight'
          }
        />
        <FactCard
          label="Type"
          value={exercise.measurementType.replace(/_/g, ' ')}
        />
      </div>
    </div>
  );
}

function Badge({
  label,
  bgColor,
  textColor,
  bordered,
}: {
  label: string;
  bgColor: string;
  textColor: string;
  bordered?: boolean;
}) {
  return (
    <span
      style={{
        backgroundColor: bgColor,
        color: textColor,
        fontSize: 12,
        fontWeight: 500,
        padding: '4px 10px',
        borderRadius: 8,
        border: bordered ? ui.cardBorder : 'none',
      }}
    >
      {label}
    </span>
  );
}

function FactCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: ui.cardBg,
        borderRadius: ui.cardRadius,
        border: ui.cardBorder,
        padding: 14,
      }}
    >
      <p style={{ color: ui.textMuted, fontSize: 12, fontWeight: 600, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </p>
      <p style={{ color: ui.textPrimary, fontSize: 14, fontWeight: 700, margin: 0, textTransform: 'capitalize' }}>
        {value}
      </p>
    </div>
  );
}
