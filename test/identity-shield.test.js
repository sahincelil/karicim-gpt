import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const family = await readFile(new URL('../family-shield/index.html', import.meta.url), 'utf8');
const osint = await readFile(new URL('../osint-guard/index.html', import.meta.url), 'utf8');
const server = await readFile(new URL('../server.js', import.meta.url), 'utf8');

test('FAMILY SHIELD is local-only and does not collect or persist personal data', () => {
  assert.match(family, /LOCAL ONLY/);
  assert.match(family, /kayıtlı numaradan/);
  assert.match(family, /OTP\/PIN\/parola/);
  assert.doesNotMatch(family, /localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest|sendBeacon/);
});

test('FAMILY SHIELD includes a resettable checklist, scenario drill, and print stylesheet', () => {
  assert.match(family, /resetChecks/);
  assert.match(family, /resetQuiz/);
  assert.match(family, /window\.print/);
  assert.match(family, /@media print/);
});

test('OSINT GUARD is manual-first and never performs remote scans or credential collection', () => {
  assert.match(osint, /MANUAL REVIEW/);
  assert.match(osint, /yalnızca kendi kullanıcı adın/i);
  assert.match(osint, /https:/);
  assert.doesNotMatch(osint, /localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest|sendBeacon|password|passwd|access_token/i);
});

test('server explicitly serves both Identity Shield static pages', () => {
  assert.ok(server.includes('family-shield' + String.fromCharCode(92) + '/index' + String.fromCharCode(92) + '.html'));
  assert.ok(server.includes('osint-guard' + String.fromCharCode(92) + '/index' + String.fromCharCode(92) + '.html'));
});
