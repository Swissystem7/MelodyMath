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

// ---------- review on #877: a 110 Hz ten must be audible on a phone ----------
const engine = require('../src/lib/musicEngine.js');
const IV = require('../src/lib/instrumentVoices.js');
// Energy a phone speaker can play: overtones at 220 Hz or above, together at
// least as strong as the 110 Hz fundamental.
function audibleEvent(e, where) {
  assert.ok(Array.isArray(e.partials), where + ': overtones');
  const up = e.partials.filter((p) => e.hz * p[0] >= 220);
  assert.ok(up.length >= 2, where + ': two overtones at 220 Hz or above');
  assert.ok(up.reduce((s, p) => s + p[1], 0) >= 1, where + ': overtones as strong as the fundamental');
}
function audibleVoice(voice, hz, where) {
  const plan = IV.planVoice(voice, hz, { audibleLow: true });
  const f = plan.filter;
  const passes = (o) => !f || (f.type === 'lowpass' && o.hz <= f.hz) || (f.type === 'highpass' && o.hz >= f.hz);
  const base = plan.oscillators[0].gain;
  const up = plan.oscillators.filter((o) => o.hz >= 220 && passes(o));
  assert.ok(up.length >= 2 && up.reduce((s, o) => s + o.gain, 0) >= base, where + ' on ' + voice + ': ' + JSON.stringify(plan.oscillators) + ' ' + JSON.stringify(f));
}

test('every ten event has energy at 220 Hz or above (chart, cube layer, vertical, registers)', () => {
  for (let n = 10; n <= 100; n += 7) g1.chart100Events(n).filter((e) => e.hz === 110).forEach((e) => audibleEvent(e, 'chart ' + n));
  for (let n = 13; n <= 100; n += 5) g2.cubeLayerEvents(n).filter((e) => e.place === 'ten').forEach((e) => audibleEvent(e, 'layer ' + n));
  const tens = g2.phaseEvents(g2.verticalVoices({ a: 47, b: 38, op: '+' }).phases).filter((e) => e.hz === 110);
  assert.ok(tens.length > 0);
  tens.forEach((e) => audibleEvent(e, 'vertical'));
  g2.phaseEvents(g2.registerVoices({ h: 4, t: 12, o: 3 }).phases).filter((e) => e.hz === 110).forEach((e) => audibleEvent(e, 'registers'));
  // The ones are still one plain note each.
  g1.chart100Events(34).filter((e) => e.hz === 220).forEach((e) => assert.equal(e.partials, undefined));
});

test('the engine plays a ten as 110 + 220/330/440 Hz at the same total gain', () => {
  const made = [];
  const param = () => ({ setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ connect(x) { return x; } });
  class FakeAC {
    constructor() { this.currentTime = 0; this.state = 'running'; this.destination = node(); }
    createOscillator() { const o = Object.assign(node(), { frequency: param(), start() {}, stop() {}, hz: null }); o.frequency.setValueAtTime = (v) => { o.hz = v; }; made.push(o); return o; }
    createGain() { const g = Object.assign(node(), { gain: param() }); g.gain.linearRampToValueAtTime = (v) => { if (!g.peak) g.peak = v; }; made.push(g); return g; }
  }
  const prev = globalThis.window;
  globalThis.window = { AudioContext: FakeAC };
  try {
    const r = engine.scheduleSequence(g1.chart100Events(10));
    assert.ok(r, 'scheduled');
    const hz = made.filter((x) => x.hz != null).map((x) => x.hz);
    assert.deepEqual(hz, [110, 220, 330, 440], 'one ten = fundamental + three overtones');
    const peaks = made.filter((x) => x.peak).map((x) => x.peak);
    assert.ok(Math.abs(peaks.reduce((s, v) => s + v, 0) - 0.24) < 1e-9, 'total gain unchanged: ' + peaks);
  } finally {
    engine.stopSequence && engine.stopSequence();
    if (prev === undefined) delete globalThis.window; else globalThis.window = prev;
  }
  assert.equal(engine.planSequence([{ at: 0, dur: 0.2, hz: 220 }], 0)[0].partials, undefined, 'a plain note has no overtones');
});

test('instrument voices: audibleLow lifts a 110 Hz ten into a phone band, other notes unchanged', () => {
  ['drumLow', 'drumHigh', 'pluck', 'woodClick', 'metalBell', 'frameDrum'].forEach((v) => audibleVoice(v, 110, 'ten'));
  ['drumLow', 'drumHigh', 'woodClick'].forEach((v) => {
    assert.deepEqual(IV.planVoice(v, 90, {}), IV.planVoice(v, 90), v + ' kick unchanged without audibleLow');
    assert.deepEqual(IV.planVoice(v, 330, { audibleLow: true }), IV.planVoice(v, 330), v + ' 330 Hz unchanged');
  });
});

