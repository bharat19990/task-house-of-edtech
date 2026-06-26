import db, { type OfflineDocument, type PendingOperation, type LocalVersionSnapshot } from './db';
import logger from '@/lib/logger';

export const offlineDocumentStore = {

  async getAllDocuments(): Promise<OfflineDocument[]> {
    try {
      return await db.documents.orderBy('updatedAt').reverse().toArray();
    } catch (error) {
      logger.error({ error }, 'Failed to get offline documents');
      return [];
    }
  },

  async getDocument(id: string): Promise<OfflineDocument | undefined> {
    try {
      return await db.documents.get(id);
    } catch (error) {
      logger.error({ error, id }, 'Failed to get offline document');
      return undefined;
    }
  },

  async saveDocument(doc: OfflineDocument): Promise<void> {
    try {
      await db.documents.put(doc);
    } catch (error) {
      logger.error({ error, id: doc.id }, 'Failed to save offline document');
      throw error;
    }
  },

  async deleteDocument(id: string): Promise<void> {
    try {
      await db.documents.delete(id);
      
      await db.pendingOps.where('docId').equals(id).delete();
    } catch (error) {
      logger.error({ error, id }, 'Failed to delete offline document');
      throw error;
    }
  },

  async bulkSaveDocuments(docs: OfflineDocument[]): Promise<void> {
    try {
      await db.documents.bulkPut(docs);
    } catch (error) {
      logger.error({ error }, 'Failed to bulk save offline documents');
      throw error;
    }
  },

  async addPendingOp(op: PendingOperation): Promise<number> {
    try {
      return await db.pendingOps.add(op);
    } catch (error) {
      logger.error({ error }, 'Failed to add pending operation');
      throw error;
    }
  },

  async getPendingOps(docId?: string): Promise<PendingOperation[]> {
    try {
      if (docId) {
        return await db.pendingOps.where('docId').equals(docId).sortBy('timestamp');
      }
      return await db.pendingOps.where('status').equals('pending').sortBy('timestamp');
    } catch (error) {
      logger.error({ error }, 'Failed to get pending operations');
      return [];
    }
  },

  async getPendingCount(): Promise<number> {
    try {
      return await db.pendingOps.where('status').anyOf(['pending', 'failed']).count();
    } catch (error) {
      logger.error({ error }, 'Failed to count pending operations');
      return 0;
    }
  },

  async updatePendingOp(
    id: number,
    status: PendingOperation['status'],
    retryCount?: number,
  ): Promise<void> {
    try {
      const update: Partial<PendingOperation> = { status };
      if (retryCount !== undefined) {
        update.retryCount = retryCount;
      }
      await db.pendingOps.update(id, update);
    } catch (error) {
      logger.error({ error, id }, 'Failed to update pending operation');
      throw error;
    }
  },

  async removePendingOp(id: number): Promise<void> {
    try {
      await db.pendingOps.delete(id);
    } catch (error) {
      logger.error({ error, id }, 'Failed to remove pending operation');
      throw error;
    }
  },

  async clearPendingOps(docId: string): Promise<void> {
    try {
      await db.pendingOps.where('docId').equals(docId).delete();
    } catch (error) {
      logger.error({ error, docId }, 'Failed to clear pending operations');
      throw error;
    }
  },

  async saveVersionSnapshot(snapshot: LocalVersionSnapshot): Promise<void> {
    try {
      await db.versionSnapshots.put(snapshot);
    } catch (error) {
      logger.error({ error }, 'Failed to save version snapshot');
      throw error;
    }
  },

  async getVersionSnapshots(documentId: string): Promise<LocalVersionSnapshot[]> {
    try {
      return await db.versionSnapshots
        .where('documentId')
        .equals(documentId)
        .reverse()
        .sortBy('createdAt');
    } catch (error) {
      logger.error({ error, documentId }, 'Failed to get version snapshots');
      return [];
    }
  },
};
