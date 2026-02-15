export interface ChangelogEntry {
    version: string;
    date: string;
    changes: { category: string; items: string[] }[];
}

export const changelog: ChangelogEntry[] = [
    {
        version: "0.3.0",
        date: "2026-02-14",
        changes: [
            {
                category: "UI Redesign",
                items: [
                    "Focus theme: dense monospace UI with sharp edges",
                    "Replaced accordion layout with fixed three-panel view (queue, timer, desktops)",
                    "Subtle panel backgrounds instead of horizontal dividers",
                    "Square corners throughout via global MUI theme",
                    "Unified header nav across all views",
                    "Draggable header bar for window repositioning",
                ],
            },
            {
                category: "Changed",
                items: [
                    "Desktop labels now show the first active todo instead of a separate title",
                    "Desktop bar shows only current monitor",
                    "Merged What's New and About into a single Info page",
                    "Setup view restyled to match the rest of the app",
                    "Hidden macOS title bar traffic lights",
                ],
            },
            {
                category: "Removed",
                items: [
                    "Removed 'What is this screen about' input field",
                    "Removed color cycle button from theme settings",
                ],
            },
        ],
    },
    {
        version: "0.2.2",
        date: "2026-02-14",
        changes: [
            {
                category: "Added",
                items: [
                    "Testing version bumps.",
                ],
            },
        ],
    },
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
