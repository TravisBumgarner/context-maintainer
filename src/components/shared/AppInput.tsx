import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { SxProps, Theme } from "@mui/material/styles";

interface AppInputProps {
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  name?: string;
  sx?: SxProps<Theme>;
}

export default function AppInput({ value, onChange, placeholder, type, name, sx }: AppInputProps) {
  const { tc, ui } = useTheme().custom;

  return (
    <Box
      component="input"
      type={type}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      sx={{
        width: "100%",
        fontSize: ui.fontSize.sm,
        color: tc(0.7),
        fontFamily: "inherit",
        bgcolor: "transparent",
        border: "none",
        outline: "none",
        borderBottom: `1px solid ${tc(0.15)}`,
        p: "3px 0",
        "&:focus": { borderColor: tc(0.3) },
        "&::placeholder": { color: tc(0.3) },
        ...sx as object,
      }}
    />
  );
}
