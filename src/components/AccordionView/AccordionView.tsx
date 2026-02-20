import { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

import DesktopNamePanel from "./components/DesktopNamePanel";
import QueuePanel from "./components/QueuePanel";
import TimerPanel from "./components/TimerPanel";
import CommonAppsPanel from "./components/CommonAppsPanel";
import DesktopsPanel from "./components/DesktopsPanel";
import { useUIStore, useDesktopStore, useSettingsStore } from "../../stores";
import { PANEL_HEIGHT_DESKTOP_NAME, PANEL_HEIGHT_TASKS, PANEL_HEIGHT_COMMON_APPS, PANEL_HEIGHT_TIMER, PANEL_HEIGHT_DESKTOPS } from "../../constants";
import { BG_OVERLAY_LIGHT } from "../../theme";
import { AppIconButton } from "../shared";

interface PanelBoxProps {
  height: number;
  isLast: boolean;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

function PanelBox({ height, isLast, children, sx }: PanelBoxProps) {
  return (
    <Box sx={{
      height,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      padding: '4px',
      bgcolor: BG_OVERLAY_LIGHT,
      ...(isLast && { borderBottomRightRadius: 8 }),
      ...sx as object,
    }}>
      {children}
    </Box>
  );
}

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

      {!hiddenPanels.includes("Tasks") && (
        <PanelBox height={PANEL_HEIGHT_TASKS} isLast={isLast("Tasks")} sx={{ flex: 1, minHeight: 0, overflow: "auto", flexShrink: "unset" }}>
          <QueuePanel desktopId={desktop.space_id} />
        </PanelBox>
      )}

      {!hiddenPanels.includes("Common Apps") && (
        <PanelBox height={PANEL_HEIGHT_COMMON_APPS} isLast={isLast("Common Apps")}>
          <CommonAppsPanel />
        </PanelBox>
      )}

      {!hiddenPanels.includes("Timer") && (
        <PanelBox height={PANEL_HEIGHT_TIMER} isLast={isLast("Timer")}>
          <TimerPanel />
        </PanelBox>
      )}

      {!hiddenPanels.includes("Desktops") && (
        <PanelBox height={PANEL_HEIGHT_DESKTOPS} isLast={isLast("Desktops")}>
          <DesktopsPanel displayIndex={displayIndex} />
        </PanelBox>
      )}
    </Box>
  );
}
