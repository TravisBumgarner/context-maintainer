import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import type { AnchorPosition } from "./types";

export const currentWindow = getCurrentWebviewWindow();

export type ColorMode = "dark" | "light";

export function detectColorMode(hex: string): ColorMode {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return L > 0.35 ? "dark" : "light";
}

export function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function friendlyMonitorName(raw: string | null, index: number): string {
  if (!raw) return `Screen ${index + 1}`;
  if (/^[#0-9a-fA-F-]+$/.test(raw.trim())) return `Screen ${index + 1}`;
  return raw;
}

export function loadAnchor(): AnchorPosition {
  const key = `anchor-${currentWindow.label}`;
  return (localStorage.getItem(key) as AnchorPosition) || "top-right";
}

export function saveAnchor(pos: AnchorPosition) {
  const key = `anchor-${currentWindow.label}`;
  localStorage.setItem(key, pos);
}

export function formatPreset(seconds: number): string {
  if (seconds >= 3600) return `${seconds / 3600}h`;
  if (seconds >= 60) return `${seconds / 60}m`;
  return `${seconds}s`;
}

export function formatCountdown(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
