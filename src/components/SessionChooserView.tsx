import { Box, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import Layout from "./AccordionView/components/Layout";
import { useUIStore, useTodoStore, useDesktopStore, useSettingsStore } from "../stores";
import type { SpaceInfo, ContextHistory } from "../types";
import { AppButton } from "./shared";

export default function SessionChooserView() {
  const theme = useTheme();
  const tc = theme.custom.tc;

  const { setView } = useUIStore();
  const hasExistingSession = useUIStore((s) => s.hasExistingSession);
  const { clearAll } = useTodoStore();
  const { setContextHistory } = useDesktopStore();
  const { setAllSpaces } = useSettingsStore();

  const btnSx = {
    display: "block",
    width: "100%",
    px: "14px",
    py: "7px",
    textAlign: "center",
  } as const;

  return (
    <Layout>
      <Box
        data-tauri-drag-region
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          useUIStore.getState().markDragged();
        }}
        sx={{
          cursor: "move",
          p: "16px 14px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
        }}
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 700,
            color: tc(0.55),
            mb: "6px",
            textAlign: "center",
          }}
        >
          Context Maintainer
        </Typography>
        <Typography variant="body2" sx={{ mb: 2, textAlign: "center" }}>
          {hasExistingSession ? "You have an existing session." : "Start a new session to get going."}
        </Typography>
        <Stack spacing={1} sx={{ width: "100%", maxWidth: 180 }}>
          <AppButton
            variant="contained"
            sx={btnSx}
            disabled={!hasExistingSession}
            onClick={() => {
              setView("todos");
              emit("session-action", { action: "continue" });
            }}
          >
            Continue Session
          </AppButton>
          <AppButton
            variant="contained"
            sx={btnSx}
            onClick={() => {
              invoke("start_new_session")
                .then(() => {
                  clearAll();
                  setView("todos");
                  emit("session-action", { action: "new" });
                })
                .catch(() => { });
            }}
          >
            New Session
          </AppButton>
          <AppButton
            variant="contained"
            sx={btnSx}
            disabled={!hasExistingSession}
            onClick={() => {
              Promise.all([
                invoke<SpaceInfo[]>("list_all_spaces"),
                invoke<ContextHistory>("get_context_history"),
              ])
                .then(([spaces, history]) => {
                  setAllSpaces(spaces);
                  setContextHistory(history);
                  setView("history-picker");
                  emit("session-action", { action: "history" });
                })
                .catch(() => { });
            }}
          >
            Pick from History
          </AppButton>
        </Stack>
      </Box>
    </Layout>
  );
}
