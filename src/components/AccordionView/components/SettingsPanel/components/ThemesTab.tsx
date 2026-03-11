import { useState } from "react";
import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { invoke } from "@tauri-apps/api/core";
import { THEMES } from "../../../../../constants";
import { useDesktopStore, useSettingsStore } from "../../../../../stores";

export function ThemesTab() {
    const theme = useTheme();
    const { tc } = theme.custom;
    const [activeTheme, setActiveTheme] = useState<string | null>(null);

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

    return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: "2px", overflow: "auto" }}>
            {THEMES.map((t) => (
                <Box
                    key={t.name}
                    component="button"
                    onClick={() => {
                        setActiveTheme(t.name);
                        handleApplyTheme(t.colors);
                    }}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        p: "4px 6px",
                        border: `1px solid ${tc(0.1)}`,
                        bgcolor: activeTheme === t.name ? tc(0.15) : tc(0.03),
                        cursor: "pointer",
                        fontFamily: "inherit",
                        width: "100%",
                        "&:hover": { bgcolor: tc(0.08) },
                    }}
                >
                    <Box sx={{ display: "flex", gap: "2px", flexWrap: "wrap", flex: 1, minWidth: 0 }}>
                        {t.colors.map((c, i) => (
                            <Box
                                key={i}
                                sx={{
                                    width: 12,
                                    height: 12,
                                    border: `1px solid ${tc(0.12)}`,
                                    bgcolor: c,
                                }}
                            />
                        ))}
                    </Box>
                    <Typography variant="subtitle2" sx={{ whiteSpace: "nowrap" }}>
                        {t.name}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
}
