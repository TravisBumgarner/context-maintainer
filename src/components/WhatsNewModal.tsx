import { Box, Typography, Button, Modal } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { changelog } from "../changelog";
import { useUIStore } from "../stores";

export default function WhatsNewModal() {
  const { tc, bg, ui } = useTheme().custom;
  const showWhatsNew = useUIStore((s) => s.showWhatsNew);
  const setShowWhatsNew = useUIStore((s) => s.setShowWhatsNew);

  const latest = changelog[0];
  if (!latest || !showWhatsNew) return null;

  return (
    <Modal open onClose={() => setShowWhatsNew(false)}>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          margin: "auto",
          height: "fit-content",
          width: "85%",
          maxHeight: "70%",
          overflow: "auto",
          bgcolor: bg,
          border: `1px solid ${tc(0.2)}`,
          p: "12px",
          "&:focus-visible": { outline: "none" },
        }}
      >
        <Typography
          sx={{
            fontSize: ui.fontSize.lg,
            fontWeight: ui.weights.bold,
            color: tc(0.6),
            mb: "8px",
          }}
        >
          What's New — v{latest.version}
        </Typography>

        {latest.changes.map((group) => (
          <Box key={group.category} sx={{ mb: "8px" }}>
            <Typography
              sx={{
                fontSize: ui.fontSize.sm,
                fontWeight: ui.weights.semibold,
                color: tc(0.45),
                mb: "2px",
              }}
            >
              {group.category}
            </Typography>
            {group.items.map((item, i) => (
              <Typography
                key={i}
                sx={{
                  fontSize: ui.fontSize.sm,
                  color: tc(0.4),
                  pl: "8px",
                  lineHeight: 1.5,
                  "&::before": { content: '"· "' },
                }}
              >
                {item}
              </Typography>
            ))}
          </Box>
        ))}

        <Button
          variant="contained"
          size="small"
          onClick={() => setShowWhatsNew(false)}
          sx={{ mt: "4px" }}
        >
          Got it
        </Button>
      </Box>
    </Modal>
  );
}
