import { useEffect } from "react";
import { Box, ButtonBase, IconButton, Link, Tooltip, Typography } from "@mui/material";
import { Tune } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore, useUIStore } from "../../../stores";
import { MODAL_ID } from "../../Modal/Modal.consts";

export default function CommonAppsPanel() {
  const { tc, ui } = useTheme().custom;
  const { commonApps, loadCommonApps } = useSettingsStore();
  const openModal = useUIStore((s) => s.openModal);

  useEffect(() => {
    loadCommonApps();
  }, [loadCommonApps]);

  return commonApps.length === 0 ? (
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
        onClick={() => openModal(MODAL_ID.COMMON_APPS)}
        sx={{
          fontSize: ui.fontSize.sm,
          color: tc(0.5),
          fontWeight: ui.weights.semibold,
          "&:hover": { color: tc(0.7) },
        }}
      >
        Configure Common Apps
      </Link>
    </Box>
  ) : (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        width: "100%",
        gap: "4px",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          flex: 1,
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {commonApps.map((app) => (
          <Box
            key={app.path}
            sx={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              bgcolor: "rgba(0,0,0,0.06)",
              overflow: "hidden",
            }}
          >
            <Tooltip title={`Show ${app.name}`} arrow>
              <ButtonBase
                onClick={() => {
                  invoke("launch_app", { path: app.path }).catch(() => {});
                }}
                sx={{
                  px: "8px",
                  py: "4px",
                  display: "flex",
                  alignItems: "center",
                  fontFamily: "inherit",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.06)" },
                  transition: "background-color 0.15s",
                }}
              >
                <Typography
                  sx={{
                    fontSize: ui.fontSize.sm,
                    fontWeight: ui.weights.semibold,
                    color: tc(0.6),
                    whiteSpace: "nowrap",
                    lineHeight: 1,
                  }}
                >
                  {app.short_name || app.name}
                </Typography>
              </ButtonBase>
            </Tooltip>
            <Tooltip title={`New ${app.name} window`} arrow>
              <ButtonBase
                onClick={() => {
                  invoke("launch_app_new", { path: app.path }).catch(() => {});
                }}
                sx={{
                  px: "4px",
                  py: "4px",
                  display: "flex",
                  alignItems: "center",
                  fontFamily: "inherit",
                  borderLeft: `1px solid ${tc(0.08)}`,
                  "&:hover": { bgcolor: "rgba(0,0,0,0.06)" },
                  transition: "background-color 0.15s",
                }}
              >
                <Typography
                  sx={{
                    fontSize: ui.fontSize.xs,
                    fontWeight: ui.weights.bold,
                    color: tc(0.35),
                    lineHeight: 1,
                  }}
                >
                  +
                </Typography>
              </ButtonBase>
            </Tooltip>
          </Box>
        ))}
      </Box>
      <Tooltip title="Configure apps" arrow>
        <IconButton
          onClick={() => openModal(MODAL_ID.COMMON_APPS)}
          size="small"
          sx={{ p: "2px", flexShrink: 0, color: tc(0.3), "&:hover": { color: tc(0.5) } }}
        >
          <Tune sx={{ fontSize: 14 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
