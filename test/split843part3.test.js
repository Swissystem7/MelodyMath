'use strict';
// Split from #843, part 3. Refs #843, Refs #665.
// 1. A ten is 110 Hz in every place-value sound, one octave below a 220 Hz one,
//    and carries 220/330/440 Hz overtones so a phone speaker plays it (#877 review).
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
const engine = require('../src/lib/musicEngine.js');
const IV = require('../src/lib/instrumentVoices.js');
const AC = { currentTime: 0, state: 'running', resume() {} };

// A phone can play it: two overtones at 220 Hz or above, together as strong as the 110 Hz fundamental.
function audible(e, where) {
  const up = (e.partials || []).filter((p) => e.hz * p[0] >= 220);
  assert.ok(up.length >= 2 && up.reduce((s, p) => s + p[1], 0) >= 1, where + ': ' + JSON.stringify(e.partials));
}

// ---------- 1. tens at 110 Hz, audible ----------
test('hundreds chart and cube layers: tens 110 Hz with overtones, ones 220 Hz plain', () => {
  for (let n = 1; n <= 100; n++) {
    const s = g1.chart100Sound(n), ev = g1.chart100Events(n);
    assert.equal(s.tensFreq, s.tens ? 110 : null, 'tens of ' + n);
    assert.equal(ev.filter((e) => e.hz === 110).length, s.tens, 'ten notes of ' + n);
    assert.equal(ev.filter((e) => e.hz === 220).length, s.ones, 'one notes of ' + n);
    assert.equal(ev.length, s.tens + s.ones);
    ev.forEach((e) => (e.hz === 110 ? audible(e, 'chart ' + n) : assert.equal(e.partials, undefined)));
  }
  for (let n = 13; n <= 100; n++) {
    g2.cubeLayerEvents(n).forEach((e) => {
      assert.equal(e.hz, e.place === 'ten' ? 110 : 220, n + ' ' + e.place);
      if (e.place === 'ten') audible(e, 'layer ' + n);
    });
  }
  for (let n = 1; n <= 12; n++) assert.ok(g2.cubeLayerEvents(n).every((e) => e.hz === 220 && e.place === 'unit'));
});

test('vertical and register voices: the 110 Hz bass is audible, ones one octave up', () => {
  assert.equal(g2.VOICES.bass.hz, 110);
  assert.equal(g2.VOICES.drum.hz, 2 * g2.VOICES.bass.hz);
  const ev = g2.phaseEvents(g2.verticalVoices({ a: 47, b: 38, op: '+' }).phases);
  assert.ok(ev.length > 0 && ev.every((e) => e.hz === 110 || e.hz === 220), 'only 110/220 Hz: ' + ev.map((e) => e.hz));
  ev.filter((e) => e.hz === 110).forEach((e) => audible(e, 'vertical'));
  g2.phaseEvents(g2.registerVoices({ h: 4, t: 12, o: 3 }).phases).filter((e) => e.hz === 110).forEach((e) => audible(e, 'registers'));
});

test('take-away circles: every ten is 110 Hz and asks for the audible timbre', () => {
  let tens = 0;
  [[8, 3], [12, 5], [34, 10], [56, 21], [99, 40]].forEach(([a, b]) => {
    const spec = take.takeAwayCircles(a, b), calls = [];
    take.soundEvents(spec).forEach((e) => { if (e.v === 10) { tens++; assert.equal(e.hz, 110, a + '-' + b); } });
    take.play(spec, { audioContext: AC, voice: 'drumLow', playVoice: (c, v, hz, t, d, o) => calls.push({ hz, o }) });
    calls.forEach((c) => assert.equal(!!(c.o && c.o.audibleLow), c.hz === 110, a + '-' + b + ' at ' + c.hz));
    calls.filter((c) => c.o && c.o.dur > 0.3).forEach((c) => assert.equal(c.hz, 110, 'held ten ' + a));
  });
  assert.ok(tens > 0, 'tens were heard');
});

