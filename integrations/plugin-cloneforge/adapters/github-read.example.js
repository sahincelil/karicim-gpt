import { defineAdapter } from '../adapter-contract.js';

// Example only: inject a backend-only client; never place provider secrets in this file.
export const githubReadAdapter = defineAdapter({
  id: 'github-read',
  provider: 'GitHub',
  authMode: 'app-installation',
  status: 'scaffolded',
  capabilities: ['profile.read', 'repositories.list'],
  async health(client) {
    if (!client || typeof client.getAuthenticatedUser !== 'function') {
      return { ok: false, state: 'needs-credential', detail: 'Backend GitHub client is not configured.' };
    }
    try {
      const profile = await client.getAuthenticatedUser();
      return { ok: Boolean(profile?.login), state: 'verified', checkedAt: new Date().toISOString() };
    } catch {
      return { ok: false, state: 'degraded', detail: 'GitHub health check failed.' };
    }
  }
});
