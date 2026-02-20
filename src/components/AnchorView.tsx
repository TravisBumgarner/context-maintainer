import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useUIStore } from "../stores";
import { ANCHOR_POSITIONS, ANCHOR_NAMES } from "../constants";
import type { AnchorPosition } from "../types";
import { BG_OVERLAY_LIGHT } from "../theme";

/** Map anchor positions to grid placement inside the monitor preview */
const GRID: Record<AnchorPosition, { row: number; col: number }> = {
  "top-left": { row: 0, col: 0 },
  "top-center": { row: 0, col: 1 },
  "top-right": { row: 0, col: 2 },
  "middle-left": { row: 1, col: 0 },
  "middle-center": { row: 1, col: 1 },
  "middle-right": { row: 1, col: 2 },
  "bottom-left": { row: 2, col: 0 },
  "bottom-center": { row: 2, col: 1 },
  "bottom-right": { row: 2, col: 2 },
};

export default function AnchorView() {
  const { tc } = useTheme().custom;
  const { anchorPos, selectAnchor, setView } = useUIStore();
  const [hoveredPos, setHoveredPos] = useState<AnchorPosition | null>(null);

  const handleSelect = (pos: AnchorPosition) => {
    selectAnchor(pos);
    setView("todos");
  };

  const displayName = hoveredPos ? ANCHOR_NAMES[hoveredPos] : ANCHOR_NAMES[anchorPos];

  return (
    <Box
      sx={{
        flex: 1,
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        m: "4px",
        bgcolor: BG_OVERLAY_LIGHT,
        borderRadius: 2,
      }}
    >
      <Typography variant="body2" sx={{ mb: "12px" }}>
        Anchor Position
      </Typography>

      {/* Monitor bezel */}
      <Box
        sx={{
          width: 180,
          height: 120,
          border: `2px solid ${tc(0.15)}`,
          borderRadius: "8px",
          bgcolor: tc(0.03),
          position: "relative",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "1fr 1fr 1fr",
          p: "6px",
          gap: "3px",
        }}
      >
        {ANCHOR_POSITIONS.map((pos) => {
          const isSelected = pos === anchorPos;
          const { row, col } = GRID[pos];

          const justifySelf =
            col === 0 ? "flex-start" : col === 2 ? "flex-end" : "center";
          const alignSelf =
            row === 0 ? "flex-start" : row === 2 ? "flex-end" : "center";

          return (
            <Box
              key={pos}
              component="button"
              onClick={() => handleSelect(pos)}
              onMouseEnter={() => setHoveredPos(pos)}
              onMouseLeave={() => setHoveredPos(null)}
              sx={{
                display: "flex",
                justifyContent: justifySelf,
                alignItems: alignSelf,
                border: "none",
                bgcolor: "transparent",
                p: 0,
                cursor: "pointer",
              }}
            >
              {/* Mini window rectangle */}
              <Box
                sx={{
                  width: isSelected ? 28 : 8,
                  height: isSelected ? 18 : 8,
                  borderRadius: isSelected ? "3px" : "50%",
                  bgcolor: isSelected ? tc(0.5) : tc(0.15),
                  border: isSelected
                    ? `1.5px solid ${tc(0.7)}`
                    : "none",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: tc(0.35),
                    width: 28,
                    height: 18,
                    borderRadius: "3px",
                  },
                }}
              />
            </Box>
          );
        })}
      </Box>

      {/* Monitor stand */}
      <Box
        sx={{
          width: 40,
          height: 6,
          bgcolor: tc(0.12),
          borderRadius: "0 0 3px 3px",
          mt: "-1px",
        }}
      />
      <Box
        sx={{
          width: 60,
          height: 4,
          bgcolor: tc(0.1),
          borderRadius: "2px",
          mt: "1px",
        }}
      />

      {/* Current/hovered position label */}
      <Typography sx={{ fontSize: 10, color: hoveredPos ? tc(0.5) : tc(0.35), mt: "8px" }}>
        {displayName}
      </Typography>
    </Box>
  );
}
