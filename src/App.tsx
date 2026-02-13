import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  availableMonitors,
  LogicalSize,
  PhysicalPosition,
  type Monitor,
} from "@tauri-apps/api/window";
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

interface Settings {
  custom_colors: Record<number, string>;
  setup_complete: boolean;
  desktop_count: number;
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

  const [view, setView] = useState<"loading" | "setup" | "todos" | "settings" | "desktops">("loading");
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
  const [settingsTab, setSettingsTab] = useState<"themes" | "permissions">("themes");
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
    invoke<Settings>("get_settings").then((s) => {
      setDesktopCount(s.desktop_count);
      setView(s.setup_complete ? "todos" : "setup");
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
          onClick={() => {
            const next = !minimized;
            setMinimized(next);
            currentWindow.setSize(new LogicalSize(240, next ? 56 : 320));
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

          {/* All desktops button */}
          <div className="all-desktops-section">
            <button
              className="all-desktops-btn"
              onClick={() => {
                refreshDisplayGroups();
                setView("desktops");
              }}
            >
              All desktops
            </button>
          </div>

          {/* Settings gear — bottom right */}
          <button
            className="settings-btn-fixed"
            onClick={() => { setShowThemePicker(false); setView("settings"); }}
            title="Settings"
          >
            {"\u2699"}
          </button>
        </>
      )}

    </div>
  );
}

export default App;
