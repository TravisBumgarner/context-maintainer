import { useState } from "react";
import { Box, Checkbox, Typography } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { useDesktopStore, useSettingsStore, useTodoStore } from "../../../../../stores";
import { BG_OVERLAY_LIGHT } from "../../../../../theme";
import { SectionTitle, NumericInput, AppButton } from "../../../../shared";

const PANELS = ["Tasks", "Common Apps", "Timer", "Desktops"] as const;

export function GeneralTab() {
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
        bgcolor: BG_OVERLAY_LIGHT,
        p: "8px",
        mb: "4px",
    } as const;

    return (
        <>
            {/* Panels */}
            <Box sx={sectionSx}>
                <SectionTitle>Panels</SectionTitle>
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
                <SectionTitle>Auto-hide after desktop switch</SectionTitle>
                <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <NumericInput
                        value={autoHideDelay}
                        min={0}
                        onChange={setAutoHideDelay}
                    />
                    <Typography>
                        sec (0 = off)
                    </Typography>
                </Box>
            </Box>

            {/* Clear All Data */}
            <Box sx={{ ...sectionSx, mb: 0, borderBottomRightRadius: '8px' }}>
                {!confirmClear ? (
                    <AppButton variant="contained" onClick={() => setConfirmClear(true)}>
                        Clear All Data
                    </AppButton>
                ) : (
                    <Box>
                        <Typography sx={{ mb: "6px" }}>
                            This will delete all todos, titles, and custom colors.
                        </Typography>
                        <Box sx={{ display: "flex", gap: "6px" }}>
                            <AppButton
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
                            </AppButton>
                            <AppButton variant="contained" onClick={() => setConfirmClear(false)}>
                                Cancel
                            </AppButton>
                        </Box>
                    </Box>
                )}
            </Box>
        </>
    );
}
