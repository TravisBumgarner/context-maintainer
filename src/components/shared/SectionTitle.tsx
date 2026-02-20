import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";

export default function SectionTitle({ children }: { children: ReactNode }) {
  const { tc, ui } = useTheme().custom;

  return (
    <Typography
      sx={{
        fontSize: ui.fontSize.xs,
        fontWeight: ui.weights.semibold,
        color: tc(0.4),
        mb: "4px",
        textTransform: "uppercase",
        letterSpacing: ui.letterSpacing.wide,
        mr: "4px"
      }}
    >
      {children}
    </Typography>
  );
}
