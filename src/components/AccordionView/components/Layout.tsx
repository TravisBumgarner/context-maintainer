import { useState } from "react";
import { Box, IconButton, Popover, Tooltip } from "@mui/material";
import { InfoOutline, Tune, LightbulbOutline, Remove, Close, Warning, OpenWith, History } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useUIStore } from "../../../stores";
import { currentWindow } from "../../../utils";
import { ANCHOR_POSITIONS, ANCHOR_LABELS, ANCHOR_NAMES } from "../../../constants";

interface LayoutProps {
  children: ReactNode;
  timerFlashing?: boolean;
}

export default function Layout({ children, timerFlashing }: LayoutProps) {
  const theme = useTheme();
  const { tc } = theme.custom;
  const { view, offMonitor, anchorPos, setView, snapToMonitor, selectAnchor } = useUIStore();
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const showSidebar = view === "todos" || view === "settings" || view === "info" || view === "history";

  const handleAnchorSelect = (pos: typeof anchorPos) => {
    selectAnchor(pos);
    setAnchorEl(null);
  };

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
            <Tooltip title="Home" arrow placement="right">
              <IconButton onClick={() => setView("todos")} sx={btnSx}>
                <LightbulbOutline fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip title="History" arrow placement="right">
              <IconButton onClick={() => setView("history")} sx={btnSx}>
                <History fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip title="About" arrow placement="right">
              <IconButton onClick={() => setView("info")} sx={btnSx}>
                <InfoOutline fontSize="inherit" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings" arrow placement="right">
              <IconButton onClick={() => setView("settings")} sx={btnSx}>
                <Tune fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Row 3: anchor picker */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Tooltip title="Anchor position" arrow placement="right">
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={btnSx}>
                  <OpenWith fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "center", horizontal: "right" }}
                transformOrigin={{ vertical: "center", horizontal: "left" }}
                slotProps={{
                  paper: {
                    sx: {
                      p: "8px",
                      bgcolor: tc(0.05),
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
                    <Tooltip key={pos} title={ANCHOR_NAMES[pos]} arrow>
                      <Box
                        component="button"
                        onClick={() => handleAnchorSelect(pos)}
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
                        }}
                      >
                        {ANCHOR_LABELS[pos]}
                      </Box>
                    </Tooltip>
                  ))}
                </Box>
              </Popover>
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
