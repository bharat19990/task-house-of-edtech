'use client';

import { Cloud, CloudOff, Loader2, AlertCircle } from 'lucide-react';
import { useSyncStore } from '@/store/syncStore';
import { cn } from '@/lib/utils/cn';

export function SyncStatusIndicator() {
  const { status, pendingCount } = useSyncStore();

  const config = {
    saved: {
      icon: Cloud,
      label: 'All saved',
      className: 'text-emerald-600 dark:text-emerald-400',
    },
    syncing: {
      icon: Loader2,
      label: 'Syncing...',
      className: 'text-blue-600 dark:text-blue-400',
    },
    pending: {
      icon: Cloud,
      label: `${pendingCount} change${pendingCount !== 1 ? 's' : ''} pending`,
      className: 'text-amber-600 dark:text-amber-400',
    },
    offline: {
      icon: CloudOff,
      label: 'Offline — saved locally',
      className: 'text-muted-foreground',
    },
    error: {
      icon: AlertCircle,
      label: 'Sync error',
      className: 'text-red-600 dark:text-red-400',
    },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', c.className)} aria-live="polite" aria-label={`Sync status: ${c.label}`}>
      <Icon className={cn('h-3.5 w-3.5', status === 'syncing' && 'animate-spin')} />
      <span>{c.label}</span>
    </div>
  );
}
