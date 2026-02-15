import { Box, IconButton, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useUIStore } from "../../../stores";

interface LayoutProps {
  children: ReactNode;
  timerFlashing?: boolean;
}

export default function Layout({ children, timerFlashing }: LayoutProps) {
  const theme = useTheme();
  const { tc } = theme.custom;
  const { view, collapsed, setView } = useUIStore();

  const showSidebar =
    !collapsed && (view === "todos" || view === "settings" || view === "info");

  const navBtnSx = {
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
          sx={{
            width: 24,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
          }}
        >
          <Tooltip title="Home" arrow placement="right">
            <IconButton onClick={() => setView("todos")} sx={navBtnSx}>
              ⌂
            </IconButton>
          </Tooltip>
          <Tooltip title="Info" arrow placement="right">
            <IconButton onClick={() => setView("info")} sx={navBtnSx}>
              i
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings" arrow placement="right">
            <IconButton onClick={() => setView("settings")} sx={navBtnSx}>
              ⚙
            </IconButton>
          </Tooltip>
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
