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
  const handleActivate = () => {
    if (!applying) {
      onUsePreset(legend);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={applying ? 'Applying…' : `Use ${legend.name} preset`}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      style={{
        position: 'relative',
        borderRadius: 24,
        overflow: 'hidden',
        width: '100%',
        height: 240,
        cursor: applying ? 'wait' : 'pointer',
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

      {/* Layer 3: content – absolute left column, 8px grid, symmetric padding */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 24,
          width: '68%',
        }}
      >
        <div>
          <p
            style={{
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 600,
              margin: '0 0 8px',
              letterSpacing: '0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
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
              gap: 8,
              marginTop: 16,
              color: 'rgba(255,255,255,0.9)',
              fontSize: 12,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {legend.traits.map((t, i) => (
              <span
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
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

        <div
          style={{
            alignSelf: 'flex-start',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <span>Use this preset</span>
          <span>→</span>
        </div>
      </div>
    </div>
  );
}
