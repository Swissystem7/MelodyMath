// #591 RhythmMaster (owner comment 6376159285): lcmOfVoices, adaptStep,
// validatePosedProblem, interleaved tasks with a reason step, the 12-item
// pre/post/retention measurement and the screen flow pre-test -> 3 steps ->
// post-test.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RM = require('../src/lib/music/rhythmMaster.js');
const MS = require('../src/lib/music/rhythmMeasure.js');
const IL = require('../src/lib/music/interleave.js');
const UI = require('../src/components/RhythmMaster.js');

const ROOT = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

function gcd(a, b) { return b ? gcd(b, a % b) : a; }
// Brute force: the first pulse > 0 where every voice strikes.
function bruteMeet(voices) {
  const vals = voices.map((v) => { const f = RM.parseVoice(v); return f.n / f.d; });
  for (let t = 0.5; t <= 20000; t += 0.5) {
    if (vals.every((v) => Math.abs(t / v - Math.round(t / v)) < 1e-9)) return t;
  }
  return null;
}

// ---- lcmOfVoices ---------------------------------------------------------

test('lcmOfVoices: the owner examples 3:4 and 2:3:5', () => {
  assert.equal(RM.lcmOfVoices([3, 4]), 12);
  assert.equal(RM.lcmOfVoices([2, 3, 5]), 30);
  assert.equal(RM.lcmOfVoices([4, 6]), 12);
  assert.equal(RM.lcmOfVoices([7]), 7);
});

test('lcmOfVoices is right for every pair of voices up to 12', () => {
  for (let a = 1; a <= 12; a++) {
    for (let b = 1; b <= 12; b++) {
      assert.equal(RM.lcmOfVoices([a, b]), a * b / gcd(a, b), a + ':' + b);
      assert.equal(RM.lcmOfVoices([a, b]), bruteMeet([a, b]), a + ':' + b + ' brute');
    }
  }
});

test('lcmOfVoices is right for every three voices up to 12', () => {
  for (let a = 1; a <= 12; a++) {
    for (let b = a; b <= 12; b++) {
      for (let c = b; c <= 12; c++) {
        const ab = a * b / gcd(a, b);
        const want = ab * c / gcd(ab, c);
        assert.equal(RM.lcmOfVoices([a, b, c]), want, a + ':' + b + ':' + c);
        assert.equal(RM.lcmOfVoices([c, a, b]), want, 'order does not matter');
      }
    }
  }
});

