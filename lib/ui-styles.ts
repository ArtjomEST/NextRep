/**
 * Shared dark emerald UI system (screenshot-accurate).
 * Use these across Home, History, Exercises, Account for consistency.
 */

export const ui = {
  /** Page background */
  bg: '#0E1114',

  /** Card: dark elevated surface */
  cardBg: 'linear-gradient(180deg, #1a2026 0%, #151b21 100%)',
  cardBorder: '1px solid rgba(255,255,255,0.06)',
  cardShadow: '0 2px 8px rgba(0,0,0,0.25)',
  cardRadius: 14,

  /** Hero: deep emerald gradient (use as layer only, not mixed with backgroundImage) */
  heroGradient: 'linear-gradient(145deg, #0f2e1f 0%, #143d28 40%, #165834 100%)',
  heroGlowOuter: 'radial-gradient(circle, rgba(180,220,190,0.15) 0%, rgba(80,160,120,0.06) 35%, transparent 60%)',
  heroGlowInner: 'radial-gradient(circle, rgba(200,240,210,0.08) 0%, transparent 55%)',

  /** Typography */
  textPrimary: '#f3f4f6',
  textMuted: 'rgba(255,255,255,0.42)',
  textLabel: 'rgba(255,255,255,0.5)',

  /** Accent */
  accent: 'rgba(34,197,94,0.95)',
  accentSoft: 'rgba(34,197,94,0.25)',

  /** Feedback */
  success: '#22C55E',
  error: '#EF4444',

  /** Section spacing */
  gap: 22,
  sectionGap: 14,
} as const;
