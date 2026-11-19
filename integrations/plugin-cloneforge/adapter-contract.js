export const ADAPTER_STATUSES = Object.freeze([
  'catalogued',
  'scaffolded',
  'configured',
  'verified',
  'degraded',
  'disabled'
]);

export const AUTH_MODES = Object.freeze([
  'oauth2-pkce',
  'api-key',
  'app-installation',
  'webhook-signature',
  'public-api',
  'manual'
]);

export function defineAdapter(adapter) {
  if (!adapter || typeof adapter !== 'object') throw new TypeError('adapter must be an object');
  const required = ['id', 'provider', 'authMode', 'capabilities', 'health'];
  for (const key of required) {
    if (!(key in adapter)) throw new TypeError(`adapter.${key} is required`);
  }
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(adapter.id)) throw new TypeError('adapter.id is invalid');
  if (!AUTH_MODES.includes(adapter.authMode)) throw new TypeError('adapter.authMode is unsupported');
  if (!Array.isArray(adapter.capabilities) || adapter.capabilities.length === 0) {
    throw new TypeError('adapter.capabilities must be a non-empty array');
  }
  if (typeof adapter.health !== 'function') throw new TypeError('adapter.health must be a function');

  return Object.freeze({
    ...adapter,
    capabilities: Object.freeze([...new Set(adapter.capabilities)]),
    status: adapter.status || 'scaffolded'
  });
}