test('lcmOfVoices with non-whole (half-pulse) voices matches brute force', () => {
  const halves = ['1/2', '3/2', '5/2', '7/2', '9/2', '11/2'];
  const all = halves.concat([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  all.forEach((a) => halves.forEach((b) => {
    assert.equal(RM.lcmOfVoices([a, b]), bruteMeet([a, b]), a + ':' + b);
  }));
  assert.equal(RM.lcmOfVoices(['3/2', 2]), 6);
  assert.equal(RM.lcmOfVoices([1.5, 2]), 6, 'decimals work too');
  assert.equal(RM.lcmOfVoices(['3/2', '5/2']), 7.5);
});

test('lcmOfVoices refuses bad voices', () => {
  [[], null, [0, 3], [-2, 3], [3, 13], [3, '1/3'], [3, 'x'], [3, ''], [3, NaN]].forEach((v) => {
    assert.equal(RM.lcmOfVoices(v), null, JSON.stringify(v));
  });
});

test('strokesPerCycle: 3 and 4 play 4 and 3 strokes before they meet', () => {
  assert.deepEqual(RM.strokesPerCycle([3, 4]), [4, 3]);
  assert.deepEqual(RM.strokesPerCycle([2, 3, 5]), [15, 10, 6]);
  assert.deepEqual(RM.strokesPerCycle(['3/2', 2]), [4, 3]);
});

// ---- adaptStep ---------------------------------------------------------

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A simulated learner whose chance of success falls as the level rises.
function simulate(profile, answers, seed) {
  const r = rng(seed);
  let s = RM.initialAdapt(0);
  let right = 0;
  let counted = 0;
  for (let i = 0; i < answers; i++) {
    const ok = r() < profile[s.level];
    s = RM.adaptStep(s, ok).state;
    if (i >= 50) { counted += 1; if (ok) right += 1; }
  }
  return right / counted;
}

test('adaptStep keeps a learner between 70% and 85% success', () => {
  const learners = [
    [0.98, 0.95, 0.8, 0.6, 0.4],
    [0.99, 0.92, 0.78, 0.65, 0.5],
    [0.97, 0.9, 0.75, 0.6, 0.5],
    [0.95, 0.85, 0.75, 0.65, 0.55],
    [1, 0.97, 0.93, 0.85, 0.72],
  ];
  learners.forEach((p, i) => {
    for (let seed = 1; seed <= 10; seed++) {
      const rate = simulate(p, 600, seed * 31 + i);
      assert.ok(rate >= RM.BAND.low && rate <= RM.BAND.high, 'learner ' + i + ' seed ' + seed + ': ' + rate.toFixed(3));
    }
  });
});

test('adaptStep: high success adds a voice or a non-whole ratio', () => {
  let s = RM.initialAdapt(0);
  const seen = [];
  for (let i = 0; i < 60; i++) {
    const r = RM.adaptStep(s, true);
    if (r.move === 'up') {
      seen.push(r.added);
      const a = RM.LEVELS[s.level];
      const b = RM.LEVELS[r.state.level];
      assert.ok(b.voices > a.voices || (b.half && !a.half), 'level ' + s.level + ' -> ' + r.state.level);
      assert.ok(r.added === 'voice' || r.added === 'half');
      assert.deepEqual(r.state.recent, [], 'the window restarts');
    }
    s = r.state;
  }
  assert.deepEqual(seen, ['half', 'voice', 'half', 'voice']);
  assert.equal(s.level, RM.LEVELS.length - 1, 'stays at the top');
});

test('adaptStep: inside the band it stays, below 70% it steps down', () => {
  let s = { level: 2, recent: [] };
  // 8 of 10 = 80%: no move.
  [1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1].forEach((ok) => {
    const r = RM.adaptStep(s, !!ok);
    assert.equal(r.move, null);
    s = r.state;
  });
  assert.equal(s.level, 2);
  let d = { level: 2, recent: [] };
  let moved = null;
  [1, 0, 1, 0, 1, 0, 0, 1].forEach((ok) => { const r = RM.adaptStep(d, !!ok); if (r.move) moved = r.move; d = r.state; });
  assert.equal(moved, 'down');
  assert.equal(d.level, 1);
  assert.equal(RM.adaptStep({ level: 0, recent: [false, false, false, false, false, false, false] }, false).move, null, 'never below level 0');
});

test('adaptStep never mutates its input and accepts a missing state', () => {
  const s = { level: 1, recent: [true] };
  RM.adaptStep(s, true);
  assert.deepEqual(s, { level: 1, recent: [true] });
  assert.equal(RM.adaptStep(null, true).state.level, 0);
});

test('adaptive difficulty keeps the owner TODO-source marker', () => {
  assert.match(read('src/lib/music/rhythmMaster.js'), /TODO-source/);
  assert.match(read('src/components/RhythmMaster.js'), /TODO-source/);
});

// ---- validatePosedProblem ----------------------------------------------

test('validatePosedProblem accepts solvable puzzles and solves them', () => {
  const a = RM.validatePosedProblem({ voices: [3, 4], question: { kind: 'lcm' }, answer: '12' });
  assert.equal(a.ok, true);
  assert.equal(a.answer, '12');
  assert.equal(a.answerMatches, true);
  const b = RM.validatePosedProblem({ voices: [2, 3, 5], question: { kind: 'ratio' }, answer: '15:10:6' });
  assert.deepEqual([b.ok, b.answer, b.answerMatches], [true, '15:10:6', true]);
  const c = RM.validatePosedProblem({ voices: [3, 4], question: { kind: 'fraction', voice: 0, strokes: 2 }, answer: '2/4' });
  assert.deepEqual([c.ok, c.answer, c.answerMatches], [true, '1/2', true], '2/4 = 1/2');
  const d = RM.validatePosedProblem({ voices: ['3/2', 2], question: { kind: 'lcm', within: 6 } });
  assert.deepEqual([d.ok, d.answer, d.answerMatches], [true, '6', null]);
  const e = RM.validatePosedProblem({ voices: [3, 4], question: { kind: 'lcm' }, answer: '7' });
  assert.equal(e.ok, true, 'a wrong answer does not make the puzzle unsolvable');
  assert.equal(e.answerMatches, false);
});

test('validatePosedProblem rejects puzzles without a solution', () => {
  const cases = [
    [{ voices: [3, 4], question: { kind: 'lcm', within: 10 } }, 'no-meet-in-span'],
    [{ voices: [2, 3, 5], question: { kind: 'lcm', within: 29 } }, 'no-meet-in-span'],
    [{ voices: [3, 4], question: { kind: 'fraction', voice: 0, strokes: 5 } }, 'strokes-too-many'],
    [{ voices: [3, 4], question: { kind: 'fraction', voice: 2, strokes: 1 } }, 'bad-voice-ref'],
    [{ voices: [3], question: { kind: 'lcm' } }, 'too-few-voices'],
    [{ voices: [2, 3, 4, 5, 6], question: { kind: 'lcm' } }, 'too-many-voices'],
    [{ voices: [3, 0], question: { kind: 'lcm' } }, 'bad-voice'],
    [{ voices: [3, 13], question: { kind: 'lcm' } }, 'bad-voice'],
    [{ voices: [3, '1/3'], question: { kind: 'lcm' } }, 'bad-voice'],
    [{ voices: [4, 4], question: { kind: 'ratio' } }, 'same-voices'],
    [{ voices: [3, 4], question: { kind: 'guess' } }, 'bad-kind'],
    [{ voices: [3, 4], question: { kind: 'lcm', within: -3 } }, 'bad-within'],
    [null, 'too-few-voices'],
  ];
  cases.forEach(([p, code]) => {
    const r = RM.validatePosedProblem(p);
    assert.equal(r.ok, false, JSON.stringify(p));
    assert.ok(r.errors.indexOf(code) !== -1, JSON.stringify(p) + ' -> ' + r.errors);
    assert.equal(r.answer, null);
    assert.ok(r.messages.every((m) => typeof m === 'string' && m.length), 'every error has a Hebrew message');
  });
});

test('validatePosedProblem ignores empty voice slots from the form', () => {
  const r = RM.validatePosedProblem({ voices: ['3', '4', ''], question: { kind: 'lcm' } });
  assert.equal(r.ok, true);
  assert.equal(r.answer, '12');
});

// ---- tasks: interleaved, 2-4 choices, explain step -----------------------

test('practice interleaves lcm / ratio / fraction, never the same kind twice in a row', () => {
  const kinds = [];
  for (let i = 0; i < 60; i++) kinds.push(RM.kindForStep(i));
  for (let i = 1; i < kinds.length; i++) assert.notEqual(kinds[i], kinds[i - 1], 'step ' + i);
  RM.KINDS.forEach((k) => assert.equal(kinds.filter((x) => x === k).length, 20));
  const block = RM.practiceBlock(2, 12);
  const rounds = [block.slice(0, 6), block.slice(6)].map((r) => r.map((t) => ({ type: t.kind })));
  assert.ok(IL.roundsOk(rounds, 2), 'every round of 6 mixes kinds (interleave.js rule)');
});

test('every task at every level has its answer among 2-4 distinct choices and 3 reasons', () => {
  for (let level = 0; level < RM.LEVELS.length; level++) {
    for (let step = 0; step < 30; step++) {
      const t = RM.taskForStep(level, step);
      assert.equal(t.voices.length, RM.LEVELS[level].voices);
      assert.equal(t.voices.some((v) => RM.parseVoice(v).d === 2), RM.LEVELS[level].half, 'half voice on half levels only');
      assert.ok(t.cycle <= 60);
      assert.ok(t.choices.length >= 2 && t.choices.length <= 4, JSON.stringify(t.choices));
      assert.equal(t.choices.filter((c) => RM.sameAnswer(t.kind, c, t.answer)).length, 1, 'exactly one right choice: ' + JSON.stringify(t));
      assert.ok(RM.checkAnswer(t, t.answer));
      assert.equal(t.reasons.length, 3);
      assert.ok(RM.checkReason(t, t.reasonId));
      assert.equal(t.reasons.filter((r) => RM.checkReason(t, r.id)).length, 1);
      assert.deepEqual(RM.taskForStep(level, step), t, 'deterministic');
    }
  }
});

test('the answers are mathematically right', () => {
  const t = RM.makeTask('lcm', [3, 4]);
  assert.equal(t.answer, '12');
  assert.equal(RM.makeTask('ratio', [3, 4]).answer, '4:3');
  assert.equal(RM.makeTask('fraction', [3, 4]).answer, '1/2', '2 of 4 strokes');
  assert.ok(RM.sameAnswer('ratio', '8:6', '4:3'));
  assert.ok(RM.sameAnswer('fraction', '2/4', '1/2'));
  assert.ok(!RM.sameAnswer('lcm', '', '12'));
});

test('cyclePlan plays every voice and closes together', () => {
  const plan = RM.cyclePlan([3, 4]);
  assert.equal(plan.filter((n) => n.v === 0).length, 5, 'strokes 0,3,6,9,12');
  assert.equal(plan.filter((n) => n.v === 1).length, 4, 'strokes 0,4,8,12');
  const last = plan[plan.length - 1].at;
  assert.equal(plan.filter((n) => n.at === last).length, 2);
  assert.ok(last <= 8);
});

// ---- measurement -------------------------------------------------------

test('three parallel 12-item forms: same slots, different numbers, 6 practised + 6 unpractised', () => {
  const A = MS.buildForm('A');
  const B = MS.buildForm('B');
  const C = MS.buildForm('C');
  [A, B, C].forEach((f) => {
    assert.equal(f.length, 12);
    assert.equal(f.filter((i) => i.practised).length, 6);
    f.forEach((it) => assert.ok(it.choices.length >= 2 && it.choices.length <= 4));
  });
  A.forEach((a, i) => {
    [B[i], C[i]].forEach((b) => {
      assert.equal(a.kind, b.kind);
      assert.equal(a.voices.length, b.voices.length);
      assert.equal(a.voices.some((v) => RM.parseVoice(v).d === 2), b.voices.some((v) => RM.parseVoice(v).d === 2));
      assert.notEqual(a.prompt, b.prompt, a.slot + ' differs between forms');
      assert.ok(Math.max(a.cycle, b.cycle) / Math.min(a.cycle, b.cycle) <= 2.5, a.slot + ' similar size');
    });
  });
  A.filter((i) => !i.practised).forEach((it) => {
    assert.notEqual(it.context, 'drums', 'unpractised items use a context practice never shows');
    assert.doesNotMatch(it.prompt, /תוף|פעימ/);
  });
});

test('scoreForm splits practised and unpractised items', () => {
  const A = MS.buildForm('A');
  const all = MS.scoreForm(A, A.map((i) => i.answer));
  assert.deepEqual([all.correct, all.practised.correct, all.unpractised.correct], [12, 6, 6]);
  const half = MS.scoreForm(A, A.map((i) => (i.practised ? i.answer : 'x')));
  assert.deepEqual([half.correct, half.unpractised.correct], [6, 0]);
});

function score(unp, pr) {
  return { correct: unp + (pr || 0), total: 12, practised: { correct: pr || 0, total: 6 }, unpractised: { correct: unp, total: 6 } };
}

test('schedule: post-test opens 4 weeks after the pre-test, retention 30 days after the post-test', () => {
  const day = MS.DAY_MS;
  let r = MS.emptyRecord();
  assert.equal(MS.schedule(r, 0).next, 'pre');
  r = MS.recordTest(r, 'pre', score(2), 0);
  assert.equal(MS.schedule(r, 27 * day).next, 'practice');
  assert.equal(MS.schedule(r, 28 * day).next, 'post');
  r = MS.recordTest(r, 'post', score(4), 29 * day);
  assert.equal(r.post.early, false);
  assert.equal(MS.schedule(r, 58 * day).next, 'practice');
  assert.equal(MS.schedule(r, 59 * day).next, 'retention');
  r = MS.recordTest(r, 'retention', score(4), 60 * day);
  assert.equal(MS.schedule(r, 60 * day).next, 'done');
  assert.equal(MS.recordTest(MS.recordTest(null, 'pre', score(1), 0), 'post', score(2), day).post.early, true);
});

test('effectSize: (post - pre) / SD(pre) on unpractised items, target 0.3', () => {
  const day = MS.DAY_MS;
  const learner = (pre, post) => MS.recordTest(MS.recordTest(null, 'pre', score(pre), 0), 'post', score(post), 30 * day);
  const group = [learner(1, 2), learner(2, 3), learner(3, 3), learner(4, 5)];
  const e = MS.effectSize(group);
  // pre shares 1/6..4/6, sd = 0.2152; mean gain = 0.75/6 = 0.125 -> d = 0.581
  assert.equal(e.n, 4);
  assert.ok(Math.abs(e.d - 0.581) < 0.001, String(e.d));
  assert.equal(e.meetsTarget, true);
  const flat = MS.effectSize([learner(1, 1), learner(3, 3)]);
  assert.equal(flat.d, 0);
  assert.equal(flat.meetsTarget, false);
  assert.equal(MS.effectSize([learner(1, 3)]).d, null, 'one learner: no SD');
  const early = MS.recordTest(MS.recordTest(null, 'pre', score(1), 0), 'post', score(6), day);
  assert.equal(MS.effectSize(group.concat([early])).skipped, 1, 'an early post-test is left out');
});

test('retentionCheck: the result is kept within one item 30 days after the post-test', () => {
  const day = MS.DAY_MS;
  let r = MS.recordTest(MS.recordTest(null, 'pre', score(2), 0), 'post', score(5), 28 * day);
  assert.equal(MS.retentionCheck(r), null);
  const kept = MS.recordTest(r, 'retention', score(4), 58 * day);
  assert.deepEqual(MS.retentionCheck(kept), { days: 30, post: 5, retention: 4, retained: true });
  const lost = MS.recordTest(r, 'retention', score(3), 60 * day);
  assert.equal(MS.retentionCheck(lost).retained, false);
  assert.equal(MS.retentionCheck(MS.recordTest(r, 'retention', score(5), 40 * day)), null, 'too early does not count');
  assert.equal(MS.retentionRate([kept, lost]), 0.5);
});

test('measurement storage is injectable and keyed per learner', () => {
  const store = new Map();
  const storage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) };
  const r = MS.recordTest(null, 'pre', score(3), 5);
  assert.equal(MS.saveRecord('dana', r, storage), true);
  assert.deepEqual(MS.loadRecord('dana', storage), r);
  assert.deepEqual(MS.loadRecord('other', storage), MS.emptyRecord());
  assert.ok(store.has(MS.STORAGE_KEY));
  store.set(MS.STORAGE_KEY, '{bad');
  assert.deepEqual(MS.loadRecord('dana', storage), MS.emptyRecord(), 'corrupt data does not throw');
});

