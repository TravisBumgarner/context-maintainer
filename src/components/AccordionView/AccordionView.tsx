import { useState, useEffect } from "react";
import {
  Box,
  Divider,
  IconButton,
  InputBase,
  Popover,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Layout from "./components/Layout";
import QueuePanel from "./components/QueuePanel";
import TimerPanel from "./components/TimerPanel";
import DesktopsPanel from "./components/DesktopsPanel";
import { ANCHOR_POSITIONS, ANCHOR_LABELS } from "../../constants";
import { useShallow } from "zustand/react/shallow";
import { useTodoStore, useTimerStore, useUIStore, useDesktopStore } from "../../stores";

interface AccordionViewProps {
  displayIndex: number;
}

export default function AccordionView({ displayIndex }: AccordionViewProps) {
  const tc = useTheme().custom.tc;
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  // Zustand stores
  const { todos, title, updateTitle } = useTodoStore();
  const { flashing } = useTimerStore(useShallow((s) => {
    const t = s.timers[s.activeDesktop];
    return {
      flashing: t?.flashing ?? false,
    };
  }));
  const {
    collapsed,
    offMonitor,
    anchorPos,
    toggleMinimize,
    snapToMonitor,
    selectAnchor,
    setView,
    refreshDisplayGroups,
  } = useUIStore();
  const { desktop, monitorNames } = useDesktopStore();

  const monitorName = monitorNames[displayIndex] || `Screen ${displayIndex + 1}`;

  const handleAnchorSelect = (pos: typeof anchorPos) => {
    selectAnchor(pos);
    setAnchorEl(null);
  };

  // Refresh display groups on mount
  useEffect(() => {
    refreshDisplayGroups();
  }, [refreshDisplayGroups]);

  const sectionLabelSx = {
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: tc(0.45),
    px: "16px",
    py: "4px",
    flexShrink: 0,
  } as const;

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
            <Tooltip title="Snap back to monitor" arrow>
              <IconButton
                onClick={() => snapToMonitor()}
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
            </Tooltip>
          )}
          <Tooltip title="Anchor position" arrow>
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{
                p: "0 3px",
                lineHeight: 1,
                fontSize: 14,
                fontWeight: 700,
                color: tc(0.3),
                "&:hover": { color: tc(0.6) },
              }}
            >
              {ANCHOR_LABELS[anchorPos]}
            </IconButton>
          </Tooltip>
          <Popover
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            transformOrigin={{ vertical: "top", horizontal: "center" }}
            slotProps={{
              paper: {
                sx: {
                  p: "8px",
                  bgcolor: tc(0.05),
                  borderRadius: "8px",
                },
              },
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "2px",
              }}
            >
              {ANCHOR_POSITIONS.map((pos) => (
                <Box
                  key={pos}
                  component="button"
                  onClick={() => handleAnchorSelect(pos)}
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
          </Popover>
          <Tooltip title="Settings" arrow>
            <IconButton
              onClick={() => setView("settings")}
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
          </Tooltip>
          <Tooltip title={collapsed ? "Expand" : "Collapse"} arrow>
            <IconButton
              onClick={toggleMinimize}
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
          </Tooltip>
        </Box>
      </Box>

      <Divider />

      <Box sx={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {/* ── Queue ── */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <Typography sx={sectionLabelSx}>Queue</Typography>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto", px: "8px" }}>
            <QueuePanel desktopId={desktop.space_id} />
          </Box>
        </Box>

        <Divider />

        {/* ── Timer ── */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <Typography sx={sectionLabelSx}>Timer</Typography>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto", alignItems: "center", justifyContent: "center" }}>
            <TimerPanel />
          </Box>
        </Box>

        <Divider />

        {/* ── Desktops ── */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
          <Typography sx={sectionLabelSx}>Desktops</Typography>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto", px: "8px" }}>
            <DesktopsPanel displayIndex={displayIndex} />
          </Box>
        </Box>
      </Box>
    </Layout>
  );
}
