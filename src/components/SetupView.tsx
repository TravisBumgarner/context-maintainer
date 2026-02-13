import { Box, Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import Layout from "./Layout";

interface SetupViewProps {
  accessibilityGranted: boolean | null;
  setAccessibilityGranted: (v: boolean) => void;
  onComplete: () => void;
}

export default function SetupView({
  accessibilityGranted,
  setAccessibilityGranted,
  onComplete,
}: SetupViewProps) {
  const theme = useTheme();
  const tc = theme.custom.tc;

  return (
    <Layout>
      <Box sx={{ p: "16px 14px", overflowY: "auto" }}>
        <Typography
          sx={{ fontSize: 14, fontWeight: 700, color: tc(0.55), mb: 1 }}
        >
          Context Maintainer
        </Typography>
        <Typography
          sx={{ fontSize: 11, color: tc(0.5), mb: "10px", lineHeight: 1.4 }}
        >
          Per-desktop task lists for macOS. Two permissions are needed:
        </Typography>

        <Box sx={{ fontSize: 11, color: tc(0.5), mb: 1, lineHeight: 1.4 }}>
          <Typography
            component="strong"
            sx={{ fontWeight: 700, color: tc(0.65), fontSize: "inherit" }}
          >
            1. Accessibility
          </Typography>
          {accessibilityGranted ? (
            <Typography
              component="span"
              sx={{ color: "#4caf50", fontSize: 10, fontWeight: 600, ml: 0.5 }}
            >
              Granted
            </Typography>
          ) : (
            <>
              <br />
              <Typography component="span" sx={{ fontSize: "inherit" }}>
                Required for desktop switching.
              </Typography>
              <br />
              <Button
                size="small"
                onClick={() => {
                  invoke<boolean>("request_accessibility")
                    .then(setAccessibilityGranted)
                    .catch(() => {});
                }}
                sx={{
                  mt: 0.5,
                  px: "10px",
                  py: "3px",
                  fontSize: 10,
                  color: theme.custom.tcInv(),
                  bgcolor: tc(0.45),
                  borderRadius: "10px",
                  "&:hover": { bgcolor: tc(0.6) },
                }}
              >
                Grant Access
              </Button>
            </>
          )}
        </Box>

        <Box sx={{ fontSize: 11, color: tc(0.5), mb: 1, lineHeight: 1.4 }}>
          <Typography
            component="strong"
            sx={{ fontWeight: 700, color: tc(0.65), fontSize: "inherit" }}
          >
            2. Keyboard Shortcuts
          </Typography>
          <br />
          System Settings &gt; Keyboard &gt; Keyboard Shortcuts &gt; Mission
          Control — enable "Switch to Desktop N" for each desktop.
        </Box>

        <Button
          onClick={() => {
            invoke("complete_setup")
              .then(onComplete)
              .catch(() => {});
          }}
          sx={{
            mt: 1,
            px: "14px",
            py: "5px",
            color: theme.custom.tcInv(),
            bgcolor: tc(0.55),
            borderRadius: "12px",
            "&:hover": { bgcolor: tc(0.7) },
          }}
        >
          Get Started
        </Button>
      </Box>
    </Layout>
  );
}
