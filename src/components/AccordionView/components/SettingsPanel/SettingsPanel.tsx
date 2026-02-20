import { Tabs, Tab } from "@mui/material";
import { ThemesTab } from "./components/ThemesTab";
import { PermissionsTab } from "./components/PermissionsTab";
import { GeneralTab } from "./components/GeneralTab";
import { useUIStore } from "../../../../stores";
import { BG_OVERLAY_LIGHT } from "../../../../theme";

export default function SettingsPanel() {
    const settingsTab = useUIStore((s) => s.settingsTab);
    const setSettingsTab = useUIStore((s) => s.setSettingsTab);

    return (
        <>
            <Tabs
                value={settingsTab}
                onChange={(_, v) => setSettingsTab(v)}
                sx={{ mb: "4px", bgcolor: BG_OVERLAY_LIGHT, borderTopRightRadius: '8px' }}
            >
                {["General", "Themes", "Permissions"].map((label) => (
                    <Tab
                        key={label}
                        label={label}
                        sx={{
                            minWidth: "unset",
                            px: "10px",
                        }}
                    />
                ))}
            </Tabs>

            {settingsTab === 0 && <GeneralTab />}

            {settingsTab === 1 && <ThemesTab />}

            {settingsTab === 2 && <PermissionsTab />}
        </>
    );
}
