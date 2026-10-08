const test = require('node:test');
const assert = require('node:assert/strict');
const line = require('../src/lib/numberLine');

test('an imported line with a huge range keeps at most 101 ticks', () => {
  const ticks = line.ticksOf({ min: 0, max: 1e9 });
  assert.ok(ticks.length <= 101, 'ticks: ' + ticks.length);
  assert.equal(ticks[0], 0);
  assert.equal(ticks[ticks.length - 1], 1e6);
  const html = line.renderNumberLineHtml({ min: 0, max: 1e9 });
  assert.ok((html.match(/class="nline-tick/g) || []).length <= 101);
});

test('endpoints past the safe range do not hang the tick loop', () => {
  const ticks = line.ticksOf({ min: 1e20, max: 1e20 });
  assert.ok(ticks.length > 1 && ticks.length <= 101);
  const L = line.normalizeLine({ min: -1e30, max: 5 });
  assert.equal(L.min, -1e6);
  assert.equal(L.max, 5);
});

test('ordinary grade-1 lines keep step 1', () => {
  assert.equal(line.normalizeLine({ min: 0, max: 20 }).step, 1);
  assert.equal(line.ticksOf({ min: 0, max: 100 }).length, 101);
  assert.equal(line.normalizeLine({ min: 0, max: 100, step: 10 }).step, 10);
});
