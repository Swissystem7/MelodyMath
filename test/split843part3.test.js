'use strict';
// Split from #843, part 3. Refs #843, Refs #665.
// 1. A ten is 110 Hz in every place-value sound, one octave below a 220 Hz one.
// 2. Fraction choices are close distractors, never an obvious 0 or 1.
// 3. A varied worked example plays the notes of the sum on screen.
const test = require('node:test');
const assert = require('node:assert/strict');
const g1 = require('../src/lib/grade1Music.js');
const g2 = require('../src/lib/grade2Music.js');
const take = require('../src/lib/music/takeAwayTen.js');
const NP = require('../src/components/NumberPlay.js');
const store = require('../src/lib/teacherStore.js');
const banks = require('../src/lib/banks.js');
const V = require('../src/lib/exercises/variety.js');
const W = require('../src/lib/exercises/patternAndWorkedExample.js');

// ---------- 1. tens at 110 Hz ----------
test('hundreds chart: every ten is 110 Hz and every one is 220 Hz, for 1..100', () => {
  for (let n = 1; n <= 100; n++) {
    const s = g1.chart100Sound(n);
    assert.equal(s.tensFreq, s.tens ? 110 : null, 'tens of ' + n);
    const ev = g1.chart100Events(n);
    assert.equal(ev.filter((e) => e.hz === 110).length, s.tens, 'ten notes of ' + n);
    assert.equal(ev.filter((e) => e.hz === 220).length, s.ones, 'one notes of ' + n);
    assert.equal(ev.length, s.tens + s.ones);
  }
});

test('cube layers above 12: ten 110 Hz, one 220 Hz; 12 and below stay 220 Hz units', () => {
  for (let n = 13; n <= 100; n++) {
    g2.cubeLayerEvents(n).forEach((e) => assert.equal(e.hz, e.place === 'ten' ? 110 : 220, n + ' ' + e.place));
  }
  for (let n = 1; n <= 12; n++) assert.ok(g2.cubeLayerEvents(n).every((e) => e.hz === 220 && e.place === 'unit'));
});

test('vertical addition/subtraction: tens voice 110 Hz, ones voice one octave up', () => {
  assert.equal(g2.VOICES.bass.hz, 110);
  assert.equal(g2.VOICES.drum.hz, 2 * g2.VOICES.bass.hz);
  const s = g2.verticalVoices({ a: 47, b: 38, op: '+' });
  const ev = g2.phaseEvents(s.phases);
  assert.ok(ev.length > 0);
  assert.ok(ev.every((e) => e.hz === 110 || e.hz === 220), 'only 110/220 Hz: ' + ev.map((e) => e.hz));
});

test('take-away circles: every ten is 110 Hz, plain or held', () => {
  let tens = 0;
  [[8, 3], [12, 5], [34, 10], [56, 21], [99, 40]].forEach(([a, b]) => {
    const spec = take.takeAwayCircles(a, b);
    take.soundEvents(spec).forEach((e) => { if (e.v === 10) { tens++; assert.equal(e.hz, 110, a + '-' + b); } });
    const calls = [];
    const ac = { currentTime: 0, state: 'running', resume() {} };
    take.play(spec, { audioContext: ac, playVoice: (c, v, hz, t, d, o) => calls.push({ hz: hz, held: !!(o && o.dur > 0.3) }) });
    calls.filter((c) => c.held).forEach((c) => assert.equal(c.hz, 110, 'held ten ' + a));
  });
  assert.ok(tens > 0, 'tens were heard');
});

test('number play: a ten on a 220 Hz instrument is 110 Hz, one octave down (not 120)', () => {
  // oud plays 'pluck', a 220 Hz voice: its unit is 220, so its ten must be 110.
  const plan = NP.extractNumberPlan({ prompt: '5 × 20 = ?', skill: 'multiplication' }, { bpm: 60, instrument: 'oud' });
  const pluck = plan.notes.filter((n) => n.voice === 'pluck' && n.value === 10);
  assert.ok(pluck.length > 0, 'the oud plays tens');
  pluck.forEach((n) => assert.equal(n.hz, 110));
  plan.notes.filter((n) => n.value === 10).forEach((n) => assert.ok(n.hz >= 110));
});

