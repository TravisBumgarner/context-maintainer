import { Box, Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import Layout from "./AccordionView/components/Layout";
import { formatRelativeTime } from "../utils";
import type { SpaceInfo, ContextHistory } from "../types";

interface HistoryPickerViewProps {
  allSpaces: SpaceInfo[];
  contextHistory: ContextHistory;
  setContextHistory: (h: ContextHistory) => void;
  onBack: () => void;
  onDone: () => void;
}

export default function HistoryPickerView({
  allSpaces,
  contextHistory,
  setContextHistory,
  onBack,
  onDone,
}: HistoryPickerViewProps) {
  const theme = useTheme();
  const tc = theme.custom.tc;

  const hasHistory = Object.values(contextHistory).some((h) => h.length > 0);

  return (
    <Layout>
      <Box sx={{ p: "10px 14px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column" }}>
        <Button
          onClick={onBack}
          sx={{
            color: tc(0.4),
            p: "2px 0",
            mb: "6px",
            justifyContent: "flex-start",
            "&:hover": { color: tc(0.65) },
          }}
        >
          &larr; Back
        </Button>

        <Typography sx={{ fontSize: 13, fontWeight: 700, color: tc(0.55), mb: "10px" }}>
          Saved Contexts
        </Typography>

        {!hasHistory && (
          <Typography sx={{ fontSize: 10, color: tc(0.25), px: "6px" }}>
            No saved history yet.
          </Typography>
        )}

        <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
          {allSpaces.map((space) => {
            const entries = contextHistory[space.space_id];
            if (!entries || entries.length === 0) return null;
            return (
              <Box key={space.space_id} sx={{ mb: "10px" }}>
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: tc(0.4),
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    mb: "4px",
                  }}
                >
                  {space.title || space.name}
                </Typography>
                {[...entries].reverse().map((ctx, revIdx) => {
                  const originalIdx = entries.length - 1 - revIdx;
                  const todoCount = ctx.todos.filter((t) => !t.done).length;
                  const date = new Date(ctx.saved_at);
                  const relative = formatRelativeTime(date);
                  return (
                    <Box
                      key={originalIdx}
                      component="button"
                      onClick={() => {
                        invoke<boolean>("restore_context", {
                          desktop: space.space_id,
                          index: originalIdx,
                        })
                          .then((ok) => {
                            if (ok) {
                              invoke<ContextHistory>("get_context_history")
                                .then(setContextHistory)
                                .catch(() => { });
                            }
                          })
                          .catch(() => { });
                      }}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        p: "6px 8px",
                        mb: "3px",
                        border: `1px solid ${tc(0.1)}`,
                        borderRadius: "6px",
                        bgcolor: tc(0.03),
                        cursor: "pointer",
                        fontFamily: "inherit",
                        textAlign: "left",
                        "&:hover": { bgcolor: tc(0.08) },
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: tc(0.65),
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {ctx.title || "Untitled"}
                      </Typography>
                      <Typography sx={{ fontSize: 9, color: tc(0.35), mt: "1px" }}>
                        {todoCount} task{todoCount !== 1 ? "s" : ""} &middot; {relative}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            );
          })}
        </Box>

        <Box
          sx={{
            flexShrink: 0,
            pt: 1,
            borderTop: `1px solid ${tc(0.08)}`,
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button
            onClick={onDone}
            sx={{
              display: "block",
              width: "100%",
              maxWidth: 180,
              px: "14px",
              py: "7px",
              color: theme.custom.tcInv(),
              bgcolor: tc(0.45),
              borderRadius: "12px",
              textAlign: "center",
              "&:hover": { bgcolor: tc(0.6) },
            }}
          >
            Done
          </Button>
        </Box>
      </Box>
    </Layout>
  );
}
