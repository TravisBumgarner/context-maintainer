# Release Workflow

Builds and signs the macOS app, then creates a draft GitHub Release with the `.dmg` attached.

## Usage

1. Go to **Actions > Build and Release (macOS)** on GitHub
2. Click **Run workflow**
3. Once complete, find the draft release under **Releases** and publish it

## Required Secrets

Set these in **Settings > Secrets and variables > Actions**:

| Secret | Description |
|--------|-------------|
| `APPLE_CERTIFICATE` | Base64-encoded `.p12` Developer ID Application certificate |
| `APPLE_CERTIFICATE_PASSWORD` | Password used when exporting the `.p12` |
| `APPLE_IDENTITY` | Signing identity string, e.g. `Developer ID Application: Your Name (TEAM_ID)` |
| `APPLE_ID` | Apple ID email used for notarization |
| `APPLE_PASSWORD` | App-specific password for notarization ([create one here](https://appleid.apple.com/account/manage)) |
| `APPLE_TEAM_ID` | Apple Developer Team ID |
| `TAURI_SIGNING_PRIVATE_KEY` | Contents of the Tauri signing private key file (see below) |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Password for the signing key (empty string if none) |

Apple code signing is optional — the build will succeed without those secrets, but the app won't be signed or notarized. The Tauri signing key is required for auto-update support.

## Generating the Tauri signing key

1. Run `npx tauri signer generate -w ~/.tauri/context-switching.key`
2. The public key is already embedded in `src-tauri/tauri.conf.json`
3. Copy the private key contents into the `TAURI_SIGNING_PRIVATE_KEY` secret
4. If you set a password, add it to `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

## Generating the Apple certificate

1. Open Keychain Access > Certificate Assistant > Request a Certificate from a Certificate Authority
2. Go to [developer.apple.com/account](https://developer.apple.com/account) > Certificates > create a **Developer ID Application** certificate using the CSR
3. Download and install the certificate
4. Export it from Keychain Access as a `.p12` file with a password
5. Base64-encode it: `base64 -i certificate.p12 | pbcopy`
6. Paste into the `APPLE_CERTIFICATE` secret
