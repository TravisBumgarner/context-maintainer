import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { openUrl } from "@tauri-apps/plugin-opener";
import { changelog } from "../changelog";

const links = [
    { label: "GitHub", url: "https://github.com/TravisBumgarner/context-maintainer" },
    { label: "Portfolio", url: "https://travisbumgarner.dev" },
];

export default function InfoView() {
    const { tc, ui } = useTheme().custom;

    const latest = changelog[0];

    return (
        <Box
            sx={{
                flex: 1,
                overflow: "auto",
                px: "10px",
                py: "12px",
            }}
        >
            <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.5), mb: "4px" }}>
                Context Maintainer — per-desktop task lists for macOS.
            </Typography>
            <Typography
                component="span"
                onClick={() => openUrl("https://www.linkedin.com/in/travisbumgarner")}
                sx={{
                    fontSize: ui.fontSize.sm,
                    color: tc(0.4),
                    cursor: "pointer",
                    mb: "12px",
                    display: "block",
                    "&:hover": { color: tc(0.6) },
                }}
            >
                Built by Travis Bumgarner — open to new roles
            </Typography>

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

            {latest && (
                <>
                    <Typography sx={{ fontSize: ui.fontSize.xs, fontWeight: ui.weights.semibold, color: tc(0.4), mb: "6px", textTransform: "uppercase", letterSpacing: ui.letterSpacing.wide }}>
                        What's New — v{latest.version}
                    </Typography>
                    <Typography sx={{ fontSize: ui.fontSize.md, color: tc(0.35), mb: "10px" }}>
                        {latest.date}
                    </Typography>

                    {latest.changes.map((group) => (
                        <Box key={group.category} sx={{ mb: "10px" }}>
                            <Typography sx={{ fontSize: ui.fontSize.md, fontWeight: ui.weights.semibold, color: tc(0.5), mb: "4px" }}>
                                {group.category}
                            </Typography>
                            {group.items.map((item, i) => (
                                <Typography
                                    key={i}
                                    sx={{ fontSize: ui.fontSize.md, color: tc(0.6), pl: "8px", mb: "2px" }}
                                >
                                    &bull; {item}
                                </Typography>
                            ))}
                        </Box>
                    ))}
                </>
            )}
        </Box>
    );
}
