'use client';

import { X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SummarizeButton } from './SummarizeButton';
import { ImproveWritingButton } from './ImproveWritingButton';
import { useState, useCallback } from 'react';
import type { Editor } from '@tiptap/react';

interface AIAssistantPanelProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  summaryResult: string;
  improveResult: string;
  isLoadingSummary: boolean;
  isLoadingImprove: boolean;
  onSummarize: (content: string) => void;
  onImprove: (text: string) => void;
}

export function AIAssistantPanel({
  editor, isOpen, onClose,
  summaryResult, improveResult,
  isLoadingSummary, isLoadingImprove,
  onSummarize, onImprove,
}: AIAssistantPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleSummarize = useCallback(() => {
    if (!editor) return;
    const content = editor.getText();
    if (content.trim()) onSummarize(content);
  }, [editor, onSummarize]);

  const handleImprove = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (selectedText.trim()) onImprove(selectedText);
  }, [editor, onImprove]);

  const handleApplyImproved = useCallback(() => {
    if (!editor || !improveResult) return;
    const { from, to } = editor.state.selection;
    editor.chain().focus().deleteRange({ from, to }).insertContent(improveResult).run();
  }, [editor, improveResult]);

  const handleCopy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const hasSelection = editor ? !editor.state.selection.empty : false;

  if (!isOpen) return null;

  return (
    <div className="w-80 border-l bg-background h-full flex flex-col animate-slide-in-right">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="bg-gradient-to-r from-purple-500 to-blue-500 bg-clip-text text-transparent">
            AI Assistant
          </span>
        </h3>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {}
          <div className="space-y-3">
            <SummarizeButton onSummarize={handleSummarize} isLoading={isLoadingSummary} />
            {summaryResult && (
              <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Summary</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleCopy(summaryResult)}
                  >
                    {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <p className="text-sm leading-relaxed">{summaryResult}</p>
              </div>
            )}
          </div>

          {}
          <div className="space-y-3">
            <ImproveWritingButton
              onImprove={handleImprove}
              isLoading={isLoadingImprove}
              hasSelection={hasSelection}
            />
            {!hasSelection && (
              <p className="text-xs text-muted-foreground">
                Select text in the editor to improve it
              </p>
            )}
            {improveResult && (
              <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Improved</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(improveResult)}
                    >
                      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <p className="text-sm leading-relaxed">{improveResult}</p>
                <Button size="sm" onClick={handleApplyImproved} className="w-full mt-2">
                  Apply to Editor
                </Button>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
