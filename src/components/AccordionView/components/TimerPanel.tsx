import { useState, useEffect } from "react";
import { Box, Button, Checkbox, IconButton, Modal, Tooltip, Typography } from "@mui/material";
import { PlayArrow, Pause, Replay, Tune } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useShallow } from "zustand/react/shallow";
import { invoke } from "@tauri-apps/api/core";
import { formatPreset, formatCountdown } from "../../../utils";
import { useTimerStore, useSettingsStore } from "../../../stores";

export default function TimerPanel() {
  const { tc, bg, ui } = useTheme().custom;
  const [modalOpen, setModalOpen] = useState(false);
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
  const { timerPresets, notifySystem, setTimerPresets, setNotifySystem } = useSettingsStore();

  useEffect(() => {
    invoke("save_timer_presets", { presets: timerPresets }).catch(() => {});
  }, [timerPresets]);

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
    <>
      <Box sx={{ display: "flex", alignItems: "center", width: "100%", px: "8px" }}>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
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
                <Tooltip title="Resume" arrow><IconButton onClick={() => resumeTimer(notifySystem, false)} sx={iconBtnSx}><PlayArrow fontSize="inherit" /></IconButton></Tooltip>
              ) : (
                <Tooltip title="Start" arrow><span><IconButton onClick={() => startTimer(notifySystem, false)} disabled={!hasTime} sx={iconBtnSx}><PlayArrow fontSize="inherit" /></IconButton></span></Tooltip>
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

        <IconButton
          onClick={() => setModalOpen(true)}
          size="small"
          sx={{ p: "2px", flexShrink: 0, color: tc(0.3), "&:hover": { color: tc(0.5) } }}
        >
          <Tune sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            margin: "auto",
            height: "fit-content",
            width: "85%",
            bgcolor: bg,
            border: `1px solid ${tc(0.2)}`,
            p: "8px",
            "&:focus-visible": { outline: "none" },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "6px" }}>
            <Typography
              sx={{
                fontSize: ui.fontSize.lg,
                fontWeight: ui.weights.bold,
                color: tc(0.6),
              }}
            >
              Timer Settings
            </Typography>
            <IconButton
              onClick={() => setModalOpen(false)}
              size="small"
              sx={{ p: "2px", color: tc(0.4), "&:hover": { color: tc(0.6) } }}
            >
              <Typography sx={{ fontSize: 11, lineHeight: 1 }}>✕</Typography>
            </IconButton>
          </Box>

          <Typography
            sx={{
              fontSize: ui.fontSize.xs,
              fontWeight: ui.weights.semibold,
              color: tc(0.4),
              mb: "4px",
              textTransform: "uppercase",
              letterSpacing: ui.letterSpacing.wide,
            }}
          >
            Presets (seconds)
          </Typography>
          <Box sx={{ display: "flex", gap: "8px", mb: "8px" }}>
            {timerPresets.map((p, i) => (
              <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Box
                  component="input"
                  type="number"
                  min={1}
                  value={p}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1);
                    setTimerPresets((prev) => prev.map((v, j) => (j === i ? val : v)));
                  }}
                  sx={{
                    width: 40,
                    fontSize: 11,
                    fontFamily: "inherit",
                    color: tc(0.7),
                    bgcolor: "transparent",
                    border: "none",
                    borderBottom: `1px solid ${tc(0.12)}`,
                    p: "3px 4px",
                    textAlign: "center",
                    outline: "none",
                    MozAppearance: "textfield",
                    "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": {
                      WebkitAppearance: "none",
                      margin: 0,
                    },
                    "&:focus": { borderColor: tc(0.3) },
                  }}
                />
                <Typography sx={{ fontSize: 9, color: tc(0.25) }}>sec</Typography>
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
            }}
            component="label"
          >
            <Checkbox
              size="small"
              checked={notifySystem}
              onChange={(e) => {
                const val = e.target.checked;
                setNotifySystem(val);
                invoke("save_notify_settings", { system: val, flash: false }).catch(() => {});
              }}
              sx={{ p: 0 }}
            />
            <Typography>System notification</Typography>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
