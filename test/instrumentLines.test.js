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

test('each primary way cites peer-reviewed studies already used by the app', () => {
  const banks = require('../src/lib/banks');
  const g6 = require('../src/lib/curriculum/grade6');
  assert.deepEqual(Object.keys(L.SOURCES).sort(), ['M1', 'M2', 'M3']);
  Object.keys(L.SOURCES).forEach((m) => {
    assert.ok(L.SOURCES[m].length >= 1, m);
    L.SOURCES[m].forEach((s) => {
      assert.ok(s.authors && s.title && s.venue && Number.isInteger(s.year), m + ' ' + s.id);
      assert.match(s.url, /^https:\/\/(doi\.org\/10\.|pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC\d+\/$)/, s.id);
      const known = banks.MUSIC_SOURCES[s.id] || g6.sources[s.id];
      assert.ok(known && known[1] === s.url, s.id + ' matches the app citation');
    });
  });
});

const MUSIC_WORDS = /תוף|תופ|מכה|מכות|מיתר|פריט|פורט|נושפ|נשיפ|צליל|קליד|לחיצ|לוחצ|תיבה|קשת|מפוח|נגנ|פעימ|קצב|מוזיק|שיר|תווים|כלי/;
const plain = (s) => s.replace(/[֑-ׇ]/g, '');

test('noMusicCheck asks the bare fact with no music words and the right answer', () => {
  const cases = [
    ['addition', { a: 3, b: 2 }, 5],
    ['addition', { a: 0, b: 7 }, 7],
    ['multiplication', { groups: 4, size: 3 }, 12],
    ['multiplication', { groups: 2, size: 5 }, 10],
    ['fractions', { num: 3, den: 4 }, '3/4'],
    ['fractions', { num: 1, den: 2 }, '1/2'],
  ];
  const names = I.INSTRUMENTS.map((x) => plain(x.instrument.he));
  cases.forEach(([t, p, want]) => {
    const c = L.noMusicCheck(t, p);
    assert.deepEqual(Object.keys(c).sort(), ['answer', 'ask']);
    assert.equal(c.answer, want, t);
    assert.match(c.ask, /[א-ת]/, t);
    assert.ok(!/[{}]/.test(c.ask), t);
    assert.ok(!MUSIC_WORDS.test(c.ask), t + ' has a music word: ' + c.ask);
    names.forEach((n) => assert.ok(!c.ask.includes(n), t + ' names ' + n));
    assert.ok(!c.ask.includes(String(want)) || t === 'addition' && p.a === 0, t + ' ask shows answer');
  });
  // the word list really catches the musical lines
  L.FAMILIES.forEach((f) => Object.keys(L.LINES).forEach((t) => assert.ok(MUSIC_WORDS.test(L.LINES[t][f].ask), t + '/' + f)));
});

test('noMusicCheck covers every topic and rejects bad numbers', () => {
  Object.keys(L.LINES).forEach((t) => assert.ok(L.noMusicCheck(t, t === 'fractions' ? { num: 1, den: 3 } : { a: 1, b: 1, groups: 1, size: 1 }), t));
  assert.equal(L.noMusicCheck('geometry', {}), null);
  assert.throws(() => L.noMusicCheck('addition', { a: 1 }), /bad param b/);
  assert.throws(() => L.noMusicCheck('multiplication', { groups: -1, size: 2 }), /bad param groups/);
  assert.throws(() => L.noMusicCheck('fractions', { num: 1, den: 0 }), /bad fraction/);
  assert.throws(() => L.noMusicCheck('fractions', { num: 5, den: 4 }), /bad fraction/);
});

test('lineFor rejects missing numbers and unknown topics', () => {
  assert.throws(() => L.lineFor('addition', 'strings', { a: 1 }), /missing param b/);
  assert.equal(L.lineFor('geometry', 'keys', {}), null);
  assert.equal(L.lineFor('addition', 'brass', {}), null);
  assert.deepEqual(L.instrumentsFor('geometry', 'keys'), []);
});