// ---------- 2. close fraction distractors ----------
const UNI = { '½': '1/2', '¼': '1/4', '⅛': '1/8' };
function frac(x) {
  const m = /^(\d+)\/(\d+)$/.exec(UNI[String(x).trim()] || String(x).trim());
  return m ? { n: +m[1], d: +m[2], v: m[1] / m[2] } : null;
}
function seeded(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function checkFraction(answer, seed) {
  const opts = store.makeChoices(answer, seeded(seed));
  const f = frac(answer);
  assert.equal(opts.length, 4, answer);
  const fs = opts.map(frac);
  assert.ok(fs.every(Boolean), 'all options are fractions: ' + opts);
  assert.equal(fs.filter((x) => Math.abs(x.v - f.v) < 1e-9).length, 1, 'answer once by value: ' + opts);
  fs.forEach((x, i) => assert.equal(fs.findIndex((y) => Math.abs(y.v - x.v) < 1e-9), i, 'distinct values: ' + opts));
  fs.filter((x) => Math.abs(x.v - f.v) > 1e-9).forEach((x) => {
    assert.ok(x.n > 0, 'no 0 distractor: ' + opts);
    if (f.n < f.d) {
      assert.ok(x.n < x.d, 'proper answer ' + answer + ' got ' + x.n + '/' + x.d);
      assert.ok(Math.abs(x.v - f.v) <= 0.5 + 1e-9, 'close to ' + answer + ': ' + opts);
    }
  });
  return opts;
}

test('every fraction answer in the class banks gets four close choices', () => {
  let n = 0;
  ['א', 'ב', 'ג', 'ד', 'ה', 'ו'].forEach((g) => banks.classItems(g).forEach((it, i) => {
    if (!frac(it.answer)) return;
    checkFraction(it.answer, 11 + i);
    n++;
  }));
  assert.ok(n > 10, 'checked ' + n + ' fraction items');
});

test('distractors are the near misses a child makes: 1/3 vs 1/4, 2/4 vs 3/4', () => {
  for (let s = 1; s < 25; s++) {
    ['1/2', '½', '1/3', '2/3', '1/4', '2/4', '3/4', '1/8', '⅛', '3/8', '7/8', '5/6', '11/12', '3/16', '1/100', '5/2', '1/1'].forEach((a) => checkFraction(a, s));
  }
  const has = (a, x) => store.makeChoices(a, seeded(3)).includes(x);
  assert.ok(has('1/3', '1/4'), '1/3 offers 1/4');
  assert.ok(has('2/4', '3/4') && has('2/4', '1/4'), '2/4 offers 1/4 and 3/4');
  assert.ok(!has('2/4', '1/2'), '1/2 equals 2/4, so it is never a wrong choice');
  assert.ok(has('1/8', '2/8') && (has('1/8', '1/7') || has('1/8', '1/9')), '1/8 offers a same and a neighbouring denominator');
  ['1/2', '1/4', '1/8', '3/4', '2/3'].forEach((a) => {
    const o = store.makeChoices(a, seeded(9));
    assert.ok(!o.includes('0') && !o.includes('1'), a + ' has no 0 or 1: ' + o);
  });
  assert.notDeepEqual(store.makeChoices('5/6', seeded(1)).sort(), store.makeChoices('11/12', seeded(1)).sort());
});

test('whole-number choices are unchanged', () => {
  const o = store.makeChoices(7, seeded(4)).slice().sort((x, y) => x - y);
  assert.deepEqual(o, [5, 6, 7, 8]);
});

// ---------- 3. worked example: notes match the sum on screen ----------
const SUM = /(\d+) תופים ועוד (\d+) פעמונים הם (\d+)/;
const worked = banks.allItems().filter((it) => it && it.kind === 'worked_example');

test('a varied worked example shows a true sum and plays exactly those notes', () => {
  assert.ok(worked.length > 0);
  let checked = 0, changed = 0;
  for (const it of worked) {
    for (const topic of Object.keys(V.TOPIC_RANGES)) {
      for (let round = 0; round < 6; round++) {
        for (const seed of [0, 1, 7, 42]) {
          const ex = V.generateVariant(Object.assign({}, it, { topicId: topic }), round, { rounds: 6, seed });
          const m = String(ex.prompt).match(SUM);
          if (!m) continue;
          checked++;
          const [a, b, total] = [+m[1], +m[2], +m[3]];
          const where = topic + ' r' + round + ' s' + seed + ': ' + ex.prompt;
          if (a !== it.a || b !== it.b) changed++;
          assert.equal(a + b, total, where);
          assert.equal(Number(ex.answer), total, where);
          assert.deepEqual([ex.a, ex.b, ex.total], [a, b, total], where);
          const ev = W.demoPlan(ex);
          assert.equal(ev.filter((e) => e.voice === 'drum').length, a, 'drums ' + where);
          assert.equal(ev.filter((e) => e.voice === 'bell').length, b, 'bells ' + where);
          assert.equal(ev.filter((e) => e.voice === 'xylo').length, total, 'total ' + where);
        }
      }
    }
  }
  assert.ok(checked > 50 && changed > 10, 'checked ' + checked + ', retuned ' + changed);
});

test('the stated result is retuned for any prompt that states it, not only worked examples', () => {
  const ex = V.generateVariant({ id: 'x', prompt: 'ראו: 3 תופים ועוד 2 פעמונים הם 5 צלילים.', answer: 5, skill: 'addition', topicId: 'mm-cur-0' }, 1, { seed: 1 });
  const m = String(ex.prompt).match(SUM);
  assert.ok(m, ex.prompt);
  assert.equal(+m[1] + +m[2], +m[3], ex.prompt);
  assert.equal(ex.a, undefined, 'only a worked example carries demo numbers');
});
