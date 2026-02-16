import { useRef, useCallback, useEffect } from "react";
import { Box, ButtonBase, Link, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { detectColorMode } from "../../../utils";
import { useUIStore, useDesktopStore, useSettingsStore } from "../../../stores";

interface DesktopsPanelProps {
  displayIndex: number;
}

export default function DesktopsPanel({ displayIndex }: DesktopsPanelProps) {
  const { tc, ui } = useTheme().custom;
  const { displayGroups } = useUIStore();
  const { desktop, switchDesktop } = useDesktopStore();
  const accessibilityGranted = useSettingsStore((s) => s.accessibilityGranted);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentGroup = displayGroups.find((g) => g.display_index === displayIndex);
  const desktops = currentGroup?.desktops ?? [];

  // Scroll active desktop to center when it changes
  useEffect(() => {
    // Double rAF ensures React has flushed the DOM update before we query
    const id = requestAnimationFrame(() => {
      const id2 = requestAnimationFrame(() => {
        const container = scrollRef.current;
        if (!container) return;
        const activeEl = container.querySelector("[data-active='true']") as HTMLElement | null;
        if (activeEl) {
          const scrollLeft = activeEl.offsetLeft - container.offsetWidth / 2 + activeEl.offsetWidth / 2;
          container.scrollTo({ left: scrollLeft, behavior: "smooth" });
        }
      });
      innerIdRef.current = id2;
    });
    const innerIdRef = { current: 0 };
    return () => {
      cancelAnimationFrame(id);
      cancelAnimationFrame(innerIdRef.current);
    };
  }, [desktop.space_id, desktops]);

  const handleClick = useCallback((spaceId: number, el: HTMLElement) => {
    if (!accessibilityGranted) return;
    switchDesktop(displayIndex, spaceId);
    const container = scrollRef.current;
    if (container) {
      const scrollLeft = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [displayIndex, switchDesktop, accessibilityGranted]);

  return (
    <>
      {!accessibilityGranted ? (
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Link
            component="button"
            onClick={() => {
              useUIStore.getState().setSettingsTab(1);
              useUIStore.getState().setView("settings");
            }}
            sx={{
              fontSize: ui.fontSize.sm,
              color: tc(0.5),
              fontWeight: ui.weights.semibold,
              "&:hover": { color: tc(0.7) },
            }}
          >
            Grant accessibility to use desktop switcher
          </Link>
        </Box>
      ) : desktops.length > 0 ? (
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
                  border: isActive ? `1px solid rgba(0,0,0,0.15)` : "1px solid transparent",
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
                    fontSize: ui.fontSize.sm,
                    fontWeight: ui.weights.semibold,
                    color: cardFg,
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.title || d.position + 1}
                </Typography>
              </ButtonBase>
            );
          })}
        </Box>
      ) : displayGroups.length === 0 ? (
        <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.25), px: "6px" }}>
          No desktops found
        </Typography>
      ) : null}
    </>
  );
}
