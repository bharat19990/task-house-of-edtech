'use client';

import { useState, useEffect, useCallback } from 'react';
import { onNetworkStatusChange, startNetworkDetector, stopNetworkDetector } from '@/lib/sync/networkDetector';
import { useSyncStore } from '@/store/syncStore';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const { setOnline } = useSyncStore();

  const handleStatusChange = useCallback(
    (online: boolean) => {
      setIsOnline(online);
      setOnline(online);
    },
    [setOnline],
  );

  useEffect(() => {
    startNetworkDetector();
    const unsubscribe = onNetworkStatusChange(handleStatusChange);

    return () => {
      unsubscribe();
      stopNetworkDetector();
    };
  }, [handleStatusChange]);

  return isOnline;
}
