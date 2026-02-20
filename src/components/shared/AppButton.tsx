import { Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";
import { BG_OVERLAY } from "../../theme";
import type { ReactNode } from "react";

interface AppButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "contained";
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export default function AppButton({ onClick, disabled, variant = "secondary", children, sx }: AppButtonProps) {
  const { tc, ui } = useTheme().custom;

  if (variant === "contained") {
    return (
      <Button
        variant="contained"
        onClick={onClick}
        disabled={disabled}
        sx={sx}
      >
        {children}
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      sx={{
        px: "12px",
        py: "4px",
        color: variant === "primary" ? tc(0.7) : tc(0.4),
        fontWeight: variant === "primary" ? ui.weights.bold : undefined,
        "&:hover": { bgcolor: BG_OVERLAY },
        "&:disabled": { color: tc(0.3) },
        ...sx as object,
      }}
    >
      {children}
    </Button>
  );
}
