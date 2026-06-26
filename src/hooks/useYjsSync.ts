'use client';

import { useEffect, useRef, useState } from 'react';
import { initializeYjsProviders, type YjsProviderInstance } from '@/lib/yjs/yjsProvider';
import type { Doc as YDoc } from 'yjs';

export function useYjsSync(docId: string | null, token: string | null) {
  const [doc, setDoc] = useState<YDoc | null>(null);
  const [wsProvider, setWsProvider] = useState<{ awareness: unknown } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const instanceRef = useRef<YjsProviderInstance | null>(null);

  useEffect(() => {
    if (!docId || !token) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_SERVER_URL ?? 'ws://localhost:1234';

    const instance = initializeYjsProviders(docId, wsUrl, token);
    instanceRef.current = instance;
    setDoc(instance.doc);

    if (instance.websocketProvider) {
      setWsProvider(instance.websocketProvider);

      instance.websocketProvider.on('status', (event: { status: string }) => {
        if (event.status === 'connected') {
          setConnectionStatus('connected');
        } else if (event.status === 'connecting') {
          setConnectionStatus('connecting');
        } else {
          setConnectionStatus('disconnected');
        }
      });
    }

    return () => {
      instance.destroy();
      instanceRef.current = null;
      setDoc(null);
      setWsProvider(null);
      setConnectionStatus('disconnected');
    };
  }, [docId, token]);

  return { doc, wsProvider, connectionStatus };
}
