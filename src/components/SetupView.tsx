import { Box, Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore, useUIStore } from "../stores";

export default function SetupView() {
  const { tc, ui } = useTheme().custom;
  const { accessibilityGranted, setAccessibilityGranted } = useSettingsStore();
  const { setView } = useUIStore();

  return (
    <Box sx={{ flex: 1, overflow: "auto", px: "10px", py: "28px" }}>
      <Typography
        sx={{ fontSize: ui.fontSize.lg, fontWeight: ui.weights.bold, color: tc(0.55), mb: "8px" }}
      >
        Context Maintainer
      </Typography>
      <Typography
        sx={{ fontSize: ui.fontSize.md, color: tc(0.5), mb: "12px", lineHeight: 1.4 }}
      >
        Per-desktop task lists for macOS. Two steps to get started:
      </Typography>

      <Box sx={{ mb: "12px" }}>
        <Typography
          sx={{ fontSize: ui.fontSize.md, fontWeight: ui.weights.bold, color: tc(0.65), mb: "4px" }}
        >
          1. Accessibility
          {accessibilityGranted && (
            <Typography
              component="span"
              sx={{ fontSize: ui.fontSize.sm, fontWeight: ui.weights.semibold, color: tc(0.5), ml: "6px" }}
            >
              Granted
            </Typography>
          )}
        </Typography>
        {!accessibilityGranted && (
          <>
            <Typography sx={{ fontSize: ui.fontSize.md, color: tc(0.5), mb: "6px" }}>
              Required for desktop switching.
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                invoke<boolean>("request_accessibility")
                  .then(setAccessibilityGranted)
                  .catch(() => { });
              }}
            >
              Grant Access
            </Button>
          </>
        )}
      </Box>

      <Box sx={{ mb: "12px" }}>
        <Typography
          sx={{ fontSize: ui.fontSize.md, fontWeight: ui.weights.bold, color: tc(0.65), mb: "4px" }}
        >
          2. Multiple Desktops
        </Typography>
        <Typography sx={{ fontSize: ui.fontSize.md, color: tc(0.5), lineHeight: 1.4 }}>
          Open Mission Control (F3 or swipe up with three fingers) and add multiple desktops by clicking the + button in the top right.
        </Typography>
      </Box>

      <Button
        variant="contained"
        onClick={() => {
          invoke("complete_setup")
            .then(() => setView("todos"))
            .catch(() => { });
        }}
      >
        Get Started
      </Button>
    </Box>
  );
}
