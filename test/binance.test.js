import assert from 'node:assert/strict';
import { safeEqual } from '../lib/binance.js';

assert.equal(safeEqual('same-token', 'same-token'), true);
assert.equal(safeEqual('same-token', 'different'), false);
assert.equal(safeEqual('', ''), false);
assert.equal(safeEqual(undefined, 'token'), false);
console.log('Binance bridge unit tests passed.');
