"use client";
import { create } from "zustand";
interface UiState {
  booted: boolean; skipRequested: boolean; cyberpunkOpen: boolean; activeJobId: string | null;
  setBooted: (v: boolean) => void; requestSkip: () => void; openCyberpunk: () => void; toggleCyberpunk: () => void; closeCyberpunk: () => void;
  setActiveJob: (id: string) => void;
}
export const useUiStore = create<UiState>((set) => ({
  booted: false, skipRequested: false, cyberpunkOpen: false, activeJobId: null,
  setBooted: (v) => set((s) => ({ booted: v, skipRequested: v ? false : s.skipRequested })),
  requestSkip: () => set({ skipRequested: true }),
  openCyberpunk: () => set({ cyberpunkOpen: true }),
  toggleCyberpunk: () => set((s) => ({ cyberpunkOpen: !s.cyberpunkOpen })),
  closeCyberpunk: () => set({ cyberpunkOpen: false }),
  setActiveJob: (id) => set({ activeJobId: id }),
}));
