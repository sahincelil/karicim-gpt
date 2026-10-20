import { timingSafeEqual } from 'node:crypto';
import { createContext, deriveContexts, searchContexts } from '../lib/context-engine.js';
import { securityHeaders } from '../lib/security.js';

const TOOLS = [
  { name: 'context_create', description: 'Save a context record with tags and provenance.', inputSchema: { type: 'object', properties: { text: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } }, source: { type: 'string' }, kind: { type: 'string' } }, required: ['text'] } },
  { name: 'context_auto_derive', description: 'Derive candidate preferences, decisions, tasks, and reminders from explicitly supplied text.', inputSchema: { type: 'object', properties: { text: { type: 'string' }, source: { type: 'string' } }, required: ['text'] } },
  { name: 'context_search', description: 'Search saved context records by text, tag, kind, or source.', inputSchema: { type: 'object', properties: { query: { type: 'string' }, limit: { type: 'number' } } } }
];

function authorized(req) {
  const expected = process.env.BODY_ADMIN_TOKEN;
  const provided = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(provided), b = Buffer.from(expected || '');
  return Boolean(expected && provided && a.length === b.length && timingSafeEqual(a, b));
}
function reply(res, status, payload) {
  securityHeaders(res);
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = status;
  return res.end(JSON.stringify(payload));
}
function error(id, code, message) {
  return { jsonrpc: '2.0', id: id ?? null, error: { code, message } };
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return reply(res, 405, error(null, -32600, 'MCP endpoint requires POST.'));
  if (!authorized(req)) return reply(res, 401, error(null, -32001, 'Unauthorized.'));
  const input = req.body;
  if (!input || input.jsonrpc !== '2.0' || typeof input.method !== 'string') return reply(res, 400, error(input?.id, -32600, 'Invalid JSON-RPC request.'));
  if (input.method === 'notifications/initialized' || input.method === 'notifications/cancelled') {
    res.statusCode = 202;
    return res.end();
  }
  if (input.method === 'initialize') {
    return reply(res, 200, { jsonrpc: '2.0', id: input.id, result: { protocolVersion: '2025-06-18', capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'karicimgpt-context', version: '1.0.0' }, instructions: 'Context tools only process text explicitly supplied by the client. Use only authorized, user-permitted source material.' } });
  }
  if (input.method === 'ping') return reply(res, 200, { jsonrpc: '2.0', id: input.id, result: {} });
  if (input.method === 'tools/list') return reply(res, 200, { jsonrpc: '2.0', id: input.id, result: { tools: TOOLS } });
  if (input.method !== 'tools/call') return reply(res, 200, error(input.id, -32601, 'Method not found.'));
  const name = input.params?.name;
  const args = input.params?.arguments || {};
  try {
    let result;
    if (name === 'context_create') result = await createContext(args);
    else if (name === 'context_auto_derive') result = await deriveContexts(args);
    else if (name === 'context_search') result = { contexts: await searchContexts(args.query || '', args.limit || 10) };
    else return reply(res, 200, error(input.id, -32602, 'Unknown context tool.'));
    return reply(res, 200, { jsonrpc: '2.0', id: input.id, result: { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result, isError: false } });
  } catch (cause) {
    return reply(res, 200, { jsonrpc: '2.0', id: input.id, result: { content: [{ type: 'text', text: cause?.message || 'Context tool failed.' }], isError: true } });
  }
}
