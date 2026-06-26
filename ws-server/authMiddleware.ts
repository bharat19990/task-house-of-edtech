import jwt from 'jsonwebtoken';
import type { IncomingMessage } from 'http';
import type { WebSocket } from 'ws';

export function verifyWebSocketAuth(
  request: IncomingMessage,
  ws: WebSocket,
): { userId: string; name: string } | null {
  try {
    const url = new URL(request.url ?? '', `http://${request.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      console.warn('WebSocket connection rejected: no token provided');
      ws.close(4001, 'Unauthorized: no token');
      return null;
    }

    console.log(`[WS] Verifying token: "${token.slice(0, 30)}${token.length > 30 ? '...' : ''}"`);

    const secret = process.env.JWT_SECRET ?? process.env.NEXTAUTH_SECRET ?? 'fallback-secret';
    const decoded = jwt.verify(token, secret) as { id: string; name: string; sub?: string };

    return {
      userId: decoded.id ?? decoded.sub ?? 'unknown',
      name: decoded.name ?? 'Anonymous',
    };
  } catch (error) {
    console.warn('WebSocket connection rejected: invalid token', error);
    ws.close(4001, 'Unauthorized: invalid token');
    return null;
  }
}

export function canWrite(role: string): boolean {
  return role === 'owner' || role === 'editor';
}
