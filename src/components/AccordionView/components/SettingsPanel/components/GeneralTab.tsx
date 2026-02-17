import { useState, useEffect } from "react";
import { Box, Button, Checkbox, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { useDesktopStore, useSettingsStore, useTodoStore } from "../../../../../stores";

const PANELS = ["Tasks", "Timer", "Desktops"] as const;

export function GeneralTab() {
    const { tc, ui } = useTheme().custom;

    const { timerPresets, notifySystem, hiddenPanels, setTimerPresets, setNotifySystem, setHiddenPanels } = useSettingsStore();
    const { setDesktop } = useDesktopStore();
    const { clearAll } = useTodoStore();
    const { refreshSpaces } = useSettingsStore();
    const [confirmClear, setConfirmClear] = useState(false);

    useEffect(() => {
        invoke("save_timer_presets", { presets: timerPresets }).catch(() => { });
    }, [timerPresets]);

    const togglePanel = (panel: string) => {
        const next = hiddenPanels.includes(panel)
            ? hiddenPanels.filter((p) => p !== panel)
            : [...hiddenPanels, panel];
        setHiddenPanels(next);
    };

    const sectionSx = {
        bgcolor: "rgba(0,0,0,0.04)",
        p: "8px",
        mb: "4px",
    } as const;

    const sectionTitleSx = {
        fontSize: ui.fontSize.xs,
        fontWeight: ui.weights.semibold,
        color: tc(0.4),
        mb: "6px",
        textTransform: "uppercase",
        letterSpacing: ui.letterSpacing.wide,
    } as const;

    return (
        <>
            {/* Timer Setup */}
            <Box sx={sectionSx}>
                <Typography sx={sectionTitleSx}>Timer Setup</Typography>
                <Box sx={{ display: "flex", gap: "8px", }}>
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
                        mt: "8px",
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
            </Box>

            {/* Panels */}
            <Box sx={sectionSx}>
                <Typography sx={sectionTitleSx}>Panels</Typography>
                <Box sx={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {PANELS.map((panel) => (
                        <Box
                            key={panel}
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
                                checked={!hiddenPanels.includes(panel)}
                                onChange={() => togglePanel(panel)}
                                sx={{ p: 0 }}
                            />
                            <Typography>{panel}</Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {/* Clear All Data */}
            <Box sx={{ ...sectionSx, mb: 0, borderBottomRightRadius: '8px' }}>
                {!confirmClear ? (
                    <Button variant="contained" onClick={() => setConfirmClear(true)}>
                        Clear All Data
                    </Button>
                ) : (
                    <Box>
                        <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.5), mb: "6px" }}>
                            This will delete all todos, titles, and custom colors.
                        </Typography>
                        <Box sx={{ display: "flex", gap: "6px" }}>
                            <Button
                                variant="contained"
                                onClick={() => {
                                    invoke("clear_all_data")
                                        .then(() => {
                                            clearAll();
                                            setDesktop((prev) => ({ ...prev, color: "#F5E6A3" }));
                                            refreshSpaces();
                                            setConfirmClear(false);
                                        })
                                        .catch(() => { });
                                }}
                            >
                                Yes, clear everything
                            </Button>
                            <Button variant="contained" onClick={() => setConfirmClear(false)}>
                                Cancel
                            </Button>
                        </Box>
                    </Box>
                )}
            </Box>
        </>
    );
}
