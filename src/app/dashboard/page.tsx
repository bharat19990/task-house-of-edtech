'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, SortAsc } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentList } from '@/components/dashboard/DocumentList';
import { CreateDocumentModal } from '@/components/dashboard/CreateDocumentModal';
import type { DocumentData } from '@/types/document';
import { offlineDocumentStore } from '@/lib/offline/offlineDocumentStore';
import { toast } from 'sonner';
import type { CollaboratorRole } from '@/types/collaborator';

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setDocuments(data);
      
      const offlineDocs = (data as DocumentData[]).map((doc) => ({
        id: doc.id,
        title: doc.title,
        ownerId: doc.ownerId,
        yjsState: '',
        content: doc.content || '',
        role: doc.role,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));
      await offlineDocumentStore.bulkSaveDocuments(offlineDocs);
    } catch (err) {
      console.warn('Dashboard fetch failed, falling back to local Dexie cache', err);
      const localDocs = await offlineDocumentStore.getAllDocuments();
      const mappedLocalDocs: DocumentData[] = localDocs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        ownerId: doc.ownerId,
        content: doc.content,
        isDeleted: false,
        role: doc.role as CollaboratorRole,
        collaboratorCount: 0,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      }));
      setDocuments(mappedLocalDocs);
      toast.info('Offline mode: Loaded cached documents.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) || doc.content.toLowerCase().includes(query),
      );
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [documents, searchQuery, sortBy]);

  const cycleSortBy = () => {
    setSortBy((prev) => {
      if (prev === 'updatedAt') return 'createdAt';
      if (prev === 'createdAt') return 'title';
      return 'updatedAt';
    });
  };

  const sortLabel = sortBy === 'updatedAt' ? 'Last modified' : sortBy === 'createdAt' ? 'Created date' : 'Title';

  return (
    <div className="container py-8 animate-fade-in">
      {}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground mt-1">
            {documents.length} document{documents.length !== 1 ? 's' : ''} in your workspace
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
          <Plus className="h-4 w-4" />
          New Document
        </Button>
      </div>

      {}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={cycleSortBy} className="gap-2 self-start">
          <SortAsc className="h-4 w-4" />
          {sortLabel}
        </Button>
      </div>

      {}
      <DocumentList
        documents={filteredDocuments}
        isLoading={isLoading}
        onDocumentDeleted={fetchDocuments}
      />

      {}
      <CreateDocumentModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreated={fetchDocuments}
      />
    </div>
  );
}
