import { Box, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { changelog } from "../../../../../changelog";

export function WhatsNewTab() {
    const tc = useTheme().custom.tc;
    const latest = changelog[0];

    if (!latest) return null;

    return (
        <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: tc(0.7), mb: "2px" }}>
                v{latest.version}
            </Typography>
            <Typography sx={{ fontSize: 11, color: tc(0.35), mb: "10px" }}>
                {latest.date}
            </Typography>

            {latest.changes.map((group) => (
                <Box key={group.category} sx={{ mb: "10px" }}>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: tc(0.5), mb: "4px" }}>
                        {group.category}
                    </Typography>
                    {group.items.map((item, i) => (
                        <Typography
                            key={i}
                            sx={{ fontSize: 12, color: tc(0.6), pl: "8px", mb: "2px" }}
                        >
                            &bull; {item}
                        </Typography>
                    ))}
                </Box>
            ))}
        </Box>
    );
}
