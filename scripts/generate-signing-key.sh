#!/usr/bin/env bash
set -euo pipefail

KEY_DIR="$HOME/.tauri"
KEY_FILE="$KEY_DIR/context-switching.key"

mkdir -p "$KEY_DIR"

echo "Generating Tauri signing keypair..."
echo ""

printf '\n\n' | npx @tauri-apps/cli signer generate -w "$KEY_FILE" --force

cat "$KEY_FILE" | pbcopy

# Update pubkey in tauri.conf.json
CONF="src-tauri/tauri.conf.json"
PUBKEY=$(cat "$KEY_FILE.pub")
# Escape slashes/special chars for sed, then replace the pubkey value in-place
python3 -c "
import json, sys
conf = json.load(open('$CONF'))
conf['plugins']['updater']['pubkey'] = '''$PUBKEY'''
json.dump(conf, open('$CONF', 'w'), indent=2)
print('Updated pubkey in $CONF')
"

echo ""
echo "================================================"
echo "  Private key copied to clipboard."
echo "  Go set TAURI_SIGNING_PRIVATE_KEY in GitHub secrets."
echo "  Public key updated in $CONF."
echo "================================================"
