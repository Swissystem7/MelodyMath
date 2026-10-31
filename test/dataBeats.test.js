// #591 DataBeats + PercentMix (owner comment 6376162984): data through a
// time-mapped bar graph, percent through 100 sub-beats of one bar, and the
// pre/post/30-day measurement of 6376159285.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const DB = require('../src/lib/music/dataBeats.js');
const VOICES = require('../src/lib/instrumentVoices.js').VOICES;

// ---------- sonifySeries ----------

test('sonifySeries maps every column to its number of taps, in time order', () => {
  const s = DB.sonifySeries([2, 4, 1], { bpm: 120 });
  assert.equal(s.mapping, 'time');
  assert.equal(s.mechanism, 'M1');
  assert.equal(s.pitch, null, 'pitch is off by default');
  assert.deepEqual(s.bars.map((b) => b.value), [2, 4, 1]);
  assert.equal(s.notes.length, 7, 'one tap per unit');
  [0, 1, 2].forEach((bar) => assert.equal(s.notes.filter((n) => n.bar === bar).length, [2, 4, 1][bar]));
  // Time order: every tap of column k comes before every tap of column k+1.
  for (let i = 1; i < s.notes.length; i++) assert.ok(s.notes[i].at > s.notes[i - 1].at);
  assert.ok(s.notes.every((n) => n.hz === undefined && n.voice === DB.TAP_VOICE));
});

test('sonifySeries gives every column the same time slot plus a silent gap', () => {
  const s = DB.sonifySeries([3, 1, 3], { bpm: 120 });
  const tap = 60 / 120 / 2;
  assert.equal(s.tap, tap);
  const starts = s.bars.map((b) => b.start);
  assert.ok(Math.abs((starts[1] - starts[0]) - (starts[2] - starts[1])) < 1e-9, 'x-axis is time: equal spacing');
  assert.ok(starts[1] - starts[0] >= 3 * tap + tap, 'a gap separates the columns');
  assert.equal(s.bars[1].end - s.bars[1].start, tap, 'a short column ends early, the slot stays');
  const zero = DB.sonifySeries([0, 2]);
  assert.equal(zero.notes.filter((n) => n.bar === 0).length, 0, 'a zero column is a silent slot');
});

test('sonifySeries pitch add-on is optional, weak evidence, and rises with the value', () => {
  const s = DB.sonifySeries([1, 3, 5], { pitch: true });
  assert.deepEqual(s.pitch, { mechanism: 'M5', optional: true, evidence: 'weak' });
  const hzOf = (bar) => s.notes.find((n) => n.bar === bar).hz;
  assert.ok(hzOf(0) < hzOf(1) && hzOf(1) < hzOf(2));
  assert.ok(VOICES[s.notes[0].voice], 'a pitched voice from instrumentVoices');
  const flat = DB.sonifySeries([4, 4], { pitch: true });
  assert.equal(flat.notes[0].hz, flat.notes[flat.notes.length - 1].hz, 'a flat series is one pitch');
});

test('sonifySeries refuses what is not a column of taps', () => {
  [[], [1.5], [-1], [13], ['3'], null].forEach((bad) => assert.throws(() => DB.sonifySeries(bad), RangeError, JSON.stringify(bad)));
  assert.equal(DB.sonifySeries([12]).notes.length, 12);
});

test('mean, trend and range of a series', () => {
  assert.equal(DB.mean([2, 4, 6, 8]), 5);
  assert.deepEqual(DB.range([3, 8, 5, 6]), { min: 3, max: 8, range: 5 });
  assert.equal(DB.trend([2, 4, 6, 8]), 'up');
  assert.equal(DB.trend([9, 7, 5, 3]), 'down');
  assert.equal(DB.trend([5, 5, 6, 4]), 'flat');
  assert.equal(DB.trend([4]), 'flat');
});

test('practice series: whole-number means, 2-4 choices, the answer among them', () => {
  DB.SERIES.forEach((s) => {
    assert.ok(Number.isInteger(DB.mean(s.values)), s.he);
    const qs = [DB.meanQuestion(s.values), DB.rangeQuestion(s.values)];
    if (!s.zigzag) qs.push(DB.trendQuestion(s.values));
    qs.forEach((q) => {
      assert.ok(q.choices.length >= 2 && q.choices.length <= 4, q.kind);
      assert.ok(q.choices.includes(q.answer), q.kind + ' ' + s.values);
      assert.equal(new Set(q.choices).size, q.choices.length);
    });
  });
  assert.ok(DB.SERIES.some((s) => DB.trend(s.values) === 'up') && DB.SERIES.some((s) => DB.trend(s.values) === 'down'));
});
