import { useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { availableMonitors } from "@tauri-apps/api/window";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { buildTheme } from "./theme";
import { DEFAULT_BG } from "./constants";
import { currentWindow, friendlyMonitorName, loadAnchor } from "./utils";
import { changelog } from "./changelog";
import type { DesktopInfo, DesktopSummary, Settings, ViewType } from "./types";

import LoadingView from "./components/LoadingView";
import SetupView from "./components/SetupView";
import SessionChooserView from "./components/SessionChooserView";
import HistoryPickerView from "./components/HistoryPickerView";
import AccordionView from "./components/AccordionView";
import SettingsView from "./components/SettingsView";
import UpdateBanner from "./components/UpdateBanner";

import { useTodoStore, useUIStore, useDesktopStore, useSettingsStore } from "./stores";

function App() {
  const displayIndex = useMemo(() => {
    const label = currentWindow.label;
    if (label === "main") return 0;
    const match = label.match(/^monitor-(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }, []);

  const view = useUIStore((s) => s.view);
  const setView = useUIStore((s) => s.setView);
  const desktopColor = useDesktopStore((s) => s.desktop.color);
  const expandedPanel = useUIStore((s) => s.expandedPanel);

  // ── Effective background for theme ──────────────────
  const effectiveBg = useMemo(() => {
    const fixedViews: ViewType[] = ["loading", "setup", "session-chooser", "history-picker"];
    return fixedViews.includes(view) ? DEFAULT_BG : desktopColor;
  }, [view, desktopColor]);

  const theme = useMemo(() => buildTheme(effectiveBg), [effectiveBg]);

  // ── Load settings on mount ─────────────────────────
  useEffect(() => {
    invoke<Settings>("get_settings")
      .then(async (s) => {
        const settings = useSettingsStore.getState();
        settings.setDesktopCount(s.desktop_count);
        settings.setTimerPresets(() => s.timer_presets ?? [60, 300, 600]);
        settings.setNotifySystem(s.notify_system ?? true);
        settings.setNotifyFlash(s.notify_flash ?? true);
        if (!s.setup_complete) {
          setView("setup");
          return;
        }
        try {
          const desktops = await invoke<DesktopSummary[]>("list_all_desktops");
          const hasData = desktops.some((d) => d.title || d.todo_count > 0);
          setView(hasData ? "session-chooser" : "todos");
        } catch {
          setView("todos");
        }
      })
      .catch(() => {
        setView("setup");
      });
  }, [setView]);

  // ── Fetch monitor info once ───────────────────────────
  useEffect(() => {
    availableMonitors().then((monitors) => {
      const m = monitors[displayIndex];
      if (m) {
        useUIStore.getState().setMonitorRef(m);
      }
      const names: Record<number, string> = {};
      monitors.forEach((mon, i) => {
        names[i] = friendlyMonitorName(mon.name, i);
      });
      useDesktopStore.getState().setMonitorNames(names);
    });
  }, [displayIndex]);

  // ── Desktop polling ───────────────────────────────────
  useEffect(() => {
    if (view !== "todos") return;

    let prevId = useDesktopStore.getState().desktop.space_id;

    // Initial load
    useTodoStore.getState().loadTodos(prevId);
    useTodoStore.getState().loadTitle(prevId);

    const poll = async () => {
      try {
        const info = await invoke<DesktopInfo>("get_desktop", { display: displayIndex });
        useDesktopStore.getState().setDesktop(() => info);

        if (info.space_id !== prevId) {
          // Flush pending save for old desktop
          const todoState = useTodoStore.getState();
          if (todoState.saveTimer) {
            clearTimeout(todoState.saveTimer);
            useTodoStore.setState({ saveTimer: null });
          }
          todoState.saveTodos(prevId, todoState.todos);

          prevId = info.space_id;
          await useTodoStore.getState().loadTodos(info.space_id);
          await useTodoStore.getState().loadTitle(info.space_id);
        }
      } catch {
        // CGS API unavailable
      }
      useUIStore.getState().checkPosition();
    };

    poll();
    const id = setInterval(poll, 200);
    return () => clearInterval(id);
  }, [view, displayIndex]);

  // ── Anchor init ────────────────────────────────────────
  useEffect(() => {
    if (view !== "todos") return;
    const saved = loadAnchor();
    if (saved !== "top-right") useUIStore.getState().snapToMonitor(saved);
  }, [view]);

  // ── What's New check ─────────────────────────────────
  useEffect(() => {
    if (view !== "todos") return;
    const latest = changelog[0];
    if (!latest) return;
    const lastSeen = localStorage.getItem("lastSeenVersion");
    if (lastSeen !== latest.version) {
      localStorage.setItem("lastSeenVersion", latest.version);
      useUIStore.getState().setShowWhatsNew(true);
      setView("settings");
    }
  }, [view, setView]);

  // ── Update check ────────────────────────────────────
  useEffect(() => {
    if (view !== "todos") return;
    let cancelled = false;

    import("@tauri-apps/plugin-updater").then(({ check }) => {
      check().then((update) => {
        if (cancelled || !update) return;
        useUIStore.getState().setUpdateAvailable({
          version: update.version,
          body: update.body ?? "",
          downloadAndInstall: (onEvent) => update.downloadAndInstall(onEvent),
        });
      }).catch(() => {
        // offline or no update — ignore
      });
    }).catch(() => {
      // plugin not available in dev — ignore
    });

    return () => { cancelled = true; };
  }, [view]);

  // ── Accessibility check ──────────────────────────────
  useEffect(() => {
    if (view === "setup" || view === "settings") {
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
      {view === "loading" && <LoadingView />}
      {view === "setup" && <SetupView />}
      {view === "session-chooser" && <SessionChooserView />}
      {view === "history-picker" && <HistoryPickerView />}
      {view === "todos" && <AccordionView displayIndex={displayIndex} />}
      {view === "settings" && <SettingsView />}
      <UpdateBanner />
    </ThemeProvider>
  );
}

export default App;
