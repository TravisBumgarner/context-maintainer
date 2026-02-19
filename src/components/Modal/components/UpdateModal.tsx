import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { relaunch } from "@tauri-apps/plugin-process";
import { error } from "@tauri-apps/plugin-log";
import { useUIStore } from "../../../stores";
import DefaultModal from "./DefaultModal";

export default function UpdateModal() {
  const { tc, ui } = useTheme().custom;
  const update = useUIStore((s) => s.updateAvailable);
  const status = useUIStore((s) => s.updateStatus);
  const setStatus = useUIStore((s) => s.setUpdateStatus);
  const dismissUpdate = useUIStore((s) => s.dismissUpdate);
  const closeModal = useUIStore((s) => s.closeModal);

  if (!update) return null;

  const handleDismiss = () => {
    dismissUpdate();
    closeModal();
  };

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
    <DefaultModal title="Update Available">
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
            onClick={handleDismiss}
            sx={{ px: "12px", py: "4px", color: tc(0.6), "&:hover": { bgcolor: "rgba(0,0,0,0.06)" } }}
          >
            Dismiss
          </Button>
        ) : (
          <>
            <Button
              onClick={handleDismiss}
              sx={{ px: "12px", py: "4px", color: tc(0.4), "&:hover": { bgcolor: "rgba(0,0,0,0.06)" } }}
            >
              Later
            </Button>
            <Button
              onClick={handleUpdate}
              sx={{ px: "12px", py: "4px", color: tc(0.7), fontWeight: ui.weights.bold, "&:hover": { bgcolor: "rgba(0,0,0,0.06)" } }}
            >
              Update
            </Button>
          </>
        )}
      </Box>
    </DefaultModal>
  );
}
