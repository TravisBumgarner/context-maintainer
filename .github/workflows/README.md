# Release

## First-time setup

1. Install Xcode command line tools
2. Have an Apple Developer ID certificate in your local keychain
3. Generate the updater signing key:

```bash
./scripts/generate-signing-key.sh
```

You'll be prompted for a password. The script sets the GitHub secret and updates the pubkey in `tauri.conf.json`. Commit and push the pubkey change.

## Releasing a new version

1. Bump the version:

```bash
npm run version-bump -- --patch   # 0.2.2 → 0.2.3
npm run version-bump -- --minor   # 0.2.2 → 0.3.0
npm run version-bump -- --major   # 0.2.2 → 1.0.0
```

This updates `package.json`, `tauri.conf.json`, `Cargo.toml`, and adds an empty changelog entry in `src/changelog.ts`.

2. Fill in the changelog in `src/changelog.ts`.
3. Commit and push your changes.
4. Build and release:

```bash
./scripts/release.sh
```

You'll be prompted for your signing key password. The script builds the app, signs everything, and asks to create a draft GitHub release.

5. Go to **Releases** on GitHub and publish the draft.

## GitHub Actions (disabled)

The CI workflow (`release.yml`) is disabled due to updater signing key issues in CI. The workflow file is preserved for future re-enablement.
