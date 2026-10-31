'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const RP = require('../src/lib/music/rhythmPolygon.js');
const CHK = require('../src/lib/music/polygonCheck.js');
const I = require('../src/lib/instruments.js');
const DAY = 864e5;

test('polygonFromBeats: N even beats make a regular N-gon with 360/N, N axes and N turns', () => {
  for (let n = 3; n <= 12; n++) {
    const p = RP.polygonFromBeats(n);
    assert.equal(p.sides, n);
    assert.equal(p.regular, true);
    assert.equal(p.centralAngle, Math.round(360 / n * 1e4) / 1e4);
    assert.equal(p.interiorAngle, Math.round(180 * (n - 2) / n * 1e4) / 1e4);
    assert.equal(p.axes, n, 'axes ' + n);
    assert.equal(p.rotationOrder, n, 'turns ' + n);
    assert.deepEqual([p.vertices[0].x, p.vertices[0].y], [0, -1], 'beat 0 is at the top');
    assert.match(p.nameHe, /משוכלל/);
  }
  const sq = RP.polygonFromBeats(4, 8);
  assert.deepEqual(sq.onsets, [0, 2, 4, 6]);
  assert.equal(sq.stepDeg, 45);
  assert.equal(sq.centralAngle, 90);
  assert.deepEqual(RP.polygonFromBeats([true, false, true, false, true, false]).onsets, [0, 2, 4]);
});

test('polygonFromBeats: uneven rhythms, too few beats and impossible clocks', () => {
  const p = RP.polygonFromBeats([0, 1, 3], 8);
  assert.equal(p.sides, 3);
  assert.equal(p.regular, false);
  assert.equal(p.centralAngle, null);
  assert.equal(p.axes, 0);
  assert.equal(p.rotationOrder, 1);
  const kite = RP.polygonFromBeats([0, 1, 4, 7], 8);
  assert.equal(kite.axes, 1, 'a kite has one mirror line');
  const two = RP.polygonFromBeats([0, 4], 8);
  assert.equal(two.isPolygon, false);
  assert.equal(two.sides, 0);
  assert.equal(RP.polygonFromBeats(5, 8), null, '5 even beats do not fit an 8-beat clock');
  assert.equal(RP.polygonFromBeats([0, 1.5], 4), null);
  assert.deepEqual(RP.polygonFromBeats([9, 1, 1], 8).onsets, [1], 'indices wrap and repeat once');
});

test('rotationEquivalence: a turned rhythm is the same rhythm k beats later, k*360/cycle degrees', () => {
  const a = [0, 3, 5];
  for (let k = 0; k < 8; k++) {
    const r = RP.rotationEquivalence(a, RP.rotate(a, k, 8), 8);
    assert.equal(r.equivalent, true);
    assert.equal(r.minSteps, k);
    assert.equal(r.minDegrees, k * 45);
  }
  assert.deepEqual(RP.rotationEquivalence([0, 2, 4, 6], [1, 3, 5, 7], 8).steps, [1, 3, 5, 7]);
  assert.deepEqual(RP.rotationEquivalence(4, 4, 4).degrees, [0, 90, 180, 270]);
  const mirror = RP.rotationEquivalence([0, 1, 3], [0, 2, 3], 8);
  assert.equal(mirror.equivalent, false, 'a mirror image is not a turn');
  assert.equal(RP.rotationEquivalence([0, 1], [0, 1, 2], 8).equivalent, false);
  assert.equal(RP.rotationEquivalence([true, false, true], [false, true, true]).equivalent, true);
});

test('pitch by angle is an optional weak add-on, off unless asked', () => {
  assert.deepEqual([RP.PITCH_ADDON.mechanism, RP.PITCH_ADDON.optional, RP.PITCH_ADDON.evidence], ['M5', true, 'weak']);
  assert.match(RP.PITCH_ADDON.he, /ראיות חלשות/);
  assert.ok(I.WEAK.includes(RP.PITCH_ADDON.mechanism));
  assert.equal(RP.pitchForAngle(0, 200), 200);
  assert.equal(RP.pitchForAngle(360, 200), 200);
  assert.equal(RP.pitchForAngle(180, 200), Math.round(200 * Math.SQRT2 * 100) / 100);
  const plain = RP.cyclePlan(4, 8, { bpm: 60 });
  assert.equal(plain.length, 8);
  assert.deepEqual(plain.filter((n) => n.kind === 'corner').map((n) => n.at), [0, 2, 4, 6]);
  assert.ok(plain.filter((n) => n.kind === 'corner').every((n) => n.hz === undefined));
  assert.ok(RP.cyclePlan(4, 8, { pitch: true }).filter((n) => n.kind === 'corner').every((n) => n.hz > 0));
});

