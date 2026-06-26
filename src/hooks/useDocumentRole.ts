'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CollaboratorRole } from '@/types/collaborator';
import db from '@/lib/offline/db';

export function useDocumentRole(docId: string | null) {
  const [role, setRole] = useState<CollaboratorRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRole = useCallback(async () => {
    if (!docId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/documents/${docId}`);
      if (response.ok) {
        const data = await response.json();
        setRole(data.role as CollaboratorRole);
        setIsLoading(false);
        return;
      } else if (response.status === 404 || response.status === 403 || response.status === 401) {
        setRole(null);
        setIsLoading(false);
        return;
      }
    } catch (e) {
      console.warn('Failed to fetch role from API, checking local DB:', e);
    }

    try {
      const localDoc = await db.documents.get(docId);
      if (localDoc && localDoc.role) {
        setRole(localDoc.role as CollaboratorRole);
      } else {
        setRole(null);
      }
    } catch {
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  return { role, isLoading, refetchRole: fetchRole };
}
