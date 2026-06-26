import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
console.log('[WS STARTUP] process.cwd():', process.cwd());
console.log('[WS STARTUP] MONGODB_URI:', process.env.MONGODB_URI || 'not set');

import { verifyWebSocketAuth } from './authMiddleware';
import connectToDatabase from '../src/lib/mongodb';
import DocumentModel from '../src/models/Document';
import Collaborator from '../src/models/Collaborator';

const PORT = parseInt(process.env.WS_PORT ?? process.env.PORT ?? '1234', 10);

const server = http.createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('y-websocket server running');
});

const wss = new WebSocketServer({ noServer: true });

const docs = new Map<string, Set<WebSocket>>();

server.on('upgrade', async (request, socket, head) => {
  try {
    const url = new URL(request.url ?? '', `http://${request.headers.host}`);
    const roomName = url.pathname.slice(1) || 'default';

    const currentRoomClients = docs.get(roomName);
    if (currentRoomClients && currentRoomClients.size >= 50) {
      console.warn(`[WS] Connection limit exceeded for room ${roomName}`);
      socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
      socket.destroy();
      return;
    }

    await connectToDatabase();

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } catch (error) {
    console.error('[WS] Upgrade error:', error);
    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    socket.destroy();
  }
});

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url ?? '', `http://localhost:${PORT}`);
  const roomName = url.pathname.slice(1) || 'default';
  const docId = roomName.replace(/^doc-/, '');

  const decoded = verifyWebSocketAuth(req, ws);
  if (!decoded) {
    
    return;
  }

  const { userId, name } = decoded;
  let role: string | null = null;

  try {
    
    const doc = await DocumentModel.findById(docId).lean();
    if (!doc || doc.isDeleted) {
      console.warn(`[WS] Document not found or deleted: ${docId}`);
      ws.close(4004, 'Document not found');
      return;
    }

    if (doc.ownerId.toString() === userId) {
      role = 'owner';
    } else {
      const collab = await Collaborator.findOne({ documentId: docId, userId }).lean();
      if (collab) {
        role = collab.role;
      }
    }

    if (!role) {
      console.warn(`[WS] User ${userId} (${name}) forbidden access to document ${docId}`);
      ws.close(4003, 'Forbidden: No access to document');
      return;
    }

    console.log(`[WS] User ${name} (${role}) connected to room: ${roomName}`);
  } catch (error) {
    console.error(`[WS] Auth database error for user ${userId}:`, error);
    ws.close(1011, 'Internal server error during auth');
    return;
  }

  if (!docs.has(roomName)) {
    docs.set(roomName, new Set());
  }
  docs.get(roomName)?.add(ws);

  ws.on('message', (message) => {
    
    let size = 0;
    if (message instanceof Buffer) {
      size = message.length;
    } else if (typeof message === 'string') {
      size = Buffer.byteLength(message);
    } else if (message instanceof ArrayBuffer) {
      size = message.byteLength;
    } else if (Array.isArray(message)) {
      size = message.reduce((acc, chunk) => acc + (chunk.length || 0), 0);
    }

    if (size > 1024 * 1024) {
      console.warn(`[WS] Message rejected: too large (${size} bytes) from ${name}`);
      return;
    }

    if (role === 'viewer') {
      console.warn(`[WS] Message rejected: user ${name} is a viewer (read-only)`);
      return;
    }

    const room = docs.get(roomName);
    if (!room) return;

    room.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log(`[WS] User ${name} disconnected from room: ${roomName}`);
    const room = docs.get(roomName);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        docs.delete(roomName);
      }
    }
  });

  ws.on('error', (error) => {
    console.error(`[WS] Error for user ${name} in room ${roomName}:`, error);
  });
});

server.listen(PORT, () => {
  console.log(`✅ y-websocket server running on ws://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('\n[WS] Shutting down...');
  wss.close();
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  wss.close();
  server.close();
  process.exit(0);
});
