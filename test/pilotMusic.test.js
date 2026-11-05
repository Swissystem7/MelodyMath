// MM-601 pilot demo — the music of each exercise (pilot/js/music.js) and the
// curriculum ids and research claims it shows (pilot/js/unit.js, pilot/js/research.js).
const test = require('node:test');
const assert = require('node:assert/strict');

const U = require('../pilot/js/unit.js');
const M = require('../pilot/js/music.js');
const R = require('../pilot/js/research.js');
const C = require('../src/lib/curriculum.js');

const COUNTED = ['a', 'b', 'one', 'ten', 'removed', 'removed-ten'];
const counted = (notes, solved) => notes.filter((n) => COUNTED.includes(n.role) && !(solved && n.role.startsWith('removed')));
const escape = (v) => String(v).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const leaks = (text, answer) => new RegExp('(^|[^0-9/])' + escape(answer) + '([^0-9/]|$)').test(text);

test('every keypad exercise plays as many notes as its numbers, and the answer resolves home', () => {
  U.QUESTIONS.filter((q) => !q.kind).forEach((q) => {
    const question = M.plan(q, 'question');
    const right = M.plan(q, 'right');
    const tens = (n) => n.filter((x) => x.role === 'ten' || x.role === 'removed-ten').length;
    const value = (n) => n.length - tens(n) + 10 * tens(n);
    if (q.op === '+') assert.equal(value(counted(question)), q.a + q.b, q.id);
    else assert.equal(value(counted(question)), q.a, q.id);
    assert.equal(value(counted(right, true)), U.answerOf(q), q.id + ' solved');
    assert.ok(!question.some((n) => n.role === 'home'), q.id + ' does not resolve before the answer');
    assert.deepEqual(right.filter((n) => n.role === 'home').map((n) => n.note), ['C4', 'E4', 'G4'], q.id);
    assert.ok(!M.plan(q, 'hint').some((n) => n.role === 'home'), q.id + ' hint stays unresolved');
  });
});

test('captions, descriptions and hints never name the answer before the child answers', () => {
  U.QUESTIONS.filter((q) => !q.kind || q.kind === 'rhythm').forEach((q) => {
    const answer = U.answerOf(q);
    if (leaks(U.questionText(q), answer)) return; // e.g. 20 − 10: the 10 is in the question itself
    const open = [M.caption(q, 'question'), M.describe(q, 'question'), M.hint(q, 'quarter'), M.hint(q, 'whole'), U.hintText(q)];
    open.forEach((t) => assert.ok(!leaks(t, answer), q.id + ': ' + t));
    assert.ok(leaks(M.caption(q, 'right'), answer), q.id + ' says the answer once solved');
  });
  const q7 = U.QUESTIONS.find((q) => q.kind === 'rhythm');
  assert.doesNotMatch(M.caption(q7, 'question') + M.hint(q7, 'quarter') + M.hint(q7, 'whole'), /חצי/);
});

test('the fraction bar: two quarters plus a half fill one 4/4 bar exactly', () => {
  assert.equal(M.barFill('half').status, 'full');
  assert.equal(M.barFill('quarter').status, 'short');
  assert.equal(M.barFill('whole').status, 'over');
  const q7 = U.QUESTIONS.find((q) => q.kind === 'rhythm');
  assert.ok(U.isCorrect(q7, 'half'));
  assert.ok(!U.isCorrect(q7, 'quarter'));
  const beat = 60 / M.RHYTHM_BPM;
  const chosen = M.plan(q7, 'right').find((n) => n.role === 'chosen');
  assert.ok(Math.abs(chosen.at - 2 * beat) < 0.01);
  assert.equal(M.plan(q7, 'question').filter((n) => n.role === 'click').length, 4);
});

test('every curriculum id the demo shows is a real, quoted row of curriculum.js', () => {
  Object.keys(U.TOPICS).forEach((t) => {
    assert.ok(U.CURRICULUM[t] && U.CURRICULUM[t].length, t + ' has curriculum ids');
    U.CURRICULUM[t].forEach((id) => {
      const row = C.topicById(id);
      assert.ok(row, id);
      assert.ok(row.verified, id + ' is verified by an official quote');
      assert.ok(['א', 'ב', 'ג', 'ד'].includes(row.grade), id);
    });
  });
  assert.equal(C.topicById('mm-cur-32').strand, 'fractions');
});

