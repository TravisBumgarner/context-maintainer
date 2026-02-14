#!/usr/bin/env bash
set -euo pipefail

# Local release build for macOS
# Signs with your local Apple identity and Tauri updater key
# Creates a draft GitHub release with the built artifacts

KEY_FILE="$HOME/.tauri/context-switching.key"

if [ ! -f "$KEY_FILE" ]; then
  echo "Error: Signing key not found at $KEY_FILE"
  echo "Run: scripts/generate-signing-key.sh"
  exit 1
fi

VERSION=$(grep '"version"' src-tauri/tauri.conf.json | head -1 | sed 's/.*: *"\(.*\)".*/\1/')
echo "Building Context Maintainer v${VERSION}..."

# Prompt for signing key password
read -s -p "Signing key password (leave blank if none): " KEY_PASSWORD
echo ""

# Build with Apple signing + updater signing
TAURI_SIGNING_PRIVATE_KEY=$(cat "$KEY_FILE") \
TAURI_SIGNING_PRIVATE_KEY_PASSWORD="$KEY_PASSWORD" \
  npm run tauri build

BUNDLE_DIR="src-tauri/target/release/bundle"
DMG="$BUNDLE_DIR/dmg/Context Maintainer_${VERSION}_aarch64.dmg"
UPDATER="$BUNDLE_DIR/macos/Context Maintainer.app.tar.gz"
UPDATER_SIG="${UPDATER}.sig"

echo ""
echo "Build complete!"
echo "  DMG: $DMG"
echo "  Updater: $UPDATER"
echo ""

read -p "Create draft GitHub release v${VERSION}? [y/N] " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  gh release create "v${VERSION}" \
    --title "Context Maintainer v${VERSION}" \
    --notes "See the assets below to download and install." \
    --draft \
    "$DMG" \
    "$UPDATER" \
    "$UPDATER_SIG"
  echo "Draft release created!"
fi