test('number play: a ten on a 220 Hz instrument is 110 Hz (not 120), and jamKit plays it audible', () => {
  const plan = NP.extractNumberPlan({ prompt: '5 × 20 = ?', skill: 'multiplication' }, { bpm: 60, instrument: 'oud' });
  const pluck = plan.notes.filter((n) => n.voice === 'pluck' && n.value === 10);
  assert.ok(pluck.length > 0 && pluck.every((n) => n.hz === 110), 'oud (220 Hz) tens at 110');
  plan.notes.forEach((n) => { assert.ok(n.value !== 10 || n.hz >= 110); assert.equal(n.audibleLow, n.value === 10); });
  const seen = [], saved = { musicEngine: globalThis.musicEngine, playVoice: globalThis.playVoice, VOICES: globalThis.VOICES };
  Object.assign(globalThis, { musicEngine: { getSharedAudioContext: () => AC, audioState: { muted: false } }, playVoice: (c, v, hz, t, d, o) => seen.push(o), VOICES: IV.VOICES });
  try {
    delete require.cache[require.resolve('../src/components/jamKit.js')];
    const h = require('../src/components/jamKit.js').playNotes([{ at: 0, voice: 'pluck', hz: 110, value: 10, audibleLow: true }, { at: 0.01, voice: 'pluck', hz: 220, value: 1, audibleLow: false }]);
    if (h && h.stop) h.stop();
  } finally {
    Object.keys(saved).forEach((k) => { if (saved[k] === undefined) delete globalThis[k]; else globalThis[k] = saved[k]; });
  }
  assert.deepEqual(seen, [{ audibleLow: true }, undefined], 'jamKit passes audibleLow for the ten only');
});

test('playEvents (grade1, grade2) plays a ten as 110 + 220/330/440 Hz at the same total gain', () => {
  const made = [];
  const param = () => ({ setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ connect(x) { return x; } });
  class FakeAC {
    constructor() { this.currentTime = 0; this.state = 'running'; this.destination = node(); }
    createOscillator() { const o = Object.assign(node(), { frequency: param(), start() {}, stop() {} }); o.frequency.setValueAtTime = (v) => { o.hz = v; }; made.push(o); return o; }
    createGain() { const g = Object.assign(node(), { gain: param() }); g.gain.linearRampToValueAtTime = (v) => { if (!g.peak) g.peak = v; }; made.push(g); return g; }
  }
  const prev = globalThis.window;
  globalThis.window = { AudioContext: FakeAC };
  try {
    assert.ok(g1.playEvents(g1.chart100Events(10)), 'scheduled');
    assert.deepEqual(made.filter((x) => x.hz != null).map((x) => x.hz), [110, 220, 330, 440]);
    const peaks = made.filter((x) => x.peak).map((x) => x.peak);
    assert.ok(Math.abs(peaks.reduce((s, v) => s + v, 0) - 0.24) < 1e-9, 'total gain unchanged: ' + peaks);
  } finally {
    if (engine.stopSequence) engine.stopSequence();
    if (prev === undefined) delete globalThis.window; else globalThis.window = prev;
  }
  const ten = g2.cubeLayerEvents(13).find((e) => e.place === 'ten'), one = g2.cubeLayerEvents(13).find((e) => e.place === 'one');
  const x = g2.withPartials([ten, one]);
  assert.deepEqual(x.map((e) => e.hz), [110, 220, 330, 440, 220], 'grade2: four notes for the ten, one for the one');
  assert.ok(Math.abs(x.slice(0, 4).reduce((s, e) => s + e.gain, 0) - ten.gain) < 1e-9 && x[4].gain === one.gain, 'gain shared');
});

test('instrument voices: audibleLow lifts a 110 Hz ten into a phone band, other notes unchanged', () => {
  ['drumLow', 'drumHigh', 'pluck', 'woodClick', 'metalBell', 'frameDrum'].forEach((v) => {
    const plan = IV.planVoice(v, 110, { audibleLow: true }), f = plan.filter;
    const up = plan.oscillators.filter((o) => o.hz >= 220 && (!f || (f.type === 'lowpass' && o.hz <= f.hz)));
    assert.ok(up.length >= 2 && up.reduce((s, o) => s + o.gain, 0) >= plan.oscillators[0].gain, v + ': ' + JSON.stringify(plan));
  });
  ['drumLow', 'drumHigh', 'woodClick'].forEach((v) => {
    assert.deepEqual(IV.planVoice(v, 90, {}), IV.planVoice(v, 90), v + ' kick unchanged without audibleLow');
    assert.deepEqual(IV.planVoice(v, 330, { audibleLow: true }), IV.planVoice(v, 330), v + ' 330 Hz unchanged');
  });
});

