import { PostHog } from 'posthog-node';

const projectToken = process.env.POSTHOG_PROJECT_TOKEN?.trim();
const host = process.env.POSTHOG_HOST?.trim() || 'https://eu.i.posthog.com';

export const posthog = projectToken
  ? new PostHog(projectToken, { host, flushAt: 20, flushInterval: 10000 })
  : null;

if (!posthog && process.env.NODE_ENV !== 'production') {
  console.warn(
    'POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once POSTHOG_PROJECT_TOKEN is configured'
  );
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TRACKED_PATHS = new Set(['/api/chat', '/api/agent', '/api/council']);

export function captureAnalytics(req, event, properties = {}) {
  if (!posthog) return;
  const pathname = new URL(req?.url || '/', `http://${req?.headers?.host || 'localhost'}`).pathname;
  if (!TRACKED_PATHS.has(pathname)) return;
  const distinctId = req?.headers?.['x-posthog-distinct-id'];
  if (typeof distinctId !== 'string' || !UUID_V4.test(distinctId)) return;
  try {
    posthog.capture({ distinctId, event, properties: { app: 'karicimgpt', ...properties }, disableGeoip: true });
  } catch (error) {
    console.warn('PostHog analytics event was skipped:', error?.message || 'unknown error');
  }
}

export async function shutdownAnalytics() {
  if (!posthog) return;
  await posthog.shutdown();
}
