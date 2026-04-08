/**
 * Dev endpoint to test weekly PRO report generation and sending.
 *
 * Protected by x-dev-secret header matching DEV_SECRET env var.
 * Hardcoded to process user with telegram_user_id = '951560156'
 * Runs the exact same logic as the real weekly cron endpoint.
 *
 * Setup:
 *   1. Set DEV_SECRET env var in Vercel (or locally in .env.local)
 *   2. Call endpoint with x-dev-secret header
 *
 * Usage:
 *   curl -X POST https://your-app.vercel.app/api/dev/test-weekly-report \
 *     -H "x-dev-secret: <DEV_SECRET>"
 */

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users, userProfiles, workouts, workoutExercises, exercises } from '@/lib/db/schema';
import { and, eq, gte, isNotNull } from 'drizzle-orm';
import { analyzeMuscleBalance } from '@/lib/utils/weeklyMuscleAnalysis';
import { generateMuscleMapPng } from '@/lib/utils/muscleMapSvg';
import { generateProReportText } from '@/lib/ai/weeklyReportText';
import type { ExerciseHistoryEntry } from '@/lib/ai/weeklyReportText';
import { sendWeeklyReportPro } from '@/lib/telegram/notify';

const DEV_SECRET = process.env.DEV_SECRET;

export async function POST(req: Request) {
  // Security: x-dev-secret header must match DEV_SECRET env var
  if (!DEV_SECRET) {
    return NextResponse.json(
      { error: 'DEV_SECRET env var not configured' },
      { status: 500 },
    );
  }

  const secret = req.headers.get('x-dev-secret');
  if (secret !== DEV_SECRET) {
    return NextResponse.json(
      { error: 'Invalid or missing x-dev-secret header' },
      { status: 401 },
    );
  }

  const db = getDb();
  const HARDCODED_TELEGRAM_USER_ID = '951560156';

  try {
    // ── 1. Fetch the hardcoded user ────────────────────────────────────────────
    const [user] = await db
      .select({
        userId: users.id,
        telegramUserId: users.telegramUserId,
        firstName: users.firstName,
        trainingDaysPerWeek: userProfiles.trainingDaysPerWeek,
        isPro: userProfiles.isPro,
        proExpiresAt: userProfiles.proExpiresAt,
        trialEndsAt: userProfiles.trialEndsAt,
      })
      .from(users)
      .innerJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(eq(users.telegramUserId, HARDCODED_TELEGRAM_USER_ID));

    if (!user) {
      return NextResponse.json(
        { error: `User with telegram_user_id '${HARDCODED_TELEGRAM_USER_ID}' not found` },
        { status: 404 },
      );
    }

    // ── 2. Check if user is effectively PRO ─────────────────────────────────────
    const now = new Date();
    const pro =
      (user.trialEndsAt && user.trialEndsAt > now) ||
      (user.isPro && (!user.proExpiresAt || user.proExpiresAt > now));

    if (!pro) {
      return NextResponse.json(
        {
          error: 'User is not PRO',
          message: 'Test endpoint expects a PRO user for proper testing',
        },
        { status: 400 },
      );
    }

    // ── 3. Fetch this week's workouts ──────────────────────────────────────────
    // Calculate week start (Monday UTC)
    const weekStart = getWeekStart();
    const weekStartDate = new Date(weekStart + 'T00:00:00Z');

    const workoutRows = await db
      .select({
        workoutId: workouts.id,
        totalVolume: workouts.totalVolume,
        primaryMuscles: exercises.primaryMuscles,
      })
      .from(workouts)
      .innerJoin(workoutExercises, eq(workoutExercises.workoutId, workouts.id))
      .innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
      .where(
        and(
          eq(workouts.userId, user.userId),
          gte(workouts.endedAt, weekStartDate),
          isNotNull(workouts.endedAt),
        ),
      );

    // Dedupe by workoutId for workout count and total volume
    const workoutMap = new Map<string, number>();
    for (const row of workoutRows) {
      if (!workoutMap.has(row.workoutId)) {
        workoutMap.set(row.workoutId, parseFloat(row.totalVolume ?? '0'));
      }
    }
    const workoutsThisWeek = workoutMap.size;
    const totalVolumeKg = [...workoutMap.values()].reduce((sum, v) => sum + v, 0);

    // ── 4. Analyze muscle balance ──────────────────────────────────────────────
    const analysis = analyzeMuscleBalance(
      workoutRows.map((r) => ({
        workoutId: r.workoutId,
        primaryMuscles: r.primaryMuscles,
      })),
    );

    // ── 5. Fetch exercise history (last 4 weeks) ───────────────────────────────
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    const historyRows = await db
      .selectDistinctOn([exercises.name], {
        exerciseName: exercises.name,
        primaryMuscles: exercises.primaryMuscles,
      })
      .from(workoutExercises)
      .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
      .innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
      .where(
        and(
          eq(workouts.userId, user.userId),
          gte(workouts.endedAt, fourWeeksAgo),
          isNotNull(workouts.endedAt),
        ),
      )
      .orderBy(exercises.name);

    const exerciseHistory: ExerciseHistoryEntry[] = historyRows
      .filter((r) => r.primaryMuscles && r.primaryMuscles.length > 0)
      .map((r) => ({ exerciseName: r.exerciseName, primaryMuscles: r.primaryMuscles! }));

    // ── 6. Generate report and muscle map ───────────────────────────────────────
    const firstName = user.firstName ?? 'there';
    const [reportResult, pngBuffer] = await Promise.all([
      generateProReportText({
        firstName,
        workoutsThisWeek,
        totalVolumeKg,
        analysis,
        exerciseHistory,
      }),
      generateMuscleMapPng(analysis.muscleStatuses),
    ]);

    // ── 7. Send via Telegram ───────────────────────────────────────────────────
    const sent = await sendWeeklyReportPro(
      user.telegramUserId!,
      reportResult.text,
      reportResult.caption,
      pngBuffer,
    );

    if (!sent) {
      return NextResponse.json(
        {
          error: 'Failed to send report via Telegram',
          message: 'Check TELEGRAM_BOT_TOKEN or telegram_user_id might be dev_*',
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Weekly PRO report generated and sent successfully',
      user: {
        userId: user.userId,
        telegramUserId: user.telegramUserId,
        firstName,
      },
      stats: {
        weekStart,
        workoutsThisWeek,
        totalVolumeKg,
        overworkedMuscles: analysis.overworkedMuscles,
        underworkedMuscles: analysis.underworkedMuscles,
        normalMuscles: analysis.normalMuscles,
        pushPullLabel: analysis.pushPullLabel,
      },
      reportPreview: {
        textLength: reportResult.text.length,
        caption: reportResult.caption,
      },
    });
  } catch (error) {
    console.error('[test-weekly-report] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

/** Returns YYYY-MM-DD string for the Monday (UTC) of the current week. */
function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 1=Mon, …, 6=Sat
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setUTCDate(now.getUTCDate() - daysToMonday);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10); // 'YYYY-MM-DD'
}
