import { create } from 'zustand';

interface EditorState {
  
  activeDocId: string | null;
  
  title: string;
  
  isDirty: boolean;
  
  isReadOnly: boolean;
  
  role: 'owner' | 'editor' | 'viewer' | null;

  setActiveDocument: (docId: string, title: string, role: 'owner' | 'editor' | 'viewer') => void;
  setTitle: (title: string) => void;
  setDirty: (isDirty: boolean) => void;
  setReadOnly: (isReadOnly: boolean) => void;
  clearEditor: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activeDocId: null,
  title: '',
  isDirty: false,
  isReadOnly: false,
  role: null,

  setActiveDocument: (docId, title, role) =>
    set({
      activeDocId: docId,
      title,
      role,
      isReadOnly: role === 'viewer',
      isDirty: false,
    }),

  setTitle: (title) => set({ title }),

  setDirty: (isDirty) => set({ isDirty }),

  setReadOnly: (isReadOnly) => set({ isReadOnly }),

  clearEditor: () =>
    set({
      activeDocId: null,
      title: '',
      isDirty: false,
      isReadOnly: false,
      role: null,
    }),
}));
