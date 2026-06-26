'use client';

import logger from '@/lib/logger';

type NetworkCallback = (isOnline: boolean) => void;

const callbacks = new Set<NetworkCallback>();

let currentStatus = typeof navigator !== 'undefined' ? navigator.onLine : true;

const POLL_INTERVAL = 30_000;

let pollTimer: ReturnType<typeof setInterval> | null = null;

function notifyCallbacks(isOnline: boolean): void {
  if (currentStatus !== isOnline) {
    currentStatus = isOnline;
    logger.info({ isOnline }, 'Network status changed');
    callbacks.forEach((cb) => cb(isOnline));
  }
}

const handleOnline = () => notifyCallbacks(true);
const handleOffline = () => notifyCallbacks(false);

async function healthCheck(): Promise<void> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('/api/auth/session', {
      method: 'GET',
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);
    notifyCallbacks(response.ok);
  } catch {
    notifyCallbacks(false);
  }
}

export function startNetworkDetector(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  if (!pollTimer) {
    pollTimer = setInterval(healthCheck, POLL_INTERVAL);
  }

  healthCheck();
}

export function stopNetworkDetector(): void {
  if (typeof window === 'undefined') return;

  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }

  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
}

export function onNetworkStatusChange(callback: NetworkCallback): () => void {
  callbacks.add(callback);
  
  callback(currentStatus);

  return () => {
    callbacks.delete(callback);
  };
}

export function isOnline(): boolean {
  return currentStatus;
}
