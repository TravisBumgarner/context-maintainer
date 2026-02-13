import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
  timerFlashing?: boolean;
}

export default function Layout({ children, timerFlashing }: LayoutProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
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
      {children}
    </Box>
  );
}
