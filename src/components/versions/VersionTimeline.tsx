'use client';

import type { VersionData } from '@/types/version';
import { VersionCard } from './VersionCard';
import { Loader2 } from 'lucide-react';

interface VersionTimelineProps {
  versions: VersionData[];
  isLoading: boolean;
  canRestore: boolean;
  onPreview: (version: VersionData) => void;
  onRestore: (versionId: string) => void;
}

export function VersionTimeline({ versions, isLoading, canRestore, onPreview, onRestore }: VersionTimelineProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No versions saved yet</p>
        <p className="text-xs text-muted-foreground mt-1">Press Ctrl+S to save a version</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {versions.map((version) => (
        <VersionCard
          key={version.id}
          version={version}
          canRestore={canRestore}
          onPreview={() => onPreview(version)}
          onRestore={() => onRestore(version.id)}
        />
      ))}
    </div>
  );
}
