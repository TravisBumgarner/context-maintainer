import { useState } from "react";
import { Box, IconButton, Popover, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ANCHOR_POSITIONS, ANCHOR_LABELS, ANCHOR_NAMES } from "../../../constants";
import { useUIStore } from "../../../stores";

export default function HeaderNav() {
  const { tc, ui } = useTheme().custom;
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const {
    collapsed,
    offMonitor,
    anchorPos,
    toggleMinimize,
    snapToMonitor,
    selectAnchor,
    setView,
  } = useUIStore();

  const handleAnchorSelect = (pos: typeof anchorPos) => {
    selectAnchor(pos);
    setAnchorEl(null);
  };

  const btnSx = {
    p: "0 3px",
    lineHeight: 1,
    fontSize: 14,
    fontWeight: 700,
    color: tc(0.3),
    "&:hover": { color: tc(0.6) },
  };

  return (
    <Box data-tauri-drag-region sx={{ px: `${ui.spacing.panelPx}px`, py: `${ui.spacing.panelPy}px`, display: "flex", alignItems: "center", flexShrink: 0, justifyContent: "flex-end", position: 'relative', top: '2px' }}>
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
        {!collapsed && (
          <>
            <Tooltip title="Anchor position" arrow>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={btnSx}>
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
            <Tooltip title="Home" arrow>
              <IconButton onClick={() => setView("todos")} sx={btnSx}>
                ⌂
              </IconButton>
            </Tooltip>
            <Tooltip title="Info" arrow>
              <IconButton onClick={() => setView("info")} sx={btnSx}>
                i
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings" arrow>
              <IconButton onClick={() => setView("settings")} sx={btnSx}>
                ⚙
              </IconButton>
            </Tooltip>
          </>
        )}
        <Tooltip title={collapsed ? "Expand" : "Collapse"} arrow>
          <IconButton onClick={toggleMinimize} sx={btnSx}>
            {collapsed ? "+" : "\u2014"}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
