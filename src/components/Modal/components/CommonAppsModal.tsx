import { useState, useEffect } from "react";
import { Box, IconButton, Tab, Tabs, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../../../stores";
import type { CommonApp } from "../../../types";
import DefaultModal from "./DefaultModal";

export default function CommonAppsModal() {
  const { tc, ui } = useTheme().custom;
  const { commonApps, setCommonApps } = useSettingsStore();
  const [installedApps, setInstalledApps] = useState<CommonApp[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (installedApps.length === 0) {
      invoke<CommonApp[]>("list_installed_apps")
        .then(setInstalledApps)
        .catch(() => {});
    }
  }, [installedApps.length]);

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

  const isSelected = (app: CommonApp) => commonApps.some((a) => a.path === app.path);

  const filtered = installedApps.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DefaultModal title="Common Apps" sx={{ height: "85%" }}>
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
            <Box
              component="input"
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              sx={{
                width: "100%",
                fontSize: ui.fontSize.sm,
                fontFamily: "inherit",
                color: tc(0.7),
                bgcolor: "transparent",
                border: "none",
                borderBottom: `1px solid ${tc(0.15)}`,
                p: "3px 0",
                outline: "none",
                "&::placeholder": { color: tc(0.3) },
                "&:focus": { borderColor: tc(0.3) },
              }}
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
                    "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: ui.fontSize.sm,
                      color: selected ? tc(0.7) : tc(0.5),
                      fontWeight: selected ? ui.weights.bold : ui.weights.normal,
                    }}
                  >
                    {app.name}
                  </Typography>
                  {selected && (
                    <Typography sx={{ fontSize: ui.fontSize.sm, fontWeight: ui.weights.bold, color: tc(0.6) }}>
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
          {commonApps.length === 0 ? (
            <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.4), py: "8px" }}>
              No apps selected. Use the Search tab to add apps.
            </Typography>
          ) : (
            commonApps.map((app) => (
              <Box
                key={app.path}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  py: "2px",
                }}
              >
                <Typography
                  sx={{
                    fontSize: ui.fontSize.sm,
                    color: tc(0.6),
                    fontWeight: ui.weights.semibold,
                    flexShrink: 0,
                  }}
                >
                  {app.name}
                </Typography>
                <Box
                  component="input"
                  type="text"
                  placeholder="short name"
                  value={app.short_name || ""}
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    updateShortName(app.path, e.target.value);
                  }}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: ui.fontSize.xs,
                    fontFamily: "inherit",
                    color: tc(0.5),
                    bgcolor: "transparent",
                    border: "none",
                    borderBottom: `1px solid ${tc(0.1)}`,
                    p: "2px 0",
                    outline: "none",
                    "&::placeholder": { color: tc(0.2) },
                    "&:focus": { borderColor: tc(0.3) },
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => toggleApp(app)}
                  sx={{ p: "2px", flexShrink: 0, color: tc(0.3), "&:hover": { color: tc(0.6) } }}
                >
                  <Typography sx={{ fontSize: 11, lineHeight: 1 }}>✕</Typography>
                </IconButton>
              </Box>
            ))
          )}
        </Box>
      )}
    </DefaultModal>
  );
}
