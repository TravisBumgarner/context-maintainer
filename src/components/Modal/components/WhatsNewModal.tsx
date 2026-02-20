import { Box, Typography } from "@mui/material";
import { changelog } from "../../../changelog";
import { useUIStore } from "../../../stores";
import DefaultModal from "./DefaultModal";
import { AppButton } from "../../shared";

export default function WhatsNewModal() {
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
          <Typography variant="subtitle2" sx={{ mb: "2px" }}>
            {group.category}
          </Typography>
          {group.items.map((item, i) => (
            <Typography
              key={i}
              variant="body2"
              sx={{ pl: "8px", lineHeight: 1.5, "&::before": { content: '"· "' } }}
            >
              {item}
            </Typography>
          ))}
        </Box>
      ))}

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <AppButton onClick={closeModal} variant="primary">
          Got it
        </AppButton>
      </Box>
    </DefaultModal>
  );
}
