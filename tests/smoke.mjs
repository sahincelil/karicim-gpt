import assert from 'node:assert/strict';
import fs from 'node:fs';

const files = ['api/chat.js', 'api/agent.js', 'api/health.js', 'lib/security.js', 'lib/github.js', 'app.js', 'index.html'];
for (const file of files) assert.ok(fs.statSync(file).size > 0, `${file} must not be empty`);

const agent = fs.readFileSync('api/agent.js', 'utf8');
const chat = fs.readFileSync('api/chat.js', 'utf8');
const github = fs.readFileSync('lib/github.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

assert.match(agent, /openrouter:web_search/);
assert.match(agent, /openrouter:web_fetch/);
assert.match(agent, /github_read_public_file/);
assert.match(agent, /tool_call_id: call\.id/);
assert.match(agent, /MAX_TOOL_CALLS_TOTAL = 6/);
assert.match(agent, /MAX_TOOL_ROUNDS = 4/);
assert.match(chat, /openrouter\/free/);
assert.match(chat, /max_tool_calls: MAX_SERVER_TOOL_CALLS/);
assert.match(github, /path\.includes\('\.\.'\)/);
assert.match(github, /MAX_FILE_BYTES = 120000/);
assert.match(app, /AbortController/);
assert.doesNotMatch('index.html', /OPENROUTER_API_KEY|XAI_API_KEY/);

console.log('smoke checks: ok');
