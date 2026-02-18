import { Snackbar, Alert, Button, CircularProgress } from "@mui/material";
import { relaunch } from "@tauri-apps/plugin-process";
import { error } from "@tauri-apps/plugin-log";
import { useUIStore } from "../stores";

export default function UpdateBanner() {
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

    const message =
        status === "downloading"
            ? "Updating..."
            : status === "error"
                ? "Update failed. Try again later."
                : `v${update.version} available`;

    return (
        <Snackbar open anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
            <Alert
                severity={status === "error" ? "error" : "info"}
                onClose={dismiss}
                action={
                    status === "downloading" ? (
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                    ) : status === "error" ? null : (
                        <Button color="inherit" size="small" onClick={handleUpdate}>
                            Update
                        </Button>
                    )
                }
                sx={{ width: "100%", fontSize: 12 }}
            >
                {message}
            </Alert>
        </Snackbar>
    );
}
