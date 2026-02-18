import { useEffect } from "react";
import { Box, ButtonBase, Link, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore, useUIStore } from "../../../stores";

export default function CommonAppsPanel() {
  const { tc, ui } = useTheme().custom;
  const { commonApps, loadCommonApps } = useSettingsStore();

  useEffect(() => {
    loadCommonApps();
  }, [loadCommonApps]);

  if (commonApps.length === 0) {
    return (
      <Box
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Link
          component="button"
          onClick={() => {
            useUIStore.getState().setSettingsTab(0);
            useUIStore.getState().setView("settings");
          }}
          sx={{
            fontSize: ui.fontSize.sm,
            color: tc(0.5),
            fontWeight: ui.weights.semibold,
            "&:hover": { color: tc(0.7) },
          }}
        >
          Set Up Common Apps
        </Link>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        gap: "6px",
        overflowX: "auto",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {commonApps.map((app) => (
        <ButtonBase
          key={app.path}
          onClick={() => {
            invoke("launch_app", { path: app.path }).catch(() => {});
          }}
          sx={{
            flexShrink: 0,
            px: "12px",
            py: "4px",
            bgcolor: "rgba(0,0,0,0.06)",
            fontFamily: "inherit",
            "&:hover": { bgcolor: "rgba(0,0,0,0.1)" },
            transition: "background-color 0.15s",
          }}
        >
          <Typography
            sx={{
              fontSize: ui.fontSize.sm,
              fontWeight: ui.weights.semibold,
              color: tc(0.6),
              whiteSpace: "nowrap",
            }}
          >
            {app.name}
          </Typography>
        </ButtonBase>
      ))}
    </Box>
  );
}
