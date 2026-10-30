'use strict';
// PredictThenPlay (Refs #591, feature 26.10 1/5): the child commits to a
// prediction before the item's own primary way plays the result.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = require('../src/lib/banks');
const curriculum = require('../src/lib/curriculum');
const prog = require('../src/lib/curriculum/progression');
const predict = require('../src/lib/predict');

function memStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
const item = (music, answer, id) => ({ id: id || 'x1', music, answer, prompt: 'p' });
const tagOf = (mech) => banks.MUSIC_MECHANISMS[mech].tags[0];

test('at most one item in 3 gets a prediction step', () => {
  assert.ok(Array.from({ length: 300 }, (_, i) => i).filter(predict.shouldPredict).length / 300 <= 1 / 3);
  [0, 1, 2].forEach((s) => assert.ok([s, s + 1, s + 2].filter(predict.shouldPredict).length <= 1));
});

test('the prediction is locked before the music plays and cannot change after', () => {
  const st = predict.start(item(tagOf('M2'), 21), banks.mechanismOf);
  let playedWhileUnlocked = null;
  assert.equal(predict.reveal(st, 't', () => { playedWhileUnlocked = true; }), null);
  assert.equal(playedWhileUnlocked, null, 'nothing plays before the lock');
  const pick = st.prediction.options.find((o) => o.id !== st.prediction.truth).id;
  assert.equal(predict.lock(st, pick), true);
  predict.setStorage(memStorage());
  let lockedWhenPlayed = null;
  const r = predict.reveal(st, 't', () => { lockedWhenPlayed = st.locked && st.choice; });
  assert.equal(lockedWhenPlayed, pick);
  assert.equal(r.hit, false);
  assert.equal(predict.lock(st, st.prediction.truth), false, 'no second lock');
  assert.equal(st.choice, pick);
  assert.equal(predict.reveal(st, 't', () => {}), null, 'plays once');
});

test('predictionAccuracy is per topic and apart from the score', () => {
  predict.setStorage(memStorage());
  predict.record('mm-cur-24', true);
  predict.record('mm-cur-24', false);
  predict.record('mm-cur-24', true);
  predict.record('mm-cur-32', false);
  assert.deepEqual(predict.predictionAccuracy('mm-cur-24'), { n: 3, hits: 2, rate: 2 / 3 });
  assert.deepEqual(predict.predictionAccuracy('mm-cur-32'), { n: 1, hits: 0, rate: 0 });
  assert.deepEqual(predict.predictionAccuracy('none'), { n: 0, hits: 0, rate: null });
});

test('M3 fraction answers ask whether the bar fills exactly, falls short or overflows', () => {
  const t = (a) => predict.build(item(tagOf('M3'), a), banks.mechanismOf).truth;
  assert.equal(t('3/4'), 'short');
  assert.equal(t(1.5), 'over');
  assert.equal(t('0.25'), 'short');
  const p = predict.build(item(tagOf('M3'), '3/4'), banks.mechanismOf);
  assert.deepEqual(p.options.map((o) => o.label), ['יחסר', 'בדיוק', 'תעלה על גדותיה']);
});

// Bounds named by a range option: [lower, upper] of the range it covers.
// The hyphen in "מ-5" / "ל-5" joins the prefix; it is not a minus sign.
const nums = (label) => (label.replace(/([מל])-/g, '$1 ').match(/-?\d+(\.\d+)?/g) || []).map(Number);
function covers(p, v) {
  const lo = nums(p.options[0].label)[0], hi = nums(p.options[2].label)[0];
  return { low: v < lo, mid: v > lo && v < hi, high: v > hi }[p.truth];
}

test('numeric predictions show a range or direction, never the exact answer', () => {
  const values = [0, 1, 2, 3, 7, 12, 21, 48, 100, 2.5, 3.75, 13.4];
  ['M1', 'M2', 'M3', 'M6'].forEach((m) => values.forEach((a) => {
    const p = predict.build(item(tagOf(m), a, m + a), banks.mechanismOf);
    if (m === 'M3' && !Number.isInteger(a) && a <= 2) return;
    const tag = m + ' ' + a + ' ' + p.options.map((o) => o.label);
    assert.deepEqual(p.options.map((o) => o.id), ['low', 'mid', 'high'], tag);
    assert.match(p.options[0].label, /^פחות מ-/);
    assert.match(p.options[1].label, /^בין /);
    assert.match(p.options[2].label, /^יותר מ-/);
    p.options.forEach((o) => assert.ok(!nums(o.label).includes(a), 'exact answer shown: ' + tag));
    assert.notEqual(p.truth, String(a));
    assert.ok(covers(p, a), 'truth range holds the answer: ' + tag);
    p.options.forEach((o) => nums(o.label).forEach((n) => assert.ok(Math.abs(n - a) >= 2, 'bound too close to the answer: ' + tag)));
    p.options.forEach((o) => assert.ok(nums(o.label).every((n) => n >= 1), 'no "less than 0": ' + tag));
  }));
});

