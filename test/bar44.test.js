const test = require('node:test');
const assert = require('node:assert/strict');
const bar = require('../src/lib/bar44');
const { isCorrect } = require('../src/lib/adaptive');

test('1/2, 1/4 and 1/8 map onto eighths of a 4/4 bar', () => {
  assert.equal(bar.eighthsOf('1/2'), 4);
  assert.equal(bar.eighthsOf('1/4'), 2);
  assert.equal(bar.eighthsOf('1/8'), 1);
  assert.equal(bar.eighthsOf('½'), 4);
  assert.equal(bar.fractionFromEighths(4), '1/2');
  assert.equal(bar.fractionFromEighths(2), '1/4');
  assert.equal(bar.fractionFromEighths(1), '1/8');
  assert.equal(bar.fractionFromEighths(8), '1');
});

test('½ and 1/2 are the same fraction answer, and 0.5 is not required', () => {
  assert.equal(bar.sameFraction('½', '1/2'), true);
  assert.equal(bar.sameFraction('1/4', '2/8'), true);
  assert.ok(isCorrect('1/2', '1/2'));
  assert.ok(isCorrect('½', '1/2'));
  assert.ok(isCorrect('1 / 4', '1/4'));
});

test('the bar drawing names a 4/4 bar and has eight cells', () => {
  const html = bar.renderBar44Html({ fraction: '1/2' }, false);
  assert.match(html, /תיבה 4\/4/);
  assert.equal((html.match(/bar44-cell/g) || []).length, 8);
  assert.match(html, /מלא: 1\/2/);
});
