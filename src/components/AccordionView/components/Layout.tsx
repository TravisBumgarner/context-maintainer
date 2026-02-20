import { Box, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useUIStore } from "../../../stores";
import { currentWindow } from "../../../utils";
import { BG_OVERLAY_LIGHT } from "../../../theme";
import { AppIconButton, type AppIcon } from "../../shared";

interface LayoutProps {
  children: ReactNode;
  timerFlashing?: boolean;
}

export default function Layout({ children, timerFlashing }: LayoutProps) {
  const theme = useTheme();
  const { tc } = theme.custom;
  const { view, setView } = useUIStore();

  const showSidebar = view === "todos" || view === "settings" || view === "info" || view === "history" || view === "anchor";

  const btnSx = {
    lineHeight: 1,
    fontSize: 14,
    fontWeight: 700,
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "row",
        transition: "background-color 0.3s ease",
        overflow: "hidden",
        backgroundColor: theme.custom.bg,
        ...(timerFlashing && {
          animation: "timer-pulse 0.5s ease-in-out 3",
          "@keyframes timer-pulse": {
            "0%, 100%": { filter: "brightness(1)" },
            "50%": { filter: "brightness(1.5)" },
          },
        }),
      }}
    >
      {showSidebar && (
        <Box
          data-tauri-drag-region
          onPointerDown={(e) => {
            // Only mark as dragged if clicking the drag region itself, not child buttons
            if ((e.target as HTMLElement).closest("button")) return;
            useUIStore.getState().markDragged();
          }}
          sx={{
            width: 32,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            py: "6px",
            my: "4px",
            ml: "4px",
            bgcolor: BG_OVERLAY_LIGHT,
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
            cursor: "move",
          }}
        >
          {/* Row 1: minimize */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Tooltip title="Close" arrow placement="right">
              <AppIconButton icon="close" onClick={() => currentWindow.close()} sx={btnSx} />
            </Tooltip>
            <Tooltip title="Hide this desktop" arrow placement="right">
              <AppIconButton icon="remove" onClick={() => currentWindow.hide()} sx={btnSx} />
            </Tooltip>
          </Box>

          {/* Row 2: nav buttons */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            {([
              { key: "todos", label: "Home", icon: "lightbulb" },
              { key: "history", label: "History", icon: "history" },
              { key: "info", label: "About", icon: "info" },
              { key: "settings", label: "Settings", icon: "tune" },
            ] as { key: typeof view; label: string; icon: AppIcon }[]).map(({ key, label, icon }) => (
              <Tooltip key={key} title={label} arrow placement="right">
                <AppIconButton
                  icon={icon}
                  onClick={() => setView(key)}
                  sx={{ ...btnSx, ...(view === key && { color: tc(0.7) }) }}
                />
              </Tooltip>
            ))}
          </Box>

          {/* Row 3: anchor picker */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Tooltip title="Anchor position" arrow placement="right">
                <AppIconButton
                  icon="openWith"
                  onClick={() => setView("anchor")}
                  sx={{ ...btnSx, ...(view === "anchor" && { color: tc(0.7) }) }}
                />
              </Tooltip>
            </Box>
        </Box>
      )}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
