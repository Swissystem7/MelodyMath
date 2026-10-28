'use strict';
// Refs #831: class-mode choices for a non-counting answer are near the answer,
// not three picks from a fixed fraction pool.
const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/lib/teacherStore');
const banks = require('../src/lib/banks');

function seeded(seed) {
  let s = seed >>> 0;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
const UNI = { '½': '1/2', '¼': '1/4', '⅛': '1/8' };
function frac(x) {
  const m = /^(\d+)\/(\d+)$/.exec(UNI[String(x).trim()] || String(x).trim());
  return m ? { n: Number(m[1]), d: Number(m[2]), v: Number(m[1]) / Number(m[2]) } : null;
}
function valueOf(x) { const f = frac(x); return f ? f.v : Number(x); }
const same = (x, y) => Math.abs(x - y) < 1e-9;

function check(answer, seed, grade) {
  const opts = store.makeChoices(answer, seeded(seed));
  const f = frac(answer);
  const target = valueOf(answer);
  assert.equal(opts.length, 4, 'four options for ' + answer);
  const vals = opts.map(valueOf);
  assert.ok(vals.every(Number.isFinite), 'numeric options for ' + answer);
  assert.equal(vals.filter((v) => same(v, target)).length, 1, 'answer appears once by value: ' + answer);
  const others = opts.filter((o, i) => !same(vals[i], target));
  const ov = others.map(valueOf);
  assert.equal(ov.length, 3);
  assert.ok(ov.every((v, i) => ov.findIndex((w) => same(v, w)) === i), 'distractors distinct by value: ' + answer + ' -> ' + opts);
  const proper = f && f.n < f.d;
  const span = proper ? 0.5 + 1e-9 : f ? 3 / f.d + 1e-9 : 4;
  others.forEach((o) => {
    const v = valueOf(o);
    assert.ok(v >= 0, 'non-negative distractor for ' + answer);
    assert.ok(Math.abs(v - target) <= span, 'distractor ' + o + ' too far from ' + answer);
    if (!f) return;
    const of = frac(o);
    assert.ok(of && of.n > 0, 'no 0/x distractor for ' + answer + ': ' + o);
    if (proper) assert.ok(v > 0 && v < 1, 'proper answer ' + answer + ' got improper ' + o);
  });
  if (f && grade === 'ד') {
    opts.forEach((o) => { const of = frac(o); assert.ok(of && of.n > 0 && of.n < of.d, 'grade ד option ' + o); });
  }
  return opts;
}

test('every non-counting class item gets four near choices (grades א-ו)', () => {
  let n = 0;
  ['א', 'ב', 'ג', 'ד', 'ה', 'ו'].forEach((g) => {
    banks.classItems(g).forEach((it, i) => {
      if (it.skill === 'counting') return;
      const a = String(it.answer).trim();
      if (!frac(a) && !(a !== '' && Number.isFinite(Number(a)))) return; // text answers
      check(it.answer, 7 + i, g);
      n++;
    });
  });
  assert.ok(n > 50, 'checked ' + n + ' items');
});

test('specific answers: 5/2, 5/6, 0, 1/8, 1/2, 1/3', () => {
  for (const a of ['5/2', '5/6', 0, '1/8', '⅛', '11/12', '2/4', '1/2', '½', '1/3', '2/3', '7/8']) for (let s = 1; s < 20; s++) check(a, s);
  assert.ok(!store.makeChoices('2/4', seeded(3)).includes('1/2'), '1/2 equals 2/4');
  const set = (a) => store.makeChoices(a, seeded(5)).filter((x) => x !== a).sort().join(',');
  assert.notEqual(set('5/2'), set('5/6'), 'distractors depend on the answer');
  assert.notEqual(set('5/6'), set('11/12'));
  const oldPool = ['1/2', '1/4', '1/8', '1', '3/4', '0'];
  assert.ok(!store.makeChoices('5/2', seeded(5)).every((x) => x === '5/2' || oldPool.includes(x)));
  assert.deepEqual(store.makeChoices('5/2', seeded(5)).slice().sort(), ['3/2', '4/2', '5/2', '6/2']);
  assert.deepEqual(store.makeChoices('1/2', seeded(5)).slice().sort(), ['1/2', '1/3', '1/4', '2/3']);
  assert.deepEqual(store.makeChoices('1/3', seeded(5)).slice().sort(), ['1/3', '1/4', '1/5', '2/3']);
});
