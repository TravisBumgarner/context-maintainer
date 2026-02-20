import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  sx?: SxProps<Theme>;
}

export default function NumericInput({ value, onChange, min, max, sx }: NumericInputProps) {
  const { tc, ui } = useTheme().custom;

  return (
    <Box
      component="input"
      type="number"
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        let v = parseInt(e.target.value) || 0;
        if (min !== undefined) v = Math.max(min, v);
        if (max !== undefined) v = Math.min(max, v);
        onChange(v);
      }}
      sx={{
        width: 40,
        fontSize: ui.fontSize.sm,
        color: tc(0.7),
        fontFamily: "inherit",
        bgcolor: "transparent",
        border: "none",
        outline: "none",
        borderBottom: `1px solid ${tc(0.15)}`,
        p: "3px 0",
        textAlign: "center",
        MozAppearance: "textfield",
        "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": {
          WebkitAppearance: "none",
          margin: 0,
        },
        "&:focus": { borderColor: tc(0.3) },
        ...sx as object,
      }}
    />
  );
}
