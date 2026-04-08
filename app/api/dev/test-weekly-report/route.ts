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
  console.log('[test-weekly-report] Request received');

  // Security: x-dev-secret header must match DEV_SECRET env var
  if (!DEV_SECRET) {
    console.error('[test-weekly-report] DEV_SECRET not configured');
    return NextResponse.json(
      { step: 'auth', error: 'DEV_SECRET env var not configured' },
      { status: 200 },
    );
  }

  const secret = req.headers.get('x-dev-secret');
  if (secret !== DEV_SECRET) {
    console.error('[test-weekly-report] Invalid secret header');
    return NextResponse.json(
      { step: 'auth', error: 'Invalid or missing x-dev-secret header' },
      { status: 200 },
    );
  }

  const db = getDb();
  const HARDCODED_TELEGRAM_USER_ID = '951560156';

  // ── 1. User lookup ────────────────────────────────────────────────────────────
  let user;
  try {
    console.log('[test-weekly-report] Step 1: Fetching user', HARDCODED_TELEGRAM_USER_ID);
    const result = await db
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

    user = result[0];
    if (!user) {
      console.warn('[test-weekly-report] User not found:', HARDCODED_TELEGRAM_USER_ID);
      return NextResponse.json(
        { step: 'user_lookup', error: `User not found: telegram_user_id=${HARDCODED_TELEGRAM_USER_ID}` },
        { status: 200 },
      );
    }
    console.log('[test-weekly-report] User found:', user.userId);
  } catch (error) {
    console.error('[test-weekly-report] Step 1 failed:', error);
    return NextResponse.json(
      {
        step: 'user_lookup',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 200 },
    );
  }

  // ── 2. Pro status check ───────────────────────────────────────────────────────
  let pro: boolean;
  try {
    console.log('[test-weekly-report] Step 2: Checking PRO status');
    const now = new Date();
    pro =
      (user.trialEndsAt && user.trialEndsAt > now) ||
      (user.isPro && (!user.proExpiresAt || user.proExpiresAt > now));

    if (!pro) {
      console.warn('[test-weekly-report] User is not PRO');
      return NextResponse.json(
        {
          step: 'pro_check',
          error: 'User is not PRO',
          isPro: user.isPro,
          proExpiresAt: user.proExpiresAt,
          trialEndsAt: user.trialEndsAt,
        },
        { status: 200 },
      );
    }
    console.log('[test-weekly-report] User is PRO');
  } catch (error) {
    console.error('[test-weekly-report] Step 2 failed:', error);
    return NextResponse.json(
      {
        step: 'pro_check',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 200 },
    );
  }

  // ── 3. Fetch this week's workouts ─────────────────────────────────────────────
  let workoutRows;
  let weekStart: string;
  let workoutsThisWeek: number;
  let totalVolumeKg: number;
  try {
    console.log('[test-weekly-report] Step 3: Fetching weekly workouts');
    weekStart = getWeekStart();
    const weekStartDate = new Date(weekStart + 'T00:00:00Z');
    console.log('[test-weekly-report] Week start:', weekStart);

    workoutRows = await db
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

    const workoutMap = new Map<string, number>();
    for (const row of workoutRows) {
      if (!workoutMap.has(row.workoutId)) {
        workoutMap.set(row.workoutId, parseFloat(row.totalVolume ?? '0'));
      }
    }
    workoutsThisWeek = workoutMap.size;
    totalVolumeKg = [...workoutMap.values()].reduce((sum, v) => sum + v, 0);
    console.log('[test-weekly-report] Workouts fetched:', { workoutsThisWeek, totalVolumeKg });
  } catch (error) {
    console.error('[test-weekly-report] Step 3 failed:', error);
    return NextResponse.json(
      {
        step: 'fetch_workouts',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 200 },
    );
  }

  // ── 4. Analyze muscle balance ─────────────────────────────────────────────────
  let analysis;
  try {
    console.log('[test-weekly-report] Step 4: Analyzing muscle balance');
    analysis = analyzeMuscleBalance(
      workoutRows.map((r) => ({
        workoutId: r.workoutId,
        primaryMuscles: r.primaryMuscles,
      })),
    );
    console.log('[test-weekly-report] Analysis complete:', {
      normal: analysis.normalMuscles.length,
      overworked: analysis.overworkedMuscles.length,
      underworked: analysis.underworkedMuscles.length,
    });
  } catch (error) {
    console.error('[test-weekly-report] Step 4 failed:', error);
    return NextResponse.json(
      {
        step: 'muscle_analysis',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 200 },
    );
  }

  // ── 5. Fetch exercise history ─────────────────────────────────────────────────
  let exerciseHistory: ExerciseHistoryEntry[];
  try {
    console.log('[test-weekly-report] Step 5: Fetching exercise history');
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

    exerciseHistory = historyRows
      .filter((r) => r.primaryMuscles && r.primaryMuscles.length > 0)
      .map((r) => ({ exerciseName: r.exerciseName, primaryMuscles: r.primaryMuscles! }));

    console.log('[test-weekly-report] Exercise history fetched:', exerciseHistory.length, 'exercises');
  } catch (error) {
    console.error('[test-weekly-report] Step 5 failed:', error);
    return NextResponse.json(
      {
        step: 'fetch_exercise_history',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 200 },
    );
  }

  // ── 6. Generate report text ───────────────────────────────────────────────────
  let reportResult;
  try {
    console.log('[test-weekly-report] Step 6: Generating report text');
    const firstName = user.firstName ?? 'there';
    reportResult = await generateProReportText({
      firstName,
      workoutsThisWeek,
      totalVolumeKg,
      analysis,
      exerciseHistory,
    });
    console.log('[test-weekly-report] Report generated:', {
      textLength: reportResult.text.length,
      captionLength: reportResult.caption.length,
    });
  } catch (error) {
    console.error('[test-weekly-report] Step 6 failed:', error);
    return NextResponse.json(
      {
        step: 'generate_report_text',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 200 },
    );
  }

  // ── 7. Generate muscle map PNG ────────────────────────────────────────────────
  let pngBuffer: Buffer;
  try {
    console.log('[test-weekly-report] Step 7: Generating muscle map PNG');
    pngBuffer = await generateMuscleMapPng(analysis.muscleStatuses);
    console.log('[test-weekly-report] PNG generated:', pngBuffer.length, 'bytes');
  } catch (error) {
    console.error('[test-weekly-report] Step 7 failed:', error);
    return NextResponse.json(
      {
        step: 'generate_muscle_map',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 200 },
    );
  }

  // ── 8. Send via Telegram ──────────────────────────────────────────────────────
  try {
    console.log('[test-weekly-report] Step 8: Sending via Telegram');
    const sent = await sendWeeklyReportPro(
      user.telegramUserId!,
      reportResult.text,
      reportResult.caption,
      pngBuffer,
    );

    if (!sent) {
      console.error('[test-weekly-report] Telegram send returned false');
      return NextResponse.json(
        {
          step: 'telegram_send',
          error: 'sendWeeklyReportPro returned false',
          message: 'Check TELEGRAM_BOT_TOKEN env var or telegram_user_id may start with dev_',
        },
        { status: 200 },
      );
    }

    console.log('[test-weekly-report] Success! Report sent via Telegram');
    return NextResponse.json({
      ok: true,
      step: 'complete',
      message: 'Weekly PRO report generated and sent successfully',
      user: {
        userId: user.userId,
        telegramUserId: user.telegramUserId,
        firstName: user.firstName,
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
        captionLength: reportResult.caption.length,
        caption: reportResult.caption,
      },
    });
  } catch (error) {
    console.error('[test-weekly-report] Step 8 failed:', error);
    return NextResponse.json(
      {
        step: 'telegram_send',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 200 },
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
