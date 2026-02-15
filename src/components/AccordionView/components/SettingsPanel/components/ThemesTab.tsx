import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { THEMES } from "../../../../../constants";
import { useDesktopStore, useSettingsStore } from "../../../../../stores";

export function ThemesTab() {
    const theme = useTheme();
    const { tc, ui } = theme.custom;
    const [expandedTheme, setExpandedTheme] = useState<string | null>(null);
    const [colorIndex, setColorIndex] = useState(0);

    const { desktop, setDesktop } = useDesktopStore();
    const { desktopCount, refreshSpaces } = useSettingsStore();

    const handleApplyTheme = (colors: string[]) => {
        const padded = Array.from({ length: desktopCount }, (_, i) => colors[i % colors.length]);
        invoke("apply_theme", { colors: padded })
            .then(() => {
                refreshSpaces();
                const newColor = padded[desktop.position] ?? padded[0];
                setDesktop((prev) => ({ ...prev, color: newColor }));
            })
            .catch(() => { });
    };

    const selectedTheme = expandedTheme ? THEMES.find((t) => t.name === expandedTheme) : null;

    return (
        <>
            <Box sx={{ mb: "12px" }}>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: "3px",
                    }}
                >
                    {THEMES.map((t) => (
                        <Box
                            key={t.name}
                            component="button"
                            onClick={() => {
                                setExpandedTheme(t.name);
                                setColorIndex(0);
                            }}
                            title={t.name}
                            sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "3px",
                                p: "5px 4px",
                                border: `1px solid ${tc(0.1)}`,

                                bgcolor: expandedTheme === t.name ? tc(0.15) : tc(0.03),
                                cursor: "pointer",
                                fontFamily: "inherit",
                                "&:hover": { bgcolor: tc(0.08) },
                            }}
                        >
                            <Box sx={{ display: "flex", gap: "2px" }}>
                                {t.colors.slice(0, 5).map((c, i) => (
                                    <Box
                                        key={i}
                                        sx={{
                                            width: 14,
                                            height: 14,
            
                                            border: `1px solid ${tc(0.12)}`,
                                            bgcolor: c,
                                        }}
                                    />
                                ))}
                            </Box>
                            <Typography sx={{ fontSize: ui.fontSize.xs, color: tc(0.5), fontWeight: ui.weights.semibold }}>
                                {t.name}
                            </Typography>
                        </Box>
                    ))}
                </Box>
            </Box>

            {selectedTheme && (
                <Box sx={{ mb: "12px" }}>
                    <Box sx={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
                        {selectedTheme.colors.map((c, i) => (
                            <Box
                                key={i}
                                sx={{
                                    width: 20,
                                    height: 20,
    
                                    border: i === colorIndex ? `2px solid ${tc(0.5)}` : `1px solid ${tc(0.12)}`,
                                    bgcolor: c,
                                    cursor: "pointer",
                                    transition: "border 0.2s",
                                }}
                                onClick={() => {
                                    setColorIndex(i);
                                    const newColors = selectedTheme.colors.slice(i).concat(selectedTheme.colors.slice(0, i));
                                    handleApplyTheme(newColors);
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            )}
        </>
    );
}
