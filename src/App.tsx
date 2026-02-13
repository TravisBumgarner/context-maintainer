import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
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
import { Reorder } from "framer-motion";

const currentWindow = getCurrentWebviewWindow();

// ── Anchor positions ─────────────────────────────────────
type AnchorPosition =
  | "top-left" | "top-center" | "top-right"
  | "middle-left" | "middle-center" | "middle-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

const ANCHOR_POSITIONS: AnchorPosition[] = [
  "top-left", "top-center", "top-right",
  "middle-left", "middle-center", "middle-right",
  "bottom-left", "bottom-center", "bottom-right",
];

const ANCHOR_LABELS: Record<AnchorPosition, string> = {
  "top-left": "↖", "top-center": "↑", "top-right": "↗",
  "middle-left": "←", "middle-center": "●", "middle-right": "→",
  "bottom-left": "↙", "bottom-center": "↓", "bottom-right": "↘",
};

function loadAnchor(): AnchorPosition {
  const key = `anchor-${currentWindow.label}`;
  return (localStorage.getItem(key) as AnchorPosition) || "top-right";
}

function saveAnchor(pos: AnchorPosition) {
  const key = `anchor-${currentWindow.label}`;
  localStorage.setItem(key, pos);
}

interface DesktopInfo {
  space_id: number;
  position: number;
  name: string;
  color: string;
}

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

interface DesktopSummary {
  space_id: number;
  position: number;
  name: string;
  title: string;
  color: string;
  todo_count: number;
}

interface SpaceInfo {
  space_id: number;
  position: number;
  name: string;
  title: string;
  color: string;
}

interface SavedContext {
  title: string;
  todos: TodoItem[];
  saved_at: string;
}

type ContextHistory = Record<number, SavedContext[]>;

interface Settings {
  custom_colors: Record<number, string>;
  setup_complete: boolean;
  desktop_count: number;
  timer_presets: number[];
  notify_system: boolean;
  notify_flash: boolean;
}

interface DisplayGroup {
  display_index: number;
  desktops: DesktopSummary[];
}

// ── Accessible text color utility ─────────────────────────
/** Returns an RGB triplet string ("0, 0, 0" or "255, 255, 255") for readable text on the given bg. */
function textColorRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return L > 0.179 ? "0, 0, 0" : "255, 255, 255";
}

