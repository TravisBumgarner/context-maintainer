import { Box, Typography, Button, IconButton, Modal } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { changelog } from "../changelog";
import { useUIStore } from "../stores";

export default function WhatsNewModal() {
  const { tc, bg, ui } = useTheme().custom;
  const showWhatsNew = useUIStore((s) => s.showWhatsNew);
  const setShowWhatsNew = useUIStore((s) => s.setShowWhatsNew);

  const latest = changelog[0];
  if (!latest || !showWhatsNew) return null;

  const close = () => setShowWhatsNew(false);

  return (
    <Modal open onClose={close}>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          margin: "auto",
          height: "fit-content",
          width: "90%",
          maxHeight: "70%",
          overflow: "auto",
          bgcolor: bg,
          border: `1px solid ${tc(0.2)}`,
          borderRadius: "8px",
          p: "8px",
          "&:focus-visible": { outline: "none" },
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "6px" }}>
          <Typography
            sx={{
              fontSize: ui.fontSize.lg,
              fontWeight: ui.weights.bold,
              color: tc(0.6),
            }}
          >
            What's New — v{latest.version}
          </Typography>
          <IconButton
            onClick={close}
            size="small"
            sx={{ p: "2px", color: tc(0.4), "&:hover": { color: tc(0.6) } }}
          >
            <Typography sx={{ fontSize: 11, lineHeight: 1 }}>✕</Typography>
          </IconButton>
        </Box>

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

        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            onClick={close}
            sx={{
              px: "12px",
              py: "4px",
              color: tc(0.7),
              fontWeight: ui.weights.bold,
              "&:hover": { bgcolor: "rgba(0,0,0,0.06)" },
            }}
          >
            Got it
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
