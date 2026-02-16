export interface ChangelogEntry {
    version: string;
    date: string;
    changes: { category: string; items: string[] }[];
}

export const changelog: ChangelogEntry[] = [
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
