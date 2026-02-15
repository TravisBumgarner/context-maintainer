import { useState } from "react";
import { Box, Collapse, Link, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { openUrl } from "@tauri-apps/plugin-opener";
import { changelog } from "../changelog";

const links = [
    { label: "GitHub", url: "https://github.com/TravisBumgarner/context-maintainer" },
];

export default function InfoView() {
    const { tc, ui } = useTheme().custom;
    const [expanded, setExpanded] = useState<string | null>(changelog[0]?.version ?? null);

    return (
        <Box
            sx={{
                flex: 1,
                overflow: "auto",
                px: "10px",
                py: "12px",
            }}
        >
            <Link
                component="button"
                onClick={() => openUrl("https://www.linkedin.com/in/travisbumgarner")}
                sx={{
                    fontSize: ui.fontSize.sm,
                    color: tc(0.4),
                    mb: "12px",
                    display: "block",
                    "&:hover": { color: tc(0.6) },
                }}
            >
                Built by Travis Bumgarner — open to new roles
            </Link>

            <Box sx={{ display: "flex", flexDirection: "column", gap: "4px", mb: "16px" }}>
                {links.map((link) => (
                    <Box
                        key={link.label}
                        component="button"
                        onClick={() => openUrl(link.url)}
                        sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            p: "6px 8px",
                            border: `1px solid ${tc(0.1)}`,
                            bgcolor: "rgba(0,0,0,0.04)",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            textAlign: "left",
                            "&:hover": { bgcolor: tc(0.08) },
                        }}
                    >
                        <Typography sx={{ fontSize: ui.fontSize.sm, fontWeight: ui.weights.semibold, color: tc(0.6) }}>
                            {link.label}
                        </Typography>
                        <Typography sx={{ fontSize: ui.fontSize.xs, color: tc(0.35) }}>
                            {link.url.replace("https://", "")}
                        </Typography>
                    </Box>
                ))}
            </Box>

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
