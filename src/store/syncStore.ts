import { create } from 'zustand';
import type { UISyncStatus } from '@/types/sync';

interface SyncState {
  
  status: UISyncStatus;
  
  pendingCount: number;
  
  lastSyncedAt: string | null;
  
  isOnline: boolean;

  setStatus: (status: UISyncStatus) => void;
  setPendingCount: (count: number) => void;
  setLastSyncedAt: (timestamp: string) => void;
  setOnline: (isOnline: boolean) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  status: 'saved',
  pendingCount: 0,
  lastSyncedAt: null,
  isOnline: true,

  setStatus: (status) => set({ status }),

  setPendingCount: (count) => set({ pendingCount: count }),

  setLastSyncedAt: (timestamp) => set({ lastSyncedAt: timestamp }),

  setOnline: (isOnline) =>
    set((state) => ({
      isOnline,
      status: isOnline ? state.status : 'offline',
    })),
}));
