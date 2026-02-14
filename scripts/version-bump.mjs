import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

export function bumpVersion(current, type) {
  const [major, minor, patch] = current.split(".").map(Number);
  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Unknown bump type: ${type}`);
  }
}

export function parseArgs(args) {
  const flag = args.find((a) => ["--patch", "--minor", "--major"].includes(a));
  return flag ? flag.replace("--", "") : null;
}

function updateJsonFile(filePath, newVersion) {
  const raw = readFileSync(filePath, "utf-8");
  const json = JSON.parse(raw);
  json.version = newVersion;
  const indent = raw.match(/^(\s+)"/m)?.[1] || "  ";
  writeFileSync(filePath, JSON.stringify(json, null, indent) + "\n");
}

function addChangelogEntry(filePath, newVersion) {
  const raw = readFileSync(filePath, "utf-8");
  const today = new Date().toISOString().slice(0, 10);
  const entry = [
    `    {`,
    `        version: "${newVersion}",`,
    `        date: "${today}",`,
    `        changes: [`,
    `            {`,
    `                category: "Added",`,
    `                items: [],`,
    `            },`,
    `        ],`,
    `    },`,
  ].join("\n");

  const updated = raw.replace(
    /^(export const changelog: ChangelogEntry\[] = \[)\n/m,
    `$1\n${entry}\n`
  );
  writeFileSync(filePath, updated);
}

function updateCargoToml(filePath, newVersion) {
  const raw = readFileSync(filePath, "utf-8");
  const updated = raw.replace(
    /^(version\s*=\s*")[\d.]+(")/m,
    `$1${newVersion}$2`
  );
  writeFileSync(filePath, updated);
}

// Run as CLI when executed directly
const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  const type = parseArgs(process.argv.slice(2));
  if (!type) {
    console.error("Usage: npm run version-bump -- --patch|--minor|--major");
    process.exit(1);
  }

  const pkgPath = resolve(ROOT, "package.json");
  const tauriConfPath = resolve(ROOT, "src-tauri/tauri.conf.json");
  const cargoPath = resolve(ROOT, "src-tauri/Cargo.toml");

  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const oldVersion = pkg.version;
  const newVersion = bumpVersion(oldVersion, type);

  updateJsonFile(pkgPath, newVersion);
  updateJsonFile(tauriConfPath, newVersion);
  updateCargoToml(cargoPath, newVersion);

  const changelogPath = resolve(ROOT, "src/changelog.ts");
  addChangelogEntry(changelogPath, newVersion);

  console.log(`${oldVersion} → ${newVersion}`);
  console.log(`Added empty changelog entry for ${newVersion} in src/changelog.ts — fill in your changes`);
}
