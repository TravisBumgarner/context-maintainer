import { useState, useEffect } from "react";
import { Autocomplete, Box, Button, Checkbox, IconButton, TextField, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { useDesktopStore, useSettingsStore, useTodoStore } from "../../../../../stores";
import type { CommonApp } from "../../../../../types";

const PANELS = ["Tasks", "Common Apps", "Timer", "Desktops"] as const;

export function GeneralTab() {
    const { tc, ui } = useTheme().custom;

    const { timerPresets, notifySystem, hiddenPanels, commonApps, setTimerPresets, setNotifySystem, setHiddenPanels, setCommonApps, loadCommonApps } = useSettingsStore();
    const { setDesktop } = useDesktopStore();
    const { clearAll } = useTodoStore();
    const { refreshSpaces } = useSettingsStore();
    const [confirmClear, setConfirmClear] = useState(false);
    const [installedApps, setInstalledApps] = useState<CommonApp[]>([]);
    const [appsLoaded, setAppsLoaded] = useState(false);

    useEffect(() => {
        invoke("save_timer_presets", { presets: timerPresets }).catch(() => { });
    }, [timerPresets]);

    useEffect(() => {
        loadCommonApps();
    }, [loadCommonApps]);

    const loadInstalledApps = () => {
        if (appsLoaded) return;
        invoke<CommonApp[]>("list_installed_apps")
            .then((apps) => {
                setInstalledApps(apps);
                setAppsLoaded(true);
            })
            .catch(() => { });
    };

    const addApp = (app: CommonApp) => {
        if (commonApps.some((a) => a.path === app.path)) return;
        setCommonApps([...commonApps, app]);
    };

    const removeApp = (path: string) => {
        setCommonApps(commonApps.filter((a) => a.path !== path));
    };

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

            {/* Common Apps */}
            <Box sx={sectionSx}>
                <Typography sx={sectionTitleSx}>Common Apps</Typography>
                <Typography sx={{ fontSize: ui.fontSize.xs, color: tc(0.35), mb: "8px" }}>
                    Add apps you use frequently — a browser, text editor, terminal, etc.
                </Typography>
                {commonApps.length > 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: "4px", mb: "8px" }}>
                        {commonApps.map((app) => (
                            <Box
                                key={app.path}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    py: "2px",
                                }}
                            >
                                <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.6) }}>
                                    {app.name}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => removeApp(app.path)}
                                    sx={{ p: "2px", color: tc(0.3), "&:hover": { color: tc(0.6) } }}
                                >
                                    <Typography sx={{ fontSize: 11, lineHeight: 1 }}>✕</Typography>
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                ) : (
                    <Typography sx={{ fontSize: ui.fontSize.xs, color: tc(0.25), mb: "8px" }}>
                        No apps added yet
                    </Typography>
                )}
                <Autocomplete
                    options={installedApps.filter((a) => !commonApps.some((c) => c.path === a.path))}
                    getOptionLabel={(option) => option.name}
                    onOpen={loadInstalledApps}
                    onChange={(_e, value) => {
                        if (value) addApp(value);
                    }}
                    value={null}
                    blurOnSelect
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            placeholder="Search apps..."
                            variant="standard"
                            size="small"
                            sx={{
                                "& .MuiInput-root": {
                                    fontSize: ui.fontSize.sm,
                                    color: tc(0.7),
                                },
                            }}
                        />
                    )}
                    size="small"
                    sx={{ maxWidth: 250 }}
                />
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
