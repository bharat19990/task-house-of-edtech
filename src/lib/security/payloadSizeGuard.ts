import { NextResponse } from 'next/server';
import logger from '@/lib/logger';

const MAX_PAYLOAD_SIZE = 2 * 1024 * 1024;

export function checkPayloadSize(request: Request): NextResponse | null {
  const contentLength = request.headers.get('content-length');

  if (contentLength) {
    const size = parseInt(contentLength, 10);

    if (!isNaN(size) && size > MAX_PAYLOAD_SIZE) {
      logger.warn(
        { size, maxSize: MAX_PAYLOAD_SIZE },
        'Payload size exceeds maximum allowed limit',
      );

      return NextResponse.json(
        {
          error: 'Payload too large',
          message: `Maximum payload size is ${MAX_PAYLOAD_SIZE / (1024 * 1024)}MB`,
          maxBytes: MAX_PAYLOAD_SIZE,
        },
        { status: 413 },
      );
    }
  }

  return null;
}

export function checkParsedBodySize(body: unknown): NextResponse | null {
  const bodyStr = JSON.stringify(body);
  const size = new TextEncoder().encode(bodyStr).length;

  if (size > MAX_PAYLOAD_SIZE) {
    logger.warn(
      { size, maxSize: MAX_PAYLOAD_SIZE },
      'Parsed body exceeds maximum allowed limit',
    );

    return NextResponse.json(
      {
        error: 'Payload too large',
        message: `Maximum payload size is ${MAX_PAYLOAD_SIZE / (1024 * 1024)}MB`,
        maxBytes: MAX_PAYLOAD_SIZE,
      },
      { status: 413 },
    );
  }

  return null;
}

export async function readBodyWithLimit(request: Request, limit: number = MAX_PAYLOAD_SIZE): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > limit) {
      throw new Error('PAYLOAD_TOO_LARGE');
    }
    return text;
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.length;
      if (totalBytes > limit) {
        await reader.cancel();
        throw new Error('PAYLOAD_TOO_LARGE');
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'PAYLOAD_TOO_LARGE') {
      throw error;
    }
    throw new Error('Failed to read request body stream');
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder().decode(result);
}

