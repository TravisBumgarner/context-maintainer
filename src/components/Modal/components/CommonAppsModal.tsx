import { useState, useEffect } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../../../stores";
import type { CommonApp } from "../../../types";
import DefaultModal from "./DefaultModal";
import { BG_OVERLAY_LIGHT } from "../../../theme";
import { openUrl } from "@tauri-apps/plugin-opener";
import { AppInput, AppIconButton } from "../../shared";

const LAUNCH_ARGS_TIP = "common_apps_launch_args";

export default function CommonAppsModal() {
  const { tc, ui } = useTheme().custom;
  const { commonApps, setCommonApps, dismissedTips, dismissTip, loadDismissedTips } = useSettingsStore();
  const [installedApps, setInstalledApps] = useState<CommonApp[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (installedApps.length === 0) {
      invoke<CommonApp[]>("list_installed_apps")
        .then(setInstalledApps)
        .catch(() => { });
    }
  }, [installedApps.length]);

  useEffect(() => {
    loadDismissedTips();
  }, [loadDismissedTips]);

  const toggleApp = (app: CommonApp) => {
    if (commonApps.some((a) => a.path === app.path)) {
      setCommonApps(commonApps.filter((a) => a.path !== app.path));
    } else {
      setCommonApps([...commonApps, app]);
    }
  };

  const updateShortName = (path: string, shortName: string) => {
    setCommonApps(commonApps.map((a) =>
      a.path === path ? { ...a, short_name: shortName || undefined } : a
    ));
  };

  const updateLaunchArgs = (path: string, launchArgs: string) => {
    setCommonApps(commonApps.map((a) =>
      a.path === path ? { ...a, launch_args: launchArgs || undefined } : a
    ));
  };

  const isSelected = (app: CommonApp) => commonApps.some((a) => a.path === app.path);

  const filtered = installedApps.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const showTip = !dismissedTips.includes(LAUNCH_ARGS_TIP);

  return (
    <DefaultModal title="Common Apps">
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ flexShrink: 0 }}
      >
        <Tab label="Search" sx={{ minWidth: "unset", px: "10px" }} />
        <Tab label="Selected" sx={{ minWidth: "unset", px: "10px" }} />
      </Tabs>

      {tab === 0 && (
        <>
          <Box sx={{ pb: "4px", flexShrink: 0 }}>
            <AppInput
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </Box>
          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {filtered.map((app) => {
              const selected = isSelected(app);
              return (
                <Box
                  key={app.path}
                  onClick={() => toggleApp(app)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    py: "2px",
                    px: "2px",
                    cursor: "pointer",
                    "&:hover": { bgcolor: BG_OVERLAY_LIGHT },
                  }}
                >
                  <Typography
                    sx={selected ? { color: tc(0.7), fontWeight: ui.weights.bold } : undefined}
                  >
                    {app.name}
                  </Typography>
                  {selected && (
                    <Typography sx={{ fontWeight: ui.weights.bold, color: tc(0.6) }}>
                      ✓
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </>
      )}

      {tab === 1 && (
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            py: "4px",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {showTip && commonApps.length > 0 && (
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: "6px",
                p: "6px",
                mb: "6px",
                bgcolor: BG_OVERLAY_LIGHT,
                borderRadius: "4px",
              }}
            >
              <Typography variant="body2" sx={{ flex: 1, fontSize: ui.fontSize.xs, color: tc(0.6), lineHeight: 1.3 }}>
                Not all apps support new instances. Use the "custom command" field to override the default behavior.{" "}
                <Typography
                  component="span"
                  onClick={() => openUrl("https://github.com/TravisBumgarner/context-maintainer?tab=readme-ov-file#common-apps---custom-commands")}
                  sx={{ fontSize: "inherit", color: tc(0.8), cursor: "pointer", textDecoration: "underline" }}
                >
                  See known commands
                </Typography>
              </Typography>
              <AppIconButton
                icon="close"
                onClick={() => dismissTip(LAUNCH_ARGS_TIP)}
                sx={{ flexShrink: 0, fontSize: 10, mt: "-2px" }}
              />
            </Box>
          )}
          {commonApps.length === 0 ? (
            <Typography variant="body2" sx={{ py: "8px" }}>
              No apps selected. Use the Search tab to add apps.
            </Typography>
          ) : (
            commonApps.map((app) => (
              <Box
                key={app.path}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  py: "4px",
                  "&:not(:last-child)": { mb: "4px" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Typography variant="subtitle1" sx={{ flexShrink: 0 }}>
                    {app.name}
                  </Typography>
                  <AppInput
                    type="text"
                    placeholder="short name"
                    value={app.short_name || ""}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      updateShortName(app.path, e.target.value);
                    }}
                    sx={{
                      flex: 1,
                      width: "auto",
                      minWidth: 0,
                      fontSize: ui.fontSize.xs,
                      p: "2px 0",
                    }}
                  />
                  <AppIconButton
                    icon="close"
                    onClick={() => toggleApp(app)}
                    sx={{ flexShrink: 0, fontSize: 11 }}
                  />
                </Box>
                <AppInput
                  type="text"
                  placeholder="custom command"
                  value={app.launch_args || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    updateLaunchArgs(app.path, e.target.value);
                  }}
                  sx={{
                    width: "100%",
                    fontSize: ui.fontSize.xs,
                    p: "2px 0",
                  }}
                />
              </Box>
            ))
          )}
        </Box>
      )}
    </DefaultModal>
  );
}
