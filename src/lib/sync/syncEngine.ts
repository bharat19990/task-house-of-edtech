'use client';

import { getPendingSyncOps, completeSyncOp, failSyncOp, resetFailedSyncOps } from './syncQueue';
import { getClientId } from '@/lib/utils/generateId';
import logger from '@/lib/logger';

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000;

let isSyncing = false;

function getBackoffDelay(retryCount: number): number {
  return Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), 30_000);
}

async function pushSyncPayload(
  docId: string,
  yjsUpdate: string,
): Promise<{ success: boolean; serverState?: string }> {
  const clientId = getClientId();
  const timestamp = new Date().toISOString();

  const response = await fetch(`/api/documents/${docId}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId,
      yjsUpdate,
      timestamp,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sync failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

export async function runSyncCycle(
  docId?: string,
  onStatusChange?: (status: 'syncing' | 'synced' | 'error', pendingCount: number) => void,
): Promise<void> {
  if (isSyncing) {
    logger.debug('Sync cycle already running, skipping');
    return;
  }

  isSyncing = true;

  try {
    await resetFailedSyncOps(docId);
    const pendingOps = await getPendingSyncOps(docId);

    if (pendingOps.length === 0) {
      onStatusChange?.('synced', 0);
      return;
    }

    onStatusChange?.('syncing', pendingOps.length);
    logger.info({ count: pendingOps.length, docId }, 'Starting sync cycle');

    for (const op of pendingOps) {
      if (!op.id) continue;

      if (op.retryCount >= MAX_RETRIES) {
        logger.error({ opId: op.id, docId: op.docId }, 'Sync operation exceeded max retries');
        continue;
      }

      if (op.retryCount > 0) {
        const delay = getBackoffDelay(op.retryCount);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      try {
        await pushSyncPayload(op.docId, op.yjsUpdate);
        await completeSyncOp(op.id);
        logger.debug({ opId: op.id, docId: op.docId }, 'Sync operation completed');
      } catch (error: any) {
        const message = error?.message || '';
        if (message.includes('(404)') || message.includes('(403)')) {
          logger.warn({ opId: op.id, docId: op.docId, message }, 'Document deleted or forbidden on server, discarding operation');
          await completeSyncOp(op.id);
        } else {
          await failSyncOp(op.id, op.retryCount);
          logger.error({ error, opId: op.id, docId: op.docId }, 'Sync operation failed');
        }
      }
    }

    const remainingOps = await getPendingSyncOps(docId);
    if (remainingOps.length === 0) {
      onStatusChange?.('synced', 0);
    } else {
      onStatusChange?.('error', remainingOps.length);
    }
  } catch (error) {
    logger.error({ error, docId }, 'Sync cycle error');
    onStatusChange?.('error', -1);
  } finally {
    isSyncing = false;
  }
}

export function isSyncInProgress(): boolean {
  return isSyncing;
}
