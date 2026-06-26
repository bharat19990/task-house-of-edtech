'use client';

import { useEditor as useTiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import type { Doc as YDoc } from 'yjs';

export function useEditor({
  doc,
  provider,
  userName,
  userColor,
  isReadOnly = false,
}: {
  doc: YDoc | null;
  provider: { awareness: unknown } | null;
  userName: string;
  userColor: string;
  isReadOnly?: boolean;
}) {
  const editor = useTiptapEditor(
    {
      editable: !isReadOnly,
      extensions: [
        StarterKit.configure({
          history: false, 
        }),
        Placeholder.configure({
          placeholder: 'Start writing...',
        }),
        Underline,
        Highlight.configure({
          multicolor: true,
        }),
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        ...(doc
          ? [
              Collaboration.configure({
                document: doc,
              }),
            ]
          : []),
        ...(provider && doc
          ? [
              CollaborationCursor.configure({
                
                provider: provider as any,
                user: {
                  name: userName,
                  color: userColor,
                },
              }),
            ]
          : []),
      ],
      editorProps: {
        attributes: {
          class: 'tiptap prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none',
        },
      },
    },
    [doc, provider, isReadOnly],
  );

  return editor;
}
