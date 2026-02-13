import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Divider,
  IconButton,
  InputBase,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Layout from "./components/Layout";
import QueuePanel from "./components/QueuePanel";
import TimerPanel from "./components/TimerPanel";
import DesktopsPanel from "./components/DesktopsPanel";
import SettingsPanel from "./components/SettingsPanel";
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
  } = useUIStore();
  const { desktop, monitorNames } = useDesktopStore();

  const monitorName = monitorNames[displayIndex] || `Screen ${displayIndex + 1}`;
  const firstUncompleted = todos.filter((t) => !t.done)[0]?.text ?? "";

  const handleChange = (_: React.SyntheticEvent, isExpanded: boolean, panel: string) => {
    if (isExpanded) changePanel(panel as any);
  };

  const sectionLabelSx = {
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: tc(0.45),
  } as const;

  const summaryPreviewSx = {
    color: tc(0.35),
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    ml: "8px",
    flex: 1,
  } as const;

  const chevron = (panel: string) => (
    <Typography sx={{ fontSize: 16, color: tc(0.3) }}>
      {expandedPanel === panel ? "\u25BE" : "\u25B8"}
    </Typography>
  );

  return (
    <Layout timerFlashing={flashing}>
      {/* ── Header ── */}
      <Box sx={{ px: "10px", py: "6px", display: "flex", alignItems: "center", flexShrink: 0 }}>
        <InputBase
          value={title}
          onChange={(e) => updateTitle(e.target.value, desktop.space_id)}
          placeholder="What are you working on?"
          sx={{
            flex: 1,
            fontSize: 14,
            fontWeight: 700,
            color: tc(0.55),
            letterSpacing: "-0.3px",
            textAlign: "center",
            "& input": { textAlign: "center", p: 0 },
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

      {/* ── Queue ── */}
      <Accordion expanded={expandedPanel === "queue"} onChange={(e, exp) => handleChange(e, exp, "queue")}>
        <AccordionSummary expandIcon={chevron("queue")}>
          <Typography sx={sectionLabelSx}>Queue</Typography>
          {expandedPanel !== "queue" && firstUncompleted && (
            <Typography sx={summaryPreviewSx}>{firstUncompleted}</Typography>
          )}
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <QueuePanel desktopId={desktop.space_id} />
        </AccordionDetails>
      </Accordion>

      {/* ── Timer ── */}
      <Accordion expanded={expandedPanel === "timer"} onChange={(e, exp) => handleChange(e, exp, "timer")}>
        <AccordionSummary expandIcon={chevron("timer")}>
          <Typography sx={sectionLabelSx}>Timer</Typography>
          {expandedPanel !== "timer" && running && (
            <Typography sx={summaryPreviewSx}>{formatCountdown(remaining)}</Typography>
          )}
        </AccordionSummary>
        <AccordionDetails>
          <TimerPanel />
        </AccordionDetails>
      </Accordion>

      {/* ── Anchor (inline — small) ── */}
      <Accordion expanded={expandedPanel === "anchor"} onChange={(e, exp) => handleChange(e, exp, "anchor")}>
        <AccordionSummary expandIcon={chevron("anchor")}>
          <Typography sx={sectionLabelSx}>Anchor</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "2px",
              maxWidth: 120,
              mx: "auto",
            }}
          >
            {ANCHOR_POSITIONS.map((pos) => (
              <Box
                key={pos}
                component="button"
                onClick={() => selectAnchor(pos)}
                title={pos}
                sx={{
                  width: 36,
                  height: 28,
                  border: "none",
                  background: "none",
                  color: tc(pos === anchorPos ? 0.9 : 0.35),
                  fontSize: 16,
                  fontFamily: "inherit",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: 0,
                  "&:hover": { color: tc(0.7) },
                }}
              >
                {ANCHOR_LABELS[pos]}
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* ── Desktops ── */}
      <Accordion expanded={expandedPanel === "desktops"} onChange={(e, exp) => handleChange(e, exp, "desktops")}>
        <AccordionSummary expandIcon={chevron("desktops")}>
          <Typography sx={sectionLabelSx}>Desktops</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <DesktopsPanel displayIndex={displayIndex} />
        </AccordionDetails>
      </Accordion>

      {/* ── Settings ── */}
      <Accordion expanded={expandedPanel === "settings"} onChange={(e, exp) => handleChange(e, exp, "settings")}>
        <AccordionSummary expandIcon={chevron("settings")}>
          <Typography sx={sectionLabelSx}>Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <SettingsPanel />
        </AccordionDetails>
      </Accordion>
    </Layout>
  );
}
