import { getAuthHeaders } from '@/lib/auth/client';

export async function downloadWorkoutPdf(workoutId: string): Promise<void> {
  const res = await fetch(`/api/workouts/${workoutId}/export`, {
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(json.error ?? `Export failed: ${res.status}`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nextrep-workout.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
