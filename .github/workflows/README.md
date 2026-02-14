# Release

## Local Build (current)

Build and release from your Mac to GitHub using the local script:

```bash
./scripts/release.sh
```

This will:
1. Build the Tauri app (Apple code signing uses your local keychain)
2. Sign the updater artifact with `~/.tauri/context-switching.key`
3. Ask to create a draft GitHub release with the DMG + updater files

Then go to **Releases** on GitHub and publish the draft.

### Version bumping

Before building a release, bump the version:

```bash
npm run version-bump -- --patch   # 0.2.2 → 0.2.3
npm run version-bump -- --minor   # 0.2.2 → 0.3.0
npm run version-bump -- --major   # 0.2.2 → 1.0.0
```

This updates `package.json`, `tauri.conf.json`, `Cargo.toml`, and adds an empty changelog entry in `src/changelog.ts`. Fill in the changelog before building.

### Prerequisites

- Xcode command line tools installed
- Apple Developer ID certificate in your local keychain
- Tauri updater signing key at `~/.tauri/context-switching.key`

### First-time setup

Generate the Tauri updater signing key:

```bash
./scripts/generate-signing-key.sh
```

You'll be prompted for a password. If you set one, you'll need to provide it when building (the release script will prompt for it). The script then sets the GitHub secret and updates the pubkey in `tauri.conf.json`. Commit and push the pubkey change.

## GitHub Actions (disabled)

The CI workflow (`release.yml`) is disabled due to updater signing key issues in the CI environment. The workflow file is preserved for future re-enablement.
