import { Box } from "@mui/material";
import SettingsPanel from "./AccordionView/components/SettingsPanel";

export default function SettingsView() {
    return (
        <Box
            sx={{
                flex: 1,
                overflow: "auto",
                m: "4px",
            }}
        >
            <SettingsPanel />
        </Box>
    );
}
