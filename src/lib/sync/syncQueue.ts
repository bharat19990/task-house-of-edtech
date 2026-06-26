'use client';

import { offlineDocumentStore } from '@/lib/offline/offlineDocumentStore';
import { getClientId } from '@/lib/utils/generateId';
import logger from '@/lib/logger';

export async function enqueueSyncOp(docId: string, yjsUpdate: string): Promise<number> {
  const clientId = getClientId();
  const timestamp = new Date().toISOString();

  try {
    const id = await offlineDocumentStore.addPendingOp({
      docId,
      clientId,
      yjsUpdate,
      timestamp,
      retryCount: 0,
      status: 'pending',
    });

    logger.debug({ docId, opId: id }, 'Sync operation enqueued');
    return id;
  } catch (error) {
    logger.error({ error, docId }, 'Failed to enqueue sync operation');
    throw error;
  }
}

export async function getPendingSyncOps(docId?: string) {
  return offlineDocumentStore.getPendingOps(docId);
}

export async function completeSyncOp(opId: number): Promise<void> {
  try {
    await offlineDocumentStore.removePendingOp(opId);
    logger.debug({ opId }, 'Sync operation completed');
  } catch (error) {
    logger.error({ error, opId }, 'Failed to complete sync operation');
    throw error;
  }
}

export async function failSyncOp(opId: number, currentRetryCount: number): Promise<void> {
  try {
    await offlineDocumentStore.updatePendingOp(opId, 'failed', currentRetryCount + 1);
    logger.warn({ opId, retryCount: currentRetryCount + 1 }, 'Sync operation failed');
  } catch (error) {
    logger.error({ error, opId }, 'Failed to mark sync operation as failed');
    throw error;
  }
}

export async function getPendingCount(): Promise<number> {
  return offlineDocumentStore.getPendingCount();
}

export async function clearDocSyncOps(docId: string): Promise<void> {
  try {
    await offlineDocumentStore.clearPendingOps(docId);
    logger.info({ docId }, 'Cleared all pending sync operations');
  } catch (error) {
    logger.error({ error, docId }, 'Failed to clear sync operations');
    throw error;
  }
}

export async function resetFailedSyncOps(docId?: string): Promise<void> {
  try {
    const ops = await getPendingSyncOps(docId);
    for (const op of ops) {
      if (op.id && (op.status === 'failed' || op.retryCount > 0)) {
        await offlineDocumentStore.updatePendingOp(op.id, 'pending', 0);
      }
    }
  } catch (error) {
    logger.error({ error, docId }, 'Failed to reset failed sync operations');
  }
}
