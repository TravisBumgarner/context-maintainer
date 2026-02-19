import { useEffect } from "react";
import { Box, Checkbox, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../../../stores";
import DefaultModal from "./DefaultModal";

export default function TimerSettingsModal() {
  const { tc, ui } = useTheme().custom;
  const { timerPresets, notifySystem, setTimerPresets, setNotifySystem } = useSettingsStore();

  useEffect(() => {
    invoke("save_timer_presets", { presets: timerPresets }).catch(() => {});
  }, [timerPresets]);

  return (
    <DefaultModal title="Timer Settings">
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
    </DefaultModal>
  );
}