// ---- the screen: pre-test -> 3 steps -> post-test ------------------------

test('screen flow: 12-item pre-test, 3 steps with a reason each, then the parallel post-test', () => {
  const day = MS.DAY_MS;
  let s = UI.createState({ now: 0 });
  assert.match(UI.renderHtml(s), /data-act="start-test" data-phase="pre"/);
  s = UI.reduce(s, { type: 'start-test', phase: 'pre' }, { now: 0 });
  const pre = s.test.items;
  assert.equal(pre.length, 12);
  for (let i = 0; i < 12; i++) {
    const html = UI.renderHtml(s);
    assert.match(html, new RegExp('שאלה ' + (i + 1) + ' מתוך 12'));
    assert.doesNotMatch(html, /data-act="play"|data-tap/, 'the tests are silent');
    s = UI.reduce(s, { type: 'test-answer', value: i < 6 ? pre[i].answer : 'x' }, { now: 0 });
  }
  assert.equal(s.phase, 'practice');
  assert.equal(s.record.pre.score.correct, 6);
  assert.doesNotMatch(UI.renderHtml(s), /data-phase="post"/, 'post-test closed before 3 steps');
  const kinds = [];
  for (let step = 0; step < 3; step++) {
    kinds.push(s.task.kind);
    assert.match(UI.renderHtml(s), /data-act="answer"/);
    s = UI.reduce(s, { type: 'answer', value: s.task.answer }, { now: day });
    assert.equal(s.answerOk, true);
    const html = UI.renderHtml(s);
    assert.match(html, /למה\?/);
    assert.equal((html.match(/data-act="reason"/g) || []).length, 3);
    s = UI.reduce(s, { type: 'reason', id: s.task.reasonId }, { now: day });
    assert.equal(s.reasonOk, true);
    if (step < 2) s = UI.reduce(s, { type: 'next' }, { now: day });
  }
  assert.deepEqual(kinds, ['lcm', 'ratio', 'fraction'], 'interleaved');
  assert.equal(s.record.steps, 3);
  const html = UI.renderHtml(s);
  assert.match(html, /data-phase="post"/);
  assert.match(html, /4 שבועות/, 'says the post-test is meant for 4 weeks later');
  s = UI.reduce(s, { type: 'start-test', phase: 'post' }, { now: 28 * day });
  const post = s.test.items;
  assert.notDeepEqual(post.map((i) => i.prompt), pre.map((i) => i.prompt), 'parallel form, not the same items');
  post.forEach((it) => { s = UI.reduce(s, { type: 'test-answer', value: it.answer }, { now: 28 * day }); });
  assert.equal(s.phase, 'summary');
  assert.equal(s.record.post.score.correct, 12);
  assert.equal(s.record.post.early, false);
  const sum = UI.renderHtml(s);
  assert.match(sum, /בפריטים שלא תורגלו: 6 מתוך 6/);
  assert.match(sum, /לא ניסוי מבוקר/);
  assert.match(sum, /בדיקת שימור תיפתח/);
});

