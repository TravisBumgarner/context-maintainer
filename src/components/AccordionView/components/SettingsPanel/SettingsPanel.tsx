import { useState } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { ThemesTab } from "./components/ThemesTab";
import { PermissionsTab } from "./components/PermissionsTab";
import { TimerTab } from "./components/TimerTab";

export default function SettingsPanel() {
    const theme = useTheme();
    const tc = theme.custom.tc;

    const [settingsTab, setSettingsTab] = useState(0);
    const [confirmClear, setConfirmClear] = useState(false);

    return (
        <>
            <Tabs
                value={settingsTab}
                onChange={(_, v) => setSettingsTab(v)}
                sx={{ mb: "10px", borderBottom: `1px solid ${tc(0.12)}` }}
            >
                {["Themes", "Permissions", "Timer"].map((label) => (
                    <Tab
                        key={label}
                        label={label}
                        sx={{
                            flexGrow: 0,
                            px: "10px",
                            borderRadius: "8px 8px 0 0",
                            "&.Mui-selected": {
                                flexGrow: 1,
                                backgroundColor: tc(0.08),
                            },
                        }}
                    />
                ))}
            </Tabs>

            {settingsTab === 0 && <ThemesTab />}

            {settingsTab === 1 && (
                <PermissionsTab confirmClear={confirmClear} setConfirmClear={setConfirmClear} />
            )}

            {settingsTab === 2 && <TimerTab />}
        </>
    );
}
