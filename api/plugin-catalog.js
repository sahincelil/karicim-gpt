import { securityHeaders } from '../lib/security.js';
import { pluginCatalog, pluginCategories, registrySnapshot, searchPlugins } from '../integrations/plugin-cloneforge/registry.js';

function send(res, status, body) {
  securityHeaders(res);
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  return res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return send(res, 405, { ok: false, error: 'Yalnızca GET destekleniyor.' });
  }

  const query = typeof req.query?.q === 'string' ? req.query.q.slice(0, 120) : '';
  const category = typeof req.query?.category === 'string' ? req.query.category.slice(0, 80) : '';
  const results = searchPlugins({ q: query, category });

  return send(res, 200, {
    ok: true,
    snapshot: registrySnapshot,
    total: pluginCatalog.length,
    resultCount: results.length,
    categories: pluginCategories,
    providers: results
  });
}
