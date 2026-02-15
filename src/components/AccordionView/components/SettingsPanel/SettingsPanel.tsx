import { useState } from "react";
import { Tabs, Tab } from "@mui/material";
import { ThemesTab } from "./components/ThemesTab";
import { PermissionsTab } from "./components/PermissionsTab";
import { TimerTab } from "./components/TimerTab";
import { useUIStore } from "../../../../stores";

export default function SettingsPanel() {
    const settingsTab = useUIStore((s) => s.settingsTab);
    const setSettingsTab = useUIStore((s) => s.setSettingsTab);
    const [confirmClear, setConfirmClear] = useState(false);

    return (
        <>
            <Tabs
                value={settingsTab}
                onChange={(_, v) => setSettingsTab(v)}
                sx={{ mb: "10px" }}
            >
                {["Themes", "Permissions", "Timer"].map((label) => (
                    <Tab
                        key={label}
                        label={label}
                        sx={{
                            minWidth: "unset",
                            px: "10px",
                            "&.Mui-selected": {
                                backgroundColor: "rgba(0,0,0,0.04)",
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
