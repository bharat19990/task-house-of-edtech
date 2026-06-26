import Dexie, { type Table } from 'dexie';

export interface OfflineDocument {
  
  id: string;
  title: string;
  ownerId: string;
  
  yjsState: string;
  
  content: string;
  role: string;
  updatedAt: string;
  createdAt: string;
}

export interface PendingOperation {
  
  id?: number;
  docId: string;
  clientId: string;
  
  yjsUpdate: string;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}

export interface LocalVersionSnapshot {
  id: string;
  documentId: string;
  label: string;
  contentSnapshot: string;
  createdAt: string;
  createdByName: string;
}

class CollabEditorDB extends Dexie {
  documents!: Table<OfflineDocument, string>;
  pendingOps!: Table<PendingOperation, number>;
  versionSnapshots!: Table<LocalVersionSnapshot, string>;

  constructor() {
    super('collab-editor-db');

    this.version(1).stores({
      documents: 'id, ownerId, updatedAt',
      pendingOps: '++id, docId, status, timestamp',
      versionSnapshots: 'id, documentId, createdAt',
    });
  }
}

const db = new CollabEditorDB();

export default db;
