'use strict';
// #673: kid-level lines on how a maths fact lives in each instrument family,
// content for #687's variation engine. Content only, one way per topic.
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../src/lib/instrumentLines');
const I = require('../src/lib/instruments');

const TOPICS = Object.keys(L.LINES);

test('every topic has a line for all four families', () => {
  assert.deepEqual(L.FAMILIES, I.FAMILIES);
  assert.deepEqual(TOPICS.sort(), ['addition', 'fractions', 'multiplication']);
  TOPICS.forEach((t) => L.FAMILIES.forEach((f) => {
    const e = L.LINES[t][f];
    assert.ok(e, t + '/' + f);
    assert.match(e.ask, /[א-ת]/, t + '/' + f + ' ask');
    assert.match(e.tell, /[א-ת]/, t + '/' + f + ' tell');
    assert.ok(e.ask.length <= 140 && e.tell.length <= 140, t + '/' + f + ' kid-short');
  }));
});

test('instruments come from instruments.js and match the family', () => {
  TOPICS.forEach((t) => L.FAMILIES.forEach((f) => {
    const ids = L.LINES[t][f].instruments;
    assert.ok(ids.length >= 1, t + '/' + f);
    ids.forEach((id) => {
      const x = I.instrumentById(id);
      assert.ok(x, 'unknown instrument ' + id);
      assert.equal(x.family, f, id + ' family');
      assert.ok(!x.optional, id + ' is optional-only, not a main voice');
    });
    assert.equal(L.instrumentsFor(t, f).length, ids.length);
  }));
});

test('one primary way per topic (#665)', () => {
  assert.deepEqual(L.MECHANISM, { addition: 'M1', multiplication: 'M2', fractions: 'M3' });
  TOPICS.forEach((t) => assert.ok(I.PRIMARY.includes(L.MECHANISM[t]), t));
});

test('templates use only their topic params; ask hides the answer', () => {
  const answer = { addition: 'sum', multiplication: 'product' };
  TOPICS.forEach((t) => L.FAMILIES.forEach((f) => {
    const e = L.LINES[t][f];
    const used = (s) => (s.match(/\{(\w+)\}/g) || []).map((m) => m.slice(1, -1));
    used(e.ask).concat(used(e.tell)).forEach((k) => assert.ok(L.PARAMS[t].includes(k), t + '/' + f + ' {' + k + '}'));
    if (answer[t]) {
      assert.ok(!used(e.ask).includes(answer[t]), t + '/' + f + ' ask shows answer');
      assert.ok(used(e.tell).includes(answer[t]), t + '/' + f + ' tell lacks answer');
    }
  }));
});

test('lineFor fills the numbers, e.g. 3 + 2', () => {
  const line = L.lineFor('addition', 'percussion', { a: 3, b: 2, sum: 5 });
  assert.equal(line.mechanism, 'M1');
  assert.match(line.ask, /3 מכות/);
  assert.ok(!/5/.test(line.ask));
  assert.match(line.tell, /3 \+ 2 = 5/);
  assert.ok(!/[{}]/.test(line.ask + line.tell));
  const m = L.lineFor('multiplication', 'keys', { groups: 4, size: 3, product: 12 });
  assert.match(m.tell, /4 × 3 = 12/);
  const fr = L.lineFor('fractions', 'winds', { num: 3, den: 4 });
  assert.match(fr.tell, /3\/4/);
});

test('lineFor rejects missing numbers and unknown topics', () => {
  assert.throws(() => L.lineFor('addition', 'strings', { a: 1 }), /missing param b/);
  assert.equal(L.lineFor('geometry', 'keys', {}), null);
  assert.equal(L.lineFor('addition', 'brass', {}), null);
  assert.deepEqual(L.instrumentsFor('geometry', 'keys'), []);
});
