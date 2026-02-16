import { Box } from "@mui/material";
import SettingsPanel from "./AccordionView/components/SettingsPanel";

export default function SettingsView() {
    return (
        <Box
            sx={{
                flex: 1,
                overflow: "auto",
                px: "10px",
                py: "12px",
                m: "4px",
                bgcolor: "rgba(0,0,0,0.04)",
                borderRadius: 2,
            }}
        >
            <SettingsPanel />
        </Box>
    );
}