test('the why-it-works panel: 3–5 claims, each with a source and what it does not show', () => {
  assert.ok(R.CLAIMS.length >= 3 && R.CLAIMS.length <= 5);
  R.CLAIMS.forEach((c) => {
    assert.match(c.source, /(19|20)\d\d/);
    assert.ok(c.shows && c.limits, c.id);
    if (c.url) assert.match(c.url, /^https:\/\//);
    assert.doesNotMatch(c.shows + c.limits, /מוכיח|הוכח|ADHD|דיסקלקול/);
  });
  assert.match(R.HONESTY, /לא נבדק/);
});

test('describe and hint have a line for every exercise and every rhythm choice', () => {
  U.QUESTIONS.filter((q) => !q.kind || q.kind === 'rhythm').forEach((q) => {
    assert.ok(M.describe(q, 'question').length > 10, q.id);
    assert.ok(M.hint(q, 'quarter').length > 10, q.id);
    if (q.kind !== 'rhythm') assert.ok(M.chips(q, 'right').some((c) => c.role === 'home'), q.id);
  });
  const q7 = U.QUESTIONS.find((q) => q.kind === 'rhythm');
  assert.match(M.hint(q7, 'half'), /4 פעמות/);
  assert.equal(M.plan(q7, 'hint', 'whole').filter((n) => n.role === 'click-over').length, 2);
  assert.deepEqual(U.hintGroups(q7), []);
  assert.equal(U.questionText(q7), '1/4 + 1/4 + ? = 1');
});

test('the player schedules every note on Web Audio, records it for the tests, and stays silent when muted', async (t) => {
  // A tiny fake AudioContext, enough for musicEngine and instrumentVoices.
  const log = { started: 0 };
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = (x) => Object.assign({ connect(n) { return n || this; }, disconnect() {} }, x);
  class FakeAC {
    constructor() { this.state = 'running'; this.currentTime = 0; this.sampleRate = 8000; this.destination = node(); }
    resume() { return Promise.resolve(); }
    createGain() { return node({ gain: param() }); }
    createOscillator() { return node({ frequency: param(), start() { log.started++; }, stop() {} }); }
    createBiquadFilter() { return node({ frequency: param() }); }
    createBuffer(c, len) { const d = new Float32Array(Math.max(1, len)); return { length: len, getChannelData: () => d }; }
    createBufferSource() { return node({ start() {}, stop() {} }); }
  }
  global.window = { AudioContext: FakeAC };
  const V = require('../src/lib/instrumentVoices.js');
  t.after(() => { delete global.window; delete globalThis.playVoice; M.setMuted(false); M.stop(); });

  const q1 = U.QUESTIONS.find((q) => !q.kind); // q5: q1–q4 are planned by score.js since a04
  const seen = [];
  // Without instrument voices: the engine's plain tones.
  assert.equal(M.play('fallback', M.plan(q1, 'question')), 'played');
  const plain = log.started;
  assert.ok(plain >= 7);
  // With the instrument voices (as on the page, where they are globals).
  globalThis.playVoice = V.playVoice;
  assert.equal(M.play('voiced', M.plan(q1, 'right'), (n) => seen.push(n)), 'played');
  assert.ok(log.started > plain);
  const rec = globalThis.__mmPilotMusic.plays.at(-1);
  assert.equal(rec.id, 'voiced');
  assert.equal(rec.notes.filter((n) => n.role === 'home').length, 3);
  await new Promise((r) => setTimeout(r, 200));
  assert.ok(seen.length >= 1, 'notes light up as they play');
  M.stop();

  M.setMuted(true);
  assert.ok(M.isMuted());
  const before = log.started;
  assert.equal(M.play('muted', M.plan(q1, 'question')), 'silent');
  assert.equal(log.started, before);
});

// a04: q1–q4 are a 10-beat strip planned by score.js. The beats that sound add up
// to the answer (a held note of 2 beats counts 2), and a taken-away beat is silent.
test('q1–q4: the sounding beats of the 10-beat strip add up to the answer; a held note counts its beats', () => {
  const S = require('../pilot/js/score.js');
  const qs = U.QUESTIONS.filter((q) => q.kind === 'num');
  assert.deepEqual(qs.map((q) => q.id), ['q1', 'q2', 'q3', 'q4']);
  qs.forEach((q) => {
    assert.equal(q.music.kind, 'durations', q.id);
    assert.equal(q.music.beats, 10, q.id + ' is a cycle of 10');
    const sounding = q.music.bars.flat().filter((n) => !n.rest).reduce((sum, n) => sum + n.len, 0);
    assert.equal(sounding, q.answer, q.id);
    q.music.bars.forEach((bar) => assert.ok(bar.reduce((sum, n) => sum + n.len, 0) <= 10, q.id + ' fits the cycle'));
    const held = S.plan(q.music, 'question').notes.filter((n) => n.role === 'held');
    assert.equal(held.length, q.music.bars.flat().filter((n) => !n.rest).length, q.id + ' rests are silent');
  });
  const long = (q) => q.music.bars.flat().filter((n) => !n.rest && n.len === 2).length;
  assert.equal(long(qs[0]), 1, 'q1: one held note of 2 beats');
  assert.equal(qs[1].music.bars[0].reduce((s2, n) => s2 + n.len, 0), 10, 'q2: the held note fills the cycle to 10');
});

test('the report has the fraction topic and keeps the gap rule; stars count first tries over all 7', () => {
  const all = {};
  U.QUESTIONS.forEach((q) => { all[q.id] = { tries: 1, correct: true, firstTry: true }; });
  assert.equal(U.stars(all), 3);
  assert.deepEqual(U.topicReport(all).map((t) => [t.topic, t.status]), [['add', 'ok'], ['sub', 'ok'], ['tens', 'ok'], ['frac', 'ok']]);
  all.q7 = { tries: 2, correct: false, revealed: true, firstTry: false };
  all.q3 = { tries: 2, correct: true, firstTry: false };
  assert.equal(U.stars(all), 2);
  assert.deepEqual(U.gaps(all).map((t) => t.topic), ['sub', 'frac']);
  assert.equal(U.stars({}), 1);
  assert.equal(U.topicReport(null)[3].status, 'none');
  assert.equal(U.isCorrect(U.QUESTIONS[0], ''), false);
  assert.equal(U.isCorrect(U.QUESTIONS[0], ' 7 '), true);
  assert.equal(U.answerOf(U.QUESTIONS[6]), '1/2');
  assert.match(U.hintText(U.QUESTIONS[5]), /אחורה 10/);
  assert.deepEqual(U.hintGroups(U.QUESTIONS[4]), [10]);
  assert.deepEqual(U.hintGroups(U.QUESTIONS[0]), []); // q1 is a score.js exercise now: its hint is the slow replay
});

test('captions for 20 − 10 and an unknown exercise', () => {
  const q6 = U.QUESTIONS.find((q) => q.id === 'q6');
  assert.match(M.caption(q6, 'question'), /2 עשרות/);
  assert.match(M.caption(q6, 'right'), /= 10/);
  assert.equal(M.caption({ id: 'x' }, 'question'), '');
});

// Engine upgrades from the per-topic studies (a05/b05, a08, b06, b09).
test('score.js: secondary accent, stereo pan on a grid, a drawn triangle, face-pair motifs', () => {
  const S = require('../pilot/js/score.js');
  const X = require('../pilot/js/coverage.js');
  const byId = (id) => X.allUnits().flatMap((u) => u.questions).find((q) => q.id === id);
  // b05/a05: 4/4 has a secondary accent on beat 3, a 10-beat cycle on beat 6 (5 + 5)
  const roles = (spec) => S.plan(spec, 'question').rows[0].groups.map((g) => g.tokens.map((k) => k.role));
  assert.deepEqual(roles({ kind: 'beats', bars: [4] })[0], ['accent', 'beat', 'accent2', 'beat']);
  assert.equal(roles({ kind: 'beats', bars: [10] })[0].indexOf('accent2'), 5);
  assert.ok(!roles({ kind: 'beats', bars: [4], sub: false })[0].includes('accent2'));
  assert.ok(!roles({ kind: 'beats', bars: [3] })[0].includes('accent2'));
  // a08: right/left is stereo, up/down is pitch — a step right keeps the pitch
  const at5 = byId('at5');
  const n = S.plan(at5.music, 'question').notes;
  assert.deepEqual(n.map((x) => x.pan || 0), [0, 0.33, 0.67, 1, 1, 0.67, 0.33], '3 right, 1 up, 2 left: the last note is still a little to the right');
  assert.equal(new Set(n.slice(0, 4).map((x) => x.hz)).size, 1, 'steps to the right do not change the pitch');
  assert.ok(n[4].hz > n[3].hz, 'a step up raises the pitch');
  assert.equal(n[4].pan, n[3].pan, 'a step up does not move the sound sideways');
  assert.equal(new Set(n.slice(4).map((x) => x.hz)).size, 1);
  assert.equal(at5.answer, 3 - 2, 'the net steps to the right, as in the check without music');
  assert.doesNotMatch(S.plan(at5.music, 'question').svg, /<line|●/, 'the picture does not show the path or the end before the answer');
  assert.match(S.plan(at5.music, 'right').svg, /<line[\s\S]*●/);
  assert.match(S.plan(byId('sd1').music, 'question').svg, /קדימה/);
  assert.match(S.plan(byId('sd2').music, 'question').svg, /בסיס/);
  // b06: three equal sides = three equal durations, the triangle is drawn rotated
  const sd4 = byId('sd4');
  const p4 = S.plan(sd4.music, 'question');
  const held = p4.notes.filter((x) => x.role === 'held');
  assert.equal(new Set(held.slice(0, 3).map((x) => x.dur)).size, 1);
  assert.equal(new Set(held.map((x) => x.hz)).size, 1, 'same pitch: only the duration differs');
  assert.ok(Math.abs(held[5].dur - 2 * held[3].dur) < 0.01, '2, 2, 4: the two short ones equal the long one');
  assert.match(p4.svg, /<polygon/);
  // b09: opposite (congruent) faces play the same motif, another pair another one
  const faces = S.plan(byId('sd1').music, 'question').rows[0].groups.filter((g) => / is-face/.test(g.cls));
  assert.equal(faces.length, 6);
  const motif = (g) => g.tokens.map((k) => k.w).join(',');
  [0, 2, 4].forEach((i) => assert.equal(motif(faces[i]), motif(faces[i + 1]), 'pair ' + i));
  assert.equal(new Set([0, 2, 4].map((i) => motif(faces[i]))).size, 3);
  const pyr = S.plan(byId('sd2').music, 'question').rows[0].groups.filter((g) => / is-face/.test(g.cls));
  assert.equal(pyr.length, 5);
  assert.equal(new Set(pyr.slice(1).map(motif)).size, 1, 'the four triangles are congruent');
});
