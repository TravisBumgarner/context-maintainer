import { useState, useEffect } from "react";
import { Autocomplete, Box, ButtonBase, IconButton, Link, Modal, TextField, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../../../stores";
import type { CommonApp } from "../../../types";

export default function CommonAppsPanel() {
  const { tc, bg, ui } = useTheme().custom;
  const { commonApps, loadCommonApps, setCommonApps } = useSettingsStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [installedApps, setInstalledApps] = useState<CommonApp[]>([]);
  const [appsLoaded, setAppsLoaded] = useState(false);

  useEffect(() => {
    loadCommonApps();
  }, [loadCommonApps]);

  const loadInstalledApps = () => {
    if (appsLoaded) return;
    invoke<CommonApp[]>("list_installed_apps")
      .then((apps) => {
        setInstalledApps(apps);
        setAppsLoaded(true);
      })
      .catch(() => { });
  };

  const addApp = (app: CommonApp) => {
    if (commonApps.some((a) => a.path === app.path)) return;
    setCommonApps([...commonApps, app]);
  };

  const removeApp = (path: string) => {
    setCommonApps(commonApps.filter((a) => a.path !== path));
  };

  return (
    <>
      {commonApps.length === 0 ? (
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
            onClick={() => setModalOpen(true)}
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
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            margin: "auto",
            height: "fit-content",
            width: "85%",
            maxHeight: "70%",
            overflow: "auto",
            bgcolor: bg,
            border: `1px solid ${tc(0.2)}`,
            p: "8px",
            "&:focus-visible": { outline: "none" },
          }}
        >
          <Typography
            sx={{
              fontSize: ui.fontSize.lg,
              fontWeight: ui.weights.bold,
              color: tc(0.6),
              mb: "2px",
            }}
          >
            Common Apps
          </Typography>
          <Typography sx={{ fontSize: ui.fontSize.xs, color: tc(0.35), mb: "6px" }}>
            Add apps you use frequently — a browser, text editor, terminal, etc.
          </Typography>

          {commonApps.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: "2px", mb: "6px" }}>
              {commonApps.map((app) => (
                <Box
                  key={app.path}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: "2px",
                  }}
                >
                  <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.6) }}>
                    {app.name}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => removeApp(app.path)}
                    sx={{ p: "2px", color: tc(0.3), "&:hover": { color: tc(0.6) } }}
                  >
                    <Typography sx={{ fontSize: 11, lineHeight: 1 }}>✕</Typography>
                  </IconButton>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography sx={{ fontSize: ui.fontSize.xs, color: tc(0.25), mb: "6px" }}>
              No apps added yet
            </Typography>
          )}

          <Autocomplete
            options={installedApps.filter((a) => !commonApps.some((c) => c.path === a.path))}
            getOptionLabel={(option) => option.name}
            onOpen={loadInstalledApps}
            onChange={(_e, value) => {
              if (value) addApp(value);
            }}
            value={null}
            blurOnSelect
            slotProps={{
              paper: {
                sx: {
                  bgcolor: bg,
                  border: `1px solid ${tc(0.15)}`,
                  boxShadow: "none",
                  "& .MuiAutocomplete-option": {
                    fontSize: ui.fontSize.sm,
                    color: tc(0.6),
                    "&:hover, &.Mui-focused": { bgcolor: `${tc(0.06)} !important` },
                  },
                  "& .MuiAutocomplete-noOptions": {
                    fontSize: ui.fontSize.sm,
                    color: tc(0.35),
                  },
                },
              },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Search apps..."
                variant="standard"
                size="small"
                sx={{
                  "& .MuiInput-root": {
                    fontSize: ui.fontSize.sm,
                    color: tc(0.7),
                  },
                  "& .MuiInput-root::before": {
                    borderColor: tc(0.15),
                  },
                  "& .MuiInput-root:hover::before": {
                    borderColor: `${tc(0.3)} !important`,
                  },
                  "& input::placeholder": {
                    color: tc(0.3),
                    opacity: 1,
                  },
                  "& .MuiSvgIcon-root": {
                    color: tc(0.3),
                  },
                }}
              />
            )}
            size="small"
            sx={{ maxWidth: 250 }}
          />
        </Box>
      </Modal>
    </>
  );
}
