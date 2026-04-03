/**
 * Weekly Fitness Report cron endpoint.
 *
 * Triggered every Sunday at 19:00 Europe/Tallinn via cron-job.org.
 * Protected by x-cron-secret header (same pattern as /api/timer/cron).
 *
 * Setup on cron-job.org:
 *   URL: GET https://next-rep-eta.vercel.app/api/cron/weekly-report
 *   Schedule: 0 19 * * 0  (timezone: Europe/Tallinn)
 *   Header: x-cron-secret: <CRON_SECRET env var value>
 */

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { users, userProfiles, workouts, workoutExercises, exercises, weeklyReports } from '@/lib/db/schema';
import { and, eq, gte, isNotNull, isNull } from 'drizzle-orm';
import { analyzeMuscleBalance } from '@/lib/utils/weeklyMuscleAnalysis';
import { generateMuscleMapPng } from '@/lib/utils/muscleMapSvg';
import { generateFreeReportText, generateProReportText } from '@/lib/ai/weeklyReportText';
import { sendWeeklyReportFree, sendWeeklyReportPro } from '@/lib/telegram/notify';

export const maxDuration = 300;

const MINI_APP_URL = process.env.NEXTREP_WEBAPP_URL
  ? `${process.env.NEXTREP_WEBAPP_URL}/account`
  : 'https://next-rep-eta.vercel.app/account';

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

function isEffectivelyPro(profile: {
  isPro: boolean;
  proExpiresAt: Date | null;
  trialEndsAt: Date | null;
}): boolean {
  const now = new Date();
  if (profile.trialEndsAt && profile.trialEndsAt > now) return true;
  return profile.isPro && (!profile.proExpiresAt || profile.proExpiresAt > now);
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function GET(req: Request) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const weekStart = getWeekStart();
  const weekStartDate = new Date(weekStart + 'T00:00:00Z');

  // ── 1. Fetch all eligible users not yet sent this week ──────────────────────
  const eligibleUsers = await db
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
    .leftJoin(
      weeklyReports,
      and(
        eq(weeklyReports.userId, users.id),
        eq(weeklyReports.weekStart, weekStart),
      ),
    )
    .where(
      and(
        isNotNull(users.telegramUserId),
        eq(userProfiles.onboardingCompleted, true),
        isNull(weeklyReports.id),
      ),
    );

  let processed = 0;
  let errors = 0;

  // ── 2. Process in batches of 25 ────────────────────────────────────────────
  const BATCH_SIZE = 25;
  for (let i = 0; i < eligibleUsers.length; i += BATCH_SIZE) {
    const batch = eligibleUsers.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (user) => {
        try {
          const tgId = user.telegramUserId!;
          const firstName = user.firstName ?? 'there';
          const pro = isEffectivelyPro({
            isPro: user.isPro,
            proExpiresAt: user.proExpiresAt,
            trialEndsAt: user.trialEndsAt,
          });

          // ── Query this week's workouts ──────────────────────────────────────
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

          // ── Send report ────────────────────────────────────────────────────
          let sent = false;

          if (pro) {
            const analysis = analyzeMuscleBalance(
              workoutRows.map((r) => ({
                workoutId: r.workoutId,
                primaryMuscles: r.primaryMuscles,
              })),
            );

            const [reportText, pngBuffer] = await Promise.all([
              generateProReportText({ firstName, workoutsThisWeek, totalVolumeKg, analysis }),
              generateMuscleMapPng(analysis.muscleStatuses),
            ]);

            sent = await sendWeeklyReportPro(tgId, firstName, reportText, pngBuffer);
          } else {
            const reportText = await generateFreeReportText({
              firstName,
              workoutsThisWeek,
              targetDaysPerWeek: user.trainingDaysPerWeek,
            });

            const upsellLine = '\n\nGet a detailed muscle balance analysis and personalized recommendations with NextRep PRO 💪';
            sent = await sendWeeklyReportFree(tgId, reportText + upsellLine, MINI_APP_URL);
          }

          if (sent) {
            await db.insert(weeklyReports).values({
              userId: user.userId,
              weekStart,
            });
            processed++;
          }
        } catch (err) {
          console.error(`[weekly-report] Failed for user ${user.userId}:`, err);
          errors++;
        }
      }),
    );

    // Rate-limit: pause between batches to stay well within Telegram's 30 msg/sec limit
    if (i + BATCH_SIZE < eligibleUsers.length) {
      await sleep(100);
    }
  }

  return NextResponse.json({ ok: true, processed, errors, weekStart });
}
