const test = require('node:test');
const assert = require('node:assert/strict');
const g1 = require('../src/lib/grade1Music');

test('countBeats generates skip counting beats with accented multiples', () => {
  const byTwo = g1.countBeats(0, 2, 8);
  assert.equal(byTwo.length, 5);
  assert.deepEqual(byTwo.map((b) => b.value), [0, 2, 4, 6, 8]);
  assert.equal(byTwo[0].accented, false);
  assert.equal(byTwo[1].accented, true);
  assert.equal(byTwo[2].accented, true);

  const byFive = g1.countBeats(5, 5, 20);
  assert.deepEqual(byFive.map((b) => b.value), [5, 10, 15, 20]);
  assert.ok(byFive.every((b) => b.accented));

  assert.equal(g1.predictNextAccented(15, 5), 20);
  assert.equal(g1.predictNextAccented(8, 2), 10);
  assert.equal(g1.predictNextAccented(30, 10), 40);
});

test('scaleStepFreq and numberLineScaleJump implement scale steps where 10 steps is an octave', () => {
  const base = 220;
  assert.equal(g1.scaleStepFreq(base, 10), 440);
  assert.equal(g1.scaleStepFreq(base, -10), 110);
  assert.equal(g1.scaleStepFreq(base, 0), 220);

  const jump10 = g1.numberLineScaleJump(5, 15, base);
  assert.equal(jump10.jump, 10);
  assert.equal(jump10.frequency, 440);
  assert.equal(jump10.isOctave, true);

  const jump1 = g1.numberLineScaleJump(3, 4, base);
  assert.equal(jump1.jump, 1);
  assert.equal(jump1.isOctave, false);
  assert.equal(jump1.frequency, Math.round(base * Math.pow(2, 1 / 10) * 100) / 100);
});

test('chart100Sound encodes tens as low frequency tone and ones as clicks with Hebrew label', () => {
  const n7 = g1.chart100Sound(7, 110);
  assert.equal(n7.tens, 0);
  assert.equal(n7.ones, 7);
  assert.equal(n7.tensFreq, null);
  assert.equal(n7.clickCount, 7);
  assert.equal(n7.label, '7 ??????');

  const n30 = g1.chart100Sound(30, 110);
  assert.equal(n30.tens, 3);
  assert.equal(n30.ones, 0);
  assert.equal(n30.tensFreq, 143);
  assert.equal(n30.clickCount, 0);
  assert.equal(n30.label, '3 ?????');

  const n42 = g1.chart100Sound(42, 110);
  assert.equal(n42.tens, 4);
  assert.equal(n42.ones, 2);
  assert.equal(n42.tensFreq, 154);
  assert.equal(n42.clickCount, 2);
  assert.equal(n42.label, '4 ????? ?-2 ??????');

  const n100 = g1.chart100Sound(100, 110);
  assert.equal(n100.tens, 10);
  assert.equal(n100.ones, 0);
  assert.equal(n100.tensFreq, 220);
});

test('melodyPattern and createPatternChallenge produce repeating AB, AAB and ABC patterns with shapes and notes', () => {
  const ab = g1.melodyPattern('AB', 4);
  assert.equal(ab.length, 4);
  assert.deepEqual(ab.map((p) => p.name), ['?????', '?????', '?????', '?????']);
  assert.deepEqual(ab.map((p) => p.note), ['??', '??', '??', '??']);

  const aab = g1.melodyPattern('AAB', 6);
  assert.equal(aab.length, 6);
  assert.deepEqual(aab.map((p) => p.name), ['?????', '?????', '?????', '?????', '?????', '?????']);

  const abc = g1.melodyPattern('ABC', 6);
  assert.equal(abc.length, 6);
  assert.deepEqual(abc.map((p) => p.name), ['?????', '?????', '?????', '?????', '?????', '?????']);

  const challenge = g1.createPatternChallenge('AB', 5);
  assert.equal(challenge.sequence.length, 4);
  assert.equal(challenge.expected.name, '?????');
  assert.ok(challenge.choices.some((c) => c.name === challenge.expected.name));
});

const banks = require('../src/lib/banks');

test('banks contains Grade א music items for skip counting, 100-chart, patterns, and scale jumps', () => {
  const g1Items = banks.itemsForGrade('א');
  const skipBeats = g1Items.filter(it => it.prompt.includes('מקצב'));
  assert.ok(skipBeats.length >= 8);

  const chart100 = g1Items.filter(it => it.standard === banks.ST.CHART100);
  assert.equal(chart100.length, 12);
  assert.ok(chart100.every(it => it.hint && it.level >= 1 && it.level <= 3));

  const patterns = g1Items.filter(it => it.standard === banks.ST.PATTERN);
  assert.equal(patterns.length, 12);
  assert.ok(patterns.every(it => it.hint && it.level >= 1 && it.level <= 3));

  const scaleJumps = g1Items.filter(it => it.skill === 'number_line' && it.prompt.includes('סולם'));
  assert.ok(scaleJumps.length >= 1);
});
