'use strict';
// PersonalBestEncore (Refs #591): an encore when the child beats their own best in a topic.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const P = require('../src/lib/motivation/personalBest');
const streak = require('../src/lib/streak');
const myInstrument = require('../src/lib/myInstrument');
const instruments = require('../src/lib/instruments');
const curriculum = require('../src/lib/curriculum');
const progression = require('../src/lib/curriculum/progression');

const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
function mockStorage(seed) {
  const store = new Map(Object.entries(seed || {}));
  return { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k), store };
}

test('isNewBest: higher accuracy, or the same accuracy with fewer hints (spec acceptance)', () => {
  assert.equal(P.isNewBest({ acc: 0.8, h: 2 }, { acc: 0.8, h: 1 }), true);
  assert.equal(P.isNewBest({ acc: 0.9, h: 0 }, { acc: 0.8, h: 0 }), false);
  assert.equal(P.isNewBest({ acc: 0.5, h: 0 }, { acc: 0.6, h: 3 }), true);
  assert.equal(P.isNewBest({ acc: 0.8, h: 1 }, { acc: 0.8, h: 1 }), false);
  assert.equal(P.isNewBest(null, { acc: 1, h: 0 }), false, 'the first run sets the bar; there is nothing to beat yet');
});

test('recordRun keeps one best per child and topic, and only raises it', () => {
  P.setStorage(mockStorage());
  const first = P.recordRun('A/נועה', 'ג:MULT', { correct: 4, total: 6, hintsUsed: 1 });
  assert.deepEqual([first.isNew, first.first, first.run.acc], [false, true, 0.667]);
  assert.equal(P.recordRun('A/נועה', 'ג:MULT', { correct: 3, total: 6, hintsUsed: 0 }).isNew, false);
  assert.deepEqual(P.bestFor('A/נועה', 'ג:MULT'), { acc: 0.667, h: 1 });
  const same = P.recordRun('A/נועה', 'ג:MULT', { correct: 4, total: 6, hintsUsed: 0 });
  assert.deepEqual([same.isNew, same.prev.h], [true, 1]);
  assert.equal(P.recordRun('A/נועה', 'ג:MULT', { correct: 6, total: 6, hintsUsed: 2 }).isNew, true);
  assert.deepEqual(P.bestFor('A/נועה', 'ג:MULT'), { acc: 1, h: 2 });
  // Another topic and another child start on their own.
  assert.equal(P.recordRun('A/נועה', 'ג:DIV', { correct: 6, total: 6 }).first, true);
  assert.equal(P.recordRun('A/דן', 'ג:MULT', { correct: 1, total: 6 }).first, true);
  assert.equal(P.recordRun('A/נועה', 'ג:MULT', { correct: 0, total: 0 }).isNew, false, 'an empty run is never saved');
});

test('no comparison between children: no API reads across children, the screen names nobody else', () => {
  const api = Object.keys(P).join(' ');
  assert.doesNotMatch(api, /rank|leader|compare|others|top/i);
  const src = read('src/lib/motivation/personalBest.js');
  assert.doesNotMatch(src, /Object\.keys\(all\)|leaderboard|דירוג/);
  assert.doesNotMatch(read('index.html').match(/function personalBestEncore[\s\S]*?\n}/)[0], /getRoster|listStudents|classBoard/);
});

test('feedback is about the strategy, never about being smart', () => {
  assert.match(P.strategyLine('M2', { acc: 1, h: 0 }, { acc: 0.8, h: 0 }), /השתמשת בקבוצות שוות/);
  assert.match(P.strategyLine('M1', { acc: 0.8, h: 0 }, { acc: 0.8, h: 2 }), /פחות רמזים/);
  const all = Object.keys(P.STRATEGY).map((m) => P.strategyLine(m, { acc: 1, h: 0 }, null)).concat(P.strategyLine(null));
  all.forEach((s) => assert.doesNotMatch(s, /חכם|חכמה|כישרון|מוכשר|גאון/));
});

