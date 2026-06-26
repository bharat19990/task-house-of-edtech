'use client';

import { useState, useCallback } from 'react';
import type { VersionData } from '@/types/version';
import { toast } from 'sonner';

export function useVersionHistory(docId: string | null) {
  const [versions, setVersions] = useState<VersionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchVersions = useCallback(async () => {
    if (!docId) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/${docId}/versions`);
      if (!response.ok) throw new Error('Failed to fetch versions');
      const data = await response.json();
      setVersions(data);
    } catch (error) {
      toast.error('Failed to load version history');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [docId]);

  const createVersion = useCallback(
    async (label: string, yjsSnapshot: string, contentSnapshot: string) => {
      if (!docId) return;
      try {
        const response = await fetch(`/api/documents/${docId}/versions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label, yjsSnapshot, contentSnapshot }),
        });

        if (!response.ok) throw new Error('Failed to create version');

        toast.success(`Version "${label}" saved`);
        await fetchVersions();
      } catch (error) {
        toast.error('Failed to save version');
        console.error(error);
      }
    },
    [docId, fetchVersions],
  );

  const restoreVersion = useCallback(
    async (versionId: string) => {
      if (!docId) return null;
      try {
        const response = await fetch(`/api/documents/${docId}/versions/${versionId}`, {
          method: 'POST',
        });

        if (!response.ok) throw new Error('Failed to restore version');

        const data = await response.json();
        toast.success(data.message ?? 'Version restored');
        await fetchVersions();
        return data.serverState as string;
      } catch (error) {
        toast.error('Failed to restore version');
        console.error(error);
        return null;
      }
    },
    [docId, fetchVersions],
  );

  return { versions, isLoading, fetchVersions, createVersion, restoreVersion };
}
