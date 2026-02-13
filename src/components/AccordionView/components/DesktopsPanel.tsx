import { Box, ButtonBase, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { detectColorMode } from "../../../utils";
import { useUIStore, useDesktopStore } from "../../../stores";

interface DesktopsPanelProps {
  displayIndex: number;
}

export default function DesktopsPanel({ displayIndex }: DesktopsPanelProps) {
  const tc = useTheme().custom.tc;
  const { displayGroups } = useUIStore();
  const { desktop, monitorNames, switchDesktop } = useDesktopStore();

  const sortedGroups = [...displayGroups].sort((a, b) => {
    if (a.display_index === displayIndex) return -1;
    if (b.display_index === displayIndex) return 1;
    return a.display_index - b.display_index;
  });

  return (
    <>
      {sortedGroups.map((group) => (
        <Box key={group.display_index} sx={{ mb: "12px" }}>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 700,
              color: tc(0.4),
              textTransform: "uppercase",
              letterSpacing: "0.3px",
              mb: "6px",
            }}
          >
            {monitorNames[group.display_index] || `Screen ${group.display_index + 1}`}
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              pb: "4px",
              "&::-webkit-scrollbar": { height: 4 },
              "&::-webkit-scrollbar-thumb": {
                background: tc(0.1),
                borderRadius: "2px",
              },
            }}
          >
            {group.desktops.map((d) => {
              const cardFg = detectColorMode(d.color) === "dark" ? "#000000" : "#ffffff";
              const isActive = d.space_id === desktop.space_id;
              return (
                <ButtonBase
                  key={d.space_id}
                  onClick={() => switchDesktop(displayIndex, d.space_id)}
                  sx={{
                    flexShrink: 0,
                    width: 80,
                    minHeight: 56,
                    border: isActive ? `2px solid ${cardFg}` : "2px solid transparent",
                    borderRadius: "8px",
                    p: "6px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "3px",
                    fontFamily: "inherit",
                    bgcolor: d.color,
                    transition: "border-color 0.15s, transform 0.1s",
                    "&:hover": { transform: "scale(1.04)" },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: cardFg,
                      textAlign: "center",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "100%",
                    }}
                  >
                    {d.title || d.name}
                  </Typography>
                  {d.todo_count > 0 && (
                    <Typography
                      sx={{
                        fontSize: 9,
                        fontWeight: 600,
                        color: cardFg,
                        borderRadius: "8px",
                        px: "5px",
                      }}
                    >
                      {d.todo_count}
                    </Typography>
                  )}
                </ButtonBase>
              );
            })}
          </Box>
        </Box>
      ))}

      {displayGroups.length === 0 && (
        <Typography sx={{ fontSize: 10, color: tc(0.25), px: "6px" }}>
          No desktops found
        </Typography>
      )}
    </>
  );
}
