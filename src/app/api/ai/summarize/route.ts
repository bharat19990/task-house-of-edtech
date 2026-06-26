import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import logger from '@/lib/logger';
import { isMockApiKey, createSimulatedStreamResponse } from '@/lib/ai/simulation';

const requestSchema = z.object({
  content: z.string().min(1, 'Content is required').max(50000, 'Content too long'),
});

function generateSimulatedSummary(content: string): string {
  const cleanText = content.replace(/<[^>]*>/g, '').trim();
  if (!cleanText) return 'The document is currently empty.';
  const sentences = cleanText.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
  if (sentences.length <= 3) {
    return `Summary: ${cleanText} (Note: Generated locally as a fallback).`;
  }
  const first = sentences[0];
  const middle = sentences[Math.floor(sentences.length / 2)];
  const last = sentences[sentences.length - 1];
  return `This document focuses on "${first}." In the middle, it discusses "${middle}." It concludes by noting "${last}." (Note: Generated locally as a fallback).`;
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

    logger.info({ userId: session.user.id }, 'AI summarize request');

    const apiKey = process.env.GROQ_API_KEY;
    if (isMockApiKey(apiKey)) {
      const summaryText = generateSimulatedSummary(parsed.data.content);
      return createSimulatedStreamResponse(summaryText);
    }

    try {
      const groq = createGroq({ apiKey });
      const result = streamText({
        model: groq('llama3-70b-8192'),
        system: 'You are a skilled summarizer. Provide a concise 3-5 sentence summary of the given text. Focus on the main ideas, key arguments, and conclusions. Be clear and direct.',
        prompt: `Summarize the following document:\n\n${parsed.data.content}`,
        maxTokens: 500,
        temperature: 0.3,
      });

      return result.toDataStreamResponse();
    } catch (apiError) {
      logger.warn({ error: apiError }, 'Groq API connection failed, falling back to simulated summary');
      const summaryText = generateSimulatedSummary(parsed.data.content);
      return createSimulatedStreamResponse(summaryText);
    }
  } catch (error) {
    logger.error({ error }, 'AI summarize error');
    return new Response('Internal server error', { status: 500 });
  }
}
