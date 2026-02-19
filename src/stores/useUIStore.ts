import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import {
  LogicalSize,
  PhysicalPosition,
  type Monitor,
} from "@tauri-apps/api/window";
import { info, error as logError } from "@tauri-apps/plugin-log";
import { currentWindow, loadAnchor, saveAnchor } from "../utils";
import { WINDOW_WIDTH, WINDOW_HEIGHT_EXPANDED, WINDOW_HEIGHT_COLLAPSED, computeExpandedHeight } from "../constants";
import type { AnchorPosition, ViewType, DisplayGroup } from "../types";
import { calculateSnapPosition } from "../snapPosition";
import { useSettingsStore } from "./useSettingsStore";

interface UIState {
  view: ViewType;
  collapsed: boolean;
  anchorPos: AnchorPosition;
  displayGroups: DisplayGroup[];
  monitorRef: Monitor | null;
  showWhatsNew: boolean;
  updateAvailable: { version: string; body: string; downloadAndInstall: (onEvent?: (event: any) => void) => Promise<void> } | null;
  updateStatus: "idle" | "downloading" | "error";
  settingsTab: number;
  hasExistingSession: boolean;
  autoHideCountdown: number | null;
  autoHidePaused: boolean;

  setView: (v: ViewType) => void;
  setCollapsed: (c: boolean) => void;
  setAnchorPos: (p: AnchorPosition) => void;
  setDisplayGroups: (g: DisplayGroup[]) => void;
  setMonitorRef: (m: Monitor | null) => void;
  setShowWhatsNew: (v: boolean) => void;
  setUpdateAvailable: (u: UIState["updateAvailable"]) => void;
  setUpdateStatus: (s: UIState["updateStatus"]) => void;
  setSettingsTab: (t: number) => void;
  setHasExistingSession: (v: boolean) => void;
  dismissUpdate: () => void;
  setAutoHideCountdown: (v: number | null) => void;
  setAutoHidePaused: (v: boolean) => void;

  checkPosition: () => Promise<void>;
  snapToMonitor: (overrideAnchor?: AnchorPosition) => Promise<void>;
  toggleMinimize: () => Promise<void>;
  selectAnchor: (pos: AnchorPosition) => void;
  markDragged: () => void;
  resizeToFit: (hiddenPanels: string[]) => Promise<void>;
  refreshDisplayGroups: () => Promise<void>;
}

let lastPos: { x: number; y: number } | null = null;
let snapping = false;

export const useUIStore = create<UIState>((set, get) => ({
  view: "loading",
  collapsed: false,
  anchorPos: loadAnchor(),
  displayGroups: [],
  monitorRef: null,
  showWhatsNew: false,
  updateAvailable: null,
  updateStatus: "idle",
  settingsTab: 0,
  hasExistingSession: false,
  autoHideCountdown: null,
  autoHidePaused: false,

  setView: (v) => set({ view: v }),
  setCollapsed: (c) => set({ collapsed: c }),
  setAnchorPos: (p) => set({ anchorPos: p }),
  setDisplayGroups: (g) => set({ displayGroups: g }),
  setMonitorRef: (m) => set({ monitorRef: m }),
  setShowWhatsNew: (v) => set({ showWhatsNew: v }),
  setUpdateAvailable: (u) => set({ updateAvailable: u }),
  setUpdateStatus: (s) => set({ updateStatus: s }),
  setSettingsTab: (t) => set({ settingsTab: t }),
  setHasExistingSession: (v) => set({ hasExistingSession: v }),
  dismissUpdate: () => set({ updateAvailable: null, updateStatus: "idle" }),
  setAutoHideCountdown: (v) => set({ autoHideCountdown: v }),
  setAutoHidePaused: (v) => set({ autoHidePaused: v }),

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

      // Detect user drag — if position changed and we're not programmatically snapping
      if (lastPos && !snapping && (pos.x !== lastPos.x || pos.y !== lastPos.y)) {
        if (get().anchorPos !== "middle-center") {
          set({ anchorPos: "middle-center" });
          saveAnchor("middle-center");
        }
      }
      lastPos = { x: pos.x, y: pos.y };

      // Auto-snap back only when anchored (not free move)
      if (!isOn && get().anchorPos !== "middle-center") {
        info(`[checkPosition] window off monitor, snapping back: center=(${cx},${cy}) monitor=(${mx},${my},${mw},${mh})`);
        get().snapToMonitor();
        return;
      }

      const sf = m.scaleFactor;
      const logicalHeight = size.height / sf;
      const hiddenPanels = useSettingsStore.getState().hiddenPanels;
      const expandedHeight = computeExpandedHeight(hiddenPanels);
      const threshold = (WINDOW_HEIGHT_COLLAPSED + expandedHeight) / 2;
      set({ collapsed: logicalHeight < threshold });
    } catch (err) {
      logError(`[checkPosition] error: ${err}`);
    }
  },

  snapToMonitor: async (overrideAnchor) => {
    const m = get().monitorRef;
    const anchorPos = overrideAnchor ?? get().anchorPos;
    if (!m) return;

    try {
      snapping = true;
      const size = await currentWindow.outerSize();
      const { x, y } = calculateSnapPosition(
        anchorPos,
        {
          x: m.position.x,
          y: m.position.y,
          width: m.size.width,
          height: m.size.height,
          scaleFactor: m.scaleFactor,
        },
        { width: size.width, height: size.height },
      );

      lastPos = { x, y };
      await currentWindow.setPosition(new PhysicalPosition(x, y));
    } catch {
      // ignore
    } finally {
      snapping = false;
    }
  },

  toggleMinimize: async () => {
    const { collapsed, monitorRef } = get();
    const next = !collapsed;
    const pos = await currentWindow.outerPosition();
    const oldSize = await currentWindow.outerSize();

    const hiddenPanels = useSettingsStore.getState().hiddenPanels;
    const expandedHeight = computeExpandedHeight(hiddenPanels);
    await currentWindow.setSize(
      new LogicalSize(WINDOW_WIDTH, next ? WINDOW_HEIGHT_COLLAPSED : expandedHeight)
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
    if (pos !== "middle-center") get().snapToMonitor(pos);
  },

  markDragged: () => {
    if (get().anchorPos !== "middle-center") {
      set({ anchorPos: "middle-center" });
      saveAnchor("middle-center");
    }
  },

  resizeToFit: async (hiddenPanels) => {
    const { collapsed, anchorPos, view } = get();
    if (collapsed || view !== "todos") return;
    const newHeight = computeExpandedHeight(hiddenPanels);
    try {
      await currentWindow.setSize(new LogicalSize(WINDOW_WIDTH, newHeight));
      if (anchorPos !== "middle-center") {
        await get().snapToMonitor();
      }
    } catch {
      // ignore
    }
  },

  refreshDisplayGroups: async () => {
    try {
      const groups = await invoke<DisplayGroup[]>("list_desktops_grouped");
      set({ displayGroups: groups });
    } catch {
      set({ displayGroups: [] });
    }
  },

}));
