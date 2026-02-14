import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

export function bumpVersion(current, type) {
  // stub
  return current;
}

export function parseArgs(args) {
  // stub
  return null;
}
