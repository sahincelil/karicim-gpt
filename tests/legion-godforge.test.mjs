import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const preflight = path.join(root, "scripts", "legion-preflight.mjs");

test("LEGION registry, evidence paths, canonical statuses, and governance pass preflight", () => {
  const output = execFileSync(process.execPath, [preflight], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
  const report = JSON.parse(output);
  assert.equal(report.ok, true, JSON.stringify(report.errors, null, 2));
  assert.equal(report.modules_checked, 8);
  assert.equal(report.statuses_match_canonical_yaml, true);
  assert.equal(report.governance_controls_checked, 7);
  assert.ok(report.evidence_paths_checked >= 8);
});
