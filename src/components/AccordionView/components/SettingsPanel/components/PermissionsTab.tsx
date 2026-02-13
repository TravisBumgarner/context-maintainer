import { Box, Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { useDesktopStore, useSettingsStore, useTodoStore, useUIStore } from "../../../../../stores";

interface PermissionsTabProps {
    confirmClear: boolean;
    setConfirmClear: (confirm: boolean) => void;
}

export function PermissionsTab({ confirmClear, setConfirmClear }: PermissionsTabProps) {
    const theme = useTheme();
    const tc = theme.custom.tc;

    const { desktop, setDesktop } = useDesktopStore();
    const { accessibilityGranted, setAccessibilityGranted, refreshSpaces } = useSettingsStore();
    const { setTodos, setTitle } = useTodoStore();
    const { setView } = useUIStore();

    return (
        <>
            <Box sx={{ mb: "12px" }}>
                {!accessibilityGranted && (
                    <Box sx={{ fontSize: 11, color: tc(0.5), mb: 1, lineHeight: 1.4 }}>
                        <Typography
                            component="strong"
                            sx={{ fontWeight: 700, color: tc(0.65), fontSize: "inherit" }}
                        >
                            Accessibility
                        </Typography>
                        {" — not granted"}
                        <br />
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
                {accessibilityGranted && (
                    <Box sx={{ fontSize: 11, color: tc(0.5), mb: 1, lineHeight: 1.4 }}>
                        <Typography
                            component="strong"
                            sx={{ fontWeight: 700, color: tc(0.65), fontSize: "inherit" }}
                        >
                            Accessibility
                        </Typography>
                        <Typography
                            component="span"
                            sx={{ color: "#4caf50", fontSize: 10, fontWeight: 600, ml: 0.5 }}
                        >
                            Granted
                        </Typography>
                    </Box>
                )}
                <Box sx={{ fontSize: 11, color: tc(0.5), mb: 1, lineHeight: 1.4 }}>
                    <Typography
                        component="strong"
                        sx={{ fontWeight: 700, color: tc(0.65), fontSize: "inherit" }}
                    >
                        Keyboard Shortcuts
                    </Typography>
                    <br />
                    System Settings &gt; Keyboard &gt; Keyboard Shortcuts &gt; Mission Control —
                    enable "Switch to Desktop N" for each desktop.
                </Box>
            </Box>

            <Button
                onClick={() => setView("setup")}
                sx={{
                    fontSize: 10,
                    color: tc(0.3),
                    p: "4px 0",
                    textDecoration: "underline",
                    "&:hover": { color: tc(0.5) },
                }}
            >
                Show Setup Again
            </Button>

            <Box sx={{ mb: "12px" }}>
                <Typography
                    sx={{
                        fontWeight: 700,
                        color: tc(0.45),
                        mb: "6px",
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                    }}
                >
                    Data
                </Typography>
                {!confirmClear ? (
                    <Button variant="contained" onClick={() => setConfirmClear(true)} sx={{ mt: "4px" }}>
                        Clear All Data
                    </Button>
                ) : (
                    <Box sx={{ mt: "4px" }}>
                        <Typography sx={{ m: "0 0 6px", color: tc(0.5) }}>
                            This will delete all todos, titles, and custom colors. Are you sure?
                        </Typography>
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
                            sx={{ mr: "6px" }}
                        >
                            Yes, clear everything
                        </Button>
                        <Button variant="contained" onClick={() => setConfirmClear(false)}>
                            Cancel
                        </Button>
                    </Box>
                )}
            </Box>
        </>
    );
}
