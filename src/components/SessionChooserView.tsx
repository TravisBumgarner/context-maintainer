import { Box, Button, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import Layout from "./AccordionView/components/Layout";
import { useUIStore, useTodoStore, useDesktopStore, useSettingsStore } from "../stores";
import type { SpaceInfo, ContextHistory } from "../types";

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
    color: theme.custom.tcInv(),
    bgcolor: tc(0.45),
    textAlign: "center",
    "&:hover": { bgcolor: tc(0.6) },
    "&.Mui-disabled": { color: tc(0.2), bgcolor: tc(0.2) },
  } as const;

  return (
    <Layout>
      <Box
        sx={{
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
        <Typography
          sx={{
            color: tc(0.4),
            mb: 2,
            textAlign: "center",
          }}
        >
          {hasExistingSession ? "You have an existing session." : "Start a new session to get going."}
        </Typography>
        <Stack spacing={1} sx={{ width: "100%", maxWidth: 180 }}>
          <Button
            sx={btnSx}
            disabled={!hasExistingSession}
            onClick={() => {
              setView("todos");
              emit("session-action", { action: "continue" });
            }}
          >
            Continue Session
          </Button>
          <Button
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
          </Button>
          <Button
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
          </Button>
        </Stack>
      </Box>
    </Layout>
  );
}
