import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { isPermissionGranted, requestPermission } from "@tauri-apps/plugin-notification";
import { useSettingsStore, useUIStore } from "../stores";
import { AppButton } from "./shared";

export default function SetupView() {
  const { tc, ui } = useTheme().custom;
  const { accessibilityGranted, setAccessibilityGranted } = useSettingsStore();
  const { setView } = useUIStore();
  const [notificationGranted, setNotificationGranted] = useState(false);

  useEffect(() => {
    isPermissionGranted().then(setNotificationGranted).catch(() => { });
  }, []);

  return (
    <Box sx={{ flex: 1, overflow: "auto", px: "10px", py: "14px" }}>
      <Typography variant="h6" sx={{ mb: "8px" }}>
        Context Maintainer
      </Typography>
      <Typography sx={{ fontSize: ui.fontSize.md, mb: "12px", lineHeight: 1.4 }}>
        Permissions required:
      </Typography>

      <Box sx={{ mb: "12px" }}>
        <Typography
          sx={{ fontSize: ui.fontSize.md, fontWeight: ui.weights.bold, color: tc(0.65), mb: "4px" }}
        >
          1. Accessibility
          {accessibilityGranted && (
            <Typography component="span" variant="subtitle2" sx={{ ml: "6px" }}>
              Granted
            </Typography>
          )}
        </Typography>
        {!accessibilityGranted && (
          <>
            <Typography sx={{ fontSize: ui.fontSize.md, mb: "6px" }}>
              Required for desktop switching.
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
          </>
        )}
      </Box>

      <Box sx={{ mb: "12px" }}>
        <Typography
          sx={{ fontSize: ui.fontSize.md, fontWeight: ui.weights.bold, color: tc(0.65), mb: "4px" }}
        >
          2. Notifications
          {notificationGranted && (
            <Typography component="span" variant="subtitle2" sx={{ ml: "6px" }}>
              Granted
            </Typography>
          )}
        </Typography>
        {!notificationGranted && (
          <>
            <Typography sx={{ fontSize: ui.fontSize.md, mb: "6px" }}>
              Required for timer alerts.
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
          </>
        )}
      </Box>

      <AppButton
        variant="contained"
        onClick={() => {
          invoke("complete_setup")
            .then(() => setView("todos"))
            .catch(() => { });
        }}
      >
        Get Started
      </AppButton>
    </Box>
  );
}
