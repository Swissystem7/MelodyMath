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

test('numeric predictions: 3 distinct options, one of them true, none negative for a positive answer', () => {
  ['M1', 'M2', 'M6'].forEach((m) => [0, 1, 7, 21, 100].forEach((a) => {
    const p = predict.build(item(tagOf(m), a, m + a), banks.mechanismOf);
    const ids = p.options.map((o) => o.id);
    assert.equal(new Set(ids).size, 3, m + ' ' + a);
    assert.ok(ids.includes(p.truth));
    assert.ok(ids.every((x) => Number(x) >= 0), m + ' ' + a + ' ' + ids);
  }));
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
  assert.ok(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8').includes("'./src/lib/predict.js'"));
});
