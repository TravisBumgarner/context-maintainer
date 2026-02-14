import { useRef, useCallback, useEffect } from "react";
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
  const { desktop, switchDesktop } = useDesktopStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentGroup = displayGroups.find((g) => g.display_index === displayIndex);
  const desktops = currentGroup?.desktops ?? [];

  // Scroll active desktop to center when it changes
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeEl = container.querySelector("[data-active='true']") as HTMLElement | null;
    if (activeEl) {
      const scrollLeft = activeEl.offsetLeft - container.offsetWidth / 2 + activeEl.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [desktop.space_id]);

  const handleClick = useCallback((spaceId: number, el: HTMLElement) => {
    switchDesktop(displayIndex, spaceId);
    const container = scrollRef.current;
    if (container) {
      const scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [displayIndex, switchDesktop]);

  return (
    <>
      {desktops.length > 0 && (
        <Box
          ref={scrollRef}
          sx={{
            display: "flex",
            gap: "6px",
            overflowX: "auto",
            px: "calc(50% - 40px)",
            scrollSnapType: "x mandatory",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {desktops.map((d) => {
            const cardFg = detectColorMode(d.color) === "dark" ? "#000000" : "#ffffff";
            const isActive = d.space_id === desktop.space_id;
            return (
              <ButtonBase
                key={d.space_id}
                data-active={isActive || undefined}
                onClick={(e) => handleClick(d.space_id, e.currentTarget)}
                sx={{
                  flexShrink: 0,
                  px: "12px",
                  py: "4px",
                  border: isActive ? `2px solid ${cardFg}` : "2px solid transparent",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontFamily: "inherit",
                  bgcolor: d.color,
                  scrollSnapAlign: "center",
                  transition: "border-color 0.15s",
                }}
              >
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: cardFg,
                    opacity: 0.6,
                  }}
                >
                  {d.position}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: cardFg,
                    whiteSpace: "nowrap",
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
                    }}
                  >
                    {d.todo_count}
                  </Typography>
                )}
              </ButtonBase>
            );
          })}
        </Box>
      )}

      {displayGroups.length === 0 && (
        <Typography sx={{ fontSize: 10, color: tc(0.25), px: "6px" }}>
          No desktops found
        </Typography>
      )}
    </>
  );
}
