'use client';

import React from 'react';
import type { LegendWorkout } from '@/lib/legends/data';

/** Left ~50–55% solid emerald, smooth fade into image near center. */
const LEGEND_CARD_GRADIENT =
  'linear-gradient(90deg, #0b2a1d 0%, #0b2a1d 22%, rgba(11,42,29,0.95) 38%, rgba(11,42,29,0.6) 50%, rgba(11,42,29,0.2) 58%, transparent 65%)';

function TraitIcon({ icon }: { icon: 'target' | 'lightning' }) {
  if (icon === 'target') {
    return (
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    );
  }
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

interface LegendsWorkoutCardProps {
  legend: LegendWorkout;
  onUsePreset: (legend: LegendWorkout) => void;
  applying?: boolean;
}

export default function LegendsWorkoutCard({
  legend,
  onUsePreset,
  applying,
}: LegendsWorkoutCardProps) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 24,
        overflow: 'hidden',
        width: '100%',
        aspectRatio: '2 / 1',
        minHeight: 200,
        maxHeight: 240,
      }}
    >
      {/* Layer 1: image – object-cover, Arnold larger and right (82% center) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
        }}
      >
        <img
          src={legend.image}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '82% center',
            transform: 'scale(1.08)',
          }}
        />
      </div>

      {/* Layer 2: left gradient overlay (does not cover right side) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: LEGEND_CARD_GRADIENT,
          pointerEvents: 'none',
        }}
      />

      {/* Layer 3: content – 8px grid, equal padding all sides (24px) */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 24,
          maxWidth: '58%',
        }}
      >
        <div>
          {/* Tag pills: single line, no wrap */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              gap: 8,
              marginBottom: 16,
            }}
          >
            {legend.tags.map((tag, i) => (
              <span
                key={i}
                style={{
                  padding: '4px 9px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#f3f4f6',
                  background: i === 0 ? '#165834' : 'rgba(26,32,38,0.95)',
                  border: i === 0 ? '1px solid rgba(34,197,94,0.25)' : '1px solid rgba(255,255,255,0.06)',
                  whiteSpace: 'nowrap',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <p
            style={{
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              margin: '0 0 8px',
              letterSpacing: '0.01em',
            }}
          >
            {legend.name}
          </p>
          <h3
            style={{
              color: '#ffffff',
              fontSize: 'clamp(20px, 5.2vw, 26px)',
              fontWeight: 800,
              margin: 0,
              lineHeight: 1.18,
              letterSpacing: '-0.02em',
              textShadow: '0 1px 2px rgba(0,0,0,0.25)',
            }}
          >
            {legend.subtitle}
          </h3>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 16,
              color: 'rgba(255,255,255,0.9)',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {legend.traits.map((t, i) => (
              <span
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {i > 0 && (
                  <span
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.45)',
                      marginRight: 2,
                    }}
                  />
                )}
                {t.icon && <TraitIcon icon={t.icon} />}
                {t.label}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onUsePreset(legend)}
          disabled={applying}
          style={{
            alignSelf: 'flex-start',
            padding: '12px 20px',
            borderRadius: 12,
            border: 'none',
            background: '#ffffff',
            color: '#0E1114',
            fontSize: 15,
            fontWeight: 700,
            cursor: applying ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {applying ? 'Applying…' : 'Use this preset'}
          {!applying && (
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
