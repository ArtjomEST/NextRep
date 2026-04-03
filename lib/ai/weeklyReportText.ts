import { openaiChatCompletion } from './openai';
import type { MuscleAnalysisResult } from '@/lib/utils/weeklyMuscleAnalysis';

export interface FreeReportInput {
  firstName: string;
  workoutsThisWeek: number;
  targetDaysPerWeek: number | null;
}

export interface ProReportInput {
  firstName: string;
  workoutsThisWeek: number;
  totalVolumeKg: number;
  analysis: MuscleAnalysisResult;
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

/**
 * Generates a detailed muscle balance report for PRO users.
 * Falls back to a structured template if OpenAI fails.
 */
export async function generateProReportText(input: ProReportInput): Promise<string> {
  const { firstName, workoutsThisWeek, totalVolumeKg, analysis } = input;

  const overworkedList = analysis.overworkedMuscles.join(', ') || 'none';
  const underworkedList = analysis.underworkedMuscles.join(', ') || 'none';
  const normalList = analysis.normalMuscles.join(', ') || 'none';
  const volumeStr = totalVolumeKg > 0 ? `${Math.round(totalVolumeKg).toLocaleString()} kg` : 'N/A';

  let balanceNote = '';
  if (analysis.pushPullLabel === 'push-heavy') {
    balanceNote = 'Your training is push-heavy this week. Add more pulling movements (rows, pull-ups) to balance it out.';
  } else if (analysis.pushPullLabel === 'pull-heavy') {
    balanceNote = 'Your training is pull-heavy this week. Adding more pressing work next week will help maintain balance.';
  } else {
    balanceNote = 'Your push/pull balance looks good this week.';
  }

  try {
    const text = await openaiChatCompletion({
      messages: [
        {
          role: 'system',
          content: 'You are Alex, a fitness coach for the NextRep app. Write a weekly fitness report as plain text. Use NO markdown formatting. No **bold**, no *italic*, no bullet points with dashes, no numbered lists with dots. Use emojis as visual separators instead. Plain text only.',
        },
        {
          role: 'user',
          content: `Write a weekly fitness report for ${firstName}.

Stats:
Workouts completed: ${workoutsThisWeek}
Total volume: ${volumeStr}
Overworked muscles: ${overworkedList}
Well-trained muscles: ${normalList}
Untrained muscles: ${underworkedList}
Push/pull balance: ${analysis.pushPullLabel} (push workouts: ${analysis.pushWorkouts}, pull workouts: ${analysis.pullWorkouts})
Balance note: ${balanceNote}

Format the report exactly like this example (plain text, emojis only for structure):

Hey ${firstName}, this is Alex 👋

This week you completed X workout(s) with a total volume of Y kg 💪

💪 Well-trained: [muscles]
🔴 Overworked: [muscles]
😴 Untrained: [muscles]

[One sentence about push/pull balance.]

🏋️ Recommendations for next week:
[Exercise name] — [benefit], [sets x reps]
[Exercise name] — [benefit], [sets x reps]

[One closing motivational line with emoji]

No dashes, no asterisks, no numbered lists. Plain text only.`,
        },
      ],
      maxTokens: 400,
      temperature: 0.7,
    });

    return text.replace(/<br\s*\/?>/gi, '\n');
  } catch {
    // Template fallback
    return `Hey ${firstName}, this is Alex 👋

This week you completed ${workoutsThisWeek} workout(s) with a total volume of ${volumeStr} 💪

💪 Well-trained: ${normalList}
🔴 Overworked: ${overworkedList}
😴 Untrained: ${underworkedList}

${balanceNote}

🏋️ Recommendations for next week:
Focus on undertrained muscle groups with compound movements.
Aim for balanced push/pull sessions next week.

Keep it up — progress takes time! 🚀`;
  }
}
