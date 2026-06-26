'use client';

import type { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Code,
  Heading1, Heading2, Heading3, List, ListOrdered, Quote,
  Highlighter, CheckSquare, Undo, Redo, Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const tools = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), label: 'Bold' },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), label: 'Italic' },
    { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline'), label: 'Underline' },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike'), label: 'Strikethrough' },
    { icon: Code, action: () => editor.chain().focus().toggleCode().run(), active: editor.isActive('code'), label: 'Code' },
    { icon: Highlighter, action: () => editor.chain().focus().toggleHighlight().run(), active: editor.isActive('highlight'), label: 'Highlight' },
    'separator',
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }), label: 'Heading 1' },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }), label: 'Heading 2' },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }), label: 'Heading 3' },
    'separator',
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList'), label: 'Bullet List' },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList'), label: 'Ordered List' },
    { icon: CheckSquare, action: () => editor.chain().focus().toggleTaskList().run(), active: editor.isActive('taskList'), label: 'Task List' },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote'), label: 'Quote' },
    { icon: Minus, action: () => editor.chain().focus().setHorizontalRule().run(), active: false, label: 'Divider' },
    'separator',
    { icon: Undo, action: () => editor.chain().focus().undo().run(), active: false, label: 'Undo', disabled: !editor.can().undo() },
    { icon: Redo, action: () => editor.chain().focus().redo().run(), active: false, label: 'Redo', disabled: !editor.can().redo() },
  ] as const;

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b px-3 py-2 bg-background/50">
      {tools.map((tool, i) => {
        if (tool === 'separator') {
          return <div key={`sep-${i}`} className="w-px h-6 bg-border mx-1.5" />;
        }

        const Icon = tool.icon;
        const isDisabled = 'disabled' in tool ? tool.disabled : false;

        return (
          <Button
            key={tool.label}
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 rounded-md',
              tool.active && 'bg-accent text-accent-foreground',
            )}
            onClick={tool.action}
            disabled={isDisabled}
            title={tool.label}
            aria-label={tool.label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        );
      })}
    </div>
  );
}
