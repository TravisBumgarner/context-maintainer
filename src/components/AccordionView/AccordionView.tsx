import {
  Box,
  Divider,
  IconButton,
  InputBase,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Layout from "./components/Layout";
import CollapsibleSection from "./components/CollapsibleSection";
import QueuePanel from "./components/QueuePanel";
import TimerPanel from "./components/TimerPanel";
import DesktopsPanel from "./components/DesktopsPanel";
import { ANCHOR_POSITIONS, ANCHOR_LABELS } from "../../constants";
import { formatCountdown } from "../../utils";
import { useTodoStore, useTimerStore, useUIStore, useDesktopStore } from "../../stores";

interface AccordionViewProps {
  displayIndex: number;
}

export default function AccordionView({ displayIndex }: AccordionViewProps) {
  const tc = useTheme().custom.tc;

  // Zustand stores
  const { todos, title, updateTitle } = useTodoStore();
  const { flashing, running, remaining } = useTimerStore();
  const {
    collapsed,
    offMonitor,
    anchorPos,
    expandedPanel,
    toggleMinimize,
    snapToMonitor,
    selectAnchor,
    changePanel,
    setView,
  } = useUIStore();
  const { desktop, monitorNames } = useDesktopStore();

  const monitorName = monitorNames[displayIndex] || `Screen ${displayIndex + 1}`;
  const firstUncompleted = todos.filter((t) => !t.done)[0]?.text ?? "";

  const handleChange = (_: React.SyntheticEvent, isExpanded: boolean, panel: string) => {
    if (isExpanded) changePanel(panel as any);
  };

  return (
    <Layout timerFlashing={flashing}>
      {/* ── Header ── */}
      <Box sx={{ px: "10px", py: "6px", display: "flex", alignItems: "center", flexShrink: 0, justifyContent: 'space-between' }}>
        <InputBase
          value={title}
          onChange={(e) => updateTitle(e.target.value, desktop.space_id)}
          placeholder="What is this screen about?"
          sx={{
            flex: 1,
            fontSize: 14,
            fontWeight: 700,
            color: tc(0.55),
            textAlign: 'left',
            letterSpacing: "-0.3px",
            "& input": { p: 0 },
            "& input::placeholder": { color: tc(0.3) },
            "&.Mui-focused input": { color: tc(0.7) },
          }}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
          {offMonitor && (
            <IconButton
              onClick={() => snapToMonitor()}
              title={`This window has been moved off its assigned monitor (${monitorName}). Click to snap it back.`}
              sx={{
                p: "0 3px",
                lineHeight: 1,
                fontSize: 16,
                fontWeight: 700,
                color: tc(0.6),
                "&:hover": { color: tc(0.9) },
              }}
            >
              !
            </IconButton>
          )}
          <IconButton
            onClick={() => setView("settings")}
            title="Settings"
            sx={{
              p: "0 3px",
              lineHeight: 1,
              fontSize: 14,
              fontWeight: 700,
              color: tc(0.3),
              "&:hover": { color: tc(0.6) },
            }}
          >
            ⚙
          </IconButton>
          <IconButton
            onClick={toggleMinimize}
            title={collapsed ? "Expand" : "Collapse"}
            sx={{
              p: "0 3px",
              lineHeight: 1,
              fontSize: 14,
              fontWeight: 700,
              color: tc(0.3),
              "&:hover": { color: tc(0.6) },
            }}
          >
            {collapsed ? "+" : "\u2014"}
          </IconButton>
        </Box>
      </Box>

      <Divider />

      <Box sx={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {/* ── Queue ── */}
        <CollapsibleSection
          label="Queue"
          isExpanded={expandedPanel === "queue"}
          onToggle={() => changePanel("queue")}
          preview={expandedPanel !== "queue" ? firstUncompleted : undefined}
        >
          <QueuePanel desktopId={desktop.space_id} />
        </CollapsibleSection>

        {/* ── Timer ── */}
        <CollapsibleSection
          label="Timer"
          isExpanded={expandedPanel === "timer"}
          onToggle={() => changePanel("timer")}
          preview={expandedPanel !== "timer" && running ? formatCountdown(remaining) : undefined}
        >
          <TimerPanel />
        </CollapsibleSection>

        {/* ── Anchor ── */}
        <CollapsibleSection
          label="Anchor"
          isExpanded={expandedPanel === "anchor"}
          onToggle={() => changePanel("anchor")}
          preview={expandedPanel !== "anchor" ? ANCHOR_LABELS[anchorPos] : undefined}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "2px",
              maxWidth: 120,
            }}
          >
            {ANCHOR_POSITIONS.map((pos) => (
              <Box
                key={pos}
                component="button"
                onClick={() => selectAnchor(pos)}
                title={pos}
                disabled={pos === 'middle-center'}
                sx={{
                  width: 36,
                  height: 28,
                  border: "none",
                  background: "none",
                  color: tc(pos === anchorPos ? 0.9 : 0.35),
                  fontSize: 16,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 0,
                  "&:hover": { color: tc(0.7) },
                  opacity: pos === 'middle-center' ? 0 : 1,
                }}
              >
                {ANCHOR_LABELS[pos]}
              </Box>
            ))}
          </Box>
        </CollapsibleSection>

        {/* ── Desktops ── */}
        <CollapsibleSection
          label="Desktops"
          isExpanded={expandedPanel === "desktops"}
          onToggle={() => changePanel("desktops")}
        >
          <DesktopsPanel displayIndex={displayIndex} />
        </CollapsibleSection>
      </Box>
    </Layout >
  );
}
