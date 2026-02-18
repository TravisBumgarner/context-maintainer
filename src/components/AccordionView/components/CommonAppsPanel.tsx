import { useState, useEffect } from "react";
import { Box, ButtonBase, IconButton, Link, Modal, Typography } from "@mui/material";
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
            display: "flex",
            flexDirection: "column",
            bgcolor: bg,
            "&:focus-visible": { outline: "none" },
          }}
        >
          <Box sx={{ p: "8px", flexShrink: 0 }}>
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
              Select apps you use frequently — a browser, text editor, terminal, etc.
            </Typography>
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
              pb: "8px",
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
                      fontWeight: selected ? ui.weights.semibold : ui.weights.normal,
                    }}
                  >
                    {app.name}
                  </Typography>
                  {selected && (
                    <Typography sx={{ fontSize: 9, color: tc(0.35) }}>
                      ✓
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>
      </Modal>
    </>
  );
}
