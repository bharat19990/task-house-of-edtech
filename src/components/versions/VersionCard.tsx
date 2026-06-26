'use client';

import { formatDateTime } from '@/lib/utils/formatDate';
import { Clock, User } from 'lucide-react';
import type { VersionData } from '@/types/version';

interface VersionCardProps {
  version: VersionData;
  onPreview: () => void;
  onRestore?: () => void;
  canRestore: boolean;
}

export function VersionCard({ version, onPreview, onRestore, canRestore }: VersionCardProps) {
  return (
    <div className="group relative pl-8 pb-6 last:pb-0">
      {}
      <div className="absolute left-0 top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background group-hover:bg-primary transition-colors" />
      {}
      <div className="absolute left-[5px] top-4 bottom-0 w-0.5 bg-border group-last:hidden" />

      <div className="space-y-1.5">
        <h4 className="text-sm font-medium">{version.label}</h4>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {version.createdByName}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDateTime(version.createdAt)}
          </span>
        </div>
        {version.contentSnapshot && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{version.contentSnapshot}</p>
        )}
        <div className="flex gap-2 mt-2">
          <button
            onClick={onPreview}
            className="text-xs text-primary hover:underline"
          >
            Preview
          </button>
          {canRestore && onRestore && (
            <button
              onClick={onRestore}
              className="text-xs text-amber-600 hover:underline"
            >
              Restore
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
