import { Box, Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { changelog } from "../../../changelog";
import { useUIStore } from "../../../stores";
import DefaultModal from "./DefaultModal";

export default function WhatsNewModal() {
  const { tc, ui } = useTheme().custom;
  const closeModal = useUIStore((s) => s.closeModal);
  const latest = changelog[0];
  if (!latest) return null;

  return (
    <DefaultModal
      title={`What's New — v${latest.version}`}
      sx={{ maxHeight: "70%", overflow: "auto", "&::-webkit-scrollbar": { display: "none" } }}
    >
      {latest.changes.map((group) => (
        <Box key={group.category} sx={{ mb: "8px" }}>
          <Typography sx={{ fontSize: ui.fontSize.sm, fontWeight: ui.weights.semibold, color: tc(0.45), mb: "2px" }}>
            {group.category}
          </Typography>
          {group.items.map((item, i) => (
            <Typography
              key={i}
              sx={{ fontSize: ui.fontSize.sm, color: tc(0.4), pl: "8px", lineHeight: 1.5, "&::before": { content: '"· "' } }}
            >
              {item}
            </Typography>
          ))}
        </Box>
      ))}

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          onClick={closeModal}
          sx={{ px: "12px", py: "4px", color: tc(0.7), fontWeight: ui.weights.bold, "&:hover": { bgcolor: "rgba(0,0,0,0.06)" } }}
        >
          Got it
        </Button>
      </Box>
    </DefaultModal>
  );
}
