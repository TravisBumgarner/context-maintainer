import { useEffect } from "react";
import { Box, Typography } from "@mui/material";

import DesktopNamePanel from "./components/DesktopNamePanel";
import QueuePanel from "./components/QueuePanel";
import TimerPanel from "./components/TimerPanel";
import CommonAppsPanel from "./components/CommonAppsPanel";
import DesktopsPanel from "./components/DesktopsPanel";
import { useUIStore, useDesktopStore, useSettingsStore } from "../../stores";
import { PANEL_HEIGHT_DESKTOP_NAME, PANEL_HEIGHT_TASKS, PANEL_HEIGHT_COMMON_APPS, PANEL_HEIGHT_TIMER, PANEL_HEIGHT_DESKTOPS } from "../../constants";
import { BG_OVERLAY_LIGHT } from "../../theme";
import { AppIconButton } from "../shared";

interface AccordionViewProps {
  displayIndex: number;
}

export default function AccordionView({ displayIndex }: AccordionViewProps) {
  const { refreshDisplayGroups } = useUIStore();
  const { desktop } = useDesktopStore();
  const hiddenPanels = useSettingsStore((s) => s.hiddenPanels);
  const autoHideCountdown = useUIStore((s) => s.autoHideCountdown);
  const autoHidePaused = useUIStore((s) => s.autoHidePaused);

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
          bgcolor: BG_OVERLAY_LIGHT, borderTopRightRadius: 8,
        }}>
          <Typography>
            {autoHidePaused ? `Paused (${autoHideCountdown}s)` : `Hiding in ${autoHideCountdown}s`}
          </Typography>
          <AppIconButton
            icon={autoHidePaused ? "play" : "pause"}
            onClick={() => useUIStore.getState().setAutoHidePaused(!autoHidePaused)}
            sx={{ fontSize: 16 }}
          />
        </Box>
      )}

      {/* ── Desktop Name ── */}
      <Box sx={{
        height: PANEL_HEIGHT_DESKTOP_NAME, display: "flex", alignItems: "center", flexShrink: 0,
        bgcolor: BG_OVERLAY_LIGHT,
        ...(!showCountdown && { borderTopRightRadius: 8 }),
        ...(visiblePanels.length === 0 && { borderBottomRightRadius: 8 }),
      }}>
        <DesktopNamePanel desktopId={desktop.space_id} />
      </Box>

      {/* ── Queue ── */}
      {!hiddenPanels.includes("Tasks") && (
        <Box sx={{ height: PANEL_HEIGHT_TASKS, minHeight: 0, overflow: "auto", px: "8px", bgcolor: BG_OVERLAY_LIGHT, ...(isLast("Tasks") && { borderBottomRightRadius: 8 }) }}>
          <QueuePanel desktopId={desktop.space_id} />
        </Box>
      )}

      {/* ── Common Apps ── */}
      {!hiddenPanels.includes("Common Apps") && (
        <Box sx={{ height: PANEL_HEIGHT_COMMON_APPS, display: 'flex', alignItems: 'center', justifyContent: 'center', px: "8px", flexShrink: 0, bgcolor: BG_OVERLAY_LIGHT, ...(isLast("Common Apps") && { borderBottomRightRadius: 8 }) }}>
          <CommonAppsPanel />
        </Box>
      )}

      {/* ── Timer ── */}
      {!hiddenPanels.includes("Timer") && (
        <Box sx={{ height: PANEL_HEIGHT_TIMER, display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "center", bgcolor: BG_OVERLAY_LIGHT, ...(isLast("Timer") && { borderBottomRightRadius: 8 }) }}>
          <TimerPanel />
        </Box>
      )}

      {/* ── Desktops ── */}
      {!hiddenPanels.includes("Desktops") && (
        <Box sx={{ height: PANEL_HEIGHT_DESKTOPS, display: 'flex', alignItems: 'center', justifyContent: 'center', px: "8px", flexShrink: 0, bgcolor: BG_OVERLAY_LIGHT, ...(isLast("Desktops") && { borderBottomRightRadius: 8 }) }}>
          <DesktopsPanel displayIndex={displayIndex} />
        </Box>
      )}
    </Box>
  );
}
