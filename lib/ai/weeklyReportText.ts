import { openaiChatCompletion } from './openai';
import type { MuscleAnalysisResult } from '@/lib/utils/weeklyMuscleAnalysis';

export interface FreeReportInput {
  firstName: string;
  workoutsThisWeek: number;
  targetDaysPerWeek: number | null;
}

export interface ExerciseHistoryEntry {
  exerciseName: string;
  primaryMuscles: string[];
}

export interface ProReportInput {
  firstName: string;
  workoutsThisWeek: number;
  totalVolumeKg: number;
  analysis: MuscleAnalysisResult;
  /** Distinct exercises the user has done in the last 4 weeks, grouped by muscle */
  exerciseHistory: ExerciseHistoryEntry[];
}

export interface ProReportResult {
  text: string;
  caption: string;
}

/**
 * Generates a short motivational message for free users.
 * Falls back to a template if OpenAI fails.
 */
export async function generateFreeReportText(input: FreeReportInput): Promise<string> {
  const { firstName, workoutsThisWeek, targetDaysPerWeek } = input;
  const target = targetDaysPerWeek ?? 3;
  const hitGoal = workoutsThisWeek >= target;

  try {
    const prompt = hitGoal
      ? `Write a short 2-3 sentence motivational Telegram message for a fitness app user named ${firstName}. They completed ${workoutsThisWeek} workouts this week and hit their goal of ${target}. Congratulate them warmly but concisely. No emojis except at the start. Start with "Hey ${firstName}," then Alex's message.`
      : `Write a short 2-3 sentence motivational Telegram message for a fitness app user named ${firstName}. They completed ${workoutsThisWeek} out of their ${target} planned workouts this week. Encourage them for next week in a friendly, honest tone. No emojis except at the start. Start with "Hey ${firstName}," then Alex's message.`;

    const text = await openaiChatCompletion({
      messages: [
        { role: 'system', content: 'You are Alex, a friendly fitness coach assistant for the NextRep app. Be concise, warm, and motivating. Use NO markdown formatting. No **bold**, no *italic*, no bullet points with dashes, no numbered lists. Use emojis as visual separators instead. Plain text only.' },
        { role: 'user', content: prompt },
      ],
      maxTokens: 120,
      temperature: 0.8,
    });

    return text.replace(/<br\s*\/?>/gi, '\n');
  } catch {
    // Template fallback
    if (hitGoal) {
      return `Hey ${firstName}, this is Alex 👋\n\nYou crushed it this week — ${workoutsThisWeek}/${target} workouts done! That consistency is what builds real results. Keep it up next week!`;
    }
    return `Hey ${firstName}, this is Alex 👋\n\nYou got ${workoutsThisWeek} out of ${target} workouts in this week. No worries — next week is a fresh start. Let's lock in those sessions early!`;
  }
}

/** Build a muscle → exercise names mapping from history */
function buildMuscleExerciseMap(history: ExerciseHistoryEntry[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const entry of history) {
    for (const muscle of entry.primaryMuscles) {
      if (!map[muscle]) map[muscle] = [];
      if (!map[muscle].includes(entry.exerciseName)) {
        map[muscle].push(entry.exerciseName);
      }
    }
  }
  return map;
}

/**
 * Generates a detailed muscle balance report for PRO users in a conversational coach style.
 * Also generates a short dynamic caption for the MuscleMap photo.
 * Falls back to a structured template if OpenAI fails.
 */