test('take-away, NumberPlay and jamKit ask for the audible ten', () => {
  const calls = [];
  const ac = { currentTime: 0, state: 'running', resume() {} };
  take.play(take.takeAwayCircles(34, 10), { audioContext: ac, voice: 'drumLow', playVoice: (c, v, hz, t, d, o) => calls.push({ hz, o }) });
  const tens = calls.filter((c) => c.hz === 110);
  assert.ok(tens.length > 0 && tens.every((c) => c.o && c.o.audibleLow), 'every take-away ten asks for audibleLow');
  calls.filter((c) => c.hz !== 110).forEach((c) => assert.ok(!c.o || !c.o.audibleLow, 'a one stays plain'));
  const seq = [];
  take.play(take.takeAwayCircles(34, 10), { playSequence: (s) => { seq.push(...s); return {}; } });
  seq.filter((s) => s.v >= 10).forEach((s) => audibleEvent(s, 'take-away sequence'));

  const plan = NP.extractNumberPlan({ prompt: '5 × 20 = ?', skill: 'multiplication' }, { bpm: 60, instrument: 'oud' });
  plan.notes.forEach((n) => assert.equal(n.audibleLow, n.value === 10));

  const seen = [];
  const saved = { musicEngine: globalThis.musicEngine, playVoice: globalThis.playVoice, VOICES: globalThis.VOICES };
  globalThis.musicEngine = { getSharedAudioContext: () => ({ currentTime: 0, state: 'running' }), audioState: { muted: false } };
  globalThis.playVoice = (c, v, hz, t, d, o) => seen.push({ hz, o });
  globalThis.VOICES = IV.VOICES;
  try {
    delete require.cache[require.resolve('../src/components/jamKit.js')];
    const jam = require('../src/components/jamKit.js');
    const h = jam.playNotes([{ at: 0, voice: 'pluck', hz: 110, value: 10, audibleLow: true }, { at: 0.01, voice: 'pluck', hz: 220, value: 1, audibleLow: false }]);
    if (h && h.stop) h.stop();
  } finally {
    Object.keys(saved).forEach((k) => { if (saved[k] === undefined) delete globalThis[k]; else globalThis[k] = saved[k]; });
  }
  assert.ok(seen.length === 2, 'both notes played: ' + JSON.stringify(seen));
  assert.ok(seen[0].o && seen[0].o.audibleLow, 'jamKit passes audibleLow for the ten');
  assert.ok(!seen[1].o, 'a one is played plain');
});

// ---------- review on #877: kid's-eye checks this PR owns ----------
test('worked-example demo: two instrument families (drum = membrane, bells/xylophone = idiophone)', () => {
  const FAMILY = { drum: 'membrane', bell: 'idiophone', xylo: 'idiophone' };
  for (const it of worked) {
    const ex = V.generateVariant(Object.assign({}, it, { topicId: 'mm-cur-0' }), 1, { rounds: 6, seed: 3 });
    const fams = new Set(W.demoPlan(ex).map((e) => FAMILY[e.voice]));
    assert.ok(!fams.has(undefined), 'every demo voice has a family');
    assert.ok(fams.size >= 2, 'two families: ' + [...fams]);
  }
});

test('no-music round: fraction choices and the worked example work with zero audio calls', () => {
  const prevAC = globalThis.AudioContext, prevWin = globalThis.window;
  let made = 0;
  globalThis.AudioContext = function () { made++; };
  globalThis.window = { AudioContext: globalThis.AudioContext };
  try {
    const opts = store.makeChoices('2/4', seeded(1));
    assert.equal(opts.length, 4);
    for (const it of worked) {
      const ex = V.generateVariant(Object.assign({}, it, { topicId: 'mm-cur-0' }), 2, { noMusic: true, seed: 5 });
      assert.equal(ex.noMusic, true);
      assert.equal(ex.hasMusic, false);
      assert.equal(ex.hear, null);
      assert.equal(ex.music, null);
      assert.equal(ex.a + ex.b, ex.total, 'still a true sum');
      assert.equal(Number(ex.answer), ex.total);
      assert.ok(W.demoPlan(ex).length > 0, 'the plan exists; nothing plays it');
    }
  } finally {
    if (prevAC === undefined) delete globalThis.AudioContext; else globalThis.AudioContext = prevAC;
    if (prevWin === undefined) delete globalThis.window; else globalThis.window = prevWin;
  }
  assert.equal(made, 0, 'no AudioContext was created');
});
