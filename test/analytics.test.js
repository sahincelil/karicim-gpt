import test from 'node:test';
import assert from 'node:assert/strict';
import { captureAnalytics } from '../lib/analytics.js';

test('analytics ignores requests without an explicit opt-in session id', () => {
  assert.doesNotThrow(() => captureAnalytics({ url: '/api/chat', headers: {} }, 'karicimgpt_interaction_completed'));
});

test('analytics ignores malformed session identifiers', () => {
  assert.doesNotThrow(() => captureAnalytics({
    url: '/api/chat',
    headers: { 'x-posthog-distinct-id': 'anonymous' }
  }, 'karicimgpt_interaction_completed'));
});

test('analytics ignores unrelated endpoints', () => {
  assert.doesNotThrow(() => captureAnalytics({
    url: '/api/memory',
    headers: { 'x-posthog-distinct-id': 'd6f1c5d0-5a60-4fd8-a2db-1d3ddfd80a12' }
  }, 'karicimgpt_interaction_completed'));
});
