import { Box, Tooltip, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useUIStore } from "../stores";
import { ANCHOR_POSITIONS, ANCHOR_LABELS, ANCHOR_NAMES } from "../constants";
import type { AnchorPosition } from "../types";

export default function AnchorView() {
    const { tc, ui } = useTheme().custom;
    const { anchorPos, selectAnchor, setView } = useUIStore();

    const handleSelect = (pos: AnchorPosition) => {
        selectAnchor(pos);
        setView("todos");
    };

    return (
        <Box
            sx={{
                flex: 1,
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                m: "4px",
                bgcolor: "rgba(0,0,0,0.04)",
                borderRadius: 2,
            }}
        >
            <Typography sx={{ fontSize: ui.fontSize.sm, color: tc(0.4), mb: "12px" }}>
                Anchor Position
            </Typography>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "4px",
                }}
            >
                {ANCHOR_POSITIONS.map((pos) => (
                    <Tooltip key={pos} title={ANCHOR_NAMES[pos]} arrow>
                        <Box
                            component="button"
                            onClick={() => handleSelect(pos)}
                            sx={{
                                width: 48,
                                height: 36,
                                border: "none",
                                bgcolor: pos === anchorPos ? tc(0.1) : "transparent",
                                borderRadius: 1,
                                color: tc(pos === anchorPos ? 0.9 : 0.35),
                                fontSize: 20,
                                fontFamily: "inherit",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                p: 0,
                                "&:hover": { color: tc(0.7), bgcolor: tc(0.06) },
                            }}
                        >
                            {ANCHOR_LABELS[pos]}
                        </Box>
                    </Tooltip>
                ))}
            </Box>
        </Box>
    );
}
