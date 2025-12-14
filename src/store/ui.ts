import { create } from "zustand";

type UiState = {
  booted: boolean;
  skipRequested: boolean;
  cyberpunkOpen: boolean;
  setBooted: (value: boolean) => void;
  requestSkip: () => void;
  openCyberpunk: () => void;
  closeCyberpunk: () => void;
  toggleCyberpunk: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  booted: false,
  skipRequested: false,
  cyberpunkOpen: false,
  setBooted: (value) =>
    set((state) => ({
      booted: value,
      skipRequested: value ? false : state.skipRequested,
    })),
  requestSkip: () => set({ skipRequested: true }),
  openCyberpunk: () => set({ cyberpunkOpen: true }),
  closeCyberpunk: () => set({ cyberpunkOpen: false }),
  toggleCyberpunk: () => set((state) => ({ cyberpunkOpen: !state.cyberpunkOpen })),
}));
