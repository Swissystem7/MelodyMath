'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { isCorrect, isDecimalAnswer } = require('../src/lib/adaptive');
const banks = require('../src/lib/banks');
const engine = require('../src/lib/musicEngine');
const poly = require('../src/lib/polyrhythm');

const music = (skill, tag) => banks.rowsOf(skill, 'ה').filter((x) => x.music === tag);

test('lcm: two drums meet at the least common multiple', () => {
  assert.equal(poly.lcmOf(3, 2), 6);
  assert.equal(poly.lcmOf(4, 6), 12);
  assert.equal(poly.lcmOf(2, 3, 4), 12);
  assert.equal(poly.lcmOf(5), 5);
  assert.equal(poly.lcmOf(), null);
  assert.equal(poly.lcmOf(0, 3), null);
  assert.equal(poly.lcmOf(2.5, 3), null);
  assert.deepEqual(poly.meetingPulses(3, 2, 12), [0, 6]);
  assert.deepEqual(poly.meetingPulses(3, 'x', 12), []);
});

test('factors, meters and primes of a bar', () => {
  assert.deepEqual(poly.factorsOf(12), [1, 2, 3, 4, 6, 12]);
  assert.deepEqual(poly.metersOf(12), [2, 3, 4, 6]);
  assert.deepEqual(poly.metersOf(7), []);
  assert.equal(poly.isPrimeBeats(7), true);
  assert.equal(poly.isPrimeBeats(9), false);
  assert.equal(poly.isPrimeBeats(1), false);
  assert.deepEqual(poly.factorsOf(-4), []);
});

test('seconds per beat is 60/BPM and agrees with the music engine', () => {
  assert.equal(poly.secondsPerBeat(120), 0.5);
  assert.equal(poly.secondsPerBeat(80), 0.75);
  assert.equal(poly.secondsPerBeat(0), null);
  [60, 80, 100, 120, 150, 240].forEach((bpm) => {
    assert.equal(poly.secondsPerBeat(bpm), engine.bpmToSeconds(bpm), String(bpm));
  });
});

test('drum-meeting items agree with lcmOf', () => {
  const rows = music('fractions', 'drumsMeet');
  assert.ok(rows.length >= 4);
  rows.forEach((it) => {
    const nums = (it.prompt.match(/כל (\d+)/g) || []).map((s) => Number(s.slice(3)));
    assert.ok(nums.length >= 2, it.prompt);
    assert.equal(Number(it.answer), poly.lcmOf.apply(null, nums), it.prompt);
  });
});

test('meter items agree with the factor logic', () => {
  const rows = music('fractions', 'meters');
  assert.ok(rows.length >= 4);
  const groups = rows.filter((it) => it.prompt.startsWith('לכמה גדלים'));
  assert.equal(groups.length, 2);
  groups.forEach((it) => {
    const n = Number(/לחלק (\d+) פעימות/.exec(it.prompt)[1]);
    assert.equal(Number(it.answer), poly.metersOf(n).length, it.prompt);
  });
  const eighteen = rows.find((it) => it.prompt.includes('18'));
  assert.equal(Number(eighteen.answer), poly.factorsOf(18).length);
});

test('mixed-bar items add up over the shortest note', () => {
  music('fractions', 'mixedBar').forEach((it) => {
    const sum = /: ([\d/ +]+) = \?/.exec(it.prompt);
    if (!sum) return;
    const total = sum[1].split('+').map((s) => s.trim()).reduce((acc, f) => engine.addFractions(acc, engine.toFraction(f)), engine.makeFraction(0, 1));
    assert.ok(isCorrect(total.n + '/' + total.d, it.answer), it.prompt);
  });
  const fill = engine.measureFill('4/4', ['1/2', '1/4', '1/8', '1/16']);
  const full = music('fractions', 'mixedBar').find((it) => it.prompt.includes('חצי, רבע, שמינית'));
  assert.ok(isCorrect(fill.remainder.n + '/' + fill.remainder.d, full.answer));
});

test('seconds-per-beat items are decimal answers checked through isDecimalAnswer', () => {
  const rows = music('decimals', 'secPerBeat');
  assert.ok(rows.length >= 4);
  rows.forEach((it) => {
    const m = /ב־(\d+) BPM/.exec(it.prompt);
    if (!m) return;
    const s = String(poly.secondsPerBeat(Number(m[1])));
    assert.ok(isDecimalAnswer(s), s);
    assert.ok(isCorrect(s, it.answer), it.prompt);
    assert.ok(isCorrect(s.replace('.', ','), it.answer), it.prompt);
  });
});

test('the do-re-mi chart is a bar chart and its items read it right', () => {
  const rows = music('data', 'hzChart');
  assert.ok(rows.length >= 4);
  rows.forEach((it) => {
    assert.equal(it.widget, 'barchart');
    assert.equal(it.strand, banks.STRAND.DATA);
  });
  const hz = Object.fromEntries(rows[0].chart.bars.map((b) => [b.label, b.value]));
  assert.equal(Number(rows.find((it) => it.prompt.includes('התדר של רה')).answer), hz['רה']);
  assert.equal(Number(rows.find((it) => it.prompt.includes('מי גבוה מדו')).answer), hz['מי'] - hz['דו']);
});

test('grade ה׳ now has data, and the diagnostic asks two levels of every skill', () => {
  assert.deepEqual(banks.skillsForGrade('ה'), ['fractions', 'decimals', 'data']);
  ['fractions', 'decimals', 'data'].forEach((skill) => {
    const levels = banks.diagnosticItems('ה').filter((x) => x.skill === skill).map((x) => x.level);
    assert.deepEqual(levels, [1, 2], skill);
  });
});
