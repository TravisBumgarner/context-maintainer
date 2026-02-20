import { useEffect } from "react";
import { Box, Checkbox, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../../../stores";
import DefaultModal from "./DefaultModal";
import { SectionTitle, NumericInput } from "../../shared";

export default function TimerSettingsModal() {
  const { tc } = useTheme().custom;
  const { timerPresets, notifySystem, setTimerPresets, setNotifySystem } = useSettingsStore();

  useEffect(() => {
    invoke("save_timer_presets", { presets: timerPresets }).catch(() => { });
  }, [timerPresets]);

  return (
    <DefaultModal title="Timer Settings">
      <SectionTitle>Presets (seconds)</SectionTitle>
      <Box sx={{ display: "flex", gap: "8px", mb: "8px" }}>
        {timerPresets.map((p, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <NumericInput
              value={p}
              min={1}
              onChange={(val) => setTimerPresets((prev) => prev.map((v, j) => (j === i ? val : v)))}
            />
            <Typography sx={{ color: tc(0.25) }}>sec</Typography>
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
            invoke("save_notify_settings", { system: val, flash: false }).catch(() => { });
          }}
          sx={{ p: 0 }}
        />
        <Typography>System notification</Typography>
      </Box>
    </DefaultModal>
  );
}
