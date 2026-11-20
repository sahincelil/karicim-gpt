import test from "node:test";
import assert from "node:assert/strict";
import worker from "./worker.js";

const env = { MESH_TOKEN: "test-token" };

test("health endpoint", async () => {
  const response = await worker.fetch(new Request("https://example.test/health"), env);
  assert.equal(response.status, 200);
});

test("MCP endpoint requires bearer token", async () => {
  const response = await worker.fetch(new Request("https://example.test/mcp", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
  }), env);
  assert.equal(response.status, 401);
});

test("MCP lists three bounded IPFS tools", async () => {
  const response = await worker.fetch(new Request("https://example.test/mcp", {
    method: "POST", headers: { authorization: "Bearer test-token", "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
  }), env);
  const payload = await response.json();
  assert.deepEqual(payload.result.tools.map((tool) => tool.name),
    ["ipfs_network_info", "ipfs_cid_validate", "ipfs_fetch"]);
});

test("invalid CID is rejected", async () => {
  const response = await worker.fetch(new Request("https://example.test/mcp", {
    method: "POST", headers: { authorization: "Bearer test-token", "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 3, method: "tools/call",
      params: { name: "ipfs_cid_validate", arguments: { cid: "not-a-valid-cid" } } }),
  }), env);
  const payload = await response.json();
  assert.equal(payload.result.isError, true);
});
