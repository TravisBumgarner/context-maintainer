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
  window: WindowSize,
): { x: number; y: number } {
  // stub — will be implemented in ralph-code phase
  return { x: 0, y: 0 };
}
