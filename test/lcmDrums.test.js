'use strict';
// #689 (Refs #665): lcmDrums restored as a primary interactive method for
// its LCM / commutativity topic in grade ג׳ (MUL_C): repeatedBars stays the
// first primary way from grade 2, lcmDrums comes after it as the second primary
// way (a drum every 3 beats and a drum every 4 beats meet at 12, one circle
// per sound), and the end-of-topic check is silent. In grades ב׳/ד׳/ה׳ lcmDrums
// stays optional extra practice.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const poly = require('../src/lib/polyrhythm');
const uc = require('../src/lib/unitCheck');
const g2 = require('../src/lib/curriculum/grade2');
const g3 = require('../src/lib/curriculum/grade3');
const g4 = require('../src/lib/curriculum/grade4');
const g5 = require('../src/lib/curriculum/grade5');

const lcmWay = g3.music.MUL_C.find((w) => w[0] === 'lcmDrums');
const NOTE = lcmWay[1];

test('grade ג׳ MUL_C: repeatedBars from grade 2 must stay the FIRST main method; lcmDrums must not come before it', () => {
  const primary = banks.primaryWays(g3.music.MUL_C);
  assert.equal(primary[0][0], 'repeatedBars', 'repeatedBars must stay the first main method');
  const repIdx = primary.findIndex((w) => w[0] === 'repeatedBars');
  const lcmIdx = primary.findIndex((w) => w[0] === 'lcmDrums');
  assert.ok(repIdx !== -1 && lcmIdx !== -1, 'both repeatedBars and lcmDrums must be primary ways');
  assert.ok(repIdx < lcmIdx, 'repeatedBars must come before lcmDrums (lcmDrums must not come before it)');
  assert.equal(primary[1][0], 'lcmDrums');
  assert.equal(banks.isOptionalWay(lcmWay), false);
  assert.equal(lcmWay[4], undefined);
  // A primary way must use a strongly evidenced mechanism (dosage rule 1).
  assert.ok(banks.MUSIC_DOSAGE.primary.includes(banks.mechanismOf('lcmDrums')), banks.mechanismOf('lcmDrums'));
  // The simultaneous polyrhythm activities stay in the weak mechanism.
  assert.ok(banks.MUSIC_DOSAGE.optionalOnly.includes(banks.mechanismOf('drumsMeet')));
  assert.match(NOTE, /3/);
  assert.match(NOTE, /4/);
  assert.match(NOTE, /12/);
});

test('grade ג׳ MUL_C: level-1 items use repeatedBars and level-2 items are solved through lcmDrums', () => {
  const items = banks.itemsForGrade('ג').filter((it) => it.standard === banks.ST.MUL_C);
  assert.ok(items.length > 0);
  const level1 = items.filter((it) => it.level === 1 && it.musicNote);
  assert.ok(level1.length > 0);
  level1.forEach((it) => {
    assert.equal(it.music, 'repeatedBars', it.id);
  });
  const level2 = items.filter((it) => it.level === 2 && it.musicNote);
  assert.ok(level2.length > 0);
  level2.forEach((it) => {
    assert.equal(it.music, 'lcmDrums', it.id);
    assert.equal(it.musicNote, NOTE, it.id);
  });
  // lcmDrums is the way itself here, never an optional extra riding along.
  items.forEach((it) => assert.ok(!(it.musicExtra || []).some((x) => x.music === 'lcmDrums'), it.id));
});

test('drums every 3 and every 4 beats meet first at 12, one circle per sound', () => {
  assert.equal(poly.lcmOf(3, 4), 12);
  assert.deepEqual(poly.meetingPulses(3, 4, 25), [0, 12, 24]);
  // One circle per sound: in beats 1..12 drum A sounds on 3, 6, 9, 12 and
  // drum B on 4, 8, 12; each sound is one slot, and they coincide only at 12.
  const hits = new Set();
  for (let b = 1; b <= 12; b++) {
    if (b % 3 === 0) hits.add('A' + b);
    if (b % 4 === 0) hits.add('B' + b);
  }
  assert.equal(hits.size, 4 + 3);
  const both = [];
  for (let b = 1; b <= 12; b++) if (b % 3 === 0 && b % 4 === 0) both.push(b);
  assert.deepEqual(both, [12]);
});

test('the grade ה׳ drum-meeting activities still agree with lcmOf', () => {
  const rows = banks.rowsOf('fractions', 'ה').filter((it) => it.music === 'drumsMeet');
  assert.ok(rows.length >= 4);
  const target = rows.find((it) => it.prompt.includes('כל 3') && it.prompt.includes('כל 4'));
  assert.ok(target);
  assert.equal(Number(target.answer), 12);
});

test('grades ב׳, ד׳ and ה׳ keep lcmDrums as optional extra practice only', () => {
  [[g2, 'MUL_B'], [g4, 'MUL_DIV_VERT'], [g5, 'PRIME_FACTOR']].forEach(([file, key]) => {
    const ways = file.music[key];
    const lcm = ways.find((w) => w[0] === 'lcmDrums');
    assert.ok(lcm, file.grade + ' ' + key);
    assert.equal(banks.isOptionalWay(lcm), true, file.grade + ' ' + key);
    assert.ok(!banks.primaryWays(ways).some((w) => w[0] === 'lcmDrums'), file.grade + ' ' + key);
  });
});

test('end-of-topic check is silent: commutativity and LCM without music', () => {
  // Grade ג׳ check (#110): 3 groups of 4 and 4 groups of 3, both 12, no music.
  const pre = uc.formItems('mult-div-3', 'pre');
  const post = uc.formItems('mult-div-3', 'post');
  assert.equal(pre[0].answer, '12');
  assert.equal(post[0].answer, '12');
  assert.notEqual(pre[0].prompt, post[0].prompt);
  // Grade ה׳ LCM check: lcm(3, 4) = 12, also with no music cues at all.
  const lcmPre = uc.formItems('lcm-poly-5', 'pre').find((it) => it.skill === 'lcm' && it.level === 2);
  assert.equal(lcmPre.answer, '12');
  [pre, post, uc.formItems('lcm-poly-5', 'pre'), uc.formItems('lcm-poly-5', 'post')].flat().forEach((it) => {
    assert.equal(it.music, undefined, it.id);
    assert.equal(it.musicNote, undefined, it.id);
  });
  const allText = JSON.stringify([pre, post, uc.formItems('lcm-poly-5', 'pre'), uc.formItems('lcm-poly-5', 'post')]);
  assert.doesNotMatch(allText, /lcmDrums|drumsMeet/);
});
