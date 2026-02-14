import { Box, IconButton, Typography, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SettingsPanel from "./AccordionView/components/SettingsPanel";
import { useUIStore } from "../stores";

export default function SettingsView() {
    const tc = useTheme().custom.tc;
    const setView = useUIStore((s) => s.setView);
    const showWhatsNew = useUIStore((s) => s.showWhatsNew);
    const setShowWhatsNew = useUIStore((s) => s.setShowWhatsNew);

    const handleBack = () => {
        setShowWhatsNew(false);
        setView("todos");
    };

    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                backgroundColor: tc(0.05),
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    px: "10px",
                    py: "6px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexShrink: 0,
                }}
            >
                <IconButton
                    onClick={handleBack}
                    title="Back"
                    sx={{
                        p: "4px",
                        lineHeight: 1,
                        fontSize: 20,
                        color: tc(0.3),
                        "&:hover": { color: tc(0.6) },
                    }}
                >
                    ←
                </IconButton>
                <Typography
                    sx={{
                        fontSize: 18,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        color: tc(0.45),
                    }}
                >
                    Settings
                </Typography>
            </Box>

            <Divider />

            {/* Content */}
            <Box
                sx={{
                    flex: 1,
                    overflow: "auto",
                    px: "10px",
                    py: "12px",
                }}
            >
                <SettingsPanel initialTab={showWhatsNew ? 3 : 0} />
            </Box>
        </Box>
    );
}
