import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  availableMonitors,
  LogicalSize,
  PhysicalPosition,
  type Monitor,
} from "@tauri-apps/api/window";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { buildTheme } from "./theme";
import { DEFAULT_BG } from "./constants";
import {
  currentWindow,
  friendlyMonitorName,
  loadAnchor,
  saveAnchor,
} from "./utils";
import type {
  AnchorPosition,
  DesktopInfo,
  DesktopSummary,
  TodoItem,
  SpaceInfo,
  ContextHistory,
  DisplayGroup,
  Settings,
  ViewType,
  AccordionPanel,
} from "./types";

import LoadingView from "./components/LoadingView";
import SetupView from "./components/SetupView";
import SessionChooserView from "./components/SessionChooserView";
import HistoryPickerView from "./components/HistoryPickerView";
import AccordionView from "./components/AccordionView";

function App() {
  const displayIndex = useMemo(() => {
    const label = currentWindow.label;
    if (label === "main") return 0;
    const match = label.match(/^monitor-(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }, []);

  const [view, setView] = useState<ViewType>("loading");
  const [monitorName, setMonitorName] = useState(`Screen ${displayIndex + 1}`);
  const [desktop, setDesktop] = useState<DesktopInfo>({
    space_id: 0,
    position: 0,
    name: "Desktop 1",
    color: DEFAULT_BG,
  });
  const [title, setTitle] = useState("");
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newText, setNewText] = useState("");
  const [offMonitor, setOffMonitor] = useState(false);
  const [displayGroups, setDisplayGroups] = useState<DisplayGroup[]>([]);
  const [monitorNames, setMonitorNames] = useState<Record<number, string>>({});
  const [allSpaces, setAllSpaces] = useState<SpaceInfo[]>([]);
  const [contextHistory, setContextHistory] = useState<ContextHistory>({});
  const [accessibilityGranted, setAccessibilityGranted] = useState<boolean | null>(null);
  const [desktopCount, setDesktopCount] = useState(10);
  const [anchorPos, setAnchorPos] = useState<AnchorPosition>(loadAnchor);
  const [minimized, setMinimized] = useState(false);
  const [expandedPanel, setExpandedPanel] = useState<AccordionPanel>("queue");
  const [timerPresets, setTimerPresets] = useState<number[]>([60, 300, 600]);
  const [notifySystem, setNotifySystem] = useState(true);
  const [notifyFlash, setNotifyFlash] = useState(true);
  const [timerHours, setTimerHours] = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerRemaining, setTimerRemaining] = useState(0);
  const [timerFlashing, setTimerFlashing] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const desktopRef = useRef(desktop.space_id);
  const todosRef = useRef(todos);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const monitorRef = useRef<Monitor | null>(null);

  todosRef.current = todos;
  desktopRef.current = desktop.space_id;

  // ── Effective background for theme ──────────────────
  const effectiveBg = useMemo(() => {
    const fixedViews: ViewType[] = ["loading", "setup", "session-chooser", "history-picker"];
    return fixedViews.includes(view) ? DEFAULT_BG : desktop.color;
  }, [view, desktop.color]);

  const theme = useMemo(() => buildTheme(effectiveBg), [effectiveBg]);

  // ── Load settings on mount ─────────────────────────
  useEffect(() => {
    invoke<Settings>("get_settings")
      .then(async (s) => {
        setDesktopCount(s.desktop_count);
        setTimerPresets(s.timer_presets ?? [60, 300, 600]);
        setNotifySystem(s.notify_system ?? true);
        setNotifyFlash(s.notify_flash ?? true);
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
  }, []);

  // ── Save helpers ──────────────────────────────────────
  const saveNow = useCallback((deskIdx: number, items: TodoItem[]) => {
    invoke("save_todos", { desktop: deskIdx, todos: items }).catch(() => {});
  }, []);

  const scheduleSave = useCallback(
    (items: TodoItem[]) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveNow(desktopRef.current, items);
      }, 300);
    },
    [saveNow]
  );

  const mutate = useCallback(
    (fn: (prev: TodoItem[]) => TodoItem[]) => {
      setTodos((prev) => {
        const next = fn(prev);
        scheduleSave(next);
        return next;
      });
    },
    [scheduleSave]
  );

  // ── Load todos + title ────────────────────────────────
  const loadTodos = useCallback(async (deskIdx: number) => {
    try {
      const items = await invoke<TodoItem[]>("get_todos", { desktop: deskIdx });
      setTodos(items);
    } catch {
      setTodos([]);
    }
  }, []);

  const loadTitle = useCallback(async (deskIdx: number) => {
    try {
      const t = await invoke<string>("get_title", { desktop: deskIdx });
      setTitle(t);
    } catch {
      setTitle("");
    }
  }, []);

  const saveTitleDebounced = useCallback((deskIdx: number, value: string) => {
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      invoke("save_title", { desktop: deskIdx, title: value }).catch(() => {});
    }, 300);
  }, []);

  // ── Fetch monitor info once ───────────────────────────
  useEffect(() => {
    availableMonitors().then((monitors) => {
      const m = monitors[displayIndex];
      if (m) {
        monitorRef.current = m;
        setMonitorName(friendlyMonitorName(m.name, displayIndex));
      }
      const names: Record<number, string> = {};
      monitors.forEach((mon, i) => {
        names[i] = friendlyMonitorName(mon.name, i);
      });
      setMonitorNames(names);
    });
  }, [displayIndex]);

  // ── Check if window is on its assigned monitor ────────
  const checkPosition = useCallback(async () => {
    const m = monitorRef.current;
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
      setOffMonitor(!isOn);
    } catch {
      // ignore
    }
  }, []);

  const snapToMonitor = useCallback(
    async (overrideAnchor?: AnchorPosition) => {
      const m = monitorRef.current;
      if (!m) return;
      try {
        const size = await currentWindow.outerSize();
        const anchor = overrideAnchor ?? anchorPos;
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
        if (anchor.includes("left")) x = mx + padding;
        else if (anchor.includes("center")) x = mx + Math.round((mw - ww) / 2);
        else x = mx + mw - ww - padding;

        let y: number;
        if (anchor.startsWith("top")) y = my + menuBar;
        else if (anchor.startsWith("middle")) y = my + Math.round((mh - wh) / 2);
        else y = my + mh - wh - padding;

        await currentWindow.setPosition(new PhysicalPosition(x, y));
        setOffMonitor(false);
      } catch {
        // ignore
      }
    },
    [anchorPos]
  );

  // ── Desktop polling ───────────────────────────────────
  useEffect(() => {
    if (view !== "todos") return;
    let prevId = desktop.space_id;

    const poll = async () => {
      try {
        const info = await invoke<DesktopInfo>("get_desktop", { display: displayIndex });
        setDesktop(info);
        if (info.space_id !== prevId) {
          if (saveTimer.current) clearTimeout(saveTimer.current);
          saveNow(prevId, todosRef.current);
          prevId = info.space_id;
          await loadTodos(info.space_id);
          await loadTitle(info.space_id);
        }
      } catch {
        // CGS API unavailable
      }
      checkPosition();
    };

    poll();
    loadTodos(desktop.space_id);
    loadTitle(desktop.space_id);
    const id = setInterval(poll, 200);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // ── Anchor handling ──────────────────────────────────
  const handleAnchorSelect = useCallback(
    (pos: AnchorPosition) => {
      setAnchorPos(pos);
      saveAnchor(pos);
      snapToMonitor(pos);
    },
    [snapToMonitor]
  );

  useEffect(() => {
    if (view !== "todos") return;
    const saved = loadAnchor();
    if (saved !== "top-right") snapToMonitor(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // ── Display groups & spaces ──────────────────────────
  const refreshDisplayGroups = useCallback(async () => {
    try {
      const groups = await invoke<DisplayGroup[]>("list_desktops_grouped");
      setDisplayGroups(groups);
    } catch {
      setDisplayGroups([]);
    }
  }, []);

  const refreshSpaces = useCallback(() => {
    invoke<SpaceInfo[]>("list_all_spaces")
      .then(setAllSpaces)
      .catch(() => setAllSpaces([]));
  }, []);

  // ── Panel change handler with side effects ──────────
  const handlePanelChange = useCallback(
    (panel: AccordionPanel) => {
      setExpandedPanel(panel);
      if (panel === "desktops") refreshDisplayGroups();
      if (panel === "settings") refreshSpaces();
    },
    [refreshDisplayGroups, refreshSpaces]
  );

  // ── Accessibility check ──────────────────────────────
  useEffect(() => {
    if (view === "setup" || expandedPanel === "settings") {
      invoke<boolean>("check_accessibility")
        .then(setAccessibilityGranted)
        .catch(() => {});
      const id = setInterval(() => {
        invoke<boolean>("check_accessibility")
          .then(setAccessibilityGranted)
          .catch(() => {});
      }, 2000);
      return () => clearInterval(id);
    }
  }, [view, expandedPanel]);

  // ── Todo actions ─────────────────────────────────────
  const addTodo = useCallback(() => {
    const text = newText.trim();
    if (!text) return;
    mutate((prev) => [...prev, { id: crypto.randomUUID(), text, done: false }]);
    setNewText("");
  }, [newText, mutate]);

  const toggleDone = useCallback(
    (id: string) => {
      mutate((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    },
    [mutate]
  );

  const updateText = useCallback(
    (id: string, text: string) => {
      mutate((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)));
    },
    [mutate]
  );

  const deleteTodo = useCallback(
    (id: string) => {
      mutate((prev) => prev.filter((t) => t.id !== id));
    },
    [mutate]
  );

  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value);
      saveTitleDebounced(desktop.space_id, value);
    },
    [desktop.space_id, saveTitleDebounced]
  );

  const handleReorder = useCallback(
    (reordered: TodoItem[]) => {
      const doneItems = todos.filter((t) => t.done);
      const next = [...reordered, ...doneItems];
      setTodos(next);
      scheduleSave(next);
    },
    [todos, scheduleSave]
  );

  // ── Timer ─────────────────────────────────────────────
  const startTimer = useCallback(() => {
    const total = timerHours * 3600 + timerMinutes * 60 + timerSeconds;
    if (total <= 0) return;
    setTimerRemaining(total);
    setTimerRunning(true);
  }, [timerHours, timerMinutes, timerSeconds]);

  const cancelTimer = useCallback(() => {
    setTimerRunning(false);
    setTimerRemaining(0);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const fireTimerNotification = useCallback(async () => {
    if (notifySystem) {
      let granted = await isPermissionGranted();
      if (!granted) {
        const permission = await requestPermission();
        granted = permission === "granted";
      }
      if (granted) {
        sendNotification({ title: "Timer Done", body: "Your timer has finished!" });
      }
    }
    if (notifyFlash) {
      setTimerFlashing(true);
      setTimeout(() => setTimerFlashing(false), 1500);
    }
  }, [notifySystem, notifyFlash]);

  useEffect(() => {
    if (!timerRunning) return;
    timerRef.current = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          fireTimerNotification();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerRunning, fireTimerNotification]);

  const populateFromPreset = useCallback((seconds: number) => {
    setTimerHours(Math.floor(seconds / 3600));
    setTimerMinutes(Math.floor((seconds % 3600) / 60));
    setTimerSeconds(seconds % 60);
  }, []);

  // ── Minimize handler ──────────────────────────────────
  const handleToggleMinimize = useCallback(async () => {
    const next = !minimized;
    setMinimized(next);
    const pos = await currentWindow.outerPosition();
    const oldSize = await currentWindow.outerSize();
    const m = monitorRef.current;
    await currentWindow.setSize(new LogicalSize(240, next ? 56 : 320));
    if (m) {
      const newSize = await currentWindow.outerSize();
      const dh = oldSize.height - newSize.height;
      const midY = pos.y + oldSize.height / 2;
      const monMidY = m.position.y + m.size.height / 2;
      if (midY > monMidY) {
        await currentWindow.setPosition(new PhysicalPosition(pos.x, pos.y + dh));
      }
    }
  }, [minimized]);

  // ── View router ───────────────────────────────────────
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {view === "loading" && <LoadingView />}

      {view === "setup" && (
        <SetupView
          accessibilityGranted={accessibilityGranted}
          setAccessibilityGranted={setAccessibilityGranted}
          onComplete={() => setView("todos")}
        />
      )}

      {view === "session-chooser" && (
        <SessionChooserView
          onContinue={() => setView("todos")}
          onNewSession={() => {
            setTodos([]);
            setTitle("");
            setView("todos");
          }}
          onPickHistory={(spaces, history) => {
            setAllSpaces(spaces);
            setContextHistory(history);
            setView("history-picker");
          }}
        />
      )}

      {view === "history-picker" && (
        <HistoryPickerView
          allSpaces={allSpaces}
          contextHistory={contextHistory}
          setContextHistory={setContextHistory}
          onBack={() => setView("session-chooser")}
          onDone={() => setView("todos")}
        />
      )}

      {view === "todos" && (
        <AccordionView
          title={title}
          todos={todos}
          newText={newText}
          minimized={minimized}
          offMonitor={offMonitor}
          monitorName={monitorName}
          anchorPos={anchorPos}
          expandedPanel={expandedPanel}
          timerFlashing={timerFlashing}
          timerRunning={timerRunning}
          timerRemaining={timerRemaining}
          timerHours={timerHours}
          timerMinutes={timerMinutes}
          timerSeconds={timerSeconds}
          timerPresets={timerPresets}
          displayGroups={displayGroups}
          displayIndex={displayIndex}
          currentSpaceId={desktop.space_id}
          monitorNames={monitorNames}
          desktop={desktop}
          allSpaces={allSpaces}
          desktopCount={desktopCount}
          accessibilityGranted={accessibilityGranted}
          notifySystem={notifySystem}
          notifyFlash={notifyFlash}
          onTitleChange={handleTitleChange}
          onNewTextChange={setNewText}
          onAddTodo={addTodo}
          onToggleDone={toggleDone}
          onUpdateText={updateText}
          onDeleteTodo={deleteTodo}
          onReorder={handleReorder}
          onSnap={() => snapToMonitor()}
          onToggleMinimize={handleToggleMinimize}
          onAnchorSelect={handleAnchorSelect}
          onPanelChange={handlePanelChange}
          onSwitchDesktop={(spaceId) => {
            invoke("switch_desktop", { display: displayIndex, target: spaceId }).catch(() => {});
          }}
          setTimerHours={setTimerHours}
          setTimerMinutes={setTimerMinutes}
          setTimerSeconds={setTimerSeconds}
          onTimerStart={startTimer}
          onTimerCancel={cancelTimer}
          onTimerPreset={populateFromPreset}
          setAllSpaces={setAllSpaces}
          setDesktop={setDesktop}
          setDesktopCount={setDesktopCount}
          setAccessibilityGranted={setAccessibilityGranted}
          setTimerPresets={setTimerPresets}
          setNotifySystem={setNotifySystem}
          setNotifyFlash={setNotifyFlash}
          setTodos={setTodos}
          setTitle={setTitle}
          refreshSpaces={refreshSpaces}
          onShowSetup={() => setView("setup")}
        />
      )}
    </ThemeProvider>
  );
}

export default App;
