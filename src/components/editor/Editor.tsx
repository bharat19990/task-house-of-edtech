'use client';

import { EditorContent, type Editor as TiptapEditor } from '@tiptap/react';

interface EditorProps {
  editor: TiptapEditor | null;
}

export function Editor({ editor }: EditorProps) {
  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-[500px] text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading editor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <EditorContent editor={editor} className="min-h-[500px]" />
    </div>
  );
}
