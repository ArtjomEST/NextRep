type ChatRole = 'system' | 'user' | 'assistant';

export async function openaiChatCompletion(options: {
  messages: { role: ChatRole; content: string }[];
  model?: string;
  temperature?: number;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model ?? 'gpt-4o-mini',
      messages: options.messages,
      temperature: options.temperature ?? 0.65,
    }),
  });

  const json = (await res.json()) as {
    error?: { message?: string };
    choices?: { message?: { content?: string } }[];
  };

  if (!res.ok) {
    const msg = json.error?.message ?? `OpenAI error (${res.status})`;
    throw new Error(msg);
  }

  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('Empty response from OpenAI');
  }

  return text;
}
