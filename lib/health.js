const providers = [
  ['openai', 'OPENAI_API_KEY'],
  ['openrouter', 'OPENROUTER_API_KEY'],
  ['xai', 'XAI_API_KEY']
];

export async function healthSnapshot() {
  const configuredProviders = providers.filter(([, key]) => Boolean(process.env[key])).map(([name]) => name);
  return {
    providers: configuredProviders,
    providerReady: configuredProviders.length > 0,
    bridgeReady: Boolean(process.env.BRIDGE_SHARED_SECRET),
    adminMemoryReady: Boolean(process.env.BODY_ADMIN_TOKEN),
    persistentMemory: Boolean(process.env.MEMORY_FILE || process.env.DATA_DIR),
    grokBridge: Boolean(process.env.XAI_API_KEY),
    councilReady: Boolean(process.env.XAI_API_KEY || process.env.OPENROUTER_API_KEY),
    production: process.env.NODE_ENV === 'production'
  };
}
