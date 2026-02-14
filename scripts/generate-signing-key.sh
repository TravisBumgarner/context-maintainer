#!/usr/bin/env bash
set -euo pipefail

KEY_DIR="$HOME/.tauri"
KEY_FILE="$KEY_DIR/context-switching.key"

mkdir -p "$KEY_DIR"

echo "Generating Tauri signing keypair..."
echo ""

npx @tauri-apps/cli signer generate -w "$KEY_FILE" --force --ci -p ""

# Set GitHub secret directly from file (clipboard mangles newlines)
gh secret set TAURI_SIGNING_PRIVATE_KEY < "$KEY_FILE"

# Update pubkey in tauri.conf.json
CONF="src-tauri/tauri.conf.json"
PUBKEY=$(cat "$KEY_FILE.pub")
python3 -c "
import json, sys
conf = json.load(open('$CONF'))
conf['plugins']['updater']['pubkey'] = '''$PUBKEY'''
json.dump(conf, open('$CONF', 'w'), indent=2)
print('Updated pubkey in $CONF')
"

echo ""
echo "================================================"
echo "  Done! GitHub secret set and pubkey updated."
echo "================================================"
