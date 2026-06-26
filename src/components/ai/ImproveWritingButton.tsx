'use client';

import { Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImproveWritingButtonProps {
  onImprove: () => void;
  isLoading: boolean;
  hasSelection: boolean;
}

export function ImproveWritingButton({ onImprove, isLoading, hasSelection }: ImproveWritingButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onImprove}
      disabled={isLoading || !hasSelection}
      className="gap-2 w-full"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Wand2 className="h-4 w-4 text-blue-500" />
      )}
      Improve Writing
    </Button>
  );
}
