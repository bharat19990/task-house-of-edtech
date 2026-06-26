'use client';

import * as Y from 'yjs';
import logger from '@/lib/logger';

export interface YjsProviderInstance {
  doc: Y.Doc;
  indexeddbProvider: ReturnType<typeof createIndexedDBProvider> | null;
  websocketProvider: ReturnType<typeof createWebsocketProvider> | null;
  destroy: () => void;
}

function createIndexedDBProvider(doc: Y.Doc, docId: string) {

  const { IndexeddbPersistence } = require('y-indexeddb');
  const provider = new IndexeddbPersistence(`collab-doc-${docId}`, doc);

  provider.on('synced', () => {
    logger.info({ docId }, 'IndexedDB provider synced');
  });

  return provider;
}

function createWebsocketProvider(
  doc: Y.Doc,
  docId: string,
  wsUrl: string,
  token: string,
) {
  
  const { WebsocketProvider } = require('y-websocket');
  const provider = new WebsocketProvider(wsUrl, `doc-${docId}`, doc, {
    params: { token },
    connect: true,
    resyncInterval: 5000,
  });

  provider.on('status', (event: { status: string }) => {
    logger.info({ docId, status: event.status }, 'WebSocket provider status change');
  });

  return provider;
}

export function initializeYjsProviders(
  docId: string,
  wsUrl: string,
  token: string,
): YjsProviderInstance {
  const doc = new Y.Doc();

  let indexeddbProvider: ReturnType<typeof createIndexedDBProvider> | null = null;
  let websocketProvider: ReturnType<typeof createWebsocketProvider> | null = null;

  try {
    indexeddbProvider = createIndexedDBProvider(doc, docId);
  } catch (error) {
    logger.error({ error, docId }, 'Failed to create IndexedDB provider');
  }

  try {
    websocketProvider = createWebsocketProvider(doc, docId, wsUrl, token);
  } catch (error) {
    logger.error({ error, docId }, 'Failed to create WebSocket provider');
  }

  const destroy = () => {
    try {
      websocketProvider?.destroy();
      indexeddbProvider?.destroy();
      doc.destroy();
      logger.info({ docId }, 'Yjs providers destroyed');
    } catch (error) {
      logger.error({ error, docId }, 'Error destroying Yjs providers');
    }
  };

  return { doc, indexeddbProvider, websocketProvider, destroy };
}
