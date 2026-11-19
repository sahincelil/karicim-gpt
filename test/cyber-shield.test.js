import test from "node:test";
import assert from "node:assert/strict";

const allowedSeverities = new Set(["critical", "high", "medium", "low", "informational"]);
const fixtureEvents = [
  { id: "DET-2401", severity: "high", status: "Open", technique: "T1110" },
  { id: "DET-2402", severity: "medium", status: "Open", technique: "T1071" },
  { id: "DET-2403", severity: "critical", status: "Open", technique: "T1098" },
  { id: "DET-2404", severity: "low", status: "Closed", technique: null },
  { id: "DET-2405", severity: "medium", status: "Open", technique: "T1195" }
];

test("synthetic event IDs are unique", () => {
  const ids = fixtureEvents.map(event => event.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every event has an allowed severity and status", () => {
  for (const event of fixtureEvents) {
    assert.ok(allowedSeverities.has(event.severity));
    assert.ok(["Open", "Triage", "Closed"].includes(event.status));
  }
});

test("open high-priority count is deterministic", () => {
  const count = fixtureEvents.filter(event =>
    event.status === "Open" && ["critical", "high"].includes(event.severity)
  ).length;
  assert.equal(count, 2);
});

test("ATT&CK references use the expected technique identifier shape", () => {
  for (const event of fixtureEvents.filter(item => item.technique)) {
    assert.match(event.technique, /^T\d{4}(\.\d{3})?$/);
  }
});
