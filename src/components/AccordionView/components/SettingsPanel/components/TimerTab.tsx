import { useEffect } from "react";
import { Box, Switch, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../../../../../stores";

export function TimerTab() {
    const theme = useTheme();
    const tc = theme.custom.tc;

    const { timerPresets, notifySystem, notifyFlash, setTimerPresets, setNotifySystem, setNotifyFlash } = useSettingsStore();

    useEffect(() => {
        invoke("save_timer_presets", { presets: timerPresets }).catch(() => { });
    }, [timerPresets]);

    return (
        <>
            <Box sx={{ mb: "12px" }}>
                <Box sx={{ display: "flex", gap: "8px", mb: "6px", justifyContent: "center" }}>
                    {timerPresets.map((p, i) => (
                        <Box key={i} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                            <Typography sx={{ fontSize: 10, color: tc(0.35) }}>
                                Preset {i + 1}
                            </Typography>
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
                                    width: 52,
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
            </Box>

            <Box sx={{ mb: "12px", display: "flex", gap: "12px", alignItems: "center" }}>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        py: "3px",
                        cursor: "pointer",
                    }}
                    component="label"
                >
                    <Switch
                        size="small"
                        checked={notifySystem}
                        onChange={(e) => {
                            const val = e.target.checked;
                            setNotifySystem(val);
                            invoke("save_notify_settings", { system: val, flash: notifyFlash }).catch(() => { });
                        }}
                    />
                    <Typography>System notification</Typography>
                </Box>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        py: "3px",
                        cursor: "pointer",
                    }}
                    component="label"
                >
                    <Switch
                        size="small"
                        checked={notifyFlash}
                        onChange={(e) => {
                            const val = e.target.checked;
                            setNotifyFlash(val);
                            invoke("save_notify_settings", { system: notifySystem, flash: val }).catch(() => { });
                        }}
                    />
                    <Typography>In-app flash</Typography>
                </Box>
            </Box>
        </>
    );
}
