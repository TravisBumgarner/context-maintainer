import { Box, Button, CircularProgress, IconButton, Modal, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { relaunch } from "@tauri-apps/plugin-process";
import { error } from "@tauri-apps/plugin-log";
import { useUIStore } from "../stores";

export default function UpdateBanner() {
    const { tc, bg, ui } = useTheme().custom;
    const update = useUIStore((s) => s.updateAvailable);
    const status = useUIStore((s) => s.updateStatus);
    const dismiss = useUIStore((s) => s.dismissUpdate);
    const setStatus = useUIStore((s) => s.setUpdateStatus);

    if (!update) return null;

    const handleUpdate = async () => {
        setStatus("downloading");
        try {
            await update.downloadAndInstall();
            await relaunch();
        } catch (err) {
            error(`Update install failed: ${err}`);
            setStatus("error");
        }
    };

    return (
        <Modal open onClose={status === "downloading" ? undefined : dismiss}>
            <Box
                sx={{
                    position: "absolute",
                    inset: 0,
                    margin: "auto",
                    width: "90%",
                    height: "fit-content",
                    bgcolor: bg,
                    border: `1px solid ${tc(0.2)}`,
                    borderRadius: "8px",
                    p: "8px",
                    "&:focus-visible": { outline: "none" },
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "6px" }}>
                    <Typography
                        sx={{
                            fontSize: ui.fontSize.lg,
                            fontWeight: ui.weights.bold,
                            color: tc(0.6),
                        }}
                    >
                        Update Available
                    </Typography>
                    {status !== "downloading" && (
                        <IconButton
                            onClick={dismiss}
                            size="small"
                            sx={{ p: "2px", color: tc(0.4), "&:hover": { color: tc(0.6) } }}
                        >
                            <Typography sx={{ fontSize: 11, lineHeight: 1 }}>✕</Typography>
                        </IconButton>
                    )}
                </Box>

                <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.5), mb: "8px" }}>
                    {status === "downloading"
                        ? "Updating..."
                        : status === "error"
                            ? "Update failed. Try again later."
                            : `v${update.version} is ready to install.`}
                </Typography>

                <Box sx={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                    {status === "downloading" ? (
                        <CircularProgress size={20} sx={{ color: tc(0.4) }} />
                    ) : status === "error" ? (
                        <Button
                            onClick={dismiss}
                            sx={{
                                px: "12px",
                                py: "4px",
                                color: tc(0.6),
                                "&:hover": { bgcolor: "rgba(0,0,0,0.06)" },
                            }}
                        >
                            Dismiss
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={dismiss}
                                sx={{
                                    px: "12px",
                                    py: "4px",
                                    color: tc(0.4),
                                    "&:hover": { bgcolor: "rgba(0,0,0,0.06)" },
                                }}
                            >
                                Later
                            </Button>
                            <Button
                                onClick={handleUpdate}
                                sx={{
                                    px: "12px",
                                    py: "4px",
                                    color: tc(0.7),
                                    fontWeight: ui.weights.bold,
                                    "&:hover": { bgcolor: "rgba(0,0,0,0.06)" },
                                }}
                            >
                                Update
                            </Button>
                        </>
                    )}
                </Box>
            </Box>
        </Modal>
    );
}
