import { useState } from "react";
import { Box, Button, Checkbox, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { useDesktopStore, useSettingsStore, useTodoStore } from "../../../../../stores";

const PANELS = ["Tasks", "Common Apps", "Timer", "Desktops"] as const;

export function GeneralTab() {
    const { tc, ui } = useTheme().custom;

    const { hiddenPanels, setHiddenPanels, autoHideDelay, setAutoHideDelay } = useSettingsStore();
    const { setDesktop } = useDesktopStore();
    const { clearAll } = useTodoStore();
    const { refreshSpaces } = useSettingsStore();
    const [confirmClear, setConfirmClear] = useState(false);

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
            {/* Panels */}
            <Box sx={sectionSx}>
                <Typography sx={sectionTitleSx}>Panels</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px" }}>
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

            {/* Auto-hide */}
            <Box sx={sectionSx}>
                <Typography sx={sectionTitleSx}>Auto-hide after desktop switch</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Box
                        component="input"
                        type="number"
                        min={0}
                        step={1}
                        value={String(autoHideDelay)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const raw = e.target.value.replace(/^0+(?=\d)/, "");
                            const v = Math.max(0, Math.floor(Number(raw) || 0));
                            setAutoHideDelay(v);
                        }}
                        sx={{
                            width: 36,
                            height: 24,
                            border: `1px solid ${tc(0.15)}`,
                            borderRadius: "4px",
                            bgcolor: tc(0.03),
                            color: "inherit",
                            fontFamily: "inherit",
                            fontSize: ui.fontSize.sm,
                            textAlign: "center",
                            outline: "none",
                            "&:focus": { borderColor: tc(0.3) },
                            // Hide spinner arrows
                            "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": {
                                WebkitAppearance: "none",
                                margin: 0,
                            },
                            MozAppearance: "textfield",
                        }}
                    />
                    <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.5) }}>
                        sec (0 = off)
                    </Typography>
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
