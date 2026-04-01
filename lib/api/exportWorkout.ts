import { getAuthHeaders } from '@/lib/auth/client';

export async function sendWorkoutPdfToBot(workoutId: string): Promise<void> {
  const res = await fetch(`/api/workouts/${workoutId}/send-pdf`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(json.error ?? `Send failed: ${res.status}`);
  }
}
