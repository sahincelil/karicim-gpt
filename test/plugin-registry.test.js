import assert from 'node:assert/strict';
import { pluginCatalog, pluginCategories, registrySnapshot, searchPlugins } from '../integrations/plugin-cloneforge/registry.js';

assert.equal(pluginCatalog.length, 94, 'registry should contain the captured 94 provider namespaces');
assert.equal(registrySnapshot.providerCount, pluginCatalog.length);
assert.ok(registrySnapshot.observedToolCount > 3000, 'tool count should be a substantial captured inventory');
assert.equal(new Set(pluginCatalog.map(item => item.id)).size, pluginCatalog.length, 'provider IDs must be unique');
assert.ok(pluginCategories.length >= 5, 'provider categories should cover multiple domains');
assert.ok(pluginCatalog.every(item => item.name && item.category && item.toolCount > 0), 'every provider must be labeled and counted');
assert.ok(pluginCatalog.every(item => item.connectionVerified === false), 'inventory must not claim live connections');
assert.ok(pluginCatalog.every(item => ['catalogued', 'existing-code'].includes(item.adapterPhase)), 'adapter phase must use a known state');
assert.ok(searchPlugins({ q: 'github' }).some(item => item.name === 'GitHub'), 'search should find GitHub');
assert.ok(searchPlugins({ category: 'Finans & Operasyon' }).every(item => item.category === 'Finans & Operasyon'), 'category filter should be exact');
assert.equal(searchPlugins({ q: 'not-a-real-provider' }).length, 0, 'unknown search should return no matches');

console.log('Plugin CloneForge registry checks passed:', pluginCatalog.length, 'providers /', registrySnapshot.observedToolCount, 'tools');
