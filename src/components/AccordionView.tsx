import { useState } from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Button,
  ButtonBase,
  Divider,
  IconButton,
  InputBase,
  Switch,
  Typography,
  Tabs,
  Tab,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Reorder } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";
import Layout from "./Layout";
import TodoItem from "./TodoItem";
import { ANCHOR_POSITIONS, ANCHOR_LABELS, THEMES } from "../constants";
import { formatPreset, formatCountdown, textColorRgb } from "../utils";
import type {
  TodoItem as TodoItemType,
  AnchorPosition,
  SpaceInfo,
  DesktopInfo,
  DisplayGroup,
  AccordionPanel,
} from "../types";

interface AccordionViewProps {
  title: string;
  todos: TodoItemType[];
  newText: string;
  minimized: boolean;
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
  setDesktopCount: (n: number) => void;
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
  minimized,
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
  setDesktopCount,
  setAccessibilityGranted,
  setTimerPresets,
  setNotifySystem,
  setNotifyFlash,
  setTodos,
  setTitle,
  refreshSpaces,
  onShowSetup,
}: AccordionViewProps) {
  const theme = useTheme();
  const tc = theme.custom.tc;

  const active = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);
  const firstUncompleted = active[0]?.text ?? "";

  const [settingsTab, setSettingsTab] = useState(0);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleChange = (_: React.SyntheticEvent, isExpanded: boolean, panel: AccordionPanel) => {
    if (isExpanded) onPanelChange(panel);
  };

  const sectionLabelSx = {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: tc(0.45),
  } as const;

  const summaryPreviewSx = {
    fontSize: 11,
    color: tc(0.35),
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    ml: "8px",
    flex: 1,
  } as const;

  const accordionSx = {
    background: "transparent",
    boxShadow: "none",
    "&:before": { display: "none" },
    "&.Mui-expanded": { margin: 0 },
  } as const;

  const summarySx = {
    minHeight: "28px !important",
    px: "10px",
    "& .MuiAccordionSummary-content": {
      margin: "4px 0 !important",
      alignItems: "center",
      overflow: "hidden",
    },
    "& .MuiAccordionSummary-expandIconWrapper": {
      color: tc(0.3),
      fontSize: 10,
    },
  } as const;

  const detailsSx = {
    px: "10px",
    py: "4px",
  } as const;

  // ── Settings helpers ──
  const handleApplyTheme = (colors: string[]) => {
    const padded = Array.from({ length: desktopCount }, (_, i) => colors[i % colors.length]);
    invoke("apply_theme", { colors: padded })
      .then(() => {
        refreshSpaces();
        const newColor = padded[desktop.position] ?? padded[0];
        setDesktop((prev) => ({ ...prev, color: newColor }));
      })
      .catch(() => {});
  };

  const handleDesktopCountChange = (delta: number) => {
    const next = Math.max(1, Math.min(20, desktopCount + delta));
    setDesktopCount(next);
    invoke("save_desktop_count", { count: next })
      .then(() => refreshSpaces())
      .catch(() => {});
  };

  const smallBtnSx = {
    mt: 0.5,
    px: "10px",
    py: "3px",
    fontSize: 10,
    fontWeight: 600,
    color: theme.custom.tcInv(),
    bgcolor: tc(0.45),
    borderRadius: "10px",
    textTransform: "none",
    minWidth: 0,
    "&:hover": { bgcolor: tc(0.6) },
  } as const;

  // ── Timer field styling ──
  const fieldInputSx = {
    width: 48,
    textAlign: "center",
    fontSize: 20,
    fontWeight: 700,
    fontFamily: "inherit",
    color: tc(0.7),
    bgcolor: tc(0.06),
    border: `1px solid ${tc(0.12)}`,
    borderRadius: "6px",
    p: "4px 2px",
    outline: "none",
    MozAppearance: "textfield",
    "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": {
      WebkitAppearance: "none",
      margin: 0,
    },
    "&:focus": {
      borderColor: tc(0.3),
      bgcolor: tc(0.04),
    },
  } as const;

  // ── Desktop groups sorted ──
  const sortedGroups = [...displayGroups].sort((a, b) => {
    if (a.display_index === displayIndex) return -1;
    if (b.display_index === displayIndex) return 1;
    return a.display_index - b.display_index;
  });

  return (
    <Layout timerFlashing={timerFlashing}>
      {/* ── Fixed header row ── */}
      <Box
        sx={{
          px: "10px",
          py: "6px",
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
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
            fontFamily: "inherit",
            "& input": { textAlign: "center", p: 0 },
            "& input::placeholder": { color: tc(0.3), opacity: 1 },
            "&.Mui-focused input": { color: tc(0.7) },
          }}
        />
        <Box sx={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
          {offMonitor && (
            <IconButton
              onClick={onSnap}
              title={`This window has been moved off its assigned monitor (${monitorName}). Click to snap it back.`}
              sx={{
                background: "none",
                border: "none",
                p: "0 3px",
                lineHeight: 1,
                minWidth: 0,
                borderRadius: 0,
                fontSize: 16,
                fontWeight: 700,
                color: tc(0.6),
                "&:hover": { color: tc(0.9), background: "none" },
              }}
            >
              !
            </IconButton>
          )}
          <IconButton
            onClick={onToggleMinimize}
            title={minimized ? "Expand" : "Collapse"}
            sx={{
              background: "none",
              border: "none",
              p: "0 3px",
              lineHeight: 1,
              minWidth: 0,
              borderRadius: 0,
              fontSize: 14,
              fontWeight: 700,
              color: tc(0.3),
              "&:hover": { color: tc(0.6), background: "none" },
            }}
          >
            —
          </IconButton>
        </Box>
      </Box>

      {!minimized && (
        <>
          <Divider sx={{ bgcolor: tc(0.12) }} />

          {/* ── Queue panel ── */}
          <Accordion
            expanded={expandedPanel === "queue"}
            onChange={(e, expanded) => handleChange(e, expanded, "queue")}
            sx={accordionSx}
            disableGutters
          >
            <AccordionSummary
              expandIcon={<Typography sx={{ fontSize: 10, color: tc(0.3) }}>{expandedPanel === "queue" ? "\u25BE" : "\u25B8"}</Typography>}
              sx={summarySx}
            >
              <Typography sx={sectionLabelSx}>Queue</Typography>
              {expandedPanel !== "queue" && firstUncompleted && (
                <Typography sx={summaryPreviewSx}>{firstUncompleted}</Typography>
              )}
            </AccordionSummary>
            <AccordionDetails sx={{ ...detailsSx, p: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Add new todo */}
              <Box sx={{ display: "flex", alignItems: "center", px: "10px", py: "4px", flexShrink: 0 }}>
                <InputBase
                  placeholder="Queue monitor task..."
                  value={newText}
                  onChange={(e) => onNewTextChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onAddTodo()}
                  sx={{
                    width: "100%",
                    bgcolor: tc(0.06),
                    border: `1px solid ${tc(0.08)}`,
                    borderRadius: "4px",
                    px: "6px",
                    py: "4px",
                    fontSize: 11,
                    fontFamily: "inherit",
                    color: tc(0.7),
                    "& input::placeholder": { color: tc(0.3), opacity: 1 },
                    "&.Mui-focused": {
                      borderColor: tc(0.2),
                      bgcolor: tc(0.04),
                    },
                  }}
                />
              </Box>

              {/* Active todos */}
              <Reorder.Group
                axis="y"
                values={active}
                onReorder={onReorder}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "2px 0",
                  minHeight: 0,
                  listStyle: "none",
                  margin: 0,
                }}
              >
                {active.map((item) => (
                  <Reorder.Item key={item.id} value={item} style={{ listStyle: "none" }}>
                    <TodoItem
                      item={item}
                      dragHandle={
                        <Typography
                          sx={{
                            flexShrink: 0,
                            cursor: "grab",
                            color: tc(0.2),
                            fontSize: 10,
                            px: "2px",
                            userSelect: "none",
                            "&:active": { cursor: "grabbing" },
                          }}
                        >
                          ⠿
                        </Typography>
                      }
                      onToggle={onToggleDone}
                      onUpdate={onUpdateText}
                      onDelete={onDeleteTodo}
                    />
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              {/* Archive */}
              {done.length > 0 && (
                <Box
                  component="details"
                  sx={{
                    flexShrink: 0,
                    borderTop: `1px solid ${tc(0.08)}`,
                    "& summary": {
                      fontSize: 10,
                      color: tc(0.35),
                      px: "10px",
                      py: "4px",
                      cursor: "pointer",
                      userSelect: "none",
                      listStyle: "none",
                      "&::-webkit-details-marker": { display: "none" },
                      "&::before": { content: '"\\25B6  "', fontSize: 8 },
                    },
                    "&[open] summary::before": { content: '"\\25BC  "' },
                  }}
                >
                  <summary>Done ({done.length})</summary>
                  <Box
                    sx={{
                      maxHeight: 80,
                      overflowY: "auto",
                      "&::-webkit-scrollbar": { width: 4 },
                      "&::-webkit-scrollbar-thumb": {
                        background: tc(0.1),
                        borderRadius: "2px",
                      },
                    }}
                  >
                    {done.map((item) => (
                      <TodoItem
                        key={item.id}
                        item={item}
                        isDone
                        onToggle={onToggleDone}
                        onUpdate={onUpdateText}
                        onDelete={onDeleteTodo}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          {/* ── Timer panel ── */}
          <Accordion
            expanded={expandedPanel === "timer"}
            onChange={(e, expanded) => handleChange(e, expanded, "timer")}
            sx={accordionSx}
            disableGutters
          >
            <AccordionSummary
              expandIcon={<Typography sx={{ fontSize: 10, color: tc(0.3) }}>{expandedPanel === "timer" ? "\u25BE" : "\u25B8"}</Typography>}
              sx={summarySx}
            >
              <Typography sx={sectionLabelSx}>Timer</Typography>
              {expandedPanel !== "timer" && timerRunning && (
                <Typography sx={summaryPreviewSx}>{formatCountdown(timerRemaining)}</Typography>
              )}
            </AccordionSummary>
            <AccordionDetails sx={detailsSx}>
              {!timerRunning ? (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      mb: "12px",
                    }}
                  >
                    {[
                      { value: timerHours, set: setTimerHours, max: 99, label: "HH" },
                      { value: timerMinutes, set: setTimerMinutes, max: 59, label: "MM" },
                      { value: timerSeconds, set: setTimerSeconds, max: 59, label: "SS" },
                    ].map((field, i) => (
                      <Box key={field.label} sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {i > 0 && (
                          <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc(0.35), pb: "14px" }}>:</Typography>
                        )}
                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <Box
                            component="input"
                            type="number"
                            min={0}
                            max={field.max}
                            value={field.value}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              field.set(Math.max(0, Math.min(field.max, parseInt(e.target.value) || 0)))
                            }
                            sx={fieldInputSx}
                          />
                          <Typography sx={{ fontSize: 9, color: tc(0.35), mt: "2px", fontWeight: 600 }}>
                            {field.label}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "center", gap: "6px", mb: "14px" }}>
                    {timerPresets.map((p, i) => (
                      <Button
                        key={i}
                        onClick={() => onTimerPreset(p)}
                        sx={{
                          px: "12px",
                          py: "4px",
                          fontSize: 11,
                          fontWeight: 600,
                          color: tc(0.55),
                          bgcolor: tc(0.06),
                          border: `1px solid ${tc(0.12)}`,
                          borderRadius: "10px",
                          textTransform: "none",
                          minWidth: 0,
                          "&:hover": { bgcolor: tc(0.12), color: tc(0.7) },
                        }}
                      >
                        {formatPreset(p)}
                      </Button>
                    ))}
                  </Box>

                  <Button
                    onClick={onTimerStart}
                    disabled={timerHours === 0 && timerMinutes === 0 && timerSeconds === 0}
                    sx={{
                      display: "block",
                      width: "100%",
                      maxWidth: 160,
                      mx: "auto",
                      px: "14px",
                      py: "7px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: theme.custom.tcInv(),
                      bgcolor: tc(0.55),
                      borderRadius: "12px",
                      textTransform: "none",
                      "&:hover": { bgcolor: tc(0.7) },
                      "&:disabled": { opacity: 0.4 },
                    }}
                  >
                    Start
                  </Button>
                </>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "14px",
                    mt: "10px",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 32,
                      fontWeight: 700,
                      color: tc(0.7),
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: "1px",
                    }}
                  >
                    {formatCountdown(timerRemaining)}
                  </Typography>
                  <Button
                    onClick={onTimerCancel}
                    sx={{
                      px: "18px",
                      py: "5px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: tc(0.55),
                      bgcolor: tc(0.08),
                      border: `1px solid ${tc(0.15)}`,
                      borderRadius: "10px",
                      textTransform: "none",
                      "&:hover": { bgcolor: tc(0.15) },
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>

          {/* ── Anchor panel ── */}
          <Accordion
            expanded={expandedPanel === "anchor"}
            onChange={(e, expanded) => handleChange(e, expanded, "anchor")}
            sx={accordionSx}
            disableGutters
          >
            <AccordionSummary
              expandIcon={<Typography sx={{ fontSize: 10, color: tc(0.3) }}>{expandedPanel === "anchor" ? "\u25BE" : "\u25B8"}</Typography>}
              sx={summarySx}
            >
              <Typography sx={sectionLabelSx}>Anchor</Typography>
            </AccordionSummary>
            <AccordionDetails sx={detailsSx}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "3px",
                  maxWidth: 100,
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
                      width: 28,
                      height: 22,
                      border: `1px solid ${tc(pos === anchorPos ? 0.3 : 0.12)}`,
                      borderRadius: "3px",
                      bgcolor: tc(pos === anchorPos ? 0.25 : 0.04),
                      color: tc(pos === anchorPos ? 0.9 : 0.4),
                      fontSize: 8,
                      fontWeight: 600,
                      fontFamily: "inherit",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      p: 0,
                      "&:hover": {
                        bgcolor: tc(0.12),
                        color: tc(0.7),
                      },
                    }}
                  >
                    {ANCHOR_LABELS[pos]}
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* ── Desktops panel ── */}
          <Accordion
            expanded={expandedPanel === "desktops"}
            onChange={(e, expanded) => handleChange(e, expanded, "desktops")}
            sx={accordionSx}
            disableGutters
          >
            <AccordionSummary
              expandIcon={<Typography sx={{ fontSize: 10, color: tc(0.3) }}>{expandedPanel === "desktops" ? "\u25BE" : "\u25B8"}</Typography>}
              sx={summarySx}
            >
              <Typography sx={sectionLabelSx}>Desktops</Typography>
            </AccordionSummary>
            <AccordionDetails sx={detailsSx}>
              {sortedGroups.map((group) => (
                <Box key={group.display_index} sx={{ mb: "12px" }}>
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: tc(0.4),
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                      mb: "6px",
                    }}
                  >
                    {monitorNames[group.display_index] || `Screen ${group.display_index + 1}`}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      gap: "6px",
                      overflowX: "auto",
                      pb: "4px",
                      "&::-webkit-scrollbar": { height: 4 },
                      "&::-webkit-scrollbar-thumb": {
                        background: tc(0.1),
                        borderRadius: "2px",
                      },
                    }}
                  >
                    {group.desktops.map((d) => {
                      const cardTc = textColorRgb(d.color);
                      const isActive = d.space_id === currentSpaceId;
                      return (
                        <ButtonBase
                          key={d.space_id}
                          onClick={() => onSwitchDesktop(d.space_id)}
                          sx={{
                            flexShrink: 0,
                            width: 80,
                            minHeight: 56,
                            border: isActive
                              ? `2px solid rgba(${cardTc}, 0.5)`
                              : "2px solid transparent",
                            borderRadius: "8px",
                            p: "6px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "3px",
                            fontFamily: "inherit",
                            bgcolor: d.color,
                            transition: "border-color 0.15s, transform 0.1s",
                            boxShadow: isActive ? `0 0 0 1px rgba(${cardTc}, 0.2)` : "none",
                            "&:hover": { transform: "scale(1.04)" },
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: 10,
                              fontWeight: 600,
                              color: `rgba(${cardTc}, 0.7)`,
                              textAlign: "center",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "100%",
                            }}
                          >
                            {d.title || d.name}
                          </Typography>
                          {d.todo_count > 0 && (
                            <Typography
                              sx={{
                                fontSize: 9,
                                fontWeight: 600,
                                color: `rgba(${cardTc}, 0.5)`,
                                bgcolor: `rgba(${cardTc}, 0.1)`,
                                borderRadius: "8px",
                                px: "5px",
                              }}
                            >
                              {d.todo_count}
                            </Typography>
                          )}
                        </ButtonBase>
                      );
                    })}
                  </Box>
                </Box>
              ))}

              {displayGroups.length === 0 && (
                <Typography sx={{ fontSize: 10, color: tc(0.25), px: "6px" }}>
                  No desktops found
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>

          {/* ── Settings panel ── */}
          <Accordion
            expanded={expandedPanel === "settings"}
            onChange={(e, expanded) => handleChange(e, expanded, "settings")}
            sx={accordionSx}
            disableGutters
          >
            <AccordionSummary
              expandIcon={<Typography sx={{ fontSize: 10, color: tc(0.3) }}>{expandedPanel === "settings" ? "\u25BE" : "\u25B8"}</Typography>}
              sx={summarySx}
            >
              <Typography sx={sectionLabelSx}>Settings</Typography>
            </AccordionSummary>
            <AccordionDetails sx={detailsSx}>
              <Tabs
                value={settingsTab}
                onChange={(_, v) => setSettingsTab(v)}
                sx={{
                  mb: "10px",
                  minHeight: 0,
                  "& .MuiTabs-indicator": { bgcolor: tc(0.45) },
                  borderBottom: `1px solid ${tc(0.12)}`,
                }}
              >
                {["Themes", "Permissions", "Timer"].map((label) => (
                  <Tab
                    key={label}
                    label={label}
                    sx={{
                      flex: 1,
                      fontSize: 11,
                      fontWeight: 600,
                      color: tc(0.35),
                      textTransform: "none",
                      minHeight: 0,
                      p: "5px 0",
                      "&.Mui-selected": { color: tc(0.65) },
                    }}
                  />
                ))}
              </Tabs>

              {/* Themes tab */}
              {settingsTab === 0 && (
                <>
                  <Box sx={{ mb: "12px" }}>
                    {!showThemePicker ? (
                      <Button
                        onClick={() => setShowThemePicker(true)}
                        sx={{
                          px: "14px",
                          py: "5px",
                          fontSize: 11,
                          fontWeight: 600,
                          color: theme.custom.tcInv(),
                          bgcolor: tc(0.45),
                          borderRadius: "12px",
                          textTransform: "none",
                          "&:hover": { bgcolor: tc(0.6) },
                        }}
                      >
                        Choose a Theme
                      </Button>
                    ) : (
                      <>
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: tc(0.45),
                            mb: "6px",
                            textTransform: "uppercase",
                            letterSpacing: "0.3px",
                          }}
                        >
                          Theme
                        </Typography>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, 1fr)",
                            gap: "6px",
                          }}
                        >
                          {THEMES.map((t) => (
                            <Box
                              key={t.name}
                              component="button"
                              onClick={() => {
                                handleApplyTheme(t.colors);
                                setShowThemePicker(false);
                              }}
                              title={t.name}
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "3px",
                                p: "5px 4px",
                                border: `1px solid ${tc(0.1)}`,
                                borderRadius: "6px",
                                bgcolor: tc(0.03),
                                cursor: "pointer",
                                fontFamily: "inherit",
                                "&:hover": { bgcolor: tc(0.08) },
                              }}
                            >
                              <Box sx={{ display: "flex", gap: "2px" }}>
                                {t.colors.slice(0, 5).map((c, i) => (
                                  <Box
                                    key={i}
                                    sx={{
                                      width: 14,
                                      height: 14,
                                      borderRadius: "3px",
                                      border: "1px solid rgba(0,0,0,0.08)",
                                      bgcolor: c,
                                    }}
                                  />
                                ))}
                              </Box>
                              <Typography sx={{ fontSize: 9, color: tc(0.5), fontWeight: 600 }}>
                                {t.name}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </>
                    )}
                  </Box>

                  <Box sx={{ mb: "12px" }}>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: tc(0.45),
                        mb: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      Desktops
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography sx={{ fontSize: 11, color: tc(0.55) }}>
                        Number of desktops
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Box
                          component="button"
                          onClick={() => handleDesktopCountChange(-1)}
                          sx={{
                            width: 20,
                            height: 20,
                            border: `1px solid ${tc(0.15)}`,
                            borderRadius: "4px",
                            bgcolor: tc(0.05),
                            color: tc(0.5),
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "inherit",
                            p: 0,
                            lineHeight: 1,
                            "&:hover": { bgcolor: tc(0.1) },
                          }}
                        >
                          -
                        </Box>
                        <Typography
                          sx={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: tc(0.6),
                            minWidth: 18,
                            textAlign: "center",
                          }}
                        >
                          {desktopCount}
                        </Typography>
                        <Box
                          component="button"
                          onClick={() => handleDesktopCountChange(1)}
                          sx={{
                            width: 20,
                            height: 20,
                            border: `1px solid ${tc(0.15)}`,
                            borderRadius: "4px",
                            bgcolor: tc(0.05),
                            color: tc(0.5),
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "inherit",
                            p: 0,
                            lineHeight: 1,
                            "&:hover": { bgcolor: tc(0.1) },
                          }}
                        >
                          +
                        </Box>
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ mb: "12px" }}>
                    {allSpaces.map((s) => (
                      <Box
                        key={s.space_id}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          py: "3px",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: tc(0.55),
                            flex: 1,
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {s.title || s.name}
                        </Typography>
                        <Box
                          component="input"
                          type="color"
                          value={s.color}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const newColor = e.target.value;
                            invoke("save_color", { desktop: s.space_id, color: newColor }).catch(() => {});
                            setAllSpaces(
                              allSpaces.map((sp) =>
                                sp.space_id === s.space_id ? { ...sp, color: newColor } : sp
                              )
                            );
                            if (s.space_id === desktop.space_id) {
                              setDesktop((prev) => ({ ...prev, color: newColor }));
                            }
                          }}
                          sx={{
                            flexShrink: 0,
                            width: 24,
                            height: 20,
                            border: `1px solid ${tc(0.12)}`,
                            borderRadius: "3px",
                            p: "1px",
                            cursor: "pointer",
                            background: "none",
                          }}
                        />
                      </Box>
                    ))}
                    {allSpaces.length === 0 && (
                      <Typography sx={{ fontSize: 10, color: tc(0.25), px: "6px" }}>
                        No spaces detected
                      </Typography>
                    )}
                  </Box>
                </>
              )}

              {/* Permissions tab */}
              {settingsTab === 1 && (
                <>
                  <Box sx={{ mb: "12px" }}>
                    {!accessibilityGranted && (
                      <Box sx={{ fontSize: 11, color: tc(0.5), mb: 1, lineHeight: 1.4 }}>
                        <Typography
                          component="strong"
                          sx={{ fontWeight: 700, color: tc(0.65), fontSize: "inherit" }}
                        >
                          Accessibility
                        </Typography>
                        {" — not granted"}
                        <br />
                        <Button
                          onClick={() => {
                            invoke<boolean>("request_accessibility")
                              .then(setAccessibilityGranted)
                              .catch(() => {});
                          }}
                          sx={smallBtnSx}
                        >
                          Grant Access
                        </Button>
                      </Box>
                    )}
                    {accessibilityGranted && (
                      <Box sx={{ fontSize: 11, color: tc(0.5), mb: 1, lineHeight: 1.4 }}>
                        <Typography
                          component="strong"
                          sx={{ fontWeight: 700, color: tc(0.65), fontSize: "inherit" }}
                        >
                          Accessibility
                        </Typography>
                        <Typography
                          component="span"
                          sx={{ color: "#4caf50", fontSize: 10, fontWeight: 600, ml: 0.5 }}
                        >
                          Granted
                        </Typography>
                      </Box>
                    )}
                    <Box sx={{ fontSize: 11, color: tc(0.5), mb: 1, lineHeight: 1.4 }}>
                      <Typography
                        component="strong"
                        sx={{ fontWeight: 700, color: tc(0.65), fontSize: "inherit" }}
                      >
                        Keyboard Shortcuts
                      </Typography>
                      <br />
                      System Settings &gt; Keyboard &gt; Keyboard Shortcuts &gt; Mission Control —
                      enable "Switch to Desktop N" for each desktop.
                    </Box>
                  </Box>

                  <Button
                    onClick={onShowSetup}
                    sx={{
                      background: "none",
                      fontSize: 10,
                      color: tc(0.3),
                      p: "4px 0",
                      textTransform: "none",
                      textDecoration: "underline",
                      minWidth: 0,
                      "&:hover": { color: tc(0.5), background: "none" },
                    }}
                  >
                    Show Setup Again
                  </Button>

                  <Box sx={{ mb: "12px" }}>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: tc(0.45),
                        mb: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      Data
                    </Typography>
                    {!confirmClear ? (
                      <Button onClick={() => setConfirmClear(true)} sx={{ ...smallBtnSx, mt: "4px" }}>
                        Clear All Data
                      </Button>
                    ) : (
                      <Box sx={{ mt: "4px" }}>
                        <Typography sx={{ m: "0 0 6px", fontSize: 11, color: tc(0.5) }}>
                          This will delete all todos, titles, and custom colors. Are you sure?
                        </Typography>
                        <Button
                          onClick={() => {
                            invoke("clear_all_data")
                              .then(() => {
                                setTodos([]);
                                setTitle("");
                                setDesktop((prev) => ({ ...prev, color: "#F5E6A3" }));
                                refreshSpaces();
                                setConfirmClear(false);
                              })
                              .catch(() => {});
                          }}
                          sx={{ ...smallBtnSx, mr: "6px" }}
                        >
                          Yes, clear everything
                        </Button>
                        <Button onClick={() => setConfirmClear(false)} sx={smallBtnSx}>
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </Box>
                </>
              )}

              {/* Timer tab */}
              {settingsTab === 2 && (
                <>
                  <Box sx={{ mb: "12px" }}>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: tc(0.45),
                        mb: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      Presets
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {timerPresets.map((p, i) => (
                        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Typography
                            sx={{ fontSize: 11, color: tc(0.5), width: 52, flexShrink: 0 }}
                          >
                            Preset {i + 1}
                          </Typography>
                          <Box
                            component="input"
                            type="number"
                            min={1}
                            value={p}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const val = Math.max(1, parseInt(e.target.value) || 1);
                              setTimerPresets((prev) => prev.map((v, j) => (j === i ? val : v)));
                            }}
                            sx={{
                              width: 60,
                              fontSize: 11,
                              fontFamily: "inherit",
                              color: tc(0.7),
                              bgcolor: tc(0.06),
                              border: `1px solid ${tc(0.12)}`,
                              borderRadius: "4px",
                              p: "3px 6px",
                              outline: "none",
                              MozAppearance: "textfield",
                              "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": {
                                WebkitAppearance: "none",
                                margin: 0,
                              },
                              "&:focus": { borderColor: tc(0.3) },
                            }}
                          />
                          <Typography sx={{ fontSize: 10, color: tc(0.35) }}>sec</Typography>
                        </Box>
                      ))}
                    </Box>
                    <Button
                      onClick={() => {
                        invoke("save_timer_presets", { presets: timerPresets }).catch(() => {});
                      }}
                      sx={{ ...smallBtnSx, mt: "6px" }}
                    >
                      Save Presets
                    </Button>
                  </Box>

                  <Box sx={{ mb: "12px" }}>
                    <Typography
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: tc(0.45),
                        mb: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                      }}
                    >
                      Notification Type
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        py: "3px",
                        cursor: "pointer",
                      }}
                      component="label"
                    >
                      <Switch
                        size="small"
                        checked={notifySystem}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setNotifySystem(val);
                          invoke("save_notify_settings", { system: val, flash: notifyFlash }).catch(() => {});
                        }}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": { color: tc(0.6) },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                            bgcolor: tc(0.3),
                          },
                        }}
                      />
                      <Typography sx={{ fontSize: 11, color: tc(0.55) }}>
                        System notification
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        py: "3px",
                        cursor: "pointer",
                      }}
                      component="label"
                    >
                      <Switch
                        size="small"
                        checked={notifyFlash}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setNotifyFlash(val);
                          invoke("save_notify_settings", { system: notifySystem, flash: val }).catch(() => {});
                        }}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": { color: tc(0.6) },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                            bgcolor: tc(0.3),
                          },
                        }}
                      />
                      <Typography sx={{ fontSize: 11, color: tc(0.55) }}>In-app flash</Typography>
                    </Box>
                  </Box>
                </>
              )}
            </AccordionDetails>
          </Accordion>
        </>
      )}
    </Layout>
  );
}
