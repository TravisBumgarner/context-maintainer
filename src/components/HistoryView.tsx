import { useEffect, useState } from "react";
import { Box, Typography, Button } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { useHistoryStore } from "../stores";
import type { DesktopSummary } from "../types";

export default function HistoryView() {
  const { tc, ui } = useTheme().custom;
  const { items, loadHistory, clearHistory } = useHistoryStore();
  const [desktops, setDesktops] = useState<DesktopSummary[]>([]);

  useEffect(() => {
    loadHistory();
    invoke<DesktopSummary[]>("list_all_desktops").then(setDesktops).catch(() => { });
  }, [loadHistory]);

  const desktopMap = new Map(desktops.map((d) => [d.space_id, d]));

  // Group items by desktop_id
  const grouped = new Map<number, typeof items>();
  for (const item of items) {
    const list = grouped.get(item.desktop_id) ?? [];
    list.push(item);
    grouped.set(item.desktop_id, list);
  }

  return (
    <Box sx={{ flex: 1, overflow: "auto", px: "10px", py: "12px", m: "4px", bgcolor: "rgba(0,0,0,0.04)", borderRadius: '0 10px 10px 0', userSelect: "text" }}>
      {items.length === 0 ? (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.35), textAlign: "center" }}>
            No completed tasks yet
          </Typography>
        </Box>
      ) : (
        <>
          {Array.from(grouped.entries()).map(([desktopId, groupItems]) => {
            const desktop = desktopMap.get(desktopId);
            const name = desktop?.name ?? `Desktop ${desktop?.position ?? desktopId}`;

            return (
              <Box key={desktopId} sx={{ mb: "12px" }}>
                <Box sx={{ mb: "4px", pb: "2px", borderBottom: `1px solid ${tc(0.15)}` }}>
                  <Typography sx={{ fontSize: ui.fontSize.sm, fontWeight: ui.weights.semibold, color: tc(0.55) }}>
                    {name}
                  </Typography>
                </Box>
                {groupItems.map((item) => (
                  <Box
                    key={item.id}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      px: "14px",
                      py: "2px",
                    }}
                  >
                    <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.5), textDecoration: "line-through" }}>
                      {item.text}
                    </Typography>
                    <Typography sx={{ fontSize: ui.fontSize.xs, color: tc(0.25), flexShrink: 0, ml: "8px" }}>
                      {new Date(item.completed_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            );
          })}
          <Button
            onClick={clearHistory}
            size="small"
            sx={{
              mt: "8px",
              fontSize: ui.fontSize.xs,
              color: tc(0.35),
              textTransform: "none",
              "&:hover": { color: tc(0.6) },
            }}
          >
            Clear History
          </Button>
        </>
      )}
    </Box>
  );
}
