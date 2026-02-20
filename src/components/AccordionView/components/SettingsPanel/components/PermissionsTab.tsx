import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { invoke } from "@tauri-apps/api/core";
import { isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";
import { useSettingsStore, useUIStore } from "../../../../../stores";
import { BG_OVERLAY_LIGHT } from "../../../../../theme";
import { SectionTitle, AppButton } from "../../../../shared";

export function PermissionsTab() {
    const { accessibilityGranted, setAccessibilityGranted } = useSettingsStore();
    const { setView } = useUIStore();
    const [notificationGranted, setNotificationGranted] = useState(false);

    useEffect(() => {
        isPermissionGranted().then(setNotificationGranted).catch(() => { });
    }, []);

    const sectionSx = {
        bgcolor: BG_OVERLAY_LIGHT,
        p: "8px",
        mb: "4px",
    } as const;

    return (
        <>
            {/* Accessibility */}
            <Box sx={sectionSx}>
                <SectionTitle>Accessibility</SectionTitle>
                {accessibilityGranted ? (
                    <Typography variant="subtitle2">
                        Granted
                    </Typography>
                ) : (
                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Typography variant="overline">
                            Not granted
                        </Typography>
                        <AppButton
                            variant="contained"
                            onClick={() => {
                                invoke<boolean>("request_accessibility")
                                    .then(setAccessibilityGranted)
                                    .catch(() => { });
                            }}
                        >
                            Grant Access
                        </AppButton>
                    </Box>
                )}
            </Box>

            {/* Notifications */}
            <Box sx={sectionSx}>
                <SectionTitle>Notifications</SectionTitle>
                {notificationGranted ? (
                    <Typography variant="subtitle2">
                        Granted
                    </Typography>
                ) : (
                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Typography variant="overline">
                            Not granted
                        </Typography>
                        <AppButton
                            variant="contained"
                            onClick={() => {
                                requestPermission()
                                    .then((p) => setNotificationGranted(p === "granted"))
                                    .catch(() => { });
                            }}
                        >
                            Grant Access
                        </AppButton>
                    </Box>
                )}
            </Box>

            {/* Setup */}
            <Box sx={{ ...sectionSx, borderBottomRightRadius: '8px' }}>
                <SectionTitle>Setup</SectionTitle>
                <AppButton
                    variant="contained"
                    onClick={() => setView("setup")}
                >
                    Show Setup Again
                </AppButton>
            </Box >
        </>
    );
}
