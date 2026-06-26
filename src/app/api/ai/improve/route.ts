import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import logger from '@/lib/logger';
import { isMockApiKey, createSimulatedStreamResponse } from '@/lib/ai/simulation';

const requestSchema = z.object({
  text: z.string().min(1, 'Text is required').max(10000, 'Text too long'),
});

function generateSimulatedImprovement(text: string): string {
  let improved = text.trim();
  if (improved.length > 0) {
    improved = improved.charAt(0).toUpperCase() + improved.slice(1);
    if (!improved.endsWith('.') && !improved.endsWith('!') && !improved.endsWith('?')) {
      improved += '.';
    }
  }
  return improved;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    logger.info({ userId: session.user.id }, 'AI improve request');

    const apiKey = process.env.GROQ_API_KEY;
    if (isMockApiKey(apiKey)) {
      const improvedText = generateSimulatedImprovement(parsed.data.text);
      return createSimulatedStreamResponse(improvedText);
    }

    try {
      const groq = createGroq({ apiKey });
      const result = streamText({
        model: groq('llama3-70b-8192'),
        system: 'You are a professional editor. Improve the given text for grammar, clarity, flow, and conciseness. Return ONLY the improved text without any explanation, commentary, or formatting. Preserve the original meaning and tone.',
        prompt: `Improve the following text:\n\n${parsed.data.text}`,
        maxTokens: 2000,
        temperature: 0.4,
      });

      return result.toDataStreamResponse();
    } catch (apiError) {
      logger.warn({ error: apiError }, 'Groq API connection failed, falling back to simulated improve');
      const improvedText = generateSimulatedImprovement(parsed.data.text);
      return createSimulatedStreamResponse(improvedText);
    }
  } catch (error) {
    logger.error({ error }, 'AI improve error');
    return new Response('Internal server error', { status: 500 });
  }
}