export async function generateProReportText(input: ProReportInput): Promise<ProReportResult> {
  const { firstName, workoutsThisWeek, totalVolumeKg, analysis, exerciseHistory } = input;

  const overworkedList = analysis.overworkedMuscles.join(', ') || 'none';
  const underworkedList = analysis.underworkedMuscles.join(', ') || 'none';
  const normalList = analysis.normalMuscles.join(', ') || 'none';
  const volumeStr = totalVolumeKg > 0 ? `${Math.round(totalVolumeKg).toLocaleString()} kg` : 'N/A';

  let balanceNote = '';
  if (analysis.pushPullLabel === 'push-heavy') {
    balanceNote = 'Push-heavy this week — needs more pulling movements.';
  } else if (analysis.pushPullLabel === 'pull-heavy') {
    balanceNote = 'Pull-heavy this week — could use more pressing work.';
  } else {
    balanceNote = 'Push/pull balance is solid.';
  }

  const muscleExerciseMap = buildMuscleExerciseMap(exerciseHistory);

  // Build exercise history context for the AI
  const historyLines: string[] = [];
  for (const [muscle, exNames] of Object.entries(muscleExerciseMap)) {
    historyLines.push(`${muscle}: ${exNames.slice(0, 5).join(', ')}`);
  }
  const historyBlock = historyLines.length > 0
    ? `\nExercises the user has done in the last 4 weeks (by muscle group):\n${historyLines.join('\n')}`
    : '\nNo exercise history from the last 4 weeks.';

  try {
    const text = await openaiChatCompletion({
      messages: [
        {
          role: 'system',
          content: `You are Alex, a friendly and slightly casual fitness coach. You write like you're texting a friend who trains — warm, direct, motivating. You use emojis naturally but not on every line. You vary your sentence structure so you never sound like a template. You NEVER use markdown formatting: no **bold**, no *italic*, no bullet points with dashes, no numbered lists, no section headers. Plain flowing text only, separated by line breaks.`,
        },
        {
          role: 'user',
          content: `Write a weekly fitness report for ${firstName}. Express everything naturally as flowing text — like a coach talking, not a program printout.

Stats this week:
Workouts: ${workoutsThisWeek}
Total volume: ${volumeStr}
Well-trained muscles: ${normalList}
Overworked muscles: ${overworkedList}
Undertrained muscles: ${underworkedList}
Balance: ${balanceNote}
${historyBlock}

Structure (express naturally, NOT as rigid sections):

1) Opening: energetic, specific to their week. Not "you completed X workouts" — something like "Solid week — you showed up 3 times and put in real work." Make it feel personal.

2) Muscle balance: 1-2 sentences about what got trained well, woven naturally into the flow.

3) Overworked muscles: if any, casual callout with a reason to back off. Use one of these emojis contextually: 🔴 or 🥵 or ⚠️

4) Undertrained muscles: if any, call it out conversationally. Use one of these emojis contextually: 😴 or 👀 or 💤

5) Recommendations (use one of: 🎯 or 💡 or 🏋️):
- FIRST PRIORITY: suggest exercises the user has actually done before (from the history above) that target the undertrained muscles. Frame as progression or variation.
- SECOND PRIORITY: if no history exists for an undertrained muscle group, suggest one simple well-known exercise.
- Write as flowing sentences, not a bullet list.

6) End with a short motivational closer.

Start with "Hey ${firstName}," — keep it under 600 tokens. Plain text only, no markdown.

ALSO: After the report, on a new line write CAPTION: followed by a short punchy photo caption (under 100 chars) for a muscle map image. Vary it each time — something like "Here's how your muscles balanced out this week 👇" or "Your muscle map this week 💪" etc.`,
        },
      ],
      maxTokens: 650,
      temperature: 0.8,
    });

    const cleaned = text.replace(/<br\s*\/?>/gi, '\n');

    // Extract caption from the response
    const captionMatch = cleaned.match(/CAPTION:\s*(.+)/i);
    let caption = captionMatch?.[1]?.trim() ?? '';
    const reportText = cleaned.replace(/\n*CAPTION:\s*.+/i, '').trim();

    // Ensure caption is under 100 chars
    if (!caption || caption.length > 100) {
      caption = `${firstName}'s muscle balance this week 💪`;
    }

    return { text: reportText, caption };
  } catch {
    // Template fallback
    const text = `Hey ${firstName}, this is Alex 👋

Solid effort this week — ${workoutsThisWeek} workout${workoutsThisWeek !== 1 ? 's' : ''} logged with ${volumeStr} total volume.

Your ${normalList !== 'none' ? normalList : 'training'} work looked good this week. ${balanceNote}

${overworkedList !== 'none' ? `🔴 ${overworkedList} got hit pretty hard — ease up a bit next week to let them recover properly.` : ''}

${underworkedList !== 'none' ? `😴 ${underworkedList} could use some love next week. Try adding a few sets targeting those areas.` : ''}

🎯 Focus on balancing things out next week and keep the momentum going.

You're building something real here — keep showing up! 🚀`;

    return {
      text: text.replace(/\n{3,}/g, '\n\n').trim(),
      caption: `${firstName}'s muscle balance this week 💪`,
    };
  }
}
