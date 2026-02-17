import { useState, useEffect } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";
import { useSettingsStore, useUIStore } from "../../../../../stores";

export function PermissionsTab() {
    const { tc, ui } = useTheme().custom;

    const { accessibilityGranted, setAccessibilityGranted } = useSettingsStore();
    const { setView } = useUIStore();
    const [notificationGranted, setNotificationGranted] = useState(false);

    useEffect(() => {
        isPermissionGranted().then(setNotificationGranted).catch(() => { });
    }, []);

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
            {/* Accessibility */}
            <Box sx={sectionSx}>
                <Typography sx={sectionTitleSx}>Accessibility</Typography>
                {accessibilityGranted ? (
                    <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.5), fontWeight: ui.weights.semibold }}>
                        Granted
                    </Typography>
                ) : (
                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.35) }}>
                            Not granted
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => {
                                invoke<boolean>("request_accessibility")
                                    .then(setAccessibilityGranted)
                                    .catch(() => { });
                            }}
                        >
                            Grant Access
                        </Button>
                    </Box>
                )}
            </Box>

            {/* Notifications */}
            <Box sx={sectionSx}>
                <Typography sx={sectionTitleSx}>Notifications</Typography>
                {notificationGranted ? (
                    <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.5), fontWeight: ui.weights.semibold }}>
                        Granted
                    </Typography>
                ) : (
                    <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.35) }}>
                            Not granted
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => {
                                requestPermission()
                                    .then((p) => setNotificationGranted(p === "granted"))
                                    .catch(() => { });
                            }}
                        >
                            Grant Access
                        </Button>
                    </Box>
                )}
            </Box>

            {/* Setup */}
            <Box sx={{ ...sectionSx, borderBottomRightRadius: '8px' }}>
                <Typography sx={sectionTitleSx}>Setup</Typography>
                <Button
                    variant="contained"
                    onClick={() => setView("setup")}
                >
                    Show Setup Again
                </Button>
            </Box >
        </>
    );
}
