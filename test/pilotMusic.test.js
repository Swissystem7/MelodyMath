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
const leaks = (text, answer) => new RegExp('(^|[^0-9/])' + String(answer).replace(/[/.]/g, '\\$&') + '([^0-9/]|$)').test(text);

test('every keypad exercise plays as many notes as its numbers, and the answer resolves home', () => {
  U.QUESTIONS.filter((q) => q.kind !== 'rhythm').forEach((q) => {
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
  U.QUESTIONS.forEach((q) => {
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
  U.QUESTIONS.forEach((q) => {
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

  const q1 = U.QUESTIONS[0];
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
  assert.match(U.hintText(U.QUESTIONS[2]), /אחורה 4/);
  assert.deepEqual(U.hintGroups(U.QUESTIONS[4]), [10]);
  assert.deepEqual(U.hintGroups(U.QUESTIONS[0]), [4, 3]);
});

test('captions for 20 − 10 and an unknown exercise', () => {
  const q6 = U.QUESTIONS.find((q) => q.id === 'q6');
  assert.match(M.caption(q6, 'question'), /2 עשרות/);
  assert.match(M.caption(q6, 'right'), /= 10/);
  assert.equal(M.caption({ id: 'x' }, 'question'), '');
});