// ---------- 2. close fraction distractors ----------
const UNI = { '½': '1/2', '¼': '1/4', '⅛': '1/8' };
const frac = (x) => { const m = /^(\d+)\/(\d+)$/.exec(UNI[String(x).trim()] || String(x).trim()); return m ? { n: +m[1], d: +m[2], v: m[1] / m[2] } : null; };
const seeded = (seed) => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
const same = (a, b) => Math.abs(a - b) < 1e-9;
function checkFraction(answer, seed) {
  const opts = store.makeChoices(answer, seeded(seed)), f = frac(answer), fs = opts.map(frac);
  assert.equal(opts.length, 4, answer);
  assert.ok(fs.every(Boolean), 'all options are fractions: ' + opts);
  assert.equal(fs.filter((x) => same(x.v, f.v)).length, 1, 'answer once by value: ' + opts);
  fs.forEach((x, i) => assert.equal(fs.findIndex((y) => same(y.v, x.v)), i, 'distinct values: ' + opts));
  fs.filter((x) => !same(x.v, f.v)).forEach((x) => {
    assert.ok(x.n > 0, 'no 0 distractor: ' + opts);
    if (f.n < f.d) assert.ok(x.n < x.d && Math.abs(x.v - f.v) <= 0.5 + 1e-9, 'close, proper for ' + answer + ': ' + opts);
  });
}

test('fraction choices: four close options for every bank answer and the near misses a child makes', () => {
  let n = 0;
  ['א', 'ב', 'ג', 'ד', 'ה', 'ו'].forEach((g) => banks.classItems(g).forEach((it, i) => { if (frac(it.answer)) { checkFraction(it.answer, 11 + i); n++; } }));
  assert.ok(n > 10, 'checked ' + n + ' fraction items');
  for (let s = 1; s < 25; s++) ['1/2', '½', '1/3', '2/3', '1/4', '2/4', '3/4', '1/8', '⅛', '3/8', '7/8', '5/6', '11/12', '3/16', '1/100', '5/2', '1/1'].forEach((a) => checkFraction(a, s));
  const has = (a, x) => store.makeChoices(a, seeded(3)).includes(x);
  assert.ok(has('1/3', '1/4'), '1/3 offers 1/4');
  assert.ok(has('2/4', '3/4') && has('2/4', '1/4') && !has('2/4', '1/2'), '2/4 offers 1/4 and 3/4, never the equal 1/2');
  assert.ok(has('1/8', '2/8') && (has('1/8', '1/7') || has('1/8', '1/9')), '1/8 offers a same and a neighbouring denominator');
  ['1/2', '1/4', '1/8', '3/4', '2/3'].forEach((a) => { const o = store.makeChoices(a, seeded(9)); assert.ok(!o.includes('0') && !o.includes('1'), a + ': ' + o); });
  assert.notDeepEqual(store.makeChoices('5/6', seeded(1)).sort(), store.makeChoices('11/12', seeded(1)).sort());
  assert.deepEqual(store.makeChoices(7, seeded(4)).slice().sort((x, y) => x - y), [5, 6, 7, 8], 'whole numbers unchanged');
});

// ---------- 3. worked example: notes match the sum on screen ----------
const SUM = /(\d+) תופים ועוד (\d+) פעמונים הם (\d+)/;
const worked = banks.allItems().filter((it) => it && it.kind === 'worked_example');
const FAMILY = { drum: 'membrane', bell: 'idiophone', xylo: 'idiophone' };

