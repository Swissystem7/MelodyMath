// #591 RhythmMaster (owner comment 6376159285): lcmOfVoices, adaptStep,
// validatePosedProblem, interleaved tasks with a reason step, the 12-item
// pre/post/retention measurement and the screen flow pre-test -> 3 steps ->
// post-test.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RM = require('../src/lib/music/rhythmTrack.js');
// const MS
// const IL
// const UI

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

