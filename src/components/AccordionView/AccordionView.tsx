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
import type {
  TodoItem as TodoItemType,
  AnchorPosition,
  SpaceInfo,
  DesktopInfo,
  DisplayGroup,
  AccordionPanel,
} from "../../types";

interface AccordionViewProps {
  title: string;
  todos: TodoItemType[];
  newText: string;
  collapsed: boolean;
  offMonitor: boolean;
  monitorName: string;
  anchorPos: AnchorPosition;
  expandedPanel: AccordionPanel;
  timerFlashing: boolean;
  timerRunning: boolean;
  timerRemaining: number;
  timerHours: number;
  timerMinutes: number;
  timerSeconds: number;
  timerPresets: number[];
  displayGroups: DisplayGroup[];
  displayIndex: number;
  currentSpaceId: number;
  monitorNames: Record<number, string>;
  desktop: DesktopInfo;
  allSpaces: SpaceInfo[];
  desktopCount: number;
  accessibilityGranted: boolean | null;
  notifySystem: boolean;
  notifyFlash: boolean;
  onTitleChange: (v: string) => void;
  onNewTextChange: (v: string) => void;
  onAddTodo: () => void;
  onToggleDone: (id: string) => void;
  onUpdateText: (id: string, text: string) => void;
  onDeleteTodo: (id: string) => void;
  onReorder: (items: TodoItemType[]) => void;
  onSnap: () => void;
  onToggleMinimize: () => void;
  onAnchorSelect: (pos: AnchorPosition) => void;
  onPanelChange: (panel: AccordionPanel) => void;
  onSwitchDesktop: (spaceId: number) => void;
  setTimerHours: (v: number) => void;
  setTimerMinutes: (v: number) => void;
  setTimerSeconds: (v: number) => void;
  onTimerStart: () => void;
  onTimerCancel: () => void;
  onTimerPreset: (seconds: number) => void;
  setAllSpaces: (s: SpaceInfo[]) => void;
  setDesktop: (fn: (prev: DesktopInfo) => DesktopInfo) => void;
  setAccessibilityGranted: (v: boolean) => void;
  setTimerPresets: (fn: (prev: number[]) => number[]) => void;
  setNotifySystem: (v: boolean) => void;
  setNotifyFlash: (v: boolean) => void;
  setTodos: (t: []) => void;
  setTitle: (t: string) => void;
  refreshSpaces: () => void;
  onShowSetup: () => void;
}

