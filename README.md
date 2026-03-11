# Context Maintainer

**Per-desktop todo lists for macOS.** A tiny, always-on-top floating window that tracks which virtual desktop you're on and gives each one its own task list, timer, and color.

![App overview showing multiple desktops with todos](readme-resources/hero.png)

---

## How it works

Context Maintainer sits in the corner of your screen and automatically detects when you move between macOS desktops (Mission Control spaces). Each desktop gets its own todo list, title, and color — so your tasks stay tied to the context they belong to.

- **Desktop 1** — "Email" — Reply to Sarah, File expense report
- **Desktop 2** — "Development" — Fix auth bug, Review PR #42
- **Desktop 3** — "Design" — Update mockups, Export assets

Switch desktops and your tasks follow.

---

## Features

### The Main View

Everything you need for your current desktop, nothing you don't. Todos, timers, a desktop switcher, and app shortcuts — all without leaving your workspace.

![Main app view showing all panels](readme-resources/main-view.png)

- **Per-desktop todos** — Each space gets its own task list. Name it, fill it, check things off. When you switch desktops, your tasks switch with you.
- **Desktop switcher** — Color-coded buttons for every desktop. See where you are, jump where you need to go.
- **Per-desktop timers** — Pomodoro, meeting countdown, whatever. Each desktop tracks its own timer independently.
- **Common apps launcher** — One click to open a new VS Code window, a fresh Chrome tab, or whatever you reach for on every desktop.

### Themes & Customization

Pick a palette and the whole app follows — background, text, borders. 14 built-in themes from subtle to bold.

![Theme selection and settings](readme-resources/settings.png)

### Multi-Monitor Support

One window per monitor, each aware of its own desktops. Monitors come and go — Context Maintainer keeps up. Change a setting anywhere and every window gets it.

### More

- **Window anchoring** — Lock to any corner, edge, or center of the screen
- **Collapsible** — Shrink to a single-line title bar when you need the space back
- **Auto-hide** — Set a delay and the window disappears after you land on a desktop
- **Session management** — Wipe the slate clean for a new project, or restore a previous session from history
- **Task history** — Every completed task is logged with the desktop it came from

---

## Setup

On first launch, Context Maintainer will ask you to **grant Accessibility permission** — needed to detect desktop switches and switch between desktops.

That's it. The app handles the rest.

---

## Common Apps - Custom Commands

Not all apps support opening a new instance with `open -n`. You can set a custom command per app in the Common Apps settings. Below are known working commands:

| App | Custom Command | Notes |
| --- | --- | --- |
| Figma | — | Not supported |
| Firefox | — | Default behavior works |
| Google Chrome | `osascript -e 'tell application "Google Chrome" to make new window'` | |
| iTerm2 | — | Default behavior works |
| Linear | — | Default behavior works |
| Microsoft Edge | — | Default behavior works |
| Notion | — | Not supported |
| Obsidian | — | Not supported |
| Postico | — | Default behavior works |
| Postman | — | Not supported |
| Safari | — | Default behavior works |
| Slack | — | Not supported |
| VS Code | `code --new-window` | Requires CLI tool installed |
| WhatsApp | — | Not supported |

If you discover a working command for another app, feel free to open a PR to add it here.

---

## Tech

Built with [Tauri 2](https://tauri.app/), React, and Rust. Uses macOS CoreGraphics APIs for reliable virtual desktop detection without polling AppleScript.

## Logs

Production logs are written by `tauri-plugin-log` to:

```
~/Library/Logs/com.travisbumgarner.context-switching/
```

```bash
tail -f ~/Library/Logs/com.travisbumgarner.context-switching/*.log
```

## Releasing

See [`.github/workflows/README.md`](.github/workflows/README.md) for secrets setup and certificate generation.

1. Bump the version: `npm run version-bump -- --patch` (or `--minor` / `--major`)
2. Update `CHANGELOG.md` with the new version's changes
3. Open a PR, get it reviewed and merged
4. Go to Actions > "Build and Release (macOS)" > Run workflow
5. Review the draft release, then publish it

Once published, running copies of the app will detect the update on next launch.

## License

MIT
