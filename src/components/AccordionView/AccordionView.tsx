import { useEffect } from "react";
import { Box } from "@mui/material";
import QueuePanel from "./components/QueuePanel";
import TimerPanel from "./components/TimerPanel";
import DesktopsPanel from "./components/DesktopsPanel";
import { useUIStore, useDesktopStore } from "../../stores";

interface AccordionViewProps {
  displayIndex: number;
}

export default function AccordionView({ displayIndex }: AccordionViewProps) {
  const { refreshDisplayGroups } = useUIStore();
  const { desktop } = useDesktopStore();

  // Refresh display groups on mount
  useEffect(() => {
    refreshDisplayGroups();
  }, [refreshDisplayGroups]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden", p: "4px", gap: "4px" }}>
      {/* ── Queue ── */}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "auto", px: "8px", bgcolor: "rgba(0,0,0,0.04)" }}>
        <QueuePanel desktopId={desktop.space_id} />
      </Box>

      {/* ── Timer ── */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "auto", alignItems: "center", justifyContent: "center", bgcolor: "rgba(0,0,0,0.04)" }}>
        <TimerPanel />
      </Box>

      {/* ── Desktops ── */}
      <Box sx={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', px: "8px", flexShrink: 0, bgcolor: "rgba(0,0,0,0.04)" }}>
        <DesktopsPanel displayIndex={displayIndex} />
      </Box>
    </Box>
  );
}