export default function AccordionView({
  title,
  todos,
  newText,
  collapsed,
  offMonitor,
  monitorName,
  anchorPos,
  expandedPanel,
  timerFlashing,
  timerRunning,
  timerRemaining,
  timerHours,
  timerMinutes,
  timerSeconds,
  timerPresets,
  displayGroups,
  displayIndex,
  currentSpaceId,
  monitorNames,
  desktop,
  allSpaces,
  desktopCount,
  accessibilityGranted,
  notifySystem,
  notifyFlash,
  onTitleChange,
  onNewTextChange,
  onAddTodo,
  onToggleDone,
  onUpdateText,
  onDeleteTodo,
  onReorder,
  onSnap,
  onToggleMinimize,
  onAnchorSelect,
  onPanelChange,
  onSwitchDesktop,
  setTimerHours,
  setTimerMinutes,
  setTimerSeconds,
  onTimerStart,
  onTimerCancel,
  onTimerPreset,
  setAllSpaces,
  setDesktop,
  setAccessibilityGranted,
  setTimerPresets,
  setNotifySystem,
  setNotifyFlash,
  setTodos,
  setTitle,
  refreshSpaces,
  onShowSetup,
}: AccordionViewProps) {
  const tc = useTheme().custom.tc;

  const firstUncompleted = todos.filter((t) => !t.done)[0]?.text ?? "";

  const handleChange = (_: React.SyntheticEvent, isExpanded: boolean, panel: AccordionPanel) => {
    if (isExpanded) onPanelChange(panel);
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

  const chevron = (panel: AccordionPanel) => (
    <Typography sx={{ fontSize: 16, color: tc(0.3) }}>
      {expandedPanel === panel ? "\u25BE" : "\u25B8"}
    </Typography>
  );

  return (
    <Layout timerFlashing={timerFlashing}>
      {/* ── Header ── */}
      <Box sx={{ px: "10px", py: "6px", display: "flex", alignItems: "center", flexShrink: 0 }}>
        <InputBase
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
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
              onClick={onSnap}
              title={`This window has been moved off its assigned monitor (${monitorName}). Click to snap it back.`}
              sx={{ p: "0 3px", lineHeight: 1, fontSize: 16, fontWeight: 700, color: tc(0.6), "&:hover": { color: tc(0.9) } }}
            >
              !
            </IconButton>
          )}
          <IconButton
            onClick={onToggleMinimize}
            title={collapsed ? "Expand" : "Collapse"}
            sx={{ p: "0 3px", lineHeight: 1, fontSize: 14, fontWeight: 700, color: tc(0.3), "&:hover": { color: tc(0.6) } }}
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
          <QueuePanel
            todos={todos}
            newText={newText}
            onNewTextChange={onNewTextChange}
            onAddTodo={onAddTodo}
            onToggleDone={onToggleDone}
            onUpdateText={onUpdateText}
            onDeleteTodo={onDeleteTodo}
            onReorder={onReorder}
          />
        </AccordionDetails>
      </Accordion>

      {/* ── Timer ── */}
      <Accordion expanded={expandedPanel === "timer"} onChange={(e, exp) => handleChange(e, exp, "timer")}>
        <AccordionSummary expandIcon={chevron("timer")}>
          <Typography sx={sectionLabelSx}>Timer</Typography>
          {expandedPanel !== "timer" && timerRunning && (
            <Typography sx={summaryPreviewSx}>{formatCountdown(timerRemaining)}</Typography>
          )}
        </AccordionSummary>
        <AccordionDetails>
          <TimerPanel
            timerRunning={timerRunning}
            timerRemaining={timerRemaining}
            timerHours={timerHours}
            timerMinutes={timerMinutes}
            timerSeconds={timerSeconds}
            timerPresets={timerPresets}
            setTimerHours={setTimerHours}
            setTimerMinutes={setTimerMinutes}
            setTimerSeconds={setTimerSeconds}
            onTimerStart={onTimerStart}
            onTimerCancel={onTimerCancel}
            onTimerPreset={onTimerPreset}
          />
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
                onClick={() => onAnchorSelect(pos)}
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
          <DesktopsPanel
            displayGroups={displayGroups}
            displayIndex={displayIndex}
            currentSpaceId={currentSpaceId}
            monitorNames={monitorNames}
            onSwitchDesktop={onSwitchDesktop}
          />
        </AccordionDetails>
      </Accordion>

      {/* ── Settings ── */}
      <Accordion expanded={expandedPanel === "settings"} onChange={(e, exp) => handleChange(e, exp, "settings")}>
        <AccordionSummary expandIcon={chevron("settings")}>
          <Typography sx={sectionLabelSx}>Settings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <SettingsPanel
            desktop={desktop}
            allSpaces={allSpaces}
            desktopCount={desktopCount}
            timerPresets={timerPresets}
            accessibilityGranted={accessibilityGranted}
            notifySystem={notifySystem}
            notifyFlash={notifyFlash}
            setAllSpaces={setAllSpaces}
            setDesktop={setDesktop}
            setAccessibilityGranted={setAccessibilityGranted}
            setTimerPresets={setTimerPresets}
            setNotifySystem={setNotifySystem}
            setNotifyFlash={setNotifyFlash}
            setTodos={setTodos}
            setTitle={setTitle}
            refreshSpaces={refreshSpaces}
            onShowSetup={onShowSetup}
          />
        </AccordionDetails>
      </Accordion>
    </Layout>
  );
}
