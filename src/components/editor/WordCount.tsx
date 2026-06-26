'use client';

import type { Editor } from '@tiptap/react';

interface WordCountProps {
  editor: Editor | null;
}

export function WordCount({ editor }: WordCountProps) {
  if (!editor) return null;

  const text = editor.getText();
  const words = text.split(/\s+/).filter((w) => w.length > 0).length;
  const chars = text.length;

  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span>{words} word{words !== 1 ? 's' : ''}</span>
      <span className="h-3 w-px bg-border" />
      <span>{chars} char{chars !== 1 ? 's' : ''}</span>
    </div>
  );
}
