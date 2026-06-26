import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { auth } from '@/lib/auth';
import { z } from 'zod';
import logger from '@/lib/logger';
import { isMockApiKey, createSimulatedStreamResponse } from '@/lib/ai/simulation';

const requestSchema = z.object({
  context: z.string().min(1, 'Context is required').max(2000, 'Context too long'),
});

function generateSimulatedAutocomplete(context: string): string {
  const ctx = context.trim().toLowerCase();
  if (ctx.endsWith('collabedit') || ctx.endsWith('editor') || ctx.includes('collab')) {
    return ' provides real-time collaboration with offline synchronization support, combining Yjs and IndexedDB.';
  }
  if (ctx.endsWith('crdt') || ctx.endsWith('sync') || ctx.includes('crdt')) {
    return ' ensures that concurrent edits are merged deterministically without conflict.';
  }
  if (ctx.endsWith('local-first') || ctx.includes('offline')) {
    return ' keeps your data stored locally in Dexie IndexedDB first and pushes sync events to MongoDB when online.';
  }
  return ' is a modern distributed text editing system built on top of robust Next.js and TypeScript technologies.';
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

    logger.info({ userId: session.user.id }, 'AI autocomplete request');

    const apiKey = process.env.GROQ_API_KEY;
    if (isMockApiKey(apiKey)) {
      const autocompleteText = generateSimulatedAutocomplete(parsed.data.context);
      return createSimulatedStreamResponse(autocompleteText);
    }

    try {
      const groq = createGroq({ apiKey });
      const result = streamText({
        model: groq('llama3-70b-8192'),
        system: 'You are a writing assistant providing inline text completions. Continue the text naturally from where it ends. Write 1-3 sentences that flow smoothly. Return ONLY the continuation text without any explanation or prefix.',
        prompt: `Continue writing from this context:\n\n${parsed.data.context}`,
        maxTokens: 200,
        temperature: 0.6,
      });

      return result.toDataStreamResponse();
    } catch (apiError) {
      logger.warn({ error: apiError }, 'Groq API connection failed, falling back to simulated autocomplete');
      const autocompleteText = generateSimulatedAutocomplete(parsed.data.context);
      return createSimulatedStreamResponse(autocompleteText);
    }
  } catch (error) {
    logger.error({ error }, 'AI autocomplete error');
    return new Response('Internal server error', { status: 500 });
  }
}
