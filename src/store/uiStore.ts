import { create } from 'zustand';

interface UIState {
  
  isVersionPanelOpen: boolean;
  
  isCollaboratorPanelOpen: boolean;
  
  isAIPanelOpen: boolean;
  
  isCreateModalOpen: boolean;

  toggleVersionPanel: () => void;
  toggleCollaboratorPanel: () => void;
  toggleAIPanel: () => void;
  setCreateModalOpen: (open: boolean) => void;
  closeAllPanels: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isVersionPanelOpen: false,
  isCollaboratorPanelOpen: false,
  isAIPanelOpen: false,
  isCreateModalOpen: false,

  toggleVersionPanel: () =>
    set((state) => ({
      isVersionPanelOpen: !state.isVersionPanelOpen,
      isCollaboratorPanelOpen: false,
      isAIPanelOpen: false,
    })),

  toggleCollaboratorPanel: () =>
    set((state) => ({
      isCollaboratorPanelOpen: !state.isCollaboratorPanelOpen,
      isVersionPanelOpen: false,
      isAIPanelOpen: false,
    })),

  toggleAIPanel: () =>
    set((state) => ({
      isAIPanelOpen: !state.isAIPanelOpen,
      isVersionPanelOpen: false,
      isCollaboratorPanelOpen: false,
    })),

  setCreateModalOpen: (open) => set({ isCreateModalOpen: open }),

  closeAllPanels: () =>
    set({
      isVersionPanelOpen: false,
      isCollaboratorPanelOpen: false,
      isAIPanelOpen: false,
    }),
}));
