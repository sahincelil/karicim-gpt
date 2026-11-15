export function resolveListenHost(env = process.env) {
  const configuredHost = typeof env.HOST === 'string' ? env.HOST.trim() : '';
  return configuredHost || '127.0.0.1';
}
