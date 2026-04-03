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
        { role: 'system', content: 'You are Alex, a friendly fitness coach assistant for the NextRep app. Be concise, warm, and motivating. Plain text only.' },
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
          content: 'You are Alex, a fitness coach for the NextRep app. Write a well-formatted Telegram weekly fitness report using HTML formatting (bold with <b>tags</b>). Be specific, professional, and actionable. Use relevant emojis naturally.',
        },
        {
          role: 'user',
          content: `Write a weekly fitness report for ${firstName}.

Stats:
- Workouts completed: ${workoutsThisWeek}
- Total volume: ${volumeStr}
- Overworked muscles: ${overworkedList}
- Well-trained muscles: ${normalList}
- Untrained muscles: ${underworkedList}
- Push/pull balance: ${analysis.pushPullLabel} (push workouts: ${analysis.pushWorkouts}, pull workouts: ${analysis.pullWorkouts})
- Balance note: ${balanceNote}

Format the report with:
1. A greeting ("Hey ${firstName}, this is Alex 👋")
2. Weekly summary (workouts + volume)
3. Muscle balance section with specific observations
4. 2-3 concrete exercise recommendations for next week to address imbalances
5. A closing motivational line

Use <b>bold</b> for section headers. Keep it scannable in Telegram. Total length: ~250-300 words.`,
        },
      ],
      maxTokens: 400,
      temperature: 0.7,
    });

    return text.replace(/<br\s*\/?>/gi, '\n');
  } catch {
    // Template fallback
    return `Hey ${firstName}, this is Alex 👋

<b>📊 Weekly Summary</b>
Workouts: ${workoutsThisWeek} | Volume: ${volumeStr}

<b>💪 Muscle Balance</b>
🔴 Overworked: ${overworkedList}
🟡 Well-trained: ${normalList}
🔵 Needs attention: ${underworkedList}

<b>⚖️ Push/Pull Balance</b>
${balanceNote}

<b>📝 Recommendations for Next Week</b>
• Focus on undertrained muscle groups
• Aim for balanced push/pull sessions
• Keep up the consistency!

Great work this week — see you next Sunday 💪`;
  }
}
