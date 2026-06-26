export function isMockApiKey(key: string | undefined): boolean {
  if (!key) return true;
  const k = key.trim().toLowerCase();
  return k.startsWith('gsk_mock') || k === 'your-groq-api-key-here' || k.includes('mock');
}

export function createSimulatedStreamResponse(textToStream: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const words = textToStream.split(/(\s+)/);
      for (const word of words) {
        if (!word) continue;
        const line = `0:${JSON.stringify(word)}\n`;
        controller.enqueue(encoder.encode(line));
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'x-vercel-ai-data-stream': 'v1',
    },
  });
}
