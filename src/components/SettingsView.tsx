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
            }}
        >
            <SettingsPanel />
        </Box>
    );
}
