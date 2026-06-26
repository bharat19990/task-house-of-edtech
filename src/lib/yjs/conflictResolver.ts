import * as Y from 'yjs';
import { applyUpdate, encodeDocState, computeStateDiff, encodeStateVector } from './yjsUtils';
import logger from '@/lib/logger';

export interface MergeResult {
  
  hasChanges: boolean;
  
  mergedState: Uint8Array;
  
  outgoingDiff: Uint8Array | null;
}

export function mergeRemoteUpdate(localDoc: Y.Doc, remoteUpdate: Uint8Array): MergeResult {
  try {
    
    const localStateVector = encodeStateVector(localDoc);

    applyUpdate(localDoc, remoteUpdate);

    const outgoingDiff = computeStateDiff(localDoc, localStateVector);
    const mergedState = encodeDocState(localDoc);

    const hasChanges = outgoingDiff.length > 2;

    return { hasChanges, mergedState, outgoingDiff: hasChanges ? outgoingDiff : null };
  } catch (error) {
    logger.error({ error }, 'Failed to merge remote update');
    throw error;
  }
}

export function mergeOfflineStates(stateA: Uint8Array, stateB: Uint8Array): Uint8Array {
  const doc = new Y.Doc();

  try {
    applyUpdate(doc, stateA);
    applyUpdate(doc, stateB);
    return encodeDocState(doc);
  } finally {
    doc.destroy();
  }
}

export function restoreFromSnapshot(currentDoc: Y.Doc, snapshotState: Uint8Array): Uint8Array {
  try {
    
    const snapshotDoc = new Y.Doc();
    applyUpdate(snapshotDoc, snapshotState);

    const snapshotFullState = encodeDocState(snapshotDoc);

    applyUpdate(currentDoc, snapshotFullState);

    snapshotDoc.destroy();
    return encodeDocState(currentDoc);
  } catch (error) {
    logger.error({ error }, 'Failed to restore from snapshot');
    throw error;
  }
}
