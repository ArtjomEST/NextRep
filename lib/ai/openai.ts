type ChatRole = 'system' | 'user' | 'assistant';

export async function openaiChatCompletion(options: {
  messages: { role: ChatRole; content: string }[];
  model?: string;
  temperature?: number;
}): Promise<string> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const { messages } = options;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: options.model ?? 'gpt-4o-mini',
      messages,
      max_tokens: 500,
      ...(options.temperature !== undefined && {
        temperature: options.temperature,
      }),
    }),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => ({}))) as {
      error?: { message?: string };
    };
    throw new Error(
      `OpenAI error: ${err.error?.message || response.statusText}`,
    );
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error('Empty response from OpenAI');
  }

  return text;
}
