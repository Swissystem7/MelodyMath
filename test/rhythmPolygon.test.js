// #591 RhythmPolygon (owner comment 6376161263): rhythm clock geometry,
// measured like RhythmMaster (6376159285).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RP = require('../src/lib/music/rhythmPolygon.js');
const CHK = require('../src/lib/music/polygonCheck.js');
const SCREEN = require('../src/components/RhythmPolygon.js');
const I = require('../src/lib/instruments.js');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
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

test('the three steps practise only the practised clocks: sides, angles, symmetry and rotation', () => {
  assert.equal(SCREEN.STEPS.length, 3);
  assert.deepEqual(SCREEN.STEPS.map((s) => s.he), ['שלב 1 · צלעות', 'שלב 2 · זוויות', 'שלב 3 · סימטריה וסיבוב']);
  SCREEN.STEPS.forEach((s) => s.items.forEach((it) => {
    assert.ok(CHK.PRACTISED_N.includes(it.clock.cycle), it.prompt);
    assert.ok(it.choices.length >= 2 && it.choices.length <= 4);
  }));
  const same = SCREEN.STEPS[2].items.filter((x) => x.kind === 'same').map((x) => x.answer);
  assert.deepEqual(same, ['כן', 'לא']);
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

function solveAll(state, rec, phase, now) {
  let s = state;
  let r = rec;
  for (let i = 0; i < 12; i++) {
    assert.equal(s.phase, phase);
    const out = SCREEN.answerTest(s, r, SCREEN.currentItem(s).answer, now);
    s = out.state;
    r = out.rec;
  }
  return { s, r };
}

test('screen flow: choose instrument, pre-test, 3 steps, wait, post-test, wait, retention, report', () => {
  const t0 = 1e12;
  let s = SCREEN.start(null, t0, true);
  assert.equal(s.phase, 'choose');
  assert.equal(SCREEN.choose(s, 'piano'), s, 'only the offered instruments');
  s = SCREEN.choose(s, 'dizi');
  assert.equal(s.instrument, 'dizi');
  let o = solveAll(s, CHK.empty(), 'pre', t0);
  s = o.s;
  assert.equal(o.r.pre.results.length, 12);
  assert.equal(s.phase, 'steps');
  let rec = o.r;
  let n = 0;
  while (s.phase === 'steps') {
    const it = SCREEN.currentItem(s);
    const wrong = it.choices.find((c) => c !== it.answer);
    const w = SCREEN.answerStep(s, wrong);
    assert.equal(w.solved, false);
    assert.equal(SCREEN.nextStep(w, rec, t0), w, 'no skipping an unsolved step item');
    s = SCREEN.nextStep(SCREEN.answerStep(w, it.answer), rec, t0 + DAY);
    n += 1;
  }
  assert.equal(n, 12);
  assert.equal(s.phase, 'wait');
  assert.equal(s.daysLeft, 27);
  assert.equal(SCREEN.start(rec, t0 + DAY, true).phase, 'steps', 'a returning child keeps practising');
  s = SCREEN.refresh(s, rec, t0 + 28 * DAY);
  o = solveAll(s, rec, 'post', t0 + 28 * DAY);
  s = o.s;
  rec = o.r;
  assert.equal(s.phase, 'wait');
  assert.equal(s.daysLeft, 30);
  s = SCREEN.start(rec, t0 + 58 * DAY, true);
  o = solveAll(s, rec, 'retention', t0 + 58 * DAY);
  assert.equal(o.s.phase, 'report');
  assert.deepEqual(Object.keys(o.r).filter((k) => o.r[k]), ['pre', 'post', 'retention']);
});

test('play plan: one turn of the clock, a turned rhythm after it, the turn button shifts the corners', () => {
  const step3 = SCREEN.STEPS[2].items[1];
  const plan = SCREEN.playPlan(step3, 0, 'woodBar', false);
  assert.equal(plan.length, 16);
  assert.deepEqual(plan.filter((x) => x.kind === 'corner' && x.second).map((x) => x.beat), step3.clock.turned);
  const sq = SCREEN.STEPS[0].items[1];
  assert.deepEqual(SCREEN.playPlan(sq, 1, 'woodBar').filter((x) => x.kind === 'corner').map((x) => x.beat), [1, 2, 3, 0].sort());
});

const NO_CLAIM = /מוזיקה\s*(משפרת|מקדמת|מחזקת|משפר)|music\s+(improves|boosts|makes)/i;
const NO_BUY = /(^|[^א-ת])(קנה|מחיר|רכישה|מנוי)([^א-ת]|$)/;

test('every screen and item: Hebrew, aria, no claim that music improves maths, no buy/price words', () => {
  const t0 = 1e12;
  const rec = CHK.record(CHK.empty(), 'pre', [], t0);
  const states = [SCREEN.start(null, t0), SCREEN.choose(SCREEN.start(null, t0), 'marimba'), SCREEN.start(rec, t0), SCREEN.refresh(SCREEN.start(rec, t0), rec, t0)];
  SCREEN.STEPS.forEach((st, step) => st.items.forEach((_, item) => states.push(Object.assign({}, states[2], { step, item }))));
  const all = states.map(SCREEN.renderHtml).concat(['A', 'B', 'C'].flatMap((f) => CHK.buildForm(f).map((x) => x.prompt)));
  all.push(CHK.CHECK_DISCLAIMER, RP.PITCH_ADDON.he);
  all.forEach((h) => {
    assert.doesNotMatch(h, NO_CLAIM);
    assert.doesNotMatch(h, NO_BUY);
    assert.match(h, /[א-ת]/);
  });
  const stepHtml = SCREEN.renderHtml(states[4]);
  assert.match(stepHtml, /role="img" aria-label="שעון קצב/);
  assert.match(stepHtml, /data-act="music"/, 'practice has the music switch');
  assert.match(stepHtml, /class="jam-pad" data-tap="/, 'free play pads sound on pointerdown');
  assert.match(stepHtml, /ראיות חלשות/);
  assert.doesNotMatch(SCREEN.renderHtml(Object.assign({}, states[4], { showMusic: false })), /data-act="(play|turn|pitch)"|data-tap=/, 'silent without music');
  const testHtml = SCREEN.renderHtml(states[1]);
  assert.doesNotMatch(testHtml, /data-act="(music|play|turn|pitch)"/, 'the test is silent');
  assert.match(testHtml, /בדיקת פתיחה/);
});

test('dosage: geometry has one primary music method (M6), instruments are timbre only, page wired', () => {
  assert.equal(I.TOPICS.polygons.mechanism, 'M6');
  assert.equal(RP.MECHANISM, I.TOPICS.polygons.mechanism);
  assert.ok(I.PRIMARY.includes(RP.MECHANISM));
  assert.equal(I.TOPICS.symmetry.mechanism, RP.MECHANISM, 'symmetry and polygons share the method');
  assert.ok(SCREEN.INSTRUMENTS.length >= 2 && SCREEN.INSTRUMENTS.length <= 4);
  SCREEN.INSTRUMENTS.forEach((id) => assert.equal(I.instrumentById(id).mechanism, RP.MECHANISM, id));
  const html = read('index.html');
  assert.match(html, /id="rpCard"/);
  ['src/lib/music/rhythmPolygon.js', 'src/lib/music/polygonCheck.js', 'src/components/RhythmPolygon.js'].forEach((f) => {
    assert.ok(html.includes('<script src="' + f + '"></script>'), f);
    assert.ok(read('sw.js').includes("'./" + f + "'"), f);
  });
  assert.match(read('src/lib/music/rhythmPolygon.js'), /TODO-source/);
});
