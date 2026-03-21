/** Shared between client (loading UI) and server (POST /api/ai/chat). */
export const PRESET_KEYWORDS = [
  // English
  'create preset',
  'make preset',
  'generate preset',
  'build preset',
  'create workout',
  'make workout',
  'generate workout',
  'build me a workout',
  'chest workout',
  'push day',
  'pull day',
  'leg day',
  'arm workout',
  'back workout',
  'shoulder workout',
  'full body',
  'upper body',
  'lower body',
  'abs workout',
  'core workout',
  'cardio workout',
  // Russian
  'составь',
  'создай',
  'сгенерируй',
  'придумай',
  'сделай мне',
  'пресет',
  'тренировку для',
  'план тренировки',
  'программу тренировок',
  'упражнения для',
  'день ног',
  'день груди',
  'день спины',
  'день плеч',
  'день рук',
  'на пресс',
  'кардио тренировку',
] as const;

export function isPresetIntentMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return PRESET_KEYWORDS.some((k) => lower.includes(k));
}
