import { useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { availableMonitors, LogicalSize } from "@tauri-apps/api/window";
import { info, error } from "@tauri-apps/plugin-log";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { buildTheme } from "./theme";
import { DEFAULT_BG, WINDOW_WIDTH, WINDOW_HEIGHT_EXPANDED } from "./constants";
import { currentWindow, friendlyMonitorName, loadAnchor } from "./utils";
import { changelog } from "./changelog";
import type { DesktopInfo, DesktopSummary, Settings } from "./types";

import LoadingView from "./components/LoadingView";
import SetupView from "./components/SetupView";
import SessionChooserView from "./components/SessionChooserView";
import HistoryPickerView from "./components/HistoryPickerView";
import AccordionView from "./components/AccordionView";
import SettingsView from "./components/SettingsView";
import InfoView from "./components/InfoView";
import HistoryView from "./components/HistoryView";
import AnchorView from "./components/AnchorView";
import RenderModal from "./components/Modal";
import Layout from "./components/AccordionView/components/Layout";

import { useTodoStore, useTimerStore, useUIStore, useDesktopStore, useSettingsStore } from "./stores";

function App() {
  const displayIndex = useMemo(() => {
    const label = currentWindow.label;
    if (label === "main") return 0;
    const match = label.match(/^monitor-(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }, []);

  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);
  const monitorRef = useUIStore((s) => s.monitorRef);
  const desktopColor = useDesktopStore((s) => s.desktop.color);
  const flashing = useTimerStore((s) => {
    const t = s.timers[s.activeDesktop];
    return t?.flashing ?? false;
  });

  // ── Effective background for theme ──────────────────
  const effectiveBg = useMemo(() => {
    return desktopColor || DEFAULT_BG;
  }, [desktopColor]);

  const theme = useMemo(() => buildTheme(effectiveBg), [effectiveBg]);

  // ── Load settings on mount ─────────────────────────
  useEffect(() => {
    invoke<Settings>("get_settings")
      .then(async (s) => {
        info(`Settings loaded: setup_complete=${s.setup_complete}`);
        const settings = useSettingsStore.getState();
        settings.setDesktopCount(s.desktop_count);
        settings.setTimerPresets(() => s.timer_presets ?? [60, 300, 600]);
        settings.setNotifySystem(s.notify_system ?? true);
        settings.setNotifyFlash(s.notify_flash ?? true);
        settings.setHiddenPanels(s.hidden_panels ?? []);
        settings.setAutoHideDelay(s.auto_hide_delay ?? 0);
        if (!s.setup_complete) {
          info("Showing setup view");
          setView("setup");
          return;
        }
        try {
          const desktops = await invoke<DesktopSummary[]>("list_all_desktops");
          const hasData = desktops.some((d) => d.title || d.todo_count > 0);
          info(`Desktops loaded: hasData=${hasData}`);
          await useTodoStore.getState().loadAll(desktops.map((d) => d.space_id));
          useUIStore.getState().setHasExistingSession(hasData);
          setView("session-chooser");
        } catch {
          useUIStore.getState().setHasExistingSession(false);
          setView("session-chooser");
        }
      })
      .catch((err) => {
        error(`Failed to load settings: ${err}`);
        setView("setup");
      });
  }, [setView]);

  // ── Cross-window session action sync ─────────────────
  useEffect(() => {
    const unlisten = listen<{ action: string }>("session-action", (event) => {
      const currentView = useUIStore.getState().view;
      if (currentView !== "session-chooser") return;

      const { action } = event.payload;
      if (action === "continue") {
        setView("todos");
      } else if (action === "new") {
        useTodoStore.getState().clearAll();
        setView("todos");
      } else if (action === "history") {
        // The initiating window loads history data and navigates to history-picker.
        // Other windows just transition to todos since they can't share the loaded data.
        setView("todos");
      }
    });

    return () => { unlisten.then((fn) => fn()); };
  }, [setView]);

  // ── Fetch monitor info and refresh on monitor changes ──
  useEffect(() => {
    const refreshMonitorRef = () => {
      availableMonitors().then((monitors) => {
        info(`[monitorRef] ${monitors.length} monitor(s) found, displayIndex=${displayIndex}`);
        const m = monitors[displayIndex];
        if (m) {
          info(`[monitorRef] set for display ${displayIndex}: pos=(${m.position.x},${m.position.y}) size=(${m.size.width},${m.size.height}) scale=${m.scaleFactor}`);
          useUIStore.getState().setMonitorRef(m);
        } else {
          info(`[monitorRef] no monitor at index ${displayIndex}`);
        }
        const names: Record<number, string> = {};
        monitors.forEach((mon, i) => {
          names[i] = friendlyMonitorName(mon.name, i);
        });
        useDesktopStore.getState().setMonitorNames(names);
      });
    };

    // Initial fetch
    refreshMonitorRef();

    // Refresh when monitors are connected/disconnected
    const unlisten = listen("monitors-changed", () => {
      info("[monitorRef] monitors-changed event received, refreshing");
      refreshMonitorRef();
    });

    return () => { unlisten.then((fn) => fn()); };
  }, [displayIndex]);

  // ── Position window based on view, then reveal ──
  useEffect(() => {
    if (!monitorRef) return;

    const position = async () => {
      if (view === "session-chooser") {
        await currentWindow.setSize(new LogicalSize(WINDOW_WIDTH, WINDOW_HEIGHT_EXPANDED));
        await useUIStore.getState().snapToMonitor("middle-center");
      } else if (view === "todos") {
        const hiddenPanels = useSettingsStore.getState().hiddenPanels;
        await useUIStore.getState().resizeToFit(hiddenPanels);
        const saved = loadAnchor();
        if (saved !== "middle-center") {
          await useUIStore.getState().snapToMonitor(saved);
        }
      } else if (view === "settings" || view === "history" || view === "info") {
        // Use full expanded height for overlay views
        await currentWindow.setSize(new LogicalSize(WINDOW_WIDTH, WINDOW_HEIGHT_EXPANDED));
      } else {
        return;
      }
      currentWindow.show();
    };
    position();
  }, [view, monitorRef]);

  // ── Desktop detection (event-driven) + slow position poll ──
  useEffect(() => {
    if (view !== "todos") return;

    let prevId = useDesktopStore.getState().desktop.space_id;
    let autoHideInterval: ReturnType<typeof setInterval> | null = null;

    const clearAutoHide = () => {
      if (autoHideInterval) {
        clearInterval(autoHideInterval);
        autoHideInterval = null;
      }
      useUIStore.getState().setAutoHideCountdown(null);
      useUIStore.getState().setAutoHidePaused(false);
    };

    // Initial load: fetch current desktop via IPC
    invoke<DesktopInfo>("get_desktop", { display: displayIndex })
      .then((info) => {
        useDesktopStore.getState().setDesktop(() => info);
        prevId = info.space_id;
        useTimerStore.getState().setActiveDesktop(info.space_id);
        useTodoStore.getState().switchTo(info.space_id);
      })
      .catch(() => {
        // CGS API unavailable — fall back to whatever was in state
        useTimerStore.getState().setActiveDesktop(prevId);
        useTodoStore.getState().switchTo(prevId);
      });

    // Listen for space-change events from NSWorkspace observer
    const unlisten = listen<DesktopInfo[]>("desktop-changed", (event) => {
      const infos = event.payload;
      const info = infos[displayIndex];
      if (!info) return;

      useDesktopStore.getState().setDesktop(() => info);
      useUIStore.getState().refreshDisplayGroups();

      if (info.space_id !== prevId) {
        // Flush pending saves for old desktop
        const todoState = useTodoStore.getState();
        if (todoState.saveTimer) {
          clearTimeout(todoState.saveTimer);
          useTodoStore.setState({ saveTimer: null });
          todoState.saveTodos(prevId, todoState.allTodos[prevId] ?? []);
        }
        if (todoState.titleTimer) {
          clearTimeout(todoState.titleTimer);
          useTodoStore.setState({ titleTimer: null });
          todoState.saveTitle(prevId, todoState.allTitles[prevId] ?? "");
        }

        prevId = info.space_id;
        useTimerStore.getState().setActiveDesktop(info.space_id);
        useTodoStore.getState().switchTo(info.space_id);

        // Auto-hide countdown after desktop switch
        clearAutoHide();
        const delay = useSettingsStore.getState().autoHideDelay;
        if (delay > 0) {
          let remaining = delay;
          useUIStore.getState().setAutoHideCountdown(remaining);
          useUIStore.getState().setAutoHidePaused(false);
          autoHideInterval = setInterval(() => {
            if (useUIStore.getState().autoHidePaused) return;
            remaining -= 1;
            if (remaining <= 0) {
              clearAutoHide();
              currentWindow.hide();
            } else {
              useUIStore.getState().setAutoHideCountdown(remaining);
            }
          }, 1000);
        }
      }
    });

    // Event-driven position check — auto-snaps back when dragged off monitor
    const unlistenMoved = currentWindow.onMoved(() => {
      useUIStore.getState().checkPosition();
    });

    // Slower poll for collapse detection only (resize doesn't fire onMoved)
    const collapseId = setInterval(() => {
      useUIStore.getState().checkPosition();
    }, 2000);

    return () => {
      unlisten.then((fn) => fn());
      unlistenMoved.then((fn) => fn());
      clearInterval(collapseId);
      clearAutoHide();
    };
  }, [view, displayIndex]);

  // ── What's New version tracking ─────────────────────
  useEffect(() => {
    if (view !== "session-chooser") return;
    const latest = changelog[0];
    if (!latest) return;
    const lastSeen = localStorage.getItem("lastSeenVersion");
    if (lastSeen !== latest.version) {
      localStorage.setItem("lastSeenVersion", latest.version);
      useUIStore.getState().openModal("WHATS_NEW");
    }
  }, [view]);

  // ── Update check (production only) ──────────────────
  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (view !== "session-chooser") return;
    let cancelled = false;

    info("Checking for updates...");
    import("@tauri-apps/plugin-updater").then(({ check }) => {
      check().then((update) => {
        if (cancelled) return;
        if (!update) {
          info("No update available");
          return;
        }
        info(`Update available: ${update.version}`);
        useUIStore.getState().setUpdateAvailable({
          version: update.version,
          body: update.body ?? "",
          downloadAndInstall: (onEvent) => update.downloadAndInstall(onEvent),
        });
        useUIStore.getState().openModal("UPDATE");
      }).catch((err) => {
        error(`Update check failed: ${err}`);
      });
    }).catch((err) => {
      error(`Updater plugin not available: ${err}`);
    });

    return () => { cancelled = true; };
  }, [view]);

  // ── Accessibility check ──────────────────────────────
  useEffect(() => {
    if (view === "setup" || view === "settings" || view === "todos") {
      useSettingsStore.getState().checkAccessibility();
      const id = setInterval(() => {
        useSettingsStore.getState().checkAccessibility();
      }, 2000);
      return () => clearInterval(id);
    }
  }, [view]);

  // ── View router ───────────────────────────────────────
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout timerFlashing={flashing}>
        {view === "loading" && <LoadingView />}
        {view === "setup" && <SetupView />}
        {view === "session-chooser" && <SessionChooserView />}
        {view === "history-picker" && <HistoryPickerView />}
        {view === "todos" && <AccordionView displayIndex={displayIndex} />}
        {view === "settings" && <SettingsView />}
        {view === "history" && <HistoryView />}
        {view === "info" && <InfoView />}
        {view === "anchor" && <AnchorView />}
        <RenderModal />
      </Layout>
    </ThemeProvider>
  );
}

export default App;
