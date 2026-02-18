import { useState, useEffect } from "react";
import { Box, ButtonBase, IconButton, Link, Modal, Tooltip, Typography } from "@mui/material";
import { Tune } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { useSettingsStore } from "../../../stores";
import type { CommonApp } from "../../../types";

export default function CommonAppsPanel() {
  const { tc, bg, ui } = useTheme().custom;
  const { commonApps, loadCommonApps, setCommonApps } = useSettingsStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [installedApps, setInstalledApps] = useState<CommonApp[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadCommonApps();
  }, [loadCommonApps]);

  useEffect(() => {
    if (modalOpen && installedApps.length === 0) {
      invoke<CommonApp[]>("list_installed_apps")
        .then(setInstalledApps)
        .catch(() => {});
    }
  }, [modalOpen, installedApps.length]);

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
                  {app.short_name || app.name}
                </Typography>
              </ButtonBase>
            ))}
          </Box>
          <Tooltip title="Configure apps" arrow>
            <IconButton
              onClick={() => setModalOpen(true)}
              size="small"
              sx={{ p: "2px", flexShrink: 0, color: tc(0.3), "&:hover": { color: tc(0.5) } }}
            >
              <Tune sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            margin: "auto",
            width: "85%",
            height: "80%",
            display: "flex",
            flexDirection: "column",
            bgcolor: bg,
            border: `1px solid ${tc(0.2)}`,
            "&:focus-visible": { outline: "none" },
          }}
        >
          {/* Header */}
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: "8px", pb: "4px", flexShrink: 0 }}>
            <Typography
              sx={{
                fontSize: ui.fontSize.lg,
                fontWeight: ui.weights.bold,
                color: tc(0.6),
              }}
            >
              Common Apps
            </Typography>
            <IconButton
              onClick={() => setModalOpen(false)}
              size="small"
              sx={{ p: "2px", color: tc(0.4), "&:hover": { color: tc(0.6) } }}
            >
              <Typography sx={{ fontSize: 11, lineHeight: 1 }}>✕</Typography>
            </IconButton>
          </Box>

          {/* Two-column body */}
          <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
            {/* Left: search + app list */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column", borderRight: `1px solid ${tc(0.1)}` }}>
              <Box sx={{ px: "8px", pb: "4px", flexShrink: 0 }}>
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
                  px: "8px",
                  pb: "4px",
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
            </Box>

            {/* Right: selected apps with short names */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <Box sx={{ px: "8px", pb: "4px", flexShrink: 0 }}>
                <Typography
                  sx={{
                    fontSize: ui.fontSize.xs,
                    fontWeight: ui.weights.semibold,
                    color: tc(0.4),
                    textTransform: "uppercase",
                    letterSpacing: ui.letterSpacing.wide,
                    py: "3px",
                    borderBottom: `1px solid ${tc(0.15)}`,
                  }}
                >
                  Selected
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  overflow: "auto",
                  px: "8px",
                  pb: "4px",
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                {commonApps.length === 0 ? (
                  <Typography sx={{ fontSize: ui.fontSize.xs, color: tc(0.25), py: "4px" }}>
                    No apps selected
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
            </Box>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
