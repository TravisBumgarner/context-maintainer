import { Box, Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { useDesktopStore, useSettingsStore, useTodoStore } from "../../../../../stores";

interface PermissionsTabProps {
    confirmClear: boolean;
    setConfirmClear: (confirm: boolean) => void;
}

export function PermissionsTab({ confirmClear, setConfirmClear }: PermissionsTabProps) {
    const { tc, ui } = useTheme().custom;

    const { desktop, setDesktop } = useDesktopStore();
    const { accessibilityGranted, setAccessibilityGranted, refreshSpaces } = useSettingsStore();
    const { setTodos, setTitle } = useTodoStore();

    return (
        <>
            {/* Accessibility */}
            <Box sx={{ mb: "16px" }}>
                <Typography sx={{ fontSize: ui.fontSize.xs, fontWeight: ui.weights.semibold, color: tc(0.4), mb: "6px", textTransform: "uppercase", letterSpacing: ui.letterSpacing.wide }}>
                    Accessibility
                </Typography>
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

            {/* Data */}
            <Box sx={{ mb: "16px" }}>
                <Typography sx={{ fontSize: ui.fontSize.xs, fontWeight: ui.weights.semibold, color: tc(0.4), mb: "6px", textTransform: "uppercase", letterSpacing: ui.letterSpacing.wide }}>
                    Data
                </Typography>
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
                                            setTodos([]);
                                            setTitle("");
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
