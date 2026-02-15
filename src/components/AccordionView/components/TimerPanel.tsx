import { Box, Button, IconButton, Tooltip, Typography } from "@mui/material";
import { PlayArrow, Pause, Replay } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useShallow } from "zustand/react/shallow";
import { formatPreset, formatCountdown } from "../../../utils";
import { useTimerStore, useSettingsStore } from "../../../stores";

export default function TimerPanel() {
  const { tc, ui } = useTheme().custom;
  const {
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
    populateFromPreset,
    setHours,
    setMinutes,
    setSeconds,
  } = useTimerStore();
  const { hours, minutes, seconds, running, paused, remaining } = useTimerStore(
    useShallow((s) => {
      const t = s.timers[s.activeDesktop];
      return {
        hours: t?.hours ?? 0,
        minutes: t?.minutes ?? 0,
        seconds: t?.seconds ?? 0,
        running: t?.running ?? false,
        paused: t?.paused ?? false,
        remaining: t?.remaining ?? 0,
      };
    }),
  );
  const { timerPresets, notifySystem, notifyFlash } = useSettingsStore();

  const active = running || paused;
  const hasTime = hours > 0 || minutes > 0 || seconds > 0;

  const fieldInputSx = {
    width: 22,
    textAlign: "center",
    fontSize: ui.fontSize.lg,
    fontWeight: ui.weights.normal,
    fontFamily: ui.timerFontFamily,
    color: tc(0.5),
    bgcolor: "transparent",
    border: "none",
    p: "4px 0",
    outline: "none",
    "&::placeholder": {
      color: tc(0.5),
      opacity: 1,
    },
  } as const;

  const iconBtnSx = {
    p: "4px",
    fontSize: 18,
    color: tc(0.45),
    "&:hover": { color: tc(0.7) },
    "&:disabled": { opacity: 0.3 },
  };

  const timeSx = {
    fontSize: ui.fontSize.lg,
    fontWeight: ui.weights.normal,
    fontFamily: ui.timerFontFamily,
    color: tc(0.5),
    fontVariantNumeric: "tabular-nums",
  };

  return (
    <Box sx={{ width: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {/* Row 1: time + action buttons */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          {active ? (
            <Typography sx={timeSx}>{formatCountdown(remaining)}</Typography>
          ) : (
            [{value: hours, set: setHours, max: 99, label: "HH"},
             {value: minutes, set: setMinutes, max: 59, label: "MM"},
             {value: seconds, set: setSeconds, max: 59, label: "SS"},
            ].map((field, i) => (
              <Box key={field.label} sx={{ display: "flex", alignItems: "center" }}>
                {i > 0 && (
                  <Typography sx={{ fontSize: ui.fontSize.lg, fontFamily: ui.timerFontFamily, color: tc(0.3) }}>:</Typography>
                )}
                <Box
                  component="input"
                  type="text"
                  inputMode="numeric"
                  value={!hasTime ? "" : String(field.value).padStart(2, "0")}
                  placeholder={field.label}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const num = parseInt(e.target.value) || 0;
                    field.set(Math.max(0, Math.min(field.max, num)));
                  }}
                  sx={fieldInputSx}
                />
              </Box>
            ))
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", ml: "6px" }}>
          {active && running ? (
            <Tooltip title="Pause" arrow><IconButton onClick={pauseTimer} sx={iconBtnSx}><Pause fontSize="inherit" /></IconButton></Tooltip>
          ) : active && paused ? (
            <Tooltip title="Resume" arrow><IconButton onClick={() => resumeTimer(notifySystem, notifyFlash)} sx={iconBtnSx}><PlayArrow fontSize="inherit" /></IconButton></Tooltip>
          ) : (
            <Tooltip title="Start" arrow><span><IconButton onClick={() => startTimer(notifySystem, notifyFlash)} disabled={!hasTime} sx={iconBtnSx}><PlayArrow fontSize="inherit" /></IconButton></span></Tooltip>
          )}
          <Tooltip title="Reset" arrow><span><IconButton onClick={resetTimer} disabled={!active} sx={iconBtnSx}><Replay fontSize="inherit" /></IconButton></span></Tooltip>
        </Box>
      </Box>

      {/* Row 2: presets */}
      {!active && (
        <Box sx={{ display: "flex", justifyContent: "center", gap: "6px", mt: "4px" }}>
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
      )}
    </Box>
  );
}