test('forms A/B/C: 12 parallel items, 6 unpractised, answers computed and always among 2-4 choices', () => {
  const forms = ['A', 'B', 'C'].map(CHK.buildForm);
  forms.forEach((f) => {
    assert.equal(f.length, 12);
    assert.equal(f.filter((x) => !x.practised).length, 6);
    f.forEach((x) => {
      assert.ok(x.choices.length >= 2 && x.choices.length <= 4, x.id);
      assert.equal(new Set(x.choices).size, x.choices.length, x.id);
      assert.ok(x.choices.includes(x.answer), x.id);
      assert.match(x.prompt, /[א-ת]/);
    });
  });
  for (let i = 0; i < 12; i++) {
    assert.equal(forms[0][i].kind, forms[1][i].kind);
    assert.equal(forms[0][i].kind, forms[2][i].kind);
    assert.notEqual(forms[0][i].prompt, forms[1][i].prompt, 'post-test is a parallel form, not a repeat');
  }
  CHK.SLOTS.forEach((s) => [s[3], s[4], s[5]].forEach((p) => {
    const n = p.n || p.cycle;
    assert.equal(CHK.PRACTISED_N.includes(n), s[2], s[0] + ' ' + n + ' practised flag matches the clocks the steps use');
  }));
  const angle = CHK.buildItem('angle', { n: 10 });
  assert.equal(angle.answer, '36°');
  assert.equal(CHK.buildItem('shift', { cycle: 12, onsets: [0, 3, 7], k: 4 }).answer, '120°');
  assert.equal(CHK.buildItem('beatsFromAngle', { n: 9 }).clock, null, 'no clock to count from');
});
test('timing: post-test after 28 days, retention 30 days after it, first attempt kept', () => {
  const t0 = Date.UTC(2026, 9, 1);
  let rec = CHK.empty();
  assert.equal(CHK.canTake(rec, 'post', t0).ok, false);
  rec = CHK.record(rec, 'pre', [{ id: 's2A', correct: true }], t0);
  assert.equal(CHK.record(rec, 'pre', [], t0 + 1).pre.results.length, 1, 'pre-test is not retaken');
  assert.deepEqual(CHK.canTake(rec, 'post', t0 + 27 * DAY), { ok: false, daysLeft: 1 });
  assert.equal(CHK.canTake(rec, 'post', t0 + 28 * DAY).ok, true);
  assert.equal(CHK.record(rec, 'post', [], t0 + DAY).post, null, 'too early, not stored');
  rec = CHK.record(rec, 'post', [], t0 + 28 * DAY);
  assert.deepEqual(CHK.canTake(rec, 'retention', t0 + 40 * DAY), { ok: false, daysLeft: 18 });
  assert.equal(CHK.canTake(rec, 'retention', t0 + 58 * DAY).ok, true);
});

test('effect size counts only unpractised items: (post - pre) / SD(pre), target 0.3 kept at 30 days', () => {
  assert.equal(CHK.effectSize([0, 1, 0, 1], [1, 1, 1, 1]), 0.87);
  assert.equal(CHK.effectSize([1, 1, 1], [1, 1, 1]), null, 'no spread, no effect size');
  assert.equal(CHK.effectSize([1], [0]), null);
  const res = (form, rightUnpractised, rightPractised) => CHK.buildForm(form).map((x, i) => ({
    id: x.id, correct: x.practised ? rightPractised : i < rightUnpractised * 2,
  }));
  const t0 = 1e12;
  let rec = CHK.record(CHK.empty(), 'pre', res('A', 3, false), t0);
  assert.equal(CHK.scores(rec.pre, false).length, 6);
  assert.equal(CHK.scores(rec.pre, true).reduce((a, b) => a + b, 0), 0);
  rec = CHK.record(rec, 'post', res('B', 6, true), t0 + 28 * DAY);
  const r = CHK.report(rec, t0 + 28 * DAY);
  assert.ok(r.gain > CHK.TARGET_SD);
  assert.equal(r.meetsTarget, true);
  assert.equal(r.retained, null, 'retention not taken yet');
  assert.equal(r.next, 'retention');
  assert.equal(r.wait, 30);
  rec = CHK.record(rec, 'retention', res('C', 3, true), t0 + 58 * DAY);
  const r2 = CHK.report(rec, t0 + 58 * DAY);
  assert.equal(r2.retentionGain, 0);
  assert.equal(r2.retained, false, 'back to the pre-test level is not retention');
  assert.match(r2.disclaimer, /לא ניסוי מבוקר/);
});

test('results stay in injectable local storage under one key', () => {
  const mem = {};
  const store = { getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); } };
  assert.deepEqual(CHK.load(store), CHK.empty());
  const rec = CHK.record(CHK.empty(), 'pre', [{ id: 's1A', correct: true }], 5);
  assert.equal(CHK.save(store, rec), true);
  assert.deepEqual(Object.keys(mem), [CHK.STORAGE_KEY]);
  assert.deepEqual(CHK.load(store), rec);
  mem[CHK.STORAGE_KEY] = '{bad';
  assert.deepEqual(CHK.load(store), CHK.empty());
});
