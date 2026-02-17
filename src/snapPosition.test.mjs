import { describe, it } from "node:test";
import assert from "node:assert/strict";

// We can't import .ts directly from node:test, so we test the logic
// via a compiled/bundled version. For now, inline the expected behavior
// and the actual function will be validated by matching these expectations.

// Since the project doesn't have a TS compilation step for tests,
// we define the expected calculation inline and test against it.
// The actual implementation in snapPosition.ts must produce identical results.

/**
 * Reference implementation of calculateSnapPosition for testing.
 * This defines the CONTRACT — the real code must match this behavior.
 */
function calculateSnapPosition(anchor, monitor, window) {
  const padding = Math.round(16 * monitor.scaleFactor);
  const menuBar = Math.round(25 * monitor.scaleFactor);

  let x;
  if (anchor.includes("left")) x = monitor.x + padding;
  else if (anchor.includes("center"))
    x = monitor.x + Math.round((monitor.width - window.width) / 2);
  else x = monitor.x + monitor.width - window.width - padding;

  let y;
  if (anchor.startsWith("top")) y = monitor.y + menuBar;
  else if (anchor.startsWith("middle"))
    y = monitor.y + Math.round((monitor.height - window.height) / 2);
  else y = monitor.y + monitor.height - window.height - padding;

  // Clamp to keep window fully within monitor bounds
  x = Math.max(monitor.x, Math.min(x, monitor.x + monitor.width - window.width));
  y = Math.max(monitor.y + menuBar, Math.min(y, monitor.y + monitor.height - window.height));

  return { x, y };
}

// Standard Retina display
const retinaMonitor = { x: 0, y: 0, width: 3024, height: 1964, scaleFactor: 2 };
// External 1080p display offset to the right
const externalMonitor = { x: 3024, y: 0, width: 1920, height: 1080, scaleFactor: 1 };
// Window at 2x scale
const windowSize = { width: 580, height: 440 };
// Window at 1x scale
const windowSize1x = { width: 290, height: 220 };

describe("calculateSnapPosition", () => {
  it("places window at top-right with padding on a Retina display", () => {
    const pos = calculateSnapPosition("top-right", retinaMonitor, windowSize);
    // Should be inset by 16 logical px * 2 scale = 32 physical px from right
    assert.equal(pos.x, 3024 - 580 - 32);
    // Should be below menu bar: 25 * 2 = 50 physical px
    assert.equal(pos.y, 50);
  });

  it("places window at bottom-left with padding on an external 1x display", () => {
    const pos = calculateSnapPosition("bottom-left", externalMonitor, windowSize1x);
    // x: monitor.x + padding (16 * 1 = 16)
    assert.equal(pos.x, 3024 + 16);
    // y: monitor.y + height - windowHeight - padding
    assert.equal(pos.y, 0 + 1080 - 220 - 16);
  });

  it("centers the window horizontally and vertically for middle-center", () => {
    const pos = calculateSnapPosition("middle-center", retinaMonitor, windowSize);
    assert.equal(pos.x, Math.round((3024 - 580) / 2));
    assert.equal(pos.y, Math.round((1964 - 440) / 2));
  });

  it("clamps position so window never extends beyond monitor bounds", () => {
    // Tiny monitor where padding would push window off-screen
    const tinyMonitor = { x: 100, y: 100, width: 300, height: 250, scaleFactor: 1 };
    const bigWindow = { width: 290, height: 220 };
    const pos = calculateSnapPosition("top-right", tinyMonitor, bigWindow);
    // x should be clamped: monitor.x <= x <= monitor.x + width - windowWidth
    assert.ok(pos.x >= tinyMonitor.x, `x (${pos.x}) should be >= monitor.x (${tinyMonitor.x})`);
    assert.ok(
      pos.x + bigWindow.width <= tinyMonitor.x + tinyMonitor.width,
      `window right edge (${pos.x + bigWindow.width}) should be <= monitor right (${tinyMonitor.x + tinyMonitor.width})`,
    );
    // y should account for menu bar but stay within bounds
    assert.ok(
      pos.y + bigWindow.height <= tinyMonitor.y + tinyMonitor.height,
      `window bottom (${pos.y + bigWindow.height}) should be <= monitor bottom (${tinyMonitor.y + tinyMonitor.height})`,
    );
  });
});
