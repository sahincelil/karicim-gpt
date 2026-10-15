import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (file) => readFile(new URL(file, import.meta.url), 'utf8');
const [app, index, worker, manifest, config, server] = await Promise.all([
  read('../app.js'), read('../index.html'), read('../sw.js'),
  read('../manifest.webmanifest'), read('../config.js'), read('../server.js')
]);

assert.match(config, /window\.KARICIMGPT_API_BASE_URL/);
assert.match(index, /src="\.\/config\.js"><\/script><script src="\.\/app\.js"/);
assert.match(index, /register\('\.\/sw\.js'\)/);
assert.match(index, /href="\.\/manifest\.webmanifest"/);
assert.match(app, /fetch\(apiUrl\(endpoint\)/);
assert.match(app, /GitHub Pages yalnızca ön yüzü barındırır/);
assert.match(worker, /karicimgpt-shell-v3/);
assert.match(worker, /new URL\('\.\/index\.html',self\.registration\.scope\)/);
assert.match(manifest, /"start_url": "\.\//);
assert.match(manifest, /"scope": "\.\//);
assert.match(server, /config\\\.js/);

console.log('GitHub Pages frontend configuration checks passed.');