test('the encore uses myInstrument.instrumentFor and backing from 2 other instrument families', () => {
  const store = mockStorage();
  myInstrument.setMyInstrument('djembe', store);
  const calls = [];
  const orig = myInstrument.instrumentFor;
  myInstrument.instrumentFor = function () { calls.push([...arguments]); return orig.apply(this, arguments); };
  try {
    const plan = P.encorePlan(streak.PHRASES.slice(0, 2), { storage: store });
    assert.equal(calls.length, 1);
    assert.equal(plan.lead, 'djembe');
    const fams = new Set([plan.leadFamily].concat(plan.backing.map((b) => b.family)));
    assert.equal(plan.backing.length, 2);
    assert.equal(fams.size, 3, 'lead and backing are three different families');
    plan.backing.forEach((b) => assert.equal(instruments.instrumentById(b.id).family, b.family));
    const played = [];
    const later = [];
    P.playEncore(plan, { playPhrase: (p, inst, ac, d) => { played.push(inst); return { started: true }; } }, 0, { set: (f) => later.push(f), clear() {} });
    later.forEach((f) => f());
    assert.equal(played[0], 'djembe');
    assert.equal(played.filter((id) => id === 'djembe').length, 2, 'both phrases on the lead');
    assert.deepEqual(new Set(played), new Set(['djembe', plan.backing[0].id, plan.backing[1].id]));
  } finally { myInstrument.instrumentFor = orig; }
  assert.equal(P.encorePlan([], { storage: mockStorage() }).lead, 'piano', 'no pick yet: the default lead');
});

test('band break after 20 minutes in a row, once; a pause starts over; no day is counted', () => {
  P.resetSession();
  const t0 = 1e12, min = 60 * 1000;
  let shown = 0;
  for (let m = 0; m <= 25; m++) if (P.tick(t0 + m * min)) shown++;
  assert.equal(shown, 1);
  P.resetSession();
  assert.equal(P.tick(t0), false);
  assert.equal(P.tick(t0 + 19 * min), false, 'a 19-minute gap is a pause, not play in a row');
  assert.equal(P.tick(t0 + 25 * min), false);
  assert.doesNotMatch(read('src/lib/motivation/personalBest.js'), /dayKey|toDateString|penalt/);
});

