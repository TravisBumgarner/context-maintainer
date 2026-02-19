import { useState, useCallback, useEffect, useMemo } from "react";
import { Box, Button, Collapse, IconButton, Link, Modal, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { openUrl } from "@tauri-apps/plugin-opener";
import { changelog } from "../changelog";

const MAX_CHARS = 800;

function FeedbackModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { tc, bg, ui } = useTheme().custom;
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
        <Modal open={open} onClose={isSubmitting ? undefined : onClose}>
            <Box sx={{
                position: "absolute", inset: 0, margin: "auto",
                width: "90%", height: "fit-content",
                bgcolor: bg, border: `1px solid ${tc(0.2)}`, borderRadius: "8px",
                p: "8px", "&:focus-visible": { outline: "none" },
            }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: "6px" }}>
                    <Typography sx={{ fontSize: ui.fontSize.lg, fontWeight: ui.weights.bold, color: tc(0.6) }}>
                        Send Feedback
                    </Typography>
                    <IconButton onClick={onClose} size="small" sx={{ p: "2px", color: tc(0.4), "&:hover": { color: tc(0.6) } }}>
                        <Typography sx={{ fontSize: 11, lineHeight: 1 }}>✕</Typography>
                    </IconButton>
                </Box>

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
            </Box>
        </Modal>
    );
}

export default function InfoView() {
    const { tc, ui } = useTheme().custom;
    const [expanded, setExpanded] = useState<string | null>(changelog[0]?.version ?? null);
    const [feedbackOpen, setFeedbackOpen] = useState(false);

    return (
        <Box
            sx={{
                flex: 1,
                overflow: "auto",
                px: "10px",
                py: "12px",
                m: "4px",
                bgcolor: "rgba(0,0,0,0.04)",
                borderRadius: '0 10px 10px 0'
            }}
        >
            <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.4), mb: "4px" }}>
                Built by Travis Bumgarner (
                <Link
                    component="button"
                    onClick={() => openUrl("https://www.linkedin.com/in/travisbumgarner")}
                    sx={{ fontSize: "inherit", color: tc(0.4), "&:hover": { color: tc(0.6) }, verticalAlign: "baseline" }}
                >
                    hiring?
                </Link>
                )
            </Typography>
            <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.4), mb: "4px" }}>
                Open Source (
                <Link
                    component="button"
                    onClick={() => openUrl("https://github.com/TravisBumgarner/context-maintainer")}
                    sx={{ fontSize: "inherit", color: tc(0.4), "&:hover": { color: tc(0.6) }, verticalAlign: "baseline" }}
                >
                    GitHub
                </Link>
                )
            </Typography>
            <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.4), mb: "16px" }}>
                <Link
                    component="button"
                    onClick={() => setFeedbackOpen(true)}
                    sx={{ fontSize: "inherit", color: tc(0.4), "&:hover": { color: tc(0.6) }, verticalAlign: "baseline" }}
                >
                    Send Feedback
                </Link>
            </Typography>

            <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

            {changelog.map((entry) => {
                const isOpen = expanded === entry.version;
                return (
                    <Box key={entry.version} sx={{ mb: "2px" }}>
                        <Box
                            component="button"
                            onClick={() => setExpanded(isOpen ? null : entry.version)}
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                width: "100%",
                                p: "4px 0",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                fontFamily: "inherit",
                                textAlign: "left",
                            }}
                        >
                            <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.3) }}>
                                {isOpen ? "▾" : "▸"}
                            </Typography>
                            <Typography sx={{ fontSize: ui.fontSize.sm, fontWeight: ui.weights.semibold, color: tc(0.5) }}>
                                v{entry.version}
                            </Typography>
                            <Typography sx={{ fontSize: ui.fontSize.xs, color: tc(0.3) }}>
                                {entry.date}
                            </Typography>
                        </Box>
                        <Collapse in={isOpen}>
                            <Box sx={{ pl: "14px", pb: "6px" }}>
                                {entry.changes.map((group) => (
                                    <Box key={group.category} sx={{ mb: "6px" }}>
                                        <Typography sx={{ fontSize: ui.fontSize.md, fontWeight: ui.weights.semibold, color: tc(0.45), mb: "2px" }}>
                                            {group.category}
                                        </Typography>
                                        {group.items.map((item, i) => (
                                            <Typography
                                                key={i}
                                                sx={{ fontSize: ui.fontSize.md, color: tc(0.55), pl: "8px", mb: "1px" }}
                                            >
                                                &bull; {item}
                                            </Typography>
                                        ))}
                                    </Box>
                                ))}
                            </Box>
                        </Collapse>
                    </Box>
                );
            })}
        </Box>
    );
}
