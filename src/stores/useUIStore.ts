import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import {
  LogicalSize,
  PhysicalPosition,
  type Monitor,
} from "@tauri-apps/api/window";
import { currentWindow, loadAnchor, saveAnchor } from "../utils";
import { WINDOW_WIDTH, WINDOW_HEIGHT_EXPANDED, WINDOW_HEIGHT_COLLAPSED } from "../constants";
import type { AnchorPosition, ViewType, AccordionPanel, DisplayGroup } from "../types";
import { useSettingsStore } from "./useSettingsStore";

interface UIState {
  view: ViewType;
  collapsed: boolean;
  offMonitor: boolean;
  anchorPos: AnchorPosition;
  expandedPanel: AccordionPanel;
  displayGroups: DisplayGroup[];
  monitorRef: Monitor | null;

  setView: (v: ViewType) => void;
  setCollapsed: (c: boolean) => void;
  setOffMonitor: (o: boolean) => void;
  setAnchorPos: (p: AnchorPosition) => void;
  setExpandedPanel: (p: AccordionPanel) => void;
  setDisplayGroups: (g: DisplayGroup[]) => void;
  setMonitorRef: (m: Monitor | null) => void;

  checkPosition: () => Promise<void>;
  snapToMonitor: (overrideAnchor?: AnchorPosition) => Promise<void>;
  toggleMinimize: () => Promise<void>;
  selectAnchor: (pos: AnchorPosition) => void;
  refreshDisplayGroups: () => Promise<void>;
  changePanel: (panel: AccordionPanel) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  view: "loading",
  collapsed: false,
  offMonitor: false,
  anchorPos: loadAnchor(),
  expandedPanel: "queue",
  displayGroups: [],
  monitorRef: null,

  setView: (v) => set({ view: v }),
  setCollapsed: (c) => set({ collapsed: c }),
  setOffMonitor: (o) => set({ offMonitor: o }),
  setAnchorPos: (p) => set({ anchorPos: p }),
  setExpandedPanel: (p) => set({ expandedPanel: p }),
  setDisplayGroups: (g) => set({ displayGroups: g }),
  setMonitorRef: (m) => set({ monitorRef: m }),

  checkPosition: async () => {
    const m = get().monitorRef;
    if (!m) return;

    try {
      const pos = await currentWindow.outerPosition();
      const size = await currentWindow.outerSize();
      const cx = pos.x + size.width / 2;
      const cy = pos.y + size.height / 2;
      const mx = m.position.x;
      const my = m.position.y;
      const mw = m.size.width;
      const mh = m.size.height;
      const isOn = cx >= mx && cx < mx + mw && cy >= my && cy < my + mh;
      set({ offMonitor: !isOn });

      const sf = m.scaleFactor;
      const logicalHeight = size.height / sf;
      const threshold = (WINDOW_HEIGHT_COLLAPSED + WINDOW_HEIGHT_EXPANDED) / 2;
      set({ collapsed: logicalHeight < threshold });
    } catch {
      // ignore
    }
  },

  snapToMonitor: async (overrideAnchor) => {
    const m = get().monitorRef;
    const anchorPos = overrideAnchor ?? get().anchorPos;
    if (!m) return;

    try {
      const size = await currentWindow.outerSize();
      const sf = m.scaleFactor;
      const padding = Math.round(16 * sf);
      const menuBar = Math.round(32 * sf);
      const mx = m.position.x;
      const my = m.position.y;
      const mw = m.size.width;
      const mh = m.size.height;
      const ww = size.width;
      const wh = size.height;

      let x: number;
      if (anchorPos.includes("left")) x = mx + padding;
      else if (anchorPos.includes("center")) x = mx + Math.round((mw - ww) / 2);
      else x = mx + mw - ww - padding;

      let y: number;
      if (anchorPos.startsWith("top")) y = my + menuBar;
      else if (anchorPos.startsWith("middle")) y = my + Math.round((mh - wh) / 2);
      else y = my + mh - wh - padding;

      await currentWindow.setPosition(new PhysicalPosition(x, y));
      set({ offMonitor: false });
    } catch {
      // ignore
    }
  },

  toggleMinimize: async () => {
    const { collapsed, monitorRef } = get();
    const next = !collapsed;
    const pos = await currentWindow.outerPosition();
    const oldSize = await currentWindow.outerSize();

    await currentWindow.setSize(
      new LogicalSize(WINDOW_WIDTH, next ? WINDOW_HEIGHT_COLLAPSED : WINDOW_HEIGHT_EXPANDED)
    );

    if (monitorRef) {
      const newSize = await currentWindow.outerSize();
      const dh = oldSize.height - newSize.height;
      const midY = pos.y + oldSize.height / 2;
      const monMidY = monitorRef.position.y + monitorRef.size.height / 2;
      if (midY > monMidY) {
        await currentWindow.setPosition(new PhysicalPosition(pos.x, pos.y + dh));
      }
    }
  },

  selectAnchor: (pos) => {
    set({ anchorPos: pos });
    saveAnchor(pos);
    get().snapToMonitor(pos);
  },

  refreshDisplayGroups: async () => {
    try {
      const groups = await invoke<DisplayGroup[]>("list_desktops_grouped");
      set({ displayGroups: groups });
    } catch {
      set({ displayGroups: [] });
    }
  },

  changePanel: (panel) => {
    set({ expandedPanel: panel });
    if (panel === "desktops") get().refreshDisplayGroups();
  },
}));