function invertRgb(rgb: string): string {
  return rgb === "0, 0, 0" ? "255, 255, 255" : "0, 0, 0";
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

// ── Themes ────────────────────────────────────────────────
const THEMES: { name: string; colors: string[] }[] = [
  {
    name: "Pastel",
    colors: ["#F5E6A3","#F2B8A0","#A8CCE0","#A8D8B0","#C8A8D8","#F0C8A0","#A0D8D0","#E0B8C8","#B8D0A0","#D0C8E0"],
  },
  {
    name: "Ocean",
    colors: ["#A9D6E5","#89C2D9","#61A5C2","#468FAF","#2C7DA0","#2A6F97","#014F86","#01497C","#013A63","#012A4A"],
  },
  {
    name: "Sunset",
    colors: ["#FFCDB2","#FFB4A2","#E5989B","#B5838D","#6D6875","#FF9E7A","#F4845F","#E76F51","#D4A5A5","#CC8B86"],
  },
  {
    name: "Forest",
    colors: ["#B7E4C7","#95D5B2","#74C69D","#52B788","#40916C","#2D6A4F","#1B4332","#588157","#A3B18A","#344E41"],
  },
  {
    name: "Candy",
    colors: ["#FFB6C1","#FF69B4","#DA70D6","#BA55D3","#9370DB","#7B68EE","#6495ED","#87CEEB","#00BFFF","#FF85A2"],
  },
  {
    name: "Mono",
    colors: ["#E8E8E8","#D0D0D0","#B8B8B8","#A0A0A0","#888888","#707070","#585858","#404040","#303030","#202020"],
  },
  {
    name: "Neon",
    colors: ["#0F3460","#16213E","#1A1A2E","#533483","#2B2D42","#0D0221","#E94560","#00F5D4","#FEE440","#9B5DE5"],
  },
  {
    name: "Earth",
    colors: ["#DEB887","#D2B48C","#C4A882","#CD853F","#D4A574","#BC8F8F","#A0826D","#8B7355","#B87333","#C68B59"],
  },
  {
    name: "Berry",
    colors: ["#F0C6D0","#E8A0B0","#D47A90","#C05470","#A83060","#8B1A4A","#6E1040","#520A30","#7B2D5B","#9B3A72"],
  },
  {
    name: "Retro",
    colors: ["#E8D44D","#E6A23C","#F56C6C","#67C23A","#409EFF","#B37FEB","#F759AB","#36CFC9","#FFA940","#FF7A45"],
  },
];

/** Return a human-friendly name; fall back to "Screen N" if the OS name is an ID. */
function friendlyMonitorName(raw: string | null, index: number): string {
  if (!raw) return `Screen ${index + 1}`;
  if (/^[#0-9a-fA-F-]+$/.test(raw.trim())) return `Screen ${index + 1}`;
  return raw;
}

/** Build style object with CSS variables for text color */
function bgStyle(bgColor: string): React.CSSProperties {
  const tc = textColorRgb(bgColor);
  return {
    backgroundColor: bgColor,
    "--tc": tc,
    "--tc-inv": invertRgb(tc),
  } as React.CSSProperties;
}

function App() {
  // Derive display index from window label: "main" = 0, "monitor-N" = N
  const displayIndex = useMemo(() => {
    const label = currentWindow.label;
    if (label === "main") return 0;
    const match = label.match(/^monitor-(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
  }, []);

  const [view, setView] = useState<"loading" | "setup" | "session-chooser" | "todos" | "settings" | "desktops" | "history-picker" | "timer">("loading");
  const [monitorName, setMonitorName] = useState(`Screen ${displayIndex + 1}`);
  const [desktop, setDesktop] = useState<DesktopInfo>({
    space_id: 0,
    position: 0,
    name: "Desktop 1",
    color: "#F5E6A3",
  });
  const [title, setTitle] = useState("");
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newText, setNewText] = useState("");
  const [offMonitor, setOffMonitor] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"themes" | "permissions" | "timer">("themes");
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [displayGroups, setDisplayGroups] = useState<DisplayGroup[]>([]);
  const [monitorNames, setMonitorNames] = useState<Record<number, string>>({});
  const [allSpaces, setAllSpaces] = useState<SpaceInfo[]>([]);
  const [accessibilityGranted, setAccessibilityGranted] = useState<boolean | null>(null);
  const [desktopCount, setDesktopCount] = useState(10);
  const [anchorPos, setAnchorPos] = useState<AnchorPosition>(loadAnchor);
  const [showAnchorOverlay, setShowAnchorOverlay] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [contextHistory, setContextHistory] = useState<ContextHistory>({});
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
  const anchorOverlayRef = useRef<HTMLDivElement | null>(null);

  // Keep refs in sync
  todosRef.current = todos;
  desktopRef.current = desktop.space_id;

  // ── Load settings on mount ─────────────────────────────
  useEffect(() => {
    invoke<Settings>("get_settings").then(async (s) => {
      setDesktopCount(s.desktop_count);
      setTimerPresets(s.timer_presets ?? [60, 300, 600]);
      setNotifySystem(s.notify_system ?? true);
      setNotifyFlash(s.notify_flash ?? true);
      if (!s.setup_complete) {
        setView("setup");
        return;
      }
      // Check if there's existing data to decide whether to show session chooser
      try {
        const desktops = await invoke<DesktopSummary[]>("list_all_desktops");
        const hasData = desktops.some((d) => d.title || d.todo_count > 0);
        setView(hasData ? "session-chooser" : "todos");
      } catch {
        setView("todos");
      }
    }).catch(() => {
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

  // ── Mutate helper (updates state + schedules save) ────
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

  // ── Load todos + title for a desktop ──────────────────
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

  const saveTitle = useCallback((deskIdx: number, value: string) => {
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

  const snapToMonitor = useCallback(async (overrideAnchor?: AnchorPosition) => {
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

      // Horizontal
      let x: number;
      if (anchor.includes("left")) {
        x = mx + padding;
      } else if (anchor.includes("center")) {
        x = mx + Math.round((mw - ww) / 2);
      } else {
        x = mx + mw - ww - padding;
      }

      // Vertical
      let y: number;
      if (anchor.startsWith("top")) {
        y = my + menuBar;
      } else if (anchor.startsWith("middle")) {
        y = my + Math.round((mh - wh) / 2);
      } else {
        y = my + mh - wh - padding;
      }

      await currentWindow.setPosition(new PhysicalPosition(x, y));
      setOffMonitor(false);
    } catch {
      // ignore
    }
  }, [anchorPos]);

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

  // ── Anchor select handler ────────────────────────────
  const handleAnchorSelect = useCallback((pos: AnchorPosition) => {
    setAnchorPos(pos);
    saveAnchor(pos);
    setShowAnchorOverlay(false);
    snapToMonitor(pos);
  }, [snapToMonitor]);

  // ── Snap to saved anchor on initial load ────────────
  useEffect(() => {
    if (view !== "todos") return;
    const saved = loadAnchor();
    if (saved !== "top-right") {
      snapToMonitor(saved);
    }
    // Run only once when entering todos view
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  // ── Click outside to dismiss anchor overlay ─────────
  useEffect(() => {
    if (!showAnchorOverlay) return;
    const handler = (e: MouseEvent) => {
      if (anchorOverlayRef.current && !anchorOverlayRef.current.contains(e.target as Node)) {
        setShowAnchorOverlay(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAnchorOverlay]);

  // ── Load grouped desktops for desktops view ──────────
  const refreshDisplayGroups = useCallback(async () => {
    try {
      const groups = await invoke<DisplayGroup[]>("list_desktops_grouped");
      setDisplayGroups(groups);
    } catch {
      setDisplayGroups([]);
    }
  }, []);

  // ── Load all spaces for settings ──────────────────────
  const refreshSpaces = useCallback(() => {
    invoke<SpaceInfo[]>("list_all_spaces").then(setAllSpaces).catch(() => setAllSpaces([]));
  }, []);

  useEffect(() => {
    if (view === "settings") refreshSpaces();
  }, [view, refreshSpaces]);

  // ── Check accessibility when on setup or settings ─────
  useEffect(() => {
    if (view === "setup" || view === "settings") {
      invoke<boolean>("check_accessibility").then(setAccessibilityGranted).catch(() => {});
      const id = setInterval(() => {
        invoke<boolean>("check_accessibility").then(setAccessibilityGranted).catch(() => {});
      }, 2000);
      return () => clearInterval(id);
    }
  }, [view]);

  // ── Actions ───────────────────────────────────────────
  const addTodo = () => {
    const text = newText.trim();
    if (!text) return;
    mutate((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, done: false },
    ]);
    setNewText("");
  };

  const toggleDone = (id: string) => {
    mutate((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  const updateText = (id: string, text: string) => {
    mutate((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text } : t))
    );
  };

  const deleteTodo = (id: string) => {
    mutate((prev) => prev.filter((t) => t.id !== id));
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    saveTitle(desktop.space_id, value);
  };

  // ── Reorder handler ──────────────────────────────────
  const handleReorder = useCallback(
    (reordered: TodoItem[]) => {
      // Rebuild the full list: reordered active items + done items in original order
      const doneItems = todos.filter((t) => t.done);
      const next = [...reordered, ...doneItems];
      setTodos(next);
      scheduleSave(next);
    },
    [todos, scheduleSave]
  );

  // ── Timer helpers ────────────────────────────────────
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

  const formatPreset = (seconds: number): string => {
    if (seconds >= 3600) return `${seconds / 3600}h`;
    if (seconds >= 60) return `${seconds / 60}m`;
    return `${seconds}s`;
  };

  const formatCountdown = (total: number): string => {
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // ── Theme / desktop count helpers ─────────────────────
  const handleApplyTheme = (colors: string[]) => {
    // Pad theme colors to cover desktopCount by cycling
    const padded = Array.from({ length: desktopCount }, (_, i) => colors[i % colors.length]);
    invoke("apply_theme", { colors: padded }).then(() => {
      refreshSpaces();
      // Update current desktop color immediately
      const newColor = padded[desktop.position] ?? padded[0];
      setDesktop((prev) => ({ ...prev, color: newColor }));
    }).catch(() => {});
  };

  const handleDesktopCountChange = (delta: number) => {
    const next = Math.max(1, Math.min(20, desktopCount + delta));
    setDesktopCount(next);
    invoke("save_desktop_count", { count: next }).then(() => refreshSpaces()).catch(() => {});
  };

  // ── Split active / done ───────────────────────────────
  const active = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  // ── Setup view ────────────────────────────────────────
  if (view === "loading") {
    return <div className="indicator" style={bgStyle("#F5E6A3")} />;
  }

  if (view === "setup") {
    return (
      <div className="indicator setup-view" style={bgStyle("#F5E6A3")}>
        <div className="setup-title">Context Maintainer</div>
        <p className="setup-desc">
          Per-desktop task lists for macOS. Two permissions are needed:
        </p>
        <div className="setup-step">
          <strong>1. Accessibility</strong>
          {accessibilityGranted ? (
            <span className="perm-granted"> Granted</span>
          ) : (
            <>
              <br />
              <span>Required for desktop switching.</span>
              <br />
              <button
                className="setup-btn-sm"
                onClick={() => {
                  invoke<boolean>("request_accessibility").then(setAccessibilityGranted).catch(() => {});
                }}
              >
                Grant Access
              </button>
            </>
          )}
        </div>
        <div className="setup-step">
          <strong>2. Keyboard Shortcuts</strong>
          <br />
          System Settings &gt; Keyboard &gt; Keyboard Shortcuts &gt; Mission Control — enable "Switch to Desktop N" for each desktop.
        </div>
        <button
          className="setup-btn"
          onClick={() => {
            invoke("complete_setup").then(() => setView("todos")).catch(() => {});
          }}
        >
          Get Started
        </button>
      </div>
    );
  }

  // ── Session chooser view ──────────────────────────────
  if (view === "session-chooser") {
    return (
      <div className="indicator session-chooser-view" style={bgStyle("#F5E6A3")}>
        <div className="session-chooser-title">Context Maintainer</div>
        <p className="session-chooser-desc">You have an existing session.</p>
        <div className="session-chooser-buttons">
          <button
            className="session-btn"
            onClick={() => setView("todos")}
          >
            Continue Session
          </button>
          <button
            className="session-btn"
            onClick={() => {
              invoke("start_new_session").then(() => {
                setTodos([]);
                setTitle("");
                setView("todos");
              }).catch(() => {});
            }}
          >
            New Session
          </button>
          <button
            className="session-btn"
            onClick={() => {
              Promise.all([
                invoke<SpaceInfo[]>("list_all_spaces"),
                invoke<ContextHistory>("get_context_history"),
              ]).then(([spaces, history]) => {
                setAllSpaces(spaces);
                setContextHistory(history);
                setView("history-picker");
              }).catch(() => {});
            }}
          >
            Pick from History
          </button>
        </div>
      </div>
    );
  }

  // ── History picker view ──────────────────────────────
  if (view === "history-picker") {
    const hasHistory = Object.values(contextHistory).some((h) => h.length > 0);

    return (
      <div className="indicator history-picker-view" style={bgStyle("#F5E6A3")}>
        <button className="settings-back" onClick={() => setView("session-chooser")}>
          &larr; Back
        </button>
        <h2 className="history-picker-title">Saved Contexts</h2>
        {!hasHistory && (
          <div className="overview-empty">No saved history yet.</div>
        )}
        <div className="history-list">
          {allSpaces.map((space) => {
            const entries = contextHistory[space.space_id];
            if (!entries || entries.length === 0) return null;
            return (
              <div key={space.space_id} className="history-space-group">
                <div className="history-space-label">{space.title || space.name}</div>
                {[...entries].reverse().map((ctx, revIdx) => {
                  const originalIdx = entries.length - 1 - revIdx;
                  const todoCount = ctx.todos.filter((t) => !t.done).length;
                  const date = new Date(ctx.saved_at);
                  const relative = formatRelativeTime(date);
                  return (
                    <button
                      key={originalIdx}
                      className="history-entry"
                      onClick={() => {
                        invoke<boolean>("restore_context", {
                          desktop: space.space_id,
                          index: originalIdx,
                        }).then((ok) => {
                          if (ok) {
                            // Refresh history to show updated state
                            invoke<ContextHistory>("get_context_history").then(setContextHistory).catch(() => {});
                          }
                        }).catch(() => {});
                      }}
                    >
                      <span className="history-entry-title">{ctx.title || "Untitled"}</span>
                      <span className="history-entry-meta">
                        {todoCount} task{todoCount !== 1 ? "s" : ""} &middot; {relative}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="history-done-section">
          <button
            className="session-btn"
            onClick={() => setView("todos")}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // ── Timer view ──────────────────────────────────────
  if (view === "timer") {
    return (
      <div className={`indicator timer-view${timerFlashing ? " timer-flash" : ""}`} style={bgStyle(desktop.color)}>
        <button className="settings-back" onClick={() => setView("todos")}>
          &larr; Back
        </button>
        <h2 className="timer-title">Notify me in...</h2>

        {!timerRunning ? (
          <>
            <div className="timer-inputs">
              <div className="timer-field">
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={timerHours}
                  onChange={(e) => setTimerHours(Math.max(0, parseInt(e.target.value) || 0))}
                />
                <span className="timer-label">HH</span>
              </div>
              <span className="timer-colon">:</span>
              <div className="timer-field">
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={timerMinutes}
                  onChange={(e) => setTimerMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                />
                <span className="timer-label">MM</span>
              </div>
              <span className="timer-colon">:</span>
              <div className="timer-field">
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={timerSeconds}
                  onChange={(e) => setTimerSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                />
                <span className="timer-label">SS</span>
              </div>
            </div>

            <div className="timer-presets">
              {timerPresets.map((p, i) => (
                <button key={i} className="timer-preset-btn" onClick={() => populateFromPreset(p)}>
                  {formatPreset(p)}
                </button>
              ))}
            </div>

            <button
              className="timer-start-btn"
              onClick={startTimer}
              disabled={timerHours === 0 && timerMinutes === 0 && timerSeconds === 0}
            >
              Start
            </button>
          </>
        ) : (
          <div className="timer-running">
            <div className="timer-countdown">{formatCountdown(timerRemaining)}</div>
            <button className="timer-cancel-btn" onClick={cancelTimer}>
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Settings view ─────────────────────────────────────
  if (view === "settings") {
    return (
      <div className="indicator settings-view" style={bgStyle(desktop.color)}>
        <button className="settings-back" onClick={() => { setConfirmClear(false); setView("todos"); }}>
          &larr; Back
        </button>

        <div className="settings-tabs">
          <button
            className={`settings-tab${settingsTab === "themes" ? " active" : ""}`}
            onClick={() => setSettingsTab("themes")}
          >
            Themes
          </button>
          <button
            className={`settings-tab${settingsTab === "permissions" ? " active" : ""}`}
            onClick={() => setSettingsTab("permissions")}
          >
            Permissions
          </button>
          <button
            className={`settings-tab${settingsTab === "timer" ? " active" : ""}`}
            onClick={() => setSettingsTab("timer")}
          >
            Timer
          </button>
        </div>

        {settingsTab === "themes" && (
          <>
            <div className="settings-section">
              {!showThemePicker ? (
                <button
                  className="choose-theme-btn"
                  onClick={() => setShowThemePicker(true)}
                >
                  Choose a Theme
                </button>
              ) : (
                <>
                  <h3>Theme</h3>
                  <div className="theme-grid">
                    {THEMES.map((theme) => (
                      <button
                        key={theme.name}
                        className="theme-card"
                        onClick={() => {
                          handleApplyTheme(theme.colors);
                          setShowThemePicker(false);
                        }}
                        title={theme.name}
                      >
                        <div className="theme-swatches">
                          {theme.colors.slice(0, 5).map((c, i) => (
                            <span key={i} className="theme-swatch" style={{ background: c }} />
                          ))}
                        </div>
                        <span className="theme-name">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="settings-section">
              <h3>Desktops</h3>
              <div className="count-row">
                <span className="count-label">Number of desktops</span>
                <div className="count-controls">
                  <button className="count-btn" onClick={() => handleDesktopCountChange(-1)}>-</button>
                  <span className="count-value">{desktopCount}</span>
                  <button className="count-btn" onClick={() => handleDesktopCountChange(1)}>+</button>
                </div>
              </div>
            </div>

            <div className="settings-section">
              {allSpaces.map((s) => (
                <div key={s.space_id} className="color-row">
                  <span className="color-row-name">{s.title || s.name}</span>
                  <input
                    type="color"
                    value={s.color}
                    onChange={(e) => {
                      const newColor = e.target.value;
                      invoke("save_color", { desktop: s.space_id, color: newColor }).catch(() => {});
                      setAllSpaces((prev) =>
                        prev.map((sp) => sp.space_id === s.space_id ? { ...sp, color: newColor } : sp)
                      );
                      if (s.space_id === desktop.space_id) {
                        setDesktop((prev) => ({ ...prev, color: newColor }));
                      }
                    }}
                  />
                </div>
              ))}
              {allSpaces.length === 0 && (
                <div className="overview-empty">No spaces detected</div>
              )}
            </div>
          </>
        )}

        {settingsTab === "permissions" && (
          <>
            <div className="settings-section">
              {!accessibilityGranted && (
                <div className="setup-step">
                  <strong>Accessibility</strong> — not granted
                  <br />
                  <button
                    className="setup-btn-sm"
                    onClick={() => {
                      invoke<boolean>("request_accessibility").then(setAccessibilityGranted).catch(() => {});
                    }}
                  >
                    Grant Access
                  </button>
                </div>
              )}
              {accessibilityGranted && (
                <div className="setup-step">
                  <strong>Accessibility</strong>
                  <span className="perm-granted"> Granted</span>
                </div>
              )}
              <div className="setup-step">
                <strong>Keyboard Shortcuts</strong>
                <br />
                System Settings &gt; Keyboard &gt; Keyboard Shortcuts &gt; Mission Control — enable "Switch to Desktop N" for each desktop.
              </div>
            </div>

            <button
              className="setup-show-again"
              onClick={() => setView("setup")}
            >
              Show Setup Again
            </button>

            <div className="settings-section">
              <h3>Data</h3>
              {!confirmClear ? (
                <button
                  className="setup-btn-sm"
                  style={{ marginTop: 4 }}
                  onClick={() => setConfirmClear(true)}
                >
                  Clear All Data
                </button>
              ) : (
                <div style={{ marginTop: 4 }}>
                  <p style={{ margin: "0 0 6px", fontSize: 11 }}>
                    This will delete all todos, titles, and custom colors. Are you sure?
                  </p>
                  <button
                    className="setup-btn-sm"
                    style={{ marginRight: 6 }}
                    onClick={() => {
                      invoke("clear_all_data").then(() => {
                        setTodos([]);
                        setTitle("");
                        setDesktop((prev) => ({ ...prev, color: "#F5E6A3" }));
                        refreshSpaces();
                        setConfirmClear(false);
                      }).catch(() => {});
                    }}
                  >
                    Yes, clear everything
                  </button>
                  <button
                    className="setup-btn-sm"
                    onClick={() => setConfirmClear(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {settingsTab === "timer" && (
          <>
            <div className="settings-section">
              <h3>Presets</h3>
              <div className="timer-presets-edit">
                {timerPresets.map((p, i) => (
                  <div key={i} className="timer-preset-edit-row">
                    <span className="timer-preset-edit-label">Preset {i + 1}</span>
                    <input
                      type="number"
                      min={1}
                      className="timer-preset-edit-input"
                      value={p}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setTimerPresets((prev) => prev.map((v, j) => (j === i ? val : v)));
                      }}
                    />
                    <span className="timer-preset-edit-unit">sec</span>
                  </div>
                ))}
              </div>
              <button
                className="setup-btn-sm"
                style={{ marginTop: 6 }}
                onClick={() => {
                  invoke("save_timer_presets", { presets: timerPresets }).catch(() => {});
                }}
              >
                Save Presets
              </button>
            </div>

            <div className="settings-section">
              <h3>Notification Type</h3>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={notifySystem}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setNotifySystem(val);
                    invoke("save_notify_settings", { system: val, flash: notifyFlash }).catch(() => {});
                  }}
                />
                <span>System notification</span>
              </label>
              <label className="toggle-row">
                <input
                  type="checkbox"
                  checked={notifyFlash}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setNotifyFlash(val);
                    invoke("save_notify_settings", { system: notifySystem, flash: val }).catch(() => {});
                  }}
                />
                <span>In-app flash</span>
              </label>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── Desktops view ────────────────────────────────────
  if (view === "desktops") {
    // Sort groups so current displayIndex comes first
    const sortedGroups = [...displayGroups].sort((a, b) => {
      if (a.display_index === displayIndex) return -1;
      if (b.display_index === displayIndex) return 1;
      return a.display_index - b.display_index;
    });

    return (
      <div className="indicator desktops-view" style={bgStyle(desktop.color)}>
        <button className="settings-back" onClick={() => setView("todos")}>
          &larr; Back
        </button>
        <h2 className="desktops-title">All Desktops</h2>
        {sortedGroups.map((group) => (
          <div key={group.display_index} className="display-group">
            <div className="display-label">
              {monitorNames[group.display_index] || `Screen ${group.display_index + 1}`}
            </div>
            <div className="desktop-cards">
              {group.desktops.map((d) => (
                <button
                  key={d.space_id}
                  className={`desktop-card${d.space_id === desktop.space_id ? " active" : ""}`}
                  style={{ backgroundColor: d.color, "--tc": textColorRgb(d.color) } as React.CSSProperties}
                  onClick={() => {
                    invoke("switch_desktop", { display: displayIndex, target: d.space_id }).catch(() => {});
                    setView("todos");
                  }}
                >
                  <span className="desktop-card-name">{d.title || d.name}</span>
                  {d.todo_count > 0 && (
                    <span className="desktop-card-count">{d.todo_count}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
        {displayGroups.length === 0 && (
          <div className="overview-empty">No desktops found</div>
        )}
      </div>
    );
  }

  // ── Todos view (default) ──────────────────────────────
  return (
    <div
      className="indicator"
      style={bgStyle(desktop.color)}
    >
      {/* Top-right controls: snap, minimize, anchor */}
      <div className="top-right-controls">
        {offMonitor && (
          <button
            className="snap-btn"
            onClick={() => snapToMonitor()}
            title={`This window has been moved off its assigned monitor (${monitorName}). Click to snap it back.`}
          >
            !
          </button>
        )}
        <button
          className="minimize-btn"
          onClick={async () => {
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
          }}
          title={minimized ? "Expand" : "Collapse"}
        >
          —
        </button>
        <button
          className="anchor-btn"
          onClick={() => setShowAnchorOverlay((v) => !v)}
          title="Set window position"
        >
          ⬚
        </button>
      </div>

      {/* Anchor position overlay */}
      {showAnchorOverlay && (
        <div className="anchor-overlay" ref={anchorOverlayRef}>
          <div className="anchor-grid">
            {ANCHOR_POSITIONS.map((pos) => (
              <button
                key={pos}
                className={`anchor-cell${pos === anchorPos ? " active" : ""}`}
                onClick={() => handleAnchorSelect(pos)}
                title={pos}
              >
                {ANCHOR_LABELS[pos]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Header — editable title */}
      <div className="header">
        <input
          className="title-input"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="What are you working on?"
        />
      </div>

      {!minimized && (
        <>
          <div className="divider" />

          {/* Add new todo */}
          <div className="add-todo">
            <input
              placeholder="Queue monitor task..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
            />
          </div>

          {/* Active todos */}
          <Reorder.Group
            axis="y"
            values={active}
            onReorder={handleReorder}
            className="todo-list"
          >
            {active.map((item) => (
              <Reorder.Item key={item.id} value={item} className="todo-item">
                <span className="drag-handle">⠿</span>
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleDone(item.id)}
                />
                <input
                  className="todo-text"
                  value={item.text}
                  onChange={(e) => updateText(item.id, e.target.value)}
                  placeholder="empty"
                />
                <button className="delete-btn" onClick={() => deleteTodo(item.id)}>
                  ✕
                </button>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {/* Archive */}
          {done.length > 0 && (
            <details className="archive-section">
              <summary>Done ({done.length})</summary>
              <div className="archive-list">
                {done.map((item) => (
                  <div key={item.id} className="todo-item">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleDone(item.id)}
                    />
                    <input
                      className="todo-text"
                      value={item.text}
                      readOnly
                      placeholder="empty"
                    />
                    <button className="delete-btn" onClick={() => deleteTodo(item.id)}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Footer row: All desktops, Timer, Settings */}
          <div className="footer-row">
            <button
              className="footer-btn"
              onClick={() => {
                refreshDisplayGroups();
                setView("desktops");
              }}
            >
              All desktops
            </button>
            <button
              className="footer-btn"
              onClick={() => setView("timer")}
              title="Timer"
            >
              {timerRunning ? formatCountdown(timerRemaining) : "\u23F1"}
            </button>
            <button
              className="footer-btn"
              onClick={() => { setShowThemePicker(false); setView("settings"); }}
              title="Settings"
            >
              {"\u2699"}
            </button>
          </div>
        </>
      )}

    </div>
  );
}

export default App;
