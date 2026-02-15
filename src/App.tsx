import { useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { availableMonitors } from "@tauri-apps/api/window";
import { info, error } from "@tauri-apps/plugin-log";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { buildTheme } from "./theme";
import { DEFAULT_BG } from "./constants";
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
import UpdateBanner from "./components/UpdateBanner";
import WhatsNewModal from "./components/WhatsNewModal";
import HeaderNav from "./components/AccordionView/components/HeaderNav";
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
        if (!s.setup_complete) {
          info("Showing setup view");
          setView("setup");
          return;
        }
        try {
          const desktops = await invoke<DesktopSummary[]>("list_all_desktops");
          const hasData = desktops.some((d) => d.title || d.todo_count > 0);
          info(`Desktops loaded: hasData=${hasData}, showing ${hasData ? "session-chooser" : "todos"}`);
          setView(hasData ? "session-chooser" : "todos");
        } catch {
          setView("todos");
        }
      })
      .catch((err) => {
        error(`Failed to load settings: ${err}`);
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
    useTimerStore.getState().setActiveDesktop(prevId);
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
          useTimerStore.getState().setActiveDesktop(info.space_id);
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

  // ── Anchor init (once on first load) ─────────────────────
  useEffect(() => {
    const saved = loadAnchor();
    if (saved !== "top-right") useUIStore.getState().snapToMonitor(saved);
  }, []);

  // ── What's New version tracking ─────────────────────
  useEffect(() => {
    if (view !== "todos") return;
    const latest = changelog[0];
    if (!latest) return;
    const lastSeen = localStorage.getItem("lastSeenVersion");
    if (lastSeen !== latest.version) {
      localStorage.setItem("lastSeenVersion", latest.version);
      useUIStore.getState().setShowWhatsNew(true);
    }
  }, [view]);

  // ── Update check ────────────────────────────────────
  useEffect(() => {
    if (view !== "todos") return;
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
        {(view === "todos" || view === "settings" || view === "info") && <HeaderNav />}
        {view === "todos" && <AccordionView displayIndex={displayIndex} />}
        {view === "settings" && <SettingsView />}
        {view === "info" && <InfoView />}
        <UpdateBanner />
        <WhatsNewModal />
      </Layout>
    </ThemeProvider>
  );
}

export default App;
