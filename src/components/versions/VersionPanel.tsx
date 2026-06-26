'use client';

import { X, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VersionTimeline } from './VersionTimeline';
import type { VersionData } from '@/types/version';
import { useState } from 'react';

interface VersionPanelProps {
  docId: string;
  versions: VersionData[];
  isLoading: boolean;
  canRestore: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSaveVersion: (label: string) => void;
  onPreview: (version: VersionData) => void;
  onRestore: (versionId: string) => void;
}

export function VersionPanel({
  versions, isLoading, canRestore, isOpen, onClose,
  onSaveVersion, onPreview, onRestore,
}: VersionPanelProps) {
  const [label, setLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!label.trim()) return;
    setIsSaving(true);
    try {
      onSaveVersion(label.trim());
      setLabel('');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l bg-background h-full flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Version History</h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {}
      <div className="p-4 border-b space-y-3">
        <Input
          placeholder="Version label..."
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          disabled={isSaving}
        />
        <Button size="sm" onClick={handleSave} disabled={isSaving || !label.trim()} className="w-full gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Version
        </Button>
      </div>

      {}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <VersionTimeline
            versions={versions}
            isLoading={isLoading}
            canRestore={canRestore}
            onPreview={onPreview}
            onRestore={onRestore}
          />
        </div>
      </ScrollArea>
    </div>
  );
}
