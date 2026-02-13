# Context ~~Switcher~~ Maintainer

**Per-desktop todo lists for macOS.** A tiny, always-on-top floating window that tracks which virtual desktop you're on and gives each one its own task list.

Stop losing track of what you were doing when you switch spaces.

---

## How it works

Context Maintainer sits in the corner of your screen and automatically detects when you move between macOS desktops (Mission Control spaces). Each desktop gets its own todo list, title, and color — so your tasks stay tied to the context they belong to.

- **Desktop 1** — "Email" — Reply to Sarah, File expense report
- **Desktop 2** — "Development" — Fix auth bug, Review PR #42
- **Desktop 3** — "Design" — Update mockups, Export assets

Switch desktops and your tasks follow.

## Features

- **Automatic desktop detection** — Knows which space you're on without any manual switching
- **Per-desktop todos** — Each virtual desktop has its own independent task list
- **Custom titles** — Name each desktop to match what you use it for
- **Color themes** — 10 built-in palettes (Pastel, Ocean, Sunset, Forest, Candy, Mono, Neon, Earth, Berry, Retro) or pick individual colors per desktop
- **Drag-and-drop reordering** — Prioritize tasks with a quick drag
- **Window anchoring** — Pin the window to any of 9 screen positions
- **Collapsible** — Minimize down to just the desktop title when you need more screen space
- **Multi-monitor support** — Separate windows per display, each tracking their own spaces
- **Desktop overview** — See all desktops and their task counts at a glance, jump to any one
- **Lightweight** — Native macOS app built with Tauri and Rust, minimal resource usage

## Setup

On first launch, Context Maintainer will walk you through two quick steps:

1. **Grant Accessibility permission** — needed to detect desktop switches
2. **Enable keyboard shortcuts** — System Settings > Keyboard > Keyboard Shortcuts > Mission Control > enable "Switch to Desktop N" for each desktop

That's it. The app handles the rest.

## Tech

Built with [Tauri 2](https://tauri.app/), React, and Rust. Uses macOS CoreGraphics APIs for reliable virtual desktop detection without polling AppleScript.

## License

MIT