// Minimal DOM, enough for mount().
function fakeEl(tag) {
  const cls = new Set();
  const el = {
    tag, children: [], listeners: {}, disabled: false, textContent: '', parent: null,
    classList: { add: (c) => cls.add(c), remove: (c) => cls.delete(c), contains: (c) => cls.has(c), toggle: (c, on) => (on ? cls.add(c) : cls.delete(c)) },
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
    fire(t) { (this.listeners[t] || []).forEach((f) => f()); },
    appendChild(c) { c.parent = this; this.children.push(c); return c; },
    focus() {},
    set innerHTML(_) { this.children = []; if (_) ['p', 'div', 'p'].forEach((t) => this.appendChild(fakeEl(t))); },
    get firstChild() { return this.children[0]; },
    get nextSibling() { const s = this.parent && this.parent.children; return s ? s[s.indexOf(this) + 1] : null; },
  };
  el.ownerDocument = { createElement: fakeEl };
  return el;
}

test('the prediction step cannot be skipped: answer and the way stay locked until a pick', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  predict.setStorage(memStorage());
  const host = fakeEl('div'), input = fakeEl('input'), check = fakeEl('button'), way = fakeEl('p');
  let played = 0;
  const it = item(tagOf('M2'), 21, 'skip1');
  assert.equal(predict.mount(host, it, 't', 2, () => { played += 1; }, banks.mechanismOf, { lock: [input, check], hide: [way] }), true);
  assert.equal(input.disabled, true, 'answer box locked');
  assert.equal(check.disabled, true, 'check button locked');
  assert.ok(way.classList.contains('hidden'), "the way's play button hidden");
  t.mock.timers.tick(5000);
  assert.equal(played, 0, 'nothing plays without a prediction');
  const btns = host.children[1].children;
  assert.equal(btns.length, 3);
  btns[1].fire('click');
  assert.equal(input.disabled, false);
  assert.equal(check.disabled, false);
  assert.ok(!way.classList.contains('hidden'));
  t.mock.timers.tick(600);
  assert.equal(played, 1, 'the way plays after the pick');
  assert.ok(btns.every((b) => b.disabled), 'no second pick');
});

test('weak or unevidenced ways get no prediction step', () => {
  ['M4', 'M5', 'M7', 'M8'].forEach((m) => {
    const tags = banks.MUSIC_MECHANISMS[m].tags;
    if (tags.length) assert.equal(predict.build(item(tags[0], 4), banks.mechanismOf), null, m);
  });
  assert.equal(predict.build({ answer: 4 }, banks.mechanismOf), null);
  assert.equal(predict.build({ music: tagOf('M1'), answer: 4, noMusic: true }, banks.mechanismOf), null);
});

test('every progression topic predicts with its own primary way only', () => {
  const byTopic = {};
  banks.allItems().forEach((it) => {
    if (!it.music) return;
    const s = curriculum.sectionForItem(it);
    const row = s && s.topic ? curriculum.MATRIX.find((r) => r.grade === it.grade && r.topic === s.topic) : null;
    const id = row ? row.topicId : null;
    if (!id || !prog.PREREQ[id]) return;
    const p = predict.build(it, banks.mechanismOf);
    if (!p) return;
    assert.equal(p.mechanism, banks.mechanismOf(it.music), it.id);
    assert.ok(banks.MUSIC_DOSAGE.primary.includes(p.mechanism), it.id + ' ' + p.mechanism);
    (byTopic[id] = byTopic[id] || new Set()).add(p.mechanism);
  });
  assert.ok(Object.keys(byTopic).length > 10, 'predictions reach many topics');
});

test('option tone starts at the tap (under 50 ms) on the child\'s instrument', () => {
  const calls = [];
  const g = globalThis;
  const saved = { playVoice: g.playVoice, st: g.MM_MASTERY_STREAK };
  g.playVoice = (ac, voice, hz, when) => calls.push({ voice, hz, when });
  g.MM_MASTERY_STREAK = { instrumentFor: () => 'darbuka', voiceFor: (id) => (id === 'darbuka' ? 'drumLow' : 'keys') };
  try {
    const r = predict.tones([predict.OPTION_HZ[1]], 'mm-cur-32', { currentTime: 3, state: 'running' });
    assert.equal(calls.length, 1);
    assert.equal(calls[0].voice, 'drumLow');
    assert.ok(calls[0].when - 3 < 0.05 && r.voice === 'drumLow');
  } finally { g.playVoice = saved.playVoice; g.MM_MASTERY_STREAK = saved.st; }
});

test('index.html loads predict.js and the personal plan mounts it before playing the way', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(html.includes('<script src="src/lib/predict.js"></script>'));
  assert.ok(html.includes('id="rmPlanPredict"'));
  assert.match(html, /MM_PREDICT\.mount\(\$\('rmPlanPredict'\),it,[^;]*\)\)\)maybeHear\(it\)/);
  // Not skippable: answer and check are gated on the panel, and rpCheck refuses while gated.
  assert.match(html, /MM_PREDICT\.mount\([^;]*\{lock:\[\$\('rmPlanAnswer'\),\$\('rmPlanCheck'\)\],hide:\[\$\('rmPlanWay'\)\]\}/);
  assert.match(html, /function rpCheck\(\)\{if\(rpAnswered\|\|\$\('rmPlanAnswer'\)\.disabled\)return;/);
  assert.ok(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8').includes("'./src/lib/predict.js'"));
});