test('a varied worked example shows a true sum and plays exactly those notes, on two families', () => {
  assert.ok(worked.length > 0);
  let checked = 0, changed = 0;
  for (const it of worked) for (const topic of Object.keys(V.TOPIC_RANGES)) for (let round = 0; round < 6; round++) for (const seed of [0, 1, 7, 42]) {
    const ex = V.generateVariant(Object.assign({}, it, { topicId: topic }), round, { rounds: 6, seed });
    const m = String(ex.prompt).match(SUM);
    if (!m) continue;
    checked++;
    const [a, b, total] = [+m[1], +m[2], +m[3]], where = topic + ' r' + round + ' s' + seed + ': ' + ex.prompt, ev = W.demoPlan(ex);
    if (a !== it.a || b !== it.b) changed++;
    assert.equal(a + b, total, where);
    assert.equal(Number(ex.answer), total, where);
    assert.deepEqual([ex.a, ex.b, ex.total], [a, b, total], where);
    assert.deepEqual(['drum', 'bell', 'xylo'].map((v) => ev.filter((e) => e.voice === v).length), [a, b, total], 'notes ' + where);
    assert.ok(new Set(ev.map((e) => FAMILY[e.voice])).size >= 2 && ev.every((e) => FAMILY[e.voice]), 'two families ' + where);
  }
  assert.ok(checked > 50 && changed > 10, 'checked ' + checked + ', retuned ' + changed);
  const plain = V.generateVariant({ id: 'x', prompt: 'ראו: 3 תופים ועוד 2 פעמונים הם 5 צלילים.', answer: 5, skill: 'addition', topicId: 'mm-cur-0' }, 1, { seed: 1 });
  const m = String(plain.prompt).match(SUM);
  assert.ok(m && +m[1] + +m[2] === +m[3], 'any prompt that states its result is retuned: ' + plain.prompt);
  assert.equal(plain.a, undefined, 'only a worked example carries demo numbers');
});

test('no-music round: fraction choices and the worked example work with zero audio calls', () => {
  const prev = { AudioContext: globalThis.AudioContext, window: globalThis.window };
  let made = 0;
  globalThis.AudioContext = function () { made++; };
  globalThis.window = { AudioContext: globalThis.AudioContext };
  try {
    assert.equal(store.makeChoices('2/4', seeded(1)).length, 4);
    for (const it of worked) {
      const ex = V.generateVariant(Object.assign({}, it, { topicId: 'mm-cur-0' }), 2, { noMusic: true, seed: 5 });
      assert.deepEqual([ex.noMusic, ex.hasMusic, ex.hear, ex.music], [true, false, null, null]);
      assert.ok(ex.a + ex.b === ex.total && Number(ex.answer) === ex.total, 'still a true sum');
      assert.ok(W.demoPlan(ex).length > 0, 'the plan exists; nothing plays it');
    }
  } finally {
    Object.keys(prev).forEach((k) => { if (prev[k] === undefined) delete globalThis[k]; else globalThis[k] = prev[k]; });
  }
  assert.equal(made, 0, 'no AudioContext was created');
});

test('on a phone a one stays audible next to a ten and sounds different (23, cube layer, vertical)', () => {
  // Phone speaker: two cascaded 2nd-order highpass at 300 Hz. Odd harmonics: triangle 1/n^2, square 1/n.
  const H = (f) => { const x = (f / 300) ** 2; return (x / Math.sqrt(1 + x * x)) ** 2; };
  const harm = (t) => (t === 'sine' ? [[1, 1]] : [1, 3, 5, 7, 9, 11, 13, 15].map((n) => [n, t === 'square' ? 1 / n : 1 / (n * n)]));
  const phone = (e) => {
    const parts = [[1, 1]].concat(e.partials || []), share = e.gain / parts.reduce((s, p) => s + p[1], 0);
    return Math.sqrt(parts.reduce((s, [r, g]) => s + harm(e.type).reduce((t, [n, a]) => t + (share * g * a * H(e.hz * r * n)) ** 2 / 2, 0), 0));
  };
  [['chart 23', g1.chart100Events(23)], ['layer 23', g2.cubeLayerEvents(23)], ['vertical', g2.phaseEvents(g2.verticalVoices({ a: 47, b: 38, op: '+' }).phases)]].forEach(([name, ev]) => {
    const ten = ev.find((e) => e.hz === 110), one = ev.find((e) => e.hz === 220);
    const db = 20 * Math.log10(phone(one) / phone(ten));
    assert.ok(db >= -6, name + ': a one is ' + db.toFixed(1) + ' dB against a ten on a phone');
    assert.notEqual(one.type, ten.type, name + ': different timbre');
    assert.ok(ten.dur >= 2 * one.dur, name + ': a one is a short click, a ten a long tone');
  });
});
