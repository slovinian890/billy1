import { create } from "zustand";

interface ToastState {
  message: string | null;
  icon?: string;
  show: (message: string, icon?: string) => void;
  hide: () => void;
}

/**
 * Tiny global store so any screen can trigger the dark toast at the root
 * layout without threading callbacks through every component.
 */
export const useToastStore = create<ToastState>((set) => ({
  message: null,
  icon: undefined,
  show: (message, icon) => set({ message, icon }),
  hide: () => set({ message: null, icon: undefined }),
}));
