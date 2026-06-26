'use client';

import { useEffect, useCallback, useRef } from 'react';
import { runSyncCycle } from '@/lib/sync/syncEngine';
import { useSyncStore } from '@/store/syncStore';

export function useSyncEngine(docId: string | null, isOnline: boolean) {
  const { setStatus, setPendingCount, setLastSyncedAt } = useSyncStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStatusChange = useCallback(
    (status: 'syncing' | 'synced' | 'error', pendingCount: number) => {
      if (status === 'synced') {
        setStatus('saved');
        setLastSyncedAt(new Date().toISOString());
      } else if (status === 'syncing') {
        setStatus('syncing');
      } else {
        setStatus('error');
      }
      setPendingCount(Math.max(0, pendingCount));
    },
    [setStatus, setPendingCount, setLastSyncedAt],
  );

  const triggerSync = useCallback(async () => {
    if (!isOnline) return;
    await runSyncCycle(docId ?? undefined, handleStatusChange);
  }, [isOnline, handleStatusChange, docId]);

  useEffect(() => {
    let isMounted = true;
    const loadPending = async () => {
      if (!docId) return;
      try {
        const { getPendingSyncOps } = await import('@/lib/sync/syncQueue');
        const ops = await getPendingSyncOps(docId);
        if (isMounted) {
          setPendingCount(ops.length);
          if (ops.length === 0) {
            setStatus('saved');
          } else {
            setStatus(isOnline ? 'pending' : 'offline');
          }
        }
      } catch (err) {
        console.error('Failed to load pending sync ops', err);
      }
    };
    loadPending();
    return () => {
      isMounted = false;
    };
  }, [docId, isOnline, setPendingCount, setStatus]);

  useEffect(() => {
    if (isOnline) {
      triggerSync();

      intervalRef.current = setInterval(triggerSync, 15_000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isOnline, triggerSync]);

  return { triggerSync };
}
