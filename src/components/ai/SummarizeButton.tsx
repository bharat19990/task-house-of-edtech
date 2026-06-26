'use client';

import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SummarizeButtonProps {
  onSummarize: () => void;
  isLoading: boolean;
}

export function SummarizeButton({ onSummarize, isLoading }: SummarizeButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onSummarize}
      disabled={isLoading}
      className="gap-2 w-full"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 text-purple-500" />
      )}
      Summarize Document
    </Button>
  );
}
