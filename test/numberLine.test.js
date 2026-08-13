const test = require('node:test');
const assert = require('node:assert/strict');
const line = require('../src/lib/numberLine');

test('a jump on the line is addition or subtraction, then clamped', () => {
  assert.equal(line.jumpOnLine(3, 4, { min: 0, max: 20 }), 7);
  assert.equal(line.jumpOnLine(8, -3, { min: 0, max: 20 }), 5);
  assert.equal(line.jumpOnLine(90, 20, { min: 0, max: 100 }), 100);
  assert.equal(line.jumpOnLine(5, -10, { min: 0, max: 20 }), 0);
});

test('ticks cover the closed interval and percent is 0–100', () => {
  const ticks = line.ticksOf({ min: 0, max: 10, step: 1 });
  assert.deepEqual(ticks.slice(0, 3), [0, 1, 2]);
  assert.equal(ticks[ticks.length - 1], 10);
  assert.equal(line.percentOnLine(0, { min: 0, max: 20 }), 0);
  assert.equal(line.percentOnLine(10, { min: 0, max: 20 }), 50);
  assert.equal(line.percentOnLine(20, { min: 0, max: 20 }), 100);
});

test('the HTML marks ticks and announces the selected number', () => {
  const html = line.renderNumberLineHtml({ min: 0, max: 10, start: 4 }, 4);
  assert.match(html, /aria-label="ישר מספרים/);
  assert.match(html, /data-n="4"/);
  assert.match(html, /נבחר: 4/);
  assert.doesNotMatch(html, /<script/);
});
