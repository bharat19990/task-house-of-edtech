'use client';

import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';

interface ConnectionStatusProps {
  status: 'connected' | 'connecting' | 'disconnected';
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const config = {
    connected: {
      icon: Wifi,
      label: 'Connected',
      dotColor: 'bg-emerald-500',
      className: 'text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    },
    connecting: {
      icon: Loader2,
      label: 'Reconnecting',
      dotColor: 'bg-amber-500',
      className: 'text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    },
    disconnected: {
      icon: WifiOff,
      label: 'Offline',
      dotColor: 'bg-red-500',
      className: 'text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
    },
  };

  const c = config[status];
  const Icon = c.icon;

  return (
    <Badge variant="outline" className={cn('gap-1.5 font-normal', c.className)} aria-live="polite" aria-label={`Connection status: ${c.label}`}>
      <span className={cn('h-2 w-2 rounded-full', c.dotColor, status === 'connecting' && 'animate-pulse')} />
      <Icon className={cn('h-3 w-3', status === 'connecting' && 'animate-spin')} />
      <span className="text-xs">{c.label}</span>
    </Badge>
  );
}
