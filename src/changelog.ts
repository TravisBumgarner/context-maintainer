export interface ChangelogEntry {
    version: string;
    date: string;
    changes: { category: string; items: string[] }[];
}

export const changelog: ChangelogEntry[] = [
    {
        version: "0.1.0",
        date: "2025-01-01",
        changes: [
            {
                category: "Added",
                items: [
                    "Per-desktop todo lists that automatically switch with macOS virtual desktops",
                    "Automatic desktop detection via macOS CoreGraphics APIs",
                    "Custom titles and color themes per desktop",
                    "Drag-and-drop task reordering",
                    "Window anchoring to 9 screen positions",
                    "Collapsible window mode",
                    "Multi-monitor support",
                    "Desktop overview with task counts",
                    "10 built-in color palettes",
                ],
            },
        ],
    },
];
