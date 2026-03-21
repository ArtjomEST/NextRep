export const EXERCISE_ADD_KEYWORDS = [
  'add',
  'include',
  'try adding',
  'consider adding',
  'incorporate',
  'suggest adding',
  'recommend adding',
  'you should add',
  'добавь',
  'добавить',
  'включи',
  'попробуй добавить',
  'рекомендую добавить',
] as const;

export function replyHasExerciseAddSuggestions(reply: string): boolean {
  const lower = reply.toLowerCase();
  return EXERCISE_ADD_KEYWORDS.some((k) => lower.includes(k));
}

/** Prompt for extracting recommended exercise names from a coach reply (second OpenAI call). */
export function buildExtractExercisesPrompt(reply: string): string {
  const safe = reply.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `From this fitness coach response, extract ONLY the exercise names that are being recommended to add. 
Return ONLY a JSON object with a single key "exercises" whose value is an array of strings, like: {"exercises":["Bench Press", "Cable Fly"]}
If no specific exercises are mentioned, return: {"exercises":[]}

Response: "${safe}"`;
}
