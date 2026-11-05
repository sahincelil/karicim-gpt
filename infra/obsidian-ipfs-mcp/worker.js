const MAX_BODY = 16 * 1024;
const MAX_FETCH = 1_048_576;
const GATEWAY = "https://ipfs.io";

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

function validCid(cid) {
  if (typeof cid !== "string" || cid.length < 10 || cid.length > 120 || /[/?#]/.test(cid)) return false;
  const b58 = /^[1-9A-HJ-NP-Za-km-z]{46}$/;
  const b32 = /^b[a-z2-7]{20,120}$/;
  return (cid.startsWith("Qm") && b58.test(cid)) || b32.test(cid);
}

function rpcError(id, code, message) {
  return json({ jsonrpc: "2.0", id: id ?? null, error: { code, message } });
}

function result(id, value) {
  return json({ jsonrpc: "2.0", id: id ?? null, result: value });
}

async function fetchIpfs(cid, maxBytes) {
  if (!validCid(cid)) throw new Error("Invalid or unsupported CID.");
  if (!Number.isInteger(maxBytes) || maxBytes < 1 || maxBytes > MAX_FETCH) throw new Error("max_bytes must be 1..1048576.");
  const response = await fetch(`${GATEWAY}/ipfs/${cid}`, {
    headers: { accept: "*/*", "user-agent": "OBSIDIAN-IPFS-MCP/0.1" },
    signal: AbortSignal.timeout(12_000),
    redirect: "error",
  });
  if (!response.ok) throw new Error(`IPFS gateway returned HTTP ${response.status}.`);
  const data = await response.arrayBuffer();
  if (data.byteLength > maxBytes) throw new Error("IPFS object exceeds configured response limit.");
  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const isText = /^(text\/|application\/(json|.+\+json))/.test(contentType);
  let content;
  if (isText) content = new TextDecoder("utf-8", { fatal: false }).decode(data);
  else {
    let binary = "";
    for (const byte of new Uint8Array(data)) binary += String.fromCharCode(byte);
    content = btoa(binary);
  }
  return { cid, gateway: GATEWAY, content_type: contentType, bytes: data.byteLength,
    encoding: isText ? "utf-8" : "base64", content, read_only: true };
}

const TOOLS = [
  { name: "ipfs_network_info", description: "Describe the read-only public IPFS adapter and its limits.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false } },
  { name: "ipfs_cid_validate", description: "Validate a CIDv0 or base32 CIDv1 string.",
    inputSchema: { type: "object", properties: { cid: { type: "string", minLength: 10, maxLength: 120 } }, required: ["cid"], additionalProperties: false } },
  { name: "ipfs_fetch", description: "Fetch public IPFS content through the fixed HTTPS gateway. Read-only; maximum 1 MiB.",
    inputSchema: { type: "object", properties: { cid: { type: "string", minLength: 10, maxLength: 120 }, max_bytes: { type: "integer", minimum: 1, maximum: MAX_FETCH } }, required: ["cid"], additionalProperties: false } },
];

async function handleRpc(req) {
  if (!req || req.jsonrpc !== "2.0" || typeof req.method !== "string") return rpcError(req?.id, -32600, "Invalid request.");
  if (req.method === "initialize") return result(req.id, {
    protocolVersion: "2024-11-05",
    capabilities: { tools: { listChanged: false } },
    serverInfo: { name: "obsidian-global-ipfs-mcp", version: "0.1.0" },
  });
  if (req.method === "notifications/initialized") return new Response(null, { status: 202 });
  if (req.method === "ping") return result(req.id, {});
  if (req.method === "tools/list") return result(req.id, { tools: TOOLS });
  if (req.method !== "tools/call") return rpcError(req.id, -32601, "Method not found.");
  const name = req.params?.name;
  const args = req.params?.arguments ?? {};
  try {
    let value;
    if (name === "ipfs_network_info") {
      value = { name: "OBSIDIAN-IPFS-MCP", version: "0.1.0",
        transport: "MCP JSON-RPC over HTTPS",
        content_addressing: "CIDv0 and base32 CIDv1 syntax validation",
        gateway: GATEWAY, write_operations: "disabled", compute_execution: "not provided by IPFS",
        peer_mesh: "not yet connected; libp2p worker discovery and authenticated peer protocol remain future work",
        limits: { max_response_bytes: MAX_FETCH, gateway_timeout_ms: 12000 },
        security: "fixed public gateway; no Kubo RPC, publishing, pinning, private data, or arbitrary URLs" };
    } else if (name === "ipfs_cid_validate") {
      if (!validCid(args.cid)) throw new Error("Invalid or unsupported CID.");
      value = { valid: true, cid: args.cid, version: args.cid.startsWith("Qm") ? 0 : 1 };
    } else if (name === "ipfs_fetch") {
      value = await fetchIpfs(args.cid, args.max_bytes ?? MAX_FETCH);
    } else {
      return rpcError(req.id, -32602, "Unknown tool.");
    }
    return result(req.id, { content: [{ type: "text", text: JSON.stringify(value) }], isError: false });
  } catch (error) {
    return result(req.id, { content: [{ type: "text", text: String(error?.message || "Request failed.") }], isError: true });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") return json({ ok: true, service: "obsidian-global-ipfs-mcp", version: "0.1.0" });
    if (url.pathname !== "/mcp" || request.method !== "POST") return json({ error: "Not found" }, 404);
    if (!env.MESH_TOKEN) return json({ error: "MESH_TOKEN is not configured" }, 503);
    const auth = request.headers.get("authorization") || "";
    if (auth !== `Bearer ${env.MESH_TOKEN}`) return json({ error: "Unauthorized" }, 401, { "www-authenticate": "Bearer" });
    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_BODY) return json({ error: "Request too large" }, 413);
    let body;
    try {
      const raw = await request.text();
      if (new TextEncoder().encode(raw).byteLength > MAX_BODY) return json({ error: "Request too large" }, 413);
      body = JSON.parse(raw);
    } catch { return rpcError(null, -32700, "Parse error."); }
    return handleRpc(body);
  },
};
