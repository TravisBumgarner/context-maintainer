export interface ChangelogEntry {
    version: string;
    date: string;
    changes: { category: string; items: string[] }[];
}

export const changelog: ChangelogEntry[] = [
    {
        version: "0.10.0",
        date: "2026-02-19",
        changes: [
            {
                category: "Added",
                items: [
                    "Auto-hide window after desktop switch (configurable delay in Settings > General)",
                    "Pause/resume countdown when auto-hide is active",
                    "New window button (+) on common apps to open a fresh instance",
                    "Dynamic window height based on visible panels",
                ],
            },
            {
                category: "Fixed",
                items: [
                    "Disabled double-click window zoom on macOS",
                    "Full-height window for session chooser, settings, history, and about views",
                    "Dynamic bottom border radius on last visible panel",
                ],
            },
        ],
    },
    {
        version: "0.9.3",
        date: "2026-02-19",
        changes: [
            {
                category: "Added",
                items: [],
            },
        ],
    },
    {
        version: "0.9.2",
        date: "2026-02-18",
        changes: [
            {
                category: "Added",
                items: [],
            },
        ],
    },
    {
        version: "0.9.0",
        date: "2026-02-18",
        changes: [
            {
                category: "Added",
                items: ["Quick access to open common apps"],
            },
        ],
    },
    {
        version: "0.8.0",
        date: "2026-02-18",
        changes: [
            {
                category: "Added",
                items: [
                    "Full-screen app spaces now appear in the desktop strip",
                    "Notification permission request in setup flow",
                ],
            },
        ],
    },
    {
        version: "0.7.0",
        date: "2026-02-17",
        changes: [
            {
                category: "Improved",
                items: [
                    "UI Improvements",
                    "Tray menu items toggle between Hide and Show",
                ],
            },
        ],
    },
    {
        version: "0.6.1",
        date: "2026-02-16",
        changes: [
            {
                category: "Added",
                items: [
                    "General settings tab with panel visibility toggles",
                    "Anchor position page replaces popover",
                ],
            },
            {
                category: "Improved",
                items: [
                    "Consistent panel backgrounds across all views",
                    "Window snaps flush to monitor edges",
                    "Active desktop centers reliably on switch",
                ],
            },
        ],
    },
    {
        version: "0.6.0",
        date: "2026-02-16",
        changes: [
            {
                category: "Improved",
                items: [
                    "Instant desktop switching with lower CPU usage",
                ],
            },
        ],
    },
    {
        version: "0.5.0",
        date: "2026-02-15",
        changes: [
            {
                category: "Added",
                items: [
                    "Task history — completed tasks saved and grouped by desktop",
                    "Auto-updates",
                ],
            },
        ],
    },
    {
        version: "0.3.0",
        date: "2026-02-14",
        changes: [
            {
                category: "Redesign",
                items: [
                    "New compact three-panel layout (queue, timer, desktops)",
                    "Draggable window",
                ],
            },
        ],
    },
];
