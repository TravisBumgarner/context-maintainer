import { useState, useCallback, useEffect, useMemo } from "react";
import { Box, Button, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useUIStore } from "../../../stores";
import DefaultModal from "./DefaultModal";

const MAX_CHARS = 800;

export default function FeedbackModal() {
  const { tc, ui } = useTheme().custom;
  const closeModal = useUIStore((s) => s.closeModal);
  const [success, setSuccess] = useState(false);
  const [failure, setFailure] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", message: "", website: "context-maintainer" });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (e.target.name === "message" && e.target.value.length > MAX_CHARS) return;
      setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }, []
  );

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("https://contact-form.nfshost.com/contact", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        setSuccess(true);
        setFormData((prev) => ({ ...prev, name: "", email: "", message: "" }));
      } else {
        setFailure(true);
      }
    } catch {
      setFailure(true);
    }
    setIsSubmitting(false);
  }, [formData]);

  const buttonMessage = useMemo(() => {
    if (isSubmitting) return "Sending...";
    if (success) return "Sent!";
    if (failure) return "Failed to send";
    return "Send";
  }, [isSubmitting, success, failure]);

  useEffect(() => {
    if (success || failure) {
      const id = setTimeout(() => { setSuccess(false); setFailure(false); }, 5000);
      return () => clearTimeout(id);
    }
  }, [success, failure]);

  const inputSx = {
    width: "100%",
    fontSize: ui.fontSize.sm,
    fontFamily: "inherit",
    color: tc(0.7),
    bgcolor: "transparent",
    border: "none",
    borderBottom: `1px solid ${tc(0.15)}`,
    p: "3px 0",
    outline: "none",
    "&::placeholder": { color: tc(0.3) },
    "&:focus": { borderColor: tc(0.3) },
  } as const;

  return (
    <DefaultModal title="Send Feedback" closeCallback={isSubmitting ? undefined : undefined}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: "6px", overflow: "visible" }}>
        <Box component="input" type="text" name="name" placeholder="Name (optional)" value={formData.name} onChange={handleChange} sx={inputSx} />
        <Box component="input" type="email" name="email" placeholder="Email (optional)" value={formData.email} onChange={handleChange} sx={inputSx} />
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Typography sx={{ fontSize: ui.fontSize.xs, color: tc(0.3) }}>
            {formData.message.length}/{MAX_CHARS}
          </Typography>
        </Box>
        <Box
          component="textarea"
          name="message"
          placeholder="Message"
          value={formData.message}
          onChange={handleChange}
          rows={4}
          sx={{
            width: "100%",
            fontSize: ui.fontSize.sm,
            fontFamily: "inherit",
            color: tc(0.7),
            bgcolor: "transparent",
            resize: "none",
            border: `1px solid ${tc(0.15)}`,
            borderRadius: 0,
            p: "4px",
            outline: "none",
            boxSizing: "border-box",
            "&::placeholder": { color: tc(0.3) },
            "&:focus": { borderColor: tc(0.3) },
          }}
        />
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || formData.message.length === 0}
            sx={{
              px: "12px", py: "4px",
              color: tc(0.7), fontWeight: ui.weights.bold,
              "&:hover": { bgcolor: "rgba(0,0,0,0.06)" },
              "&:disabled": { color: tc(0.3) },
            }}
          >
            {buttonMessage}
          </Button>
        </Box>
      </Box>
    </DefaultModal>
  );
}
