import { Box, IconButton, Tooltip } from "@mui/material";
import { InfoOutline, Tune, LightbulbOutline, Remove, Close, Warning, OpenWith, History } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useUIStore } from "../../../stores";
import { currentWindow } from "../../../utils";

interface LayoutProps {
  children: ReactNode;
  timerFlashing?: boolean;
}

export default function Layout({ children, timerFlashing }: LayoutProps) {
  const theme = useTheme();
  const { tc } = theme.custom;
  const { view, offMonitor, setView, snapToMonitor } = useUIStore();

  const showSidebar = view === "todos" || view === "settings" || view === "info" || view === "history" || view === "anchor";

  const btnSx = {
    p: "2px",
    lineHeight: 1,
    fontSize: 14,
    fontWeight: 700,
    color: tc(0.3),
    "&:hover": { color: tc(0.6) },
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
            bgcolor: "rgba(0,0,0,0.04)",
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
          }}
        >
          {/* Row 1: minimize */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Tooltip title="Close" arrow placement="right">
              <IconButton onClick={() => currentWindow.close()} sx={btnSx}>
                <Close fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Hide" arrow placement="right">
              <IconButton onClick={() => currentWindow.hide()} sx={btnSx}>
                <Remove fontSize="inherit" />
              </IconButton>
            </Tooltip>
            {offMonitor && (
              <Tooltip title="Snap back to monitor" arrow placement="right">
                <IconButton onClick={() => snapToMonitor()} sx={{ ...btnSx, color: tc(0.6), "&:hover": { color: tc(0.9) } }}>
                  <Warning fontSize="inherit" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Row 2: nav buttons */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            {([
              { key: "todos", label: "Home", icon: <LightbulbOutline fontSize="inherit" /> },
              { key: "history", label: "History", icon: <History fontSize="inherit" /> },
              { key: "info", label: "About", icon: <InfoOutline fontSize="inherit" /> },
              { key: "settings", label: "Settings", icon: <Tune fontSize="inherit" /> },
            ] as const).map(({ key, label, icon }) => (
              <Tooltip key={key} title={label} arrow placement="right">
                <IconButton
                  onClick={() => setView(key)}
                  sx={{ ...btnSx, ...(view === key && { color: tc(0.7) }) }}
                >
                  {icon}
                </IconButton>
              </Tooltip>
            ))}
          </Box>

          {/* Row 3: anchor picker */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Tooltip title="Anchor position" arrow placement="right">
                <IconButton
                  onClick={() => setView("anchor")}
                  sx={{ ...btnSx, ...(view === "anchor" && { color: tc(0.7) }) }}
                >
                  <OpenWith fontSize="inherit" />
                </IconButton>
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
