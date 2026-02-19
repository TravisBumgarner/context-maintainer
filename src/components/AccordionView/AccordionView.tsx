import { useEffect } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { Pause, PlayArrow } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import DesktopNamePanel from "./components/DesktopNamePanel";
import QueuePanel from "./components/QueuePanel";
import TimerPanel from "./components/TimerPanel";
import CommonAppsPanel from "./components/CommonAppsPanel";
import DesktopsPanel from "./components/DesktopsPanel";
import { useUIStore, useDesktopStore, useSettingsStore } from "../../stores";
import { PANEL_HEIGHT_DESKTOP_NAME, PANEL_HEIGHT_TASKS, PANEL_HEIGHT_COMMON_APPS, PANEL_HEIGHT_TIMER, PANEL_HEIGHT_DESKTOPS } from "../../constants";

interface AccordionViewProps {
  displayIndex: number;
}

export default function AccordionView({ displayIndex }: AccordionViewProps) {
  const { refreshDisplayGroups } = useUIStore();
  const { desktop } = useDesktopStore();
  const hiddenPanels = useSettingsStore((s) => s.hiddenPanels);
  const autoHideCountdown = useUIStore((s) => s.autoHideCountdown);
  const autoHidePaused = useUIStore((s) => s.autoHidePaused);
  const { tc, ui } = useTheme().custom;

  // Refresh display groups on mount
  useEffect(() => {
    refreshDisplayGroups();
  }, [refreshDisplayGroups]);

  // Determine first/last visible panel for border radius
  const visiblePanels = ["Tasks", "Common Apps", "Timer", "Desktops"].filter(
    (p) => !hiddenPanels.includes(p)
  );
  const lastPanel = visiblePanels[visiblePanels.length - 1];
  const isLast = (panel: string) => panel === lastPanel;

  const showCountdown = autoHideCountdown !== null && autoHideCountdown <= 10;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", p: "4px", gap: "4px" }}>
      {/* ── Auto-hide countdown ── */}
      {showCountdown && (
        <Box sx={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          px: "8px", py: "4px", flexShrink: 0,
          bgcolor: "rgba(0,0,0,0.04)", borderTopRightRadius: 8,
        }}>
          <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.5) }}>
            {autoHidePaused ? `Paused (${autoHideCountdown}s)` : `Hiding in ${autoHideCountdown}s`}
          </Typography>
          <IconButton
            size="small"
            onClick={() => useUIStore.getState().setAutoHidePaused(!autoHidePaused)}
            sx={{ p: "2px", color: tc(0.4), "&:hover": { color: tc(0.6) } }}
          >
            {autoHidePaused ? <PlayArrow sx={{ fontSize: 16 }} /> : <Pause sx={{ fontSize: 16 }} />}
          </IconButton>
        </Box>
      )}

      {/* ── Desktop Name ── */}
      <Box sx={{
        height: PANEL_HEIGHT_DESKTOP_NAME, display: "flex", alignItems: "center", flexShrink: 0,
        bgcolor: "rgba(0,0,0,0.04)",
        ...(!showCountdown && { borderTopRightRadius: 8 }),
        ...(visiblePanels.length === 0 && { borderBottomRightRadius: 8 }),
      }}>
        <DesktopNamePanel desktopId={desktop.space_id} />
      </Box>

      {/* ── Queue ── */}
      {!hiddenPanels.includes("Tasks") && (
        <Box sx={{ height: PANEL_HEIGHT_TASKS, minHeight: 0, overflow: "auto", px: "8px", bgcolor: "rgba(0,0,0,0.04)", ...(isLast("Tasks") && { borderBottomRightRadius: 8 }) }}>
          <QueuePanel desktopId={desktop.space_id} />
        </Box>
      )}

      {/* ── Common Apps ── */}
      {!hiddenPanels.includes("Common Apps") && (
        <Box sx={{ height: PANEL_HEIGHT_COMMON_APPS, display: 'flex', alignItems: 'center', justifyContent: 'center', px: "8px", flexShrink: 0, bgcolor: "rgba(0,0,0,0.04)", ...(isLast("Common Apps") && { borderBottomRightRadius: 8 }) }}>
          <CommonAppsPanel />
        </Box>
      )}

      {/* ── Timer ── */}
      {!hiddenPanels.includes("Timer") && (
        <Box sx={{ height: PANEL_HEIGHT_TIMER, display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "center", bgcolor: "rgba(0,0,0,0.04)", ...(isLast("Timer") && { borderBottomRightRadius: 8 }) }}>
          <TimerPanel />
        </Box>
      )}

      {/* ── Desktops ── */}
      {!hiddenPanels.includes("Desktops") && (
        <Box sx={{ height: PANEL_HEIGHT_DESKTOPS, display: 'flex', alignItems: 'center', justifyContent: 'center', px: "8px", flexShrink: 0, bgcolor: "rgba(0,0,0,0.04)", ...(isLast("Desktops") && { borderBottomRightRadius: 8 }) }}>
          <DesktopsPanel displayIndex={displayIndex} />
        </Box>
      )}
    </Box>
  );
}