test('screen: a wrong answer still asks for the reason and names the right one', () => {
  let s = UI.reduce(UI.createState({ record: MS.recordTest(null, 'pre', score(1), 0) }), { type: 'practice' }, { now: 0 });
  const wrong = s.task.choices.find((c) => !RM.sameAnswer(s.task.kind, c, s.task.answer));
  s = UI.reduce(s, { type: 'answer', value: wrong }, { now: 0 });
  assert.equal(s.answerOk, false);
  assert.equal(s.sub, 'explain');
  assert.match(s.message, /התשובה היא/);
  const bad = s.task.reasons.find((r) => r.id !== s.task.reasonId);
  s = UI.reduce(s, { type: 'reason', id: bad.id }, { now: 0 });
  assert.equal(s.reasonOk, false);
  assert.match(s.message, /הנימוק המתאים/);
});

test('screen: "pose a puzzle" refuses one without a solution and solves one that has it', () => {
  let s = UI.reduce(UI.createState({ record: MS.recordTest(null, 'pre', score(1), 0) }), { type: 'pose-open' }, { now: 0 });
  assert.match(UI.renderHtml(s), /המציאו חידה/);
  s = UI.reduce(s, { type: 'pose-check', draft: { voices: ['3', '4', ''], kind: 'lcm', within: '10', strokes: '', answer: '' } }, { now: 0 });
  assert.equal(s.pose.result.ok, false);
  assert.match(UI.renderHtml(s), /אין פתרון/);
  s = UI.reduce(s, { type: 'pose-check', draft: { voices: ['2', '3', '5'], kind: 'lcm', within: '', strokes: '', answer: '30' } }, { now: 0 });
  assert.equal(s.pose.result.ok, true);
  assert.match(UI.renderHtml(s), /יש לחידה פתרון: <bdi dir="ltr">30<\/bdi>\. גם התשובה שלכם נכונה/);
  assert.match(UI.renderHtml(s), /<option value="5" selected>/, 'the draft is kept');
});

