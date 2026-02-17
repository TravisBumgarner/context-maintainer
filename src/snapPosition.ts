import type { AnchorPosition } from "./types";

export interface MonitorBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  scaleFactor: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

/**
 * Calculate the physical (x, y) position where a window should snap to
 * on a given monitor, based on the chosen anchor position.
 *
 * All inputs and outputs are in physical (pixel) coordinates.
 */
export function calculateSnapPosition(
  anchor: AnchorPosition,
  monitor: MonitorBounds,
  win: WindowSize,
): { x: number; y: number } {
  const padding = Math.round(16 * monitor.scaleFactor);
  const menuBar = Math.round(25 * monitor.scaleFactor);

  let x: number;
  if (anchor.includes("left")) x = monitor.x + padding;
  else if (anchor.includes("center"))
    x = monitor.x + Math.round((monitor.width - win.width) / 2);
  else x = monitor.x + monitor.width - win.width - padding;

  let y: number;
  if (anchor.startsWith("top")) y = monitor.y + menuBar;
  else if (anchor.startsWith("middle"))
    y = monitor.y + Math.round((monitor.height - win.height) / 2);
  else y = monitor.y + monitor.height - win.height - padding;

  // Clamp to keep window fully within monitor bounds
  x = Math.max(monitor.x, Math.min(x, monitor.x + monitor.width - win.width));
  y = Math.max(monitor.y + menuBar, Math.min(y, monitor.y + monitor.height - win.height));

  return { x, y };
}
