import { useState } from "react";
import { Box, Button, Switch, Typography, Tabs, Tab } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { THEMES } from "../../../constants";
import { useDesktopStore, useSettingsStore, useTodoStore, useUIStore } from "../../../stores";

export default function SettingsPanel() {
  const theme = useTheme();
  const tc = theme.custom.tc;

  const { desktop, setDesktop } = useDesktopStore();
  const {
    allSpaces,
    desktopCount,
    timerPresets,
    accessibilityGranted,
    notifySystem,
    notifyFlash,
    setAllSpaces,
    setAccessibilityGranted,
    setTimerPresets,
    setNotifySystem,
    setNotifyFlash,
    refreshSpaces,
  } = useSettingsStore();
  const { setTodos, setTitle } = useTodoStore();
  const { setView } = useUIStore();

  const [settingsTab, setSettingsTab] = useState(0);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const smallBtnSx = {
    mt: 0.5,
    px: "10px",
    py: "3px",
    fontSize: 10,
    color: theme.custom.tcInv(),
    bgcolor: tc(0.45),
    borderRadius: "10px",
    "&:hover": { bgcolor: tc(0.6) },
  } as const;

  const handleApplyTheme = (colors: string[]) => {
    const padded = Array.from({ length: desktopCount }, (_, i) => colors[i % colors.length]);
    invoke("apply_theme", { colors: padded })
      .then(() => {
        refreshSpaces();
        const newColor = padded[desktop.position] ?? padded[0];
        setDesktop((prev) => ({ ...prev, color: newColor }));
      })
      .catch(() => {});
  };

  return (
    <>
      <Tabs
        value={settingsTab}
        onChange={(_, v) => setSettingsTab(v)}
        sx={{ mb: "10px", borderBottom: `1px solid ${tc(0.12)}` }}
      >
        {["Themes", "Permissions", "Timer"].map((label) => (
          <Tab key={label} label={label} sx={{ flex: 1 }} />
        ))}
      </Tabs>

      {/* Themes tab */}
      {settingsTab === 0 && (
        <>
          <Box sx={{ mb: "12px" }}>
            {!showThemePicker ? (
              <Button
                onClick={() => setShowThemePicker(true)}
                sx={{
                  px: "14px",
                  py: "5px",
                  color: theme.custom.tcInv(),
                  bgcolor: tc(0.45),
                  borderRadius: "12px",
                  "&:hover": { bgcolor: tc(0.6) },
                }}
              >
                Choose a Theme
              </Button>
            ) : (
              <>
                <Typography
                  sx={{
                    fontWeight: 700,
                    color: tc(0.45),
                    mb: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                  }}
                >
                  Theme
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "6px",
                  }}
                >
                  {THEMES.map((t) => (
                    <Box
                      key={t.name}
                      component="button"
                      onClick={() => {
                        handleApplyTheme(t.colors);
                        setShowThemePicker(false);
                      }}
                      title={t.name}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "3px",
                        p: "5px 4px",
                        border: `1px solid ${tc(0.1)}`,
                        borderRadius: "6px",
                        bgcolor: tc(0.03),
                        cursor: "pointer",
                        fontFamily: "inherit",
                        "&:hover": { bgcolor: tc(0.08) },
                      }}
                    >
                      <Box sx={{ display: "flex", gap: "2px" }}>
                        {t.colors.slice(0, 5).map((c, i) => (
                          <Box
                            key={i}
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: "3px",
                              border: `1px solid ${tc(0.12)}`,
                              bgcolor: c,
                            }}
                          />
                        ))}
                      </Box>
                      <Typography sx={{ fontSize: 9, color: tc(0.5), fontWeight: 600 }}>
                        {t.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>

          <Box sx={{ mb: "12px" }}>
            {allSpaces.map((s) => (
              <Box
                key={s.space_id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: "3px",
                }}
              >
                <Box
                  component="input"
                  type="color"
                  value={s.color}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const newColor = e.target.value;
                    invoke("save_color", { desktop: s.space_id, color: newColor }).catch(() => {});
                    setAllSpaces(
                      allSpaces.map((sp) =>
                        sp.space_id === s.space_id ? { ...sp, color: newColor } : sp
                      )
                    );
                    if (s.space_id === desktop.space_id) {
                      setDesktop((prev) => ({ ...prev, color: newColor }));
                    }
                  }}
                  sx={{
                    flexShrink: 0,
                    width: 24,
                    height: 20,
                    border: `1px solid ${tc(0.12)}`,
                    borderRadius: "3px",
                    p: "1px",
                    cursor: "pointer",
                    background: "none",
                  }}
                />
              </Box>
            ))}
            {allSpaces.length === 0 && (
              <Typography sx={{ fontSize: 10, color: tc(0.25), px: "6px" }}>
                No spaces detected
              </Typography>
            )}
          </Box>
        </>
      )}

      {/* Permissions tab */}
      {settingsTab === 1 && (
        <>
          <Box sx={{ mb: "12px" }}>
            {!accessibilityGranted && (
              <Box sx={{ fontSize: 11, color: tc(0.5), mb: 1, lineHeight: 1.4 }}>
                <Typography
                  component="strong"
                  sx={{ fontWeight: 700, color: tc(0.65), fontSize: "inherit" }}
                >
                  Accessibility
                </Typography>
                {" — not granted"}
                <br />
                <Button
                  onClick={() => {
                    invoke<boolean>("request_accessibility")
                      .then(setAccessibilityGranted)
                      .catch(() => {});
                  }}
                  sx={smallBtnSx}
                >
                  Grant Access
                </Button>
              </Box>
            )}
            {accessibilityGranted && (
              <Box sx={{ fontSize: 11, color: tc(0.5), mb: 1, lineHeight: 1.4 }}>
                <Typography
                  component="strong"
                  sx={{ fontWeight: 700, color: tc(0.65), fontSize: "inherit" }}
                >
                  Accessibility
                </Typography>
                <Typography
                  component="span"
                  sx={{ color: "#4caf50", fontSize: 10, fontWeight: 600, ml: 0.5 }}
                >
                  Granted
                </Typography>
              </Box>
            )}
            <Box sx={{ fontSize: 11, color: tc(0.5), mb: 1, lineHeight: 1.4 }}>
              <Typography
                component="strong"
                sx={{ fontWeight: 700, color: tc(0.65), fontSize: "inherit" }}
              >
                Keyboard Shortcuts
              </Typography>
              <br />
              System Settings &gt; Keyboard &gt; Keyboard Shortcuts &gt; Mission Control —
              enable "Switch to Desktop N" for each desktop.
            </Box>
          </Box>

          <Button
            onClick={() => setView("setup")}
            sx={{
              fontSize: 10,
              color: tc(0.3),
              p: "4px 0",
              textDecoration: "underline",
              "&:hover": { color: tc(0.5) },
            }}
          >
            Show Setup Again
          </Button>

          <Box sx={{ mb: "12px" }}>
            <Typography
              sx={{
                fontWeight: 700,
                color: tc(0.45),
                mb: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
            >
              Data
            </Typography>
            {!confirmClear ? (
              <Button onClick={() => setConfirmClear(true)} sx={{ ...smallBtnSx, mt: "4px" }}>
                Clear All Data
              </Button>
            ) : (
              <Box sx={{ mt: "4px" }}>
                <Typography sx={{ m: "0 0 6px", color: tc(0.5) }}>
                  This will delete all todos, titles, and custom colors. Are you sure?
                </Typography>
                <Button
                  onClick={() => {
                    invoke("clear_all_data")
                      .then(() => {
                        setTodos([]);
                        setTitle("");
                        setDesktop((prev) => ({ ...prev, color: "#F5E6A3" }));
                        refreshSpaces();
                        setConfirmClear(false);
                      })
                      .catch(() => {});
                  }}
                  sx={{ ...smallBtnSx, mr: "6px" }}
                >
                  Yes, clear everything
                </Button>
                <Button onClick={() => setConfirmClear(false)} sx={smallBtnSx}>
                  Cancel
                </Button>
              </Box>
            )}
          </Box>
        </>
      )}

      {/* Timer settings tab */}
      {settingsTab === 2 && (
        <>
          <Box sx={{ mb: "12px" }}>
            <Box sx={{ display: "flex", gap: "8px", mb: "6px" }}>
              {timerPresets.map((p, i) => (
                <Box key={i} sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                  <Typography sx={{ fontSize: 10, color: tc(0.35) }}>
                    Preset {i + 1}
                  </Typography>
                  <Box
                    component="input"
                    type="number"
                    min={1}
                    value={p}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const val = Math.max(1, parseInt(e.target.value) || 1);
                      setTimerPresets((prev) => prev.map((v, j) => (j === i ? val : v)));
                    }}
                    sx={{
                      width: 52,
                      fontSize: 11,
                      fontFamily: "inherit",
                      color: tc(0.7),
                      bgcolor: "transparent",
                      border: "none",
                      borderBottom: `1px solid ${tc(0.12)}`,
                      p: "3px 4px",
                      textAlign: "center",
                      outline: "none",
                      MozAppearance: "textfield",
                      "&::-webkit-inner-spin-button, &::-webkit-outer-spin-button": {
                        WebkitAppearance: "none",
                        margin: 0,
                      },
                      "&:focus": { borderColor: tc(0.3) },
                    }}
                  />
                  <Typography sx={{ fontSize: 9, color: tc(0.25) }}>sec</Typography>
                </Box>
              ))}
            </Box>
            <Button
              onClick={() => {
                invoke("save_timer_presets", { presets: timerPresets }).catch(() => {});
              }}
              sx={{ ...smallBtnSx, mt: "6px" }}
            >
              Save Presets
            </Button>
          </Box>

          <Box sx={{ mb: "12px" }}>
            <Typography
              sx={{
                fontWeight: 700,
                color: tc(0.45),
                mb: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.3px",
              }}
            >
              Notification Type
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                py: "3px",
                cursor: "pointer",
              }}
              component="label"
            >
              <Switch
                size="small"
                checked={notifySystem}
                onChange={(e) => {
                  const val = e.target.checked;
                  setNotifySystem(val);
                  invoke("save_notify_settings", { system: val, flash: notifyFlash }).catch(() => {});
                }}
              />
              <Typography>System notification</Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                py: "3px",
                cursor: "pointer",
              }}
              component="label"
            >
              <Switch
                size="small"
                checked={notifyFlash}
                onChange={(e) => {
                  const val = e.target.checked;
                  setNotifyFlash(val);
                  invoke("save_notify_settings", { system: notifySystem, flash: val }).catch(() => {});
                }}
              />
              <Typography>In-app flash</Typography>
            </Box>
          </Box>
        </>
      )}
    </>
  );
}