test('screen: the music switch removes the play button but the task stays solvable', () => {
  let s = UI.reduce(UI.createState({ showMusic: false, record: MS.recordTest(null, 'pre', score(1), 0) }), { type: 'practice' }, { now: 0 });
  assert.doesNotMatch(UI.renderHtml(s), /data-act="play"|data-tap/);
  const on = UI.reduce(s, { type: 'music' }, { now: 0 });
  const pads = UI.renderHtml(on).match(/class="jam-pad" data-tap="[a-zA-Z]+"/g) || [];
  assert.equal(pads.length, on.task.voices.length, 'one free-play pad per voice, sounding on pointerdown');
  s = UI.reduce(s, { type: 'answer', value: s.task.answer }, { now: 0 });
  assert.equal(s.answerOk, true);
});

// ---- wiring and wording ---------------------------------------------------

test('index.html and sw.js load the three RhythmMaster files in order', () => {
  const html = read('index.html');
  assert.match(html, /id="rmCard"/);
  const a = html.indexOf('src/lib/music/rhythmMaster.js');
  const b = html.indexOf('src/lib/music/rhythmMeasure.js');
  const c = html.indexOf('src/components/RhythmMaster.js');
  assert.ok(a > html.indexOf('src/components/jamKit.js') && a < b && b < c);
  const sw = read('sw.js');
  ['./src/lib/music/rhythmMaster.js', './src/lib/music/rhythmMeasure.js', './src/components/RhythmMaster.js'].forEach((f) => assert.ok(sw.includes("'" + f + "'"), f));
});

test('no "music improves maths" claim and no buy/price words in RhythmMaster text', () => {
  const text = ['src/lib/music/rhythmMaster.js', 'src/lib/music/rhythmMeasure.js', 'src/components/RhythmMaster.js']
    .map(read).join('\n').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  assert.doesNotMatch(text, /קנה|קנו|מחיר|רכישה|מנוי|מטבע|פרס/);
  assert.doesNotMatch(text, /(מוזיקה|מוסיקה|נגינה|הקצב)[^.'"]{0,30}(משפר|משפרת|מחזק|מחזקת|מעלה|משדרג)/);
  assert.doesNotMatch(text, /improves? math/i);
  assert.doesNotMatch(text, /Math\.random/, 'no randomness');
});
