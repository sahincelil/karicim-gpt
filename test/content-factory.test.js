import assert from 'node:assert/strict';
import handler from '../api/content-factory.js';
import { buildContentFactoryPrompt, normalizeContentFactoryInput } from '../lib/content-factory.js';

function invoke(method, body = {}) {
  const res = {
    headers: {},
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; return this; },
    end(value) { this.body = value; return this; }
  };
  const req = { method, body, headers: {} };
  return Promise.resolve(handler(req, res)).then(() => res);
}

const normalized = normalizeContentFactoryInput({ topic: 'Kör nokta ve beyin', brief: 'Kaynakları doğrula.' });
assert.equal(normalized.topic, 'Kör nokta ve beyin');
assert.equal(normalized.brief, 'Kaynakları doğrula.');
assert.throws(() => normalizeContentFactoryInput({ topic: '   ' }), /En az 4 karakter/);
assert.throws(() => normalizeContentFactoryInput({ topic: 'x'.repeat(501) }), /en fazla 500/);
assert.throws(() => normalizeContentFactoryInput({ topic: 'Uygun konu', brief: 'x'.repeat(1801) }), /en fazla 1800/);

const prompt = buildContentFactoryPrompt({ topic: 'Kör nokta ve beyin' });
assert.match(prompt, /SYSTEM ARCHIVE \/\/ HUMAN PROTOCOL/);
assert.match(prompt, /40-55 saniyelik/);
assert.match(prompt, /6-8 dakikalık/);
assert.match(prompt, /Kaynak.*uydurma/s);
assert.match(prompt, /Her iki formatı da üret/);
assert.match(prompt, /9:16/);
assert.match(prompt, /16:9/);

const wrongMethod = await invoke('GET');
assert.equal(wrongMethod.statusCode, 405);
assert.equal(JSON.parse(wrongMethod.body).error, 'Yalnızca POST destekleniyor.');

const badRequest = await invoke('POST', { topic: 'x' });
assert.equal(badRequest.statusCode, 400);
assert.match(JSON.parse(badRequest.body).error, /En az 4 karakter/);

console.log('LEGION CONTENT FACTORY tests: OK');