test('wired into the topic step on the practice screen, after its last item', () => {
  const html = read('index.html');
  assert.match(html, /<script src="src\/lib\/motivation\/personalBest\.js"><\/script>/);
  assert.match(html, /function rpAdvance\(\)\{const st=rmPlan\[rpStep\];if\(\(st\.history\|\|\[\]\)\.length<PLAN_PER_SKILL\)\{rpRender\(\);return\}const enc=personalBestEncore\(st\);/);
  assert.match(html, /P\.playEncore\(P\.encorePlan\(/);
  assert.match(html, /id="bandBreak"/);
  assert.match(html, /bandBreakTick\(\);/);
  assert.match(read('sw.js'), /'\.\/src\/lib\/motivation\/personalBest\.js'/);
});

test('a long encore stops when the exercise changes: nothing plays over the next one (#801)', () => {
  const song = Array.from({ length: 8 }, (_, i) => streak.PHRASES[i % streak.PHRASES.length]);
  const plan = P.encorePlan(song, { storage: mockStorage() });
  const pending = new Map();
  let id = 0;
  const timer = { set: (f, ms) => { pending.set(++id, { f, ms }); return id; }, clear: (k) => pending.delete(k) };
  const played = [];
  const h = P.playEncore(plan, { playPhrase: (p) => { played.push(p); return {}; } }, 0.3, timer);
  assert.ok(h.seconds > 5, 'a song of 8 phrases is longer than the 5s before the next exercise');
  const now = played.length;
  assert.ok(now <= 3, 'only the first phrase and bar go to the audio clock up front');
  assert.ok([...pending.values()].some((x) => x.ms > 5000), 'the rest is still waiting when the next exercise shows');
  h.stop();
  assert.equal(pending.size, 0, 'stop() clears every waiting phrase and bar');
  assert.equal(played.length, now);
  assert.equal(P.playEncore(null, {}), null);
});

test('the page stops the encore on the next exercise and when the child leaves the practice screen', () => {
  const html = read('index.html');
  assert.match(html, /function rpRender\(\)\{if\(typeof stopEncore==='function'\)stopEncore\(\);/);
  assert.match(html, /rpEncore=P\.playEncore\(/);
  assert.match(html, /\['rmPlanRestart','rmPlanReport'\]\.forEach\(function\(id\)\{ const b=\$\(id\); if\(b&&b\.addEventListener\) b\.addEventListener\('click',stopEncore\); \}\);/);
});

// The page's own rpAdvance + personalBestEncore, run in a VM: the last item of a topic step ends it.
function runStepEnd(quiet) {
  const html = read('index.html').replace(/\r\n/g, '\n');
  const src = html.match(/function personalBestEncore\(st\)\{[\s\S]*?\n\}\n/)[0] + html.match(/var rpEncore=null;\nfunction stopEncore\(\)\{.*\n/)[0] + html.match(/function rpAdvance\(\)\{.*\n/)[0];
  P.setStorage(mockStorage({ 'mm.personalBest.v1': JSON.stringify({ me: { 'ג:MULT': { acc: 0.5, h: 0 } } }) }));
  const els = {};
  const el = (id) => els[id] || (els[id] = { id, innerHTML: '', textContent: '', hidden: true, disabled: false, focus() {} });
  const played = [], instCalls = [];
  const prevMine = globalThis.MM_MY_INSTRUMENT;
  globalThis.MM_MY_INSTRUMENT = { instrumentFor: (f) => { instCalls.push(f); return 'djembe'; } };
  const ctx = vm.createContext({
    MM_PERSONAL_BEST: P,
    MM_MASTERY_STREAK: { mySong: () => [], PHRASES: streak.PHRASES, playPhrase: (p, inst) => { played.push(inst); return {}; } },
    $: el, show: (id, on) => { el(id).hidden = !on; }, prefsNow: () => ({ quiet }), who: { classCode: '', name: '' }, selectedGrade: 'ג',
    mechanismOf: () => 'M2', generateRhythmExercise: () => ({ pattern: [], bpm: 80, fractionPattern: '♩♩' }), playRhythmClicks: () => played.push('rhythm'),
    endTeacherSession() {}, rpRender() {}, setTimeout() {}, PLAN_PER_SKILL: 6, rpStep: 0, rpItem: 0,
    rmPlan: [{ skill: 'MULT', he: 'כפל', history: Array.from({ length: 6 }, () => ({ correct: true })), hints: 0, current: { music: 'equalGroups' } }],
  });
  let stoppedAfter;
  try {
    vm.runInContext(src + '\nrpAdvance();', ctx);
    const before = played.length;
    vm.runInContext('stopEncore();', ctx); // what rpRender does when the next exercise shows
    stoppedAfter = vm.runInContext('rpEncore', ctx) === null && played.length === before;
  } finally { globalThis.MM_MY_INSTRUMENT = prevMine; }
  return { reward: el('rmReward'), played, instCalls, stoppedAfter };
}

test('the end of a topic step shows the encore and plays it on the child\'s instrument (page code in a VM)', () => {
  const { reward, played, instCalls, stoppedAfter } = runStepEnd(false);
  assert.ok(stoppedAfter, 'stopEncore() ends the page\'s encore');
  assert.match(reward.innerHTML, /data-encore[\s\S]*הדרן[\s\S]*השתמשת בקבוצות שוות/);
  assert.equal(reward.hidden, false);
  assert.equal(instCalls.length, 1);
  assert.equal(played[0], 'djembe');
  assert.equal(new Set(played.map((id) => instruments.instrumentById(id).family)).size, 3);
  assert.ok(!played.includes('rhythm'), 'the encore replaces the finale clicks, not on top of them');
  assert.deepEqual(P.bestFor('me', 'ג:MULT'), { acc: 1, h: 0 });
});

test('no-music check: with "בלי מוזיקה" the new best shows the words and plays nothing', () => {
  const { reward, played } = runStepEnd(true);
  assert.match(reward.innerHTML, /הדרן/);
  assert.deepEqual(played, []);
});

test('streak.js and fillBar are not changed; percentBar, areaScore and cubeLayerGroups stay', () => {
  const s = read('src/lib/streak.js');
  assert.equal(crypto.createHash('sha256').update(s.replace(/\r\n/g, '\n')).digest('hex').slice(0, 16), STREAK_SHA);
  const banks = read('src/lib/banks.js');
  ['fillBar', 'percentBar', 'areaScore', 'cubeLayerGroups'].forEach((t) => assert.match(banks, new RegExp("'" + t + "'"), t));
});

test('topic order is unchanged: curriculum rows and progression links', () => {
  const ids = curriculum.MATRIX.map((r) => r.grade + ':' + r.topicId).join(',');
  const links = Object.keys(progression.PREREQ).map((k) => k + '<' + progression.PREREQ[k][0].join('+')).join(',');
  assert.equal(crypto.createHash('sha256').update(ids + '|' + links).digest('hex').slice(0, 16), ORDER_SHA);
});

// Pinned from master at f48deb0: streak.js as it is, and the row order and prereq links of every topic.
const STREAK_SHA = '5c1abeacab72f074';
const ORDER_SHA = 'af3d54971df00e2b';
