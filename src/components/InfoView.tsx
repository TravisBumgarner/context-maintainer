import { useState } from "react";
import { Box, Collapse, Link, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { openUrl } from "@tauri-apps/plugin-opener";
import { changelog } from "../changelog";

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
            <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.4), mb: "16px" }}>
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
