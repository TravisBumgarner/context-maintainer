import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { SpaceInfo, DesktopInfo } from "../types";

interface SettingsState {
  timerPresets: number[];
  notifySystem: boolean;
  notifyFlash: boolean;
  desktopCount: number;
  accessibilityGranted: boolean | null;
  allSpaces: SpaceInfo[];

  setTimerPresets: (fn: (prev: number[]) => number[]) => void;
  setNotifySystem: (v: boolean) => void;
  setNotifyFlash: (v: boolean) => void;
  setDesktopCount: (n: number) => void;
  setAccessibilityGranted: (v: boolean) => void;
  setAllSpaces: (s: SpaceInfo[]) => void;

  refreshSpaces: () => void;
  checkAccessibility: () => void;
  applyTheme: (colors: string[], desktopCount: number, desktop: DesktopInfo, setDesktop: (fn: (prev: DesktopInfo) => DesktopInfo) => void, refreshSpaces: () => void) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  timerPresets: [60, 300, 600],
  notifySystem: true,
  notifyFlash: true,
  desktopCount: 10,
  accessibilityGranted: null,
  allSpaces: [],

  setTimerPresets: (fn) => set((state) => ({ timerPresets: fn(state.timerPresets) })),
  setNotifySystem: (v) => set({ notifySystem: v }),
  setNotifyFlash: (v) => set({ notifyFlash: v }),
  setDesktopCount: (n) => set({ desktopCount: n }),
  setAccessibilityGranted: (v) => set({ accessibilityGranted: v }),
  setAllSpaces: (s) => set({ allSpaces: s }),

  refreshSpaces: () => {
    invoke<SpaceInfo[]>("list_all_spaces")
      .then((spaces) => set({ allSpaces: spaces }))
      .catch(() => set({ allSpaces: [] }));
  },

  checkAccessibility: () => {
    invoke<boolean>("check_accessibility")
      .then((granted) => set({ accessibilityGranted: granted }))
      .catch(() => {});
  },

  applyTheme: (colors, desktopCount, desktop, setDesktop, refreshSpaces) => {
    const padded = Array.from({ length: desktopCount }, (_, i) => colors[i % colors.length]);
    invoke("apply_theme", { colors: padded })
      .then(() => {
        refreshSpaces();
        const newColor = padded[desktop.position] ?? padded[0];
        setDesktop((prev) => ({ ...prev, color: newColor }));
      })
      .catch(() => {});
  },
}));
