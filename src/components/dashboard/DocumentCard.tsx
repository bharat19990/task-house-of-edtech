'use client';

import Link from 'next/link';
import { FileText, Trash2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatRelativeDate } from '@/lib/utils/formatDate';
import type { DocumentData } from '@/types/document';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/cn';

interface DocumentCardProps {
  document: DocumentData;
  onDeleted: () => void;
}

export function DocumentCard({ document, onDeleted }: DocumentCardProps) {
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/documents/${document.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      toast.success('Document deleted');
      onDeleted();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const roleBadgeVariant = document.role === 'owner' ? 'default' : document.role === 'editor' ? 'secondary' : 'outline';

  return (
    <Link href={`/editor/${document.id}`}>
      <Card className="group h-full transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                  {document.title}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={roleBadgeVariant} className="text-xs capitalize">
                    {document.role}
                  </Badge>
                  {document.collaboratorCount > 1 && (
                    <span className="text-xs text-muted-foreground">
                      {document.collaboratorCount} collaborators
                    </span>
                  )}
                </div>
              </div>
            </div>
            {document.role === 'owner' && (
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity',
                  'text-muted-foreground hover:text-destructive',
                )}
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {document.content && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {document.content}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatRelativeDate(document.updatedAt)}</span>
            </div>
            {document.collaboratorCount > 1 && (
              <div className="flex -space-x-2">
                {Array.from({ length: Math.min(document.collaboratorCount, 3) }).map((_, i) => (
                  <Avatar key={i} className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      {String.fromCharCode(65 + i)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
