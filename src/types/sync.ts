import { z } from 'zod';

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface SyncOperation {
  id?: number;
  docId: string;
  clientId: string;
  yjsUpdate: string; 
  timestamp: string; 
  retryCount: number;
  status: SyncStatus;
}

export interface SyncPayload {
  clientId: string;
  yjsUpdate: string; 
  timestamp: string;
}

export interface SyncResponse {
  success: boolean;
  serverState?: string; 
  message?: string;
}

export type UISyncStatus = 'saved' | 'syncing' | 'pending' | 'offline' | 'error';

export const syncPayloadSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  yjsUpdate: z.string().min(1, 'Yjs update is required'),
  timestamp: z.string().datetime({ message: 'Valid ISO 8601 timestamp required' }),
});

export const syncLogSchema = z.object({
  documentId: z.string().min(1),
  userId: z.string().min(1),
  clientId: z.string().min(1),
  operation: z.enum(['update', 'sync', 'restore']),
  payloadSizeBytes: z.number().nonnegative(),
  status: z.enum(['success', 'failed']),
});

export type SyncPayloadInput = z.infer<typeof syncPayloadSchema>;
export type SyncLogInput = z.infer<typeof syncLogSchema>;
