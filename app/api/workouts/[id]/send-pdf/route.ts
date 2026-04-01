import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import {
  workouts,
  workoutExercises,
  workoutSets,
  exercises,
  users,
} from '@/lib/db/schema';
import { eq, asc, inArray } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/auth/helpers';
import {
  buildWorkoutPdfBuffer,
  formatDatePdf,
  formatDurationPdf,
  type PdfExerciseRow,
  type PdfSetRow,
} from '@/lib/pdf/workoutPdf';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const db = getDb();
    const auth = await authenticateRequest(req);
    if (!auth) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    const [workout] = await db
      .select()
      .from(workouts)
      .where(eq(workouts.id, id))
      .limit(1);

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 });
    }
    if (workout.userId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [user] = await db
      .select({
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        telegramUserId: users.telegramUserId,
      })
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1);

    if (!user?.telegramUserId) {
      return NextResponse.json({ error: 'Telegram user ID not found' }, { status: 400 });
    }

    const userName = user.username
      ? `@${user.username}`
      : [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';

    const weRows = await db
      .select({
        weId: workoutExercises.id,
        exerciseName: exercises.name,
        category: exercises.category,
        primaryMuscles: exercises.primaryMuscles,
        secondaryMuscles: exercises.secondaryMuscles,
        measurementType: exercises.measurementType,
        order: workoutExercises.order,
        status: workoutExercises.status,
      })
      .from(workoutExercises)
      .innerJoin(exercises, eq(workoutExercises.exerciseId, exercises.id))
      .where(eq(workoutExercises.workoutId, id))
      .orderBy(asc(workoutExercises.order));

    const weIds = weRows.map((r) => r.weId);
    const setsMap = new Map<string, PdfSetRow[]>();

    if (weIds.length > 0) {
      const allSets = await db
        .select({
          workoutExerciseId: workoutSets.workoutExerciseId,
          setIndex: workoutSets.setIndex,
          weight: workoutSets.weight,
          reps: workoutSets.reps,
          seconds: workoutSets.seconds,
          completed: workoutSets.completed,
        })
        .from(workoutSets)
        .where(inArray(workoutSets.workoutExerciseId, weIds))
        .orderBy(asc(workoutSets.setIndex));

      for (const s of allSets) {
        const arr = setsMap.get(s.workoutExerciseId) ?? [];
        arr.push({
          setIndex: s.setIndex,
          weight: s.weight != null ? Number(s.weight) : null,
          reps: s.reps,
          seconds: s.seconds,
          completed: s.completed,
        });
        setsMap.set(s.workoutExerciseId, arr);
      }
    }

    const exRows: PdfExerciseRow[] = weRows.map((r) => ({
      weId: r.weId,
      exerciseName: r.exerciseName,
      category: r.category,
      primaryMuscles: Array.isArray(r.primaryMuscles) ? (r.primaryMuscles as string[]) : [],
      secondaryMuscles: Array.isArray(r.secondaryMuscles) ? (r.secondaryMuscles as string[]) : [],
      measurementType: r.measurementType,
      order: r.order,
      status: r.status,
      sets: setsMap.get(r.weId) ?? [],
    }));

    const pdfBuffer = await buildWorkoutPdfBuffer({
      workoutName: workout.name,
      createdAt: workout.createdAt.toISOString(),
      startedAt: workout.startedAt?.toISOString() ?? null,
      durationSec: workout.durationSec,
      totalVolume: Number(workout.totalVolume ?? 0),
      totalSets: workout.totalSets ?? 0,
      notes: workout.notes,
      exercises: exRows,
      userName,
    });

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) {
      return NextResponse.json({ error: 'Bot token not configured' }, { status: 500 });
    }

    const dateStr = (workout.startedAt ?? workout.createdAt).toISOString().slice(0, 10);
    const caption = `${workout.name}\n${formatDatePdf(workout.startedAt?.toISOString() ?? workout.createdAt.toISOString())} · ${formatDurationPdf(workout.durationSec)}`;

    const formData = new FormData();
    formData.append('chat_id', user.telegramUserId);
    formData.append('caption', caption);
    formData.append(
      'document',
      new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' }),
      `nextrep-workout-${dateStr}.pdf`,
    );

    const tgRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
      { method: 'POST', body: formData },
    );

    if (!tgRes.ok) {
      const detail = await tgRes.text();
      console.error('Telegram sendDocument failed:', detail);
      return NextResponse.json(
        { error: 'Failed to send to Telegram', detail },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('POST /api/workouts/[id]/send-pdf error:', err);
    return NextResponse.json(
      { error: 'Failed to send PDF', message: String(err) },
      { status: 500 },
    );
  }
}
