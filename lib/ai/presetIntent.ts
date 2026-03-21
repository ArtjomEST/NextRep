/** Shared between client (loading UI) and server (POST /api/ai/chat). */
export const PRESET_KEYWORDS = [
  'create preset',
  'make preset',
  'generate preset',
  'build preset',
  'create workout',
  'make workout',
  'generate workout',
  'build me a workout',
  'create a program',
  'make me a program',
  'chest workout',
  'push day',
  'pull day',
  'leg day',
  'arm workout',
  'back workout',
  'shoulder workout',
  'full body workout',
  'upper body',
  'lower body',
] as const;

export function isPresetIntentMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return PRESET_KEYWORDS.some((k) => lower.includes(k));
}
