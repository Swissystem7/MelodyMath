'use strict';
// #689 (Refs #665): lcmDrums marked as an optional extra practice method
// (EXTRA) across grades ב׳/ג׳/ד׳/ה׳ (with M2 mechanism and rissman2005 citation).
// In grade ג׳ (MUL_C): repeatedBars is the single primary way, accentSkip is
// an EXTRA method, and lcmDrums is an EXTRA method (not main), matching
// how other grades mark extras.
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

test('grade ג׳ MUL_C: lcmDrums is marked as an EXTRA method (not main), matching other grades', () => {
  const ways = g3.music.MUL_C;
  const lcm = ways.find((w) => w[0] === 'lcmDrums');
  assert.ok(lcm, 'lcmDrums must exist in MUL_C');
  assert.equal(banks.isOptionalWay(lcm), true, 'lcmDrums must be marked as optional/extra');
  assert.equal(lcm[2], 'rissman2005', 'must cite rissman2005');
  assert.equal(lcm[3], 'R', 'evidence rating must be R');
  assert.deepEqual(lcm[4], { optional: true });

  // lcmDrums must NOT be a primary way
  assert.ok(!banks.primaryWays(ways).some((w) => w[0] === 'lcmDrums'), 'lcmDrums must not be a primary/main method');

  // Grade 3 MUL_C must keep exactly one main musical method
  const primary = banks.primaryWays(ways);
  assert.equal(primary.length, 1, 'MUL_C must keep exactly one main musical method');
  assert.equal(primary[0][0], 'repeatedBars', 'repeatedBars must be the sole main method');

  // accentSkip is also an EXTRA method
  const accent = ways.find((w) => w[0] === 'accentSkip');
  assert.ok(accent, 'accentSkip must exist in MUL_C');
  assert.equal(banks.isOptionalWay(accent), true, 'accentSkip must be marked as optional/extra');

  // lcmDrums mechanism is M2 (strongly evidenced dosage)
  assert.ok(banks.MUSIC_DOSAGE.primary.includes(banks.mechanismOf('lcmDrums')), banks.mechanismOf('lcmDrums'));
  // The simultaneous polyrhythm activities stay in the weak mechanism.
  assert.ok(banks.MUSIC_DOSAGE.optionalOnly.includes(banks.mechanismOf('drumsMeet')));
  assert.match(NOTE, /3/);
  assert.match(NOTE, /4/);
  assert.match(NOTE, /12/);
  assert.match(NOTE, /עיגול לכל צליל/);
});

test('mechanism M2 does not cite rissman2005 (lcmDrums cites rissman2005 as its own source)', () => {
  assert.ok(!banks.MUSIC_MECHANISMS.M2.sources.includes('rissman2005'), 'M2 must not cite rissman2005');
  assert.ok(!banks.MUSIC_MECHANISMS.M2.finding.includes('Rissman'), 'M2 finding must not include Rissman');
  assert.ok(banks.MUSIC_MECHANISMS.M4.sources.includes('rissman2005'), 'M4 sources must keep rissman2005');
});

test('grade ג׳ MUL_C: items solve through primary way repeatedBars and lcmDrums rides along as musicExtra', () => {
  const items = banks.itemsForGrade('ג').filter((it) => it.standard === banks.ST.MUL_C);
  assert.ok(items.length > 0);
  const withNote = items.filter((it) => it.musicNote);
  assert.ok(withNote.length > 0);
  withNote.forEach((it) => {
    assert.equal(it.music, 'repeatedBars', it.id);
  });
  // lcmDrums is not a primary way on any item
  items.forEach((it) => {
    assert.notEqual(it.music, 'lcmDrums', it.id);
  });
  // lcmDrums rides along as an optional extra
  const withExtra = items.filter((it) => (it.musicExtra || []).some((x) => x.music === 'lcmDrums'));
  assert.ok(withExtra.length > 0, 'MUL_C items must have lcmDrums in musicExtra');
  withExtra.forEach((it) => {
    const extra = it.musicExtra.find((x) => x.music === 'lcmDrums');
    assert.equal(extra.src, 'rissman2005');
    assert.equal(extra.ev, 'R');
    assert.equal(extra.note, NOTE);
  });
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

test('grades ב׳, ג׳, ד׳ and ה׳ keep lcmDrums as optional extra practice only', () => {
  [[g2, 'MUL_B'], [g3, 'MUL_C'], [g4, 'MUL_DIV_VERT'], [g5, 'PRIME_FACTOR']].forEach(([file, key]) => {
    const ways = file.music[key];
    const lcm = ways.find((w) => w[0] === 'lcmDrums');
    assert.ok(lcm, file.grade + ' ' + key);
    assert.equal(banks.isOptionalWay(lcm), true, file.grade + ' ' + key);
    assert.equal(lcm[2], 'rissman2005', file.grade + ' ' + key);
    assert.equal(lcm[3], 'R', file.grade + ' ' + key);
    assert.deepEqual(lcm[4], { optional: true }, file.grade + ' ' + key);
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
