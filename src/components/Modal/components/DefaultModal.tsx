import { Box, Modal as MUIModal, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { SxProps } from "@mui/material/styles";
import { useCallback } from "react";
import { useUIStore } from "../../../stores";
import { AppIconButton } from "../../shared";

interface DefaultModalProps {
  children: React.ReactNode;
  closeCallback?: () => void;
  sx?: SxProps;
  title: string;
}

export default function DefaultModal({ children, closeCallback, sx, title }: DefaultModalProps) {
  const { tc, bg } = useTheme().custom;
  const activeModal = useUIStore((s) => s.activeModal);
  const closeModal = useUIStore((s) => s.closeModal);

  const handleClose = useCallback(() => {
    if (closeCallback) closeCallback();
    closeModal();
  }, [closeCallback, closeModal]);

  return (
    <MUIModal
      open={activeModal !== null}
      onClose={handleClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(4px)",
        p: "8px",
      }}
    >
      <Box
        sx={{
          width: "100%",
          height: "100%",
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
          bgcolor: bg,
          border: `1px solid ${tc(0.2)}`,
          borderRadius: "8px",
          p: "8px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.08)",
          "&:focus-visible": { outline: "none" },
          ...sx,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pb: "6px",
            mb: "6px",
          }}
        >
          <Typography variant="h6">
            {title}
          </Typography>
          <AppIconButton icon="close" onClick={handleClose} sx={{ fontSize: 14 }} />
        </Box>
        {children}
      </Box>
    </MUIModal>
  );
}
