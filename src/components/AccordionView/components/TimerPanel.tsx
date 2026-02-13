import { Box, Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { formatPreset, formatCountdown } from "../utils";

interface TimerPanelProps {
  timerRunning: boolean;
  timerRemaining: number;
  timerHours: number;
  timerMinutes: number;
  timerSeconds: number;
  timerPresets: number[];
  setTimerHours: (v: number) => void;
  setTimerMinutes: (v: number) => void;
  setTimerSeconds: (v: number) => void;
  onTimerStart: () => void;
  onTimerCancel: () => void;
  onTimerPreset: (seconds: number) => void;
}

export default function TimerPanel({
  timerRunning,
  timerRemaining,
  timerHours,
  timerMinutes,
  timerSeconds,
  timerPresets,
  setTimerHours,
  setTimerMinutes,
  setTimerSeconds,
  onTimerStart,
  onTimerCancel,
  onTimerPreset,
}: TimerPanelProps) {
  const tc = useTheme().custom.tc;

  const fieldInputSx = {
    width: 48,
    textAlign: "center",
    fontSize: 20,
    fontWeight: 700,
    fontFamily: "inherit",
    color: tc(0.7),
    bgcolor: "transparent",
    border: "none",
    p: "4px 2px",
    outline: "none",
    MozAppearance: "textfield",
    "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": {
      WebkitAppearance: "none",
      margin: 0,
    },
  } as const;

  if (timerRunning) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "14px",
          mt: "10px",
        }}
      >
        <Typography
          sx={{
            fontSize: 32,
            fontWeight: 700,
            color: tc(0.7),
            fontVariantNumeric: "tabular-nums",
            letterSpacing: "1px",
          }}
        >
          {formatCountdown(timerRemaining)}
        </Typography>
        <Button
          onClick={onTimerCancel}
          sx={{
            px: "14px",
            py: "4px",
            "&:hover": { color: tc(0.7) },
          }}
        >
          Cancel
        </Button>
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          mb: "12px",
        }}
      >
        {[
          { value: timerHours, set: setTimerHours, max: 99, label: "HH" },
          { value: timerMinutes, set: setTimerMinutes, max: 59, label: "MM" },
          { value: timerSeconds, set: setTimerSeconds, max: 59, label: "SS" },
        ].map((field, i) => (
          <Box key={field.label} sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {i > 0 && (
              <Typography sx={{ fontSize: 20, fontWeight: 700, color: tc(0.35), pb: "14px" }}>:</Typography>
            )}
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Box
                component="input"
                type="number"
                min={0}
                max={field.max}
                value={field.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.set(Math.max(0, Math.min(field.max, parseInt(e.target.value) || 0)))
                }
                sx={fieldInputSx}
              />
              <Typography sx={{ fontSize: 9, color: tc(0.35), mt: "2px", fontWeight: 600 }}>
                {field.label}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center", gap: "6px", mb: "14px" }}>
        {timerPresets.map((p, i) => (
          <Button
            key={i}
            onClick={() => onTimerPreset(p)}
            sx={{
              px: "8px",
              py: "2px",
              "&:hover": { color: tc(0.7) },
            }}
          >
            {formatPreset(p)}
          </Button>
        ))}
      </Box>

      <Button
        onClick={onTimerStart}
        disabled={timerHours === 0 && timerMinutes === 0 && timerSeconds === 0}
        sx={{
          display: "block",
          mx: "auto",
          px: "14px",
          py: "4px",
          fontSize: 12,
          color: tc(0.55),
          "&:hover": { color: tc(0.7) },
          "&:disabled": { opacity: 0.4 },
        }}
      >
        Start
      </Button>
    </>
  );
}
