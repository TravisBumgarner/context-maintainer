import { Box, Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { formatPreset, formatCountdown } from "../../../utils";
import { useTimerStore, useSettingsStore } from "../../../stores";

export default function TimerPanel() {
  const tc = useTheme().custom.tc;
  const {
    hours,
    minutes,
    seconds,
    running,
    remaining,
    setHours,
    setMinutes,
    setSeconds,
    startTimer,
    cancelTimer,
    populateFromPreset,
  } = useTimerStore();
  const { timerPresets, notifySystem, notifyFlash } = useSettingsStore();

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

  if (running) {
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
          {formatCountdown(remaining)}
        </Typography>
        <Button
          onClick={cancelTimer}
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
          { value: hours, set: setHours, max: 99, label: "HH" },
          { value: minutes, set: setMinutes, max: 59, label: "MM" },
          { value: seconds, set: setSeconds, max: 59, label: "SS" },
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
            onClick={() => populateFromPreset(p)}
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
        onClick={() => startTimer(notifySystem, notifyFlash)}
        disabled={hours === 0 && minutes === 0 && seconds === 0}
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
