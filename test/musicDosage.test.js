'use strict';
// #591 dosage rules (owner 23.10 15:54), tests for rules 1 and 2:
// 1. the way an item is solved with (its primary way) comes only from a
//    strongly evidenced mechanism: M1 steady beat, M2 accented / grouped
//    beats, M3 note durations, M6 melodic and rhythmic patterns;
// 2. M4 polyrhythm, M5 pitch and M7 rhythmic movement (weak evidence) are
//    optional extra practice only, never primary, always marked
//    evidence: 'weak'.
// Rule 4 inside a grade: the primary ways of a standard share one mechanism,
// and a standard taught in several grades keeps it.
// DOSED lists the grades already converted; each PR of the stack adds one.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');

const FILES = [1, 2, 3, 4, 5, 6].map((n) => require('../src/lib/curriculum/grade' + n));
const DOSED = ['א', 'ב'];
const { primary: STRONG, optionalOnly: WEAK } = banks.MUSIC_DOSAGE;
const dosed = FILES.filter((f) => DOSED.includes(f.grade));
const each = (fn) => dosed.forEach((f) => Object.keys(f.music).forEach((key) => fn(f, key, f.music[key])));

test('the dosage classes split the evidenced mechanisms M1-M7', () => {
  assert.deepEqual(STRONG, ['M1', 'M2', 'M3', 'M6']);
  assert.deepEqual(WEAK, ['M4', 'M5', 'M7']);
  assert.equal(banks.isOptionalWay(['t', 'n', 's', 'A']), false);
  assert.equal(banks.isOptionalWay(['t', 'n', 's', 'A', { optional: true, evidence: 'weak' }]), true);
  assert.deepEqual(banks.primaryWays([['a'], ['b', 'n', 's', 'A', { optional: true }]]), [['a']]);
});

test('rule 1: every standard has a primary way, and every primary way is M1, M2, M3 or M6', () => {
  const wrong = [];
  each((f, key, ways) => {
    const primary = banks.primaryWays(ways);
    if (!primary.length) wrong.push(f.grade + ' ' + key + ' has no primary way');
    primary.forEach(([tag]) => {
      if (!STRONG.includes(banks.mechanismOf(tag))) wrong.push(f.grade + ' ' + key + ' ' + tag + ' ' + banks.mechanismOf(tag));
    });
  });
  assert.deepEqual(wrong, []);
});

test('rule 2: an M4, M5 or M7 way is never primary and is always marked optional with evidence weak', () => {
  const wrong = [];
  each((f, key, ways) => ways.forEach((w) => {
    const weak = WEAK.includes(banks.mechanismOf(w[0]));
    const opts = w[4] || {};
    if (weak && !(opts.optional === true && opts.evidence === 'weak')) wrong.push(f.grade + ' ' + key + ' ' + w[0] + ' not marked weak');
    if (!weak && opts.evidence === 'weak') wrong.push(f.grade + ' ' + key + ' ' + w[0] + ' marked weak but is ' + banks.mechanismOf(w[0]));
  }));
  assert.deepEqual(wrong, []);
});

test('rule 4 in a standard: its primary ways share one mechanism', () => {
  const wrong = [];
  each((f, key, ways) => {
    const mechs = new Set(banks.primaryWays(ways).map(([tag]) => banks.mechanismOf(tag)));
    if (mechs.size !== 1) wrong.push(f.grade + ' ' + key + ' ' + [...mechs].join('+'));
  });
  assert.deepEqual(wrong, []);
});

test('rule 4 across grades: a standard taught in several grades keeps its primary mechanism', () => {
  const seen = {};
  const wrong = [];
  each((f, key, ways) => {
    const m = banks.mechanismOf(banks.primaryWays(ways)[0][0]);
    if (seen[key] && seen[key][1] !== m) wrong.push(key + ': ' + seen[key].join(' ') + ' → ' + f.grade + ' ' + m);
    if (!seen[key]) seen[key] = [f.grade, m];
  });
  assert.deepEqual(wrong, []);
});

test('items: the way shown is primary and strong; optional ways ride along, weak ones marked', () => {
  let extras = 0;
  banks.allItems().filter((it) => DOSED.includes(it.grade) && it.musicNote).forEach((it) => {
    assert.ok(STRONG.includes(banks.mechanismOf(it.music)), it.id + ' ' + it.music);
    (it.musicExtra || []).forEach((x) => {
      extras++;
      const weak = WEAK.includes(banks.mechanismOf(x.music));
      assert.equal(x.evidence, weak ? 'weak' : 'strong', it.id + ' ' + x.music);
      assert.ok(x.note && banks.MUSIC_SOURCES[x.src] && ['D', 'R', 'A'].includes(x.ev), it.id + ' ' + x.music);
      assert.notEqual(x.music, it.music, it.id);
    });
  });
  assert.ok(extras > 0);
});
