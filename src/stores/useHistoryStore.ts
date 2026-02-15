import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { CompletedItem } from "../types";

interface HistoryState {
  items: CompletedItem[];
  loadHistory: () => Promise<void>;
  addCompleted: (text: string, desktopId: number) => Promise<void>;
  clearHistory: () => Promise<void>;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  items: [],

  loadHistory: async () => {
    try {
      const items = await invoke<CompletedItem[]>("get_completed");
      set({ items });
    } catch {
      set({ items: [] });
    }
  },

  addCompleted: async (text, desktopId) => {
    await invoke("add_completed", { text, desktopId });
  },

  clearHistory: async () => {
    await invoke("clear_completed");
    set({ items: [] });
  },
}));
