import { useState } from "react";
import { Box, Button, Checkbox, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { useDesktopStore, useSettingsStore, useTodoStore } from "../../../../../stores";

const PANELS = ["Tasks", "Common Apps", "Timer", "Desktops"] as const;

export function GeneralTab() {
    const { tc, ui } = useTheme().custom;

    const { hiddenPanels, setHiddenPanels } = useSettingsStore();
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
