import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { DesktopInfo, ContextHistory } from "../types";

interface DesktopState {
  desktop: DesktopInfo;
  contextHistory: ContextHistory;
  monitorNames: Record<number, string>;

  setDesktop: (fn: (prev: DesktopInfo) => DesktopInfo) => void;
  setContextHistory: (h: ContextHistory) => void;
  setMonitorNames: (names: Record<number, string>) => void;

  switchDesktop: (displayIndex: number, spaceId: number) => void;
}

export const useDesktopStore = create<DesktopState>((set) => ({
  desktop: {
    space_id: 0,
    position: 0,
    name: "Desktop 1",
    color: "#F5E6A3",
  },
  contextHistory: {},
  monitorNames: {},

  setDesktop: (fn) => set((state) => ({ desktop: fn(state.desktop) })),
  setContextHistory: (h) => set({ contextHistory: h }),
  setMonitorNames: (names) => set({ monitorNames: names }),

  switchDesktop: (displayIndex, spaceId) => {
    invoke("switch_desktop", { display: displayIndex, target: spaceId }).catch(() => {});
  },
}));
