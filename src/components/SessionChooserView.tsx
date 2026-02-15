import { Box, Button, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import Layout from "./AccordionView/components/Layout";
import { useUIStore, useTodoStore, useDesktopStore, useSettingsStore } from "../stores";
import type { SpaceInfo, ContextHistory } from "../types";

export default function SessionChooserView() {
  const theme = useTheme();
  const tc = theme.custom.tc;

  const { setView } = useUIStore();
  const { setTodos, setTitle } = useTodoStore();
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
          You have an existing session.
        </Typography>
        <Stack spacing={1} sx={{ width: "100%", maxWidth: 180 }}>
          <Button sx={btnSx} onClick={() => setView("todos")}>
            Continue Session
          </Button>
          <Button
            sx={btnSx}
            onClick={() => {
              invoke("start_new_session")
                .then(() => {
                  setTodos([]);
                  setTitle("");
                  setView("todos");
                })
                .catch(() => { });
            }}
          >
            New Session
          </Button>
          <Button
            sx={btnSx}
            onClick={() => {
              Promise.all([
                invoke<SpaceInfo[]>("list_all_spaces"),
                invoke<ContextHistory>("get_context_history"),
              ])
                .then(([spaces, history]) => {
                  setAllSpaces(spaces);
                  setContextHistory(history);
                  setView("history-picker");
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
