# Changelog & Auto-Update

## Overview

Add changelog tracking and automatic update support to Context Maintainer. Updates are distributed via GitHub Releases using Tauri 2's built-in updater plugin.

## Goals

1. **Changelog**: Maintain a `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/) conventions. Release notes are included in GitHub Releases and surfaced in-app after an update.
2. **Auto-update**: The app checks for updates on launch, notifies the user, and allows one-click download + install via the Tauri updater plugin.

## Technical Approach

### Tauri Updater Plugin

- **Rust**: Add `tauri-plugin-updater` dependency, register plugin in `lib.rs`
- **Frontend**: Add `@tauri-apps/plugin-updater` and `@tauri-apps/plugin-process` npm packages
- **Signing**: Generate a Tauri signing keypair (`npm run tauri signer generate`). Public key goes in `tauri.conf.json`, private key stored as a GitHub Actions secret (`TAURI_SIGNING_PRIVATE_KEY`)
- **Endpoint**: `https://github.com/TravisBumgarner/context-switching/releases/latest/download/latest.json` — the `tauri-action` generates this file automatically
- **Capabilities**: Add `updater:default` to `src-tauri/capabilities/default.json`

### tauri.conf.json changes

```json
{
  "bundle": {
    "createUpdaterArtifacts": true
  },
  "plugins": {
    "updater": {
      "pubkey": "<generated public key>",
      "endpoints": [
        "https://github.com/TravisBumgarner/context-switching/releases/latest/download/latest.json"
      ]
    }
  }
}
```

### GitHub Actions

Update `.github/workflows/release.yml` to:
- Accept a version input on `workflow_dispatch`
- Set `TAURI_SIGNING_PRIVATE_KEY` from secrets
- The existing `tauri-action` already creates releases and uploads artifacts; adding `createUpdaterArtifacts: true` in config makes it also generate `latest.json`

### Frontend Update Flow

On app launch:
1. Call `check()` from `@tauri-apps/plugin-updater`
2. If an update is available, show a non-blocking notification/banner with version + release notes
3. User clicks "Update" → `downloadAndInstall()` → `relaunch()`
4. If user dismisses, don't pester again until next launch

### Version Bump Script

A Node script (`scripts/version-bump.mjs`) keeps the version in sync across all three files:
- `package.json`
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

Usage: `npm run version-bump -- --patch|--minor|--major`

No external dependencies — uses only Node built-ins.

### Changelog

- Maintain `CHANGELOG.md` in the repo root
- Entries follow Keep a Changelog format (Added, Changed, Fixed, Removed)
- The release workflow reads the current version's changelog section for the GitHub Release body

## Out of Scope

- Windows/Linux builds (macOS only for now)
- Delta updates
