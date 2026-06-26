'use client';

import { DocumentCard } from './DocumentCard';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';
import type { DocumentData } from '@/types/document';

interface DocumentListProps {
  documents: DocumentData[];
  isLoading: boolean;
  onDocumentDeleted: () => void;
}

export function DocumentList({ documents, isLoading, onDocumentDeleted }: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50 mb-6">
          <FileText className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
        <p className="text-muted-foreground max-w-sm">
          Create your first document to get started with collaborative editing.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => (
        <DocumentCard key={doc.id} document={doc} onDeleted={onDocumentDeleted} />
      ))}
    </div>
  );
}
