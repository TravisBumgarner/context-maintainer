import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bumpVersion, parseArgs } from "./version-bump.mjs";

describe("bumpVersion", () => {
  it("increments the patch component", () => {
    assert.equal(bumpVersion("0.1.0", "patch"), "0.1.1");
  });

  it("increments the minor component and resets patch", () => {
    assert.equal(bumpVersion("0.1.3", "minor"), "0.2.0");
  });

  it("increments the major component and resets minor and patch", () => {
    assert.equal(bumpVersion("1.2.3", "major"), "2.0.0");
  });
});

describe("parseArgs", () => {
  it("returns the bump type from a valid flag", () => {
    assert.equal(parseArgs(["--patch"]), "patch");
    assert.equal(parseArgs(["--minor"]), "minor");
    assert.equal(parseArgs(["--major"]), "major");
  });

  it("returns null when no flag is provided", () => {
    assert.equal(parseArgs([]), null);
  });
});
