'use strict';
// #591 InstrumentStudio (spec 6376023552, correction 6376035473: all free).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const S = require('../src/lib/music/instrumentStudio.js');
const UI = require('../src/components/InstrumentStudio.js');
const I = require('../src/lib/instruments.js');
const V = require('../src/lib/instrumentVoices.js');
const LIB = require('../src/lib/music/instrumentLibrary.js');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const answer = (s, correct, topic) => S.onEvent(s, { type: 'answer', correct, topic: topic || 'fractions' });
const answers = (s, n, topic) => { for (let i = 0; i < n; i++) s = answer(s, true, topic); return s; };

test('every profile is a real instrument with its own mechanic, samples and look (24 since the library)', () => {
  assert.equal(S.PROFILES.length, 24);
  assert.deepEqual(S.PROFILES.filter((x) => x.basic).map((x) => x.mechanic).sort(), ['barsByPitch', 'keys', 'pressSlide', 'strikeDamp', 'tapZones', 'thumbPluck'], 'the six starting ones keep their own mechanics');
  assert.deepEqual([...new Set(S.PROFILES.map((x) => x.mechanic))].sort(), Object.keys(S.MECHANICS).sort());
  const seen = { pair: new Set(), samples: new Set(), theme: new Set() };
  S.PROFILES.forEach((x) => {
    assert.ok(I.instrumentById(x.id), x.id + ' is in instruments.js');
    assert.match(x.he, /[א-ת]/);
    assert.ok(S.MECHANICS[x.mechanic], x.id);
    x.samples.forEach((v) => assert.ok(V.VOICES[v], x.id + ' voice ' + v));
    const key = x.samples.slice().sort().join('+');
    assert.ok(!seen.pair.has(x.mechanic + '|' + x.voice), 'mechanic and voice shared: ' + x.id);
    assert.ok(!seen.samples.has(key), 'same sample set: ' + x.id);
    assert.ok(!seen.theme.has(x.theme.icon + x.theme.color), 'same look: ' + x.id);
    seen.pair.add(x.mechanic + '|' + x.voice); seen.samples.add(key); seen.theme.add(x.theme.icon + x.theme.color);
  });
});

test('unlocks are deterministic: the same answers open the same instruments in the same order', () => {
  const run = () => {
    let s = S.initialState();
    const log = [];
    ['fractions', 'patterns', 'counting'].forEach((t) => { s = answers(s, S.MASTERY, t); log.push(s.opened.slice()); });
    return log;
  };
  assert.deepEqual(run(), run());
  assert.deepEqual(run()[2], LIB.basicIds().concat(['djembe', 'oud', 'flute']));
  assert.deepEqual(S.unlockedIds(answers(S.initialState(), S.MASTERY - 1)), LIB.basicIds(), 'one short of mastery opens nothing');
  const src = fs.readFileSync(path.join(root, 'src/lib/music/instrumentStudio.js'), 'utf8');
  assert.doesNotMatch(src, /Math\.random|Date\.now|setTimeout|setInterval/, 'no chance and no timers in unlocks');
});

test('primaryMethod(topic) is the same for every instrument, and answers count the same whatever is chosen', () => {
  Object.keys(I.TOPICS).forEach((t) => {
    const m = S.primaryMethod(t);
    assert.equal(m.mechanism, I.TOPICS[t].mechanism);
    S.PROFILES.forEach((x) => assert.deepEqual(S.primaryMethod(t, x.id), m, t + ' / ' + x.id));
  });
  const seq = [true, true, false, true, true, true, true, true];
  const ends = S.PROFILES.map((x) => {
    let s = Object.assign(S.initialState(), { current: x.id });
    seq.forEach((c) => { s = answer(s, c); });
    return { correct: s.correct, streak: s.streak, opened: s.opened };
  });
  ends.forEach((e) => assert.deepEqual(e, ends[0]));
});

test('a choice opens only at topic start, after 5 correct in a row and on a new unlock, with 2-4 options', () => {
  let s = S.initialState();
  assert.equal(S.onEvent(s, { type: 'tile' }).moment, null, 'nothing inside an exercise');
  assert.equal(S.onEvent(s, { type: 'hint' }).moment, null);
  const start = S.onEvent(s, { type: 'topicStart' });
  assert.equal(start.moment.kind, 'topicStart');
  for (let i = 1; i <= 4; i++) { s = answer(s, true, 't' + i); assert.equal(s.moment, null, 'no choice after ' + i); }
  s = answer(s, true, 't5');
  assert.equal(s.moment.kind, 'streak');
  s = S.choose(s, s.moment.options[1]);
  s = answer(s, false, 't1');
  assert.equal(s.moment, null, 'a wrong answer never opens a choice');
  const u = answers(S.initialState(), S.MASTERY, 'fractions');
  assert.equal(u.moment.kind, 'unlock');
  assert.equal(u.moment.fresh, 'djembe');
  assert.equal(u.moment.options[0], 'djembe');
  [start, u].forEach((x) => {
    assert.ok(x.moment.options.length >= S.MIN_OPTIONS && x.moment.options.length <= S.MAX_OPTIONS);
    assert.ok(x.moment.options.includes(x.current), 'the current instrument can be kept');
  });
  const all = answers(answers(answers(S.initialState(), 5, 'a'), 5, 'b'), 5, 'c');
  assert.equal(S.onEvent(all, { type: 'topicStart' }).moment.options.length, 4, 'never more than 4 of 9');
  assert.equal(S.choose(S.initialState(), 'piano').current, 'darbuka', 'no switch outside a moment');
});

test('an instrument that cannot sound within 50 ms is unavailable and never offered', () => {
  assert.ok(S.PROFILES.every((x) => S.isAvailable(x, { jsPathMs: 10 })));
  const slow = { jsPathMs: 47 };
  assert.ok(S.PROFILES.every((x) => !S.isAvailable(x, slow)));
  assert.equal(S.onEvent(S.initialState(), { type: 'topicStart' }, slow).moment, null, 'fewer than 2 options: no choice');
  assert.match(UI.renderHtml(S.initialState(), { device: slow }), /לא זמין במכשיר הזה/);
});

test('the picker has Hebrew labels a screen reader can use', () => {
  const s = S.onEvent(S.initialState(), { type: 'topicStart' });
  const out = UI.renderHtml(s, { topic: 'fractions' });
  assert.match(out, /role="group" aria-labelledby="stChoiceHead"/);
  assert.match(out, /<h4 id="stChoiceHead" tabindex="-1">/);
  s.moment.options.forEach((id) => assert.match(out, new RegExp('data-act="choose" data-id="' + id + '" aria-pressed="(true|false)"')));
  assert.match(out, /<label for="stTopic">נושא<\/label>/);
  assert.match(out, /משכי תווים בתיבה/);
  S.PROFILES.forEach((x) => {
    const surf = UI.surfaceHtml(x);
    assert.match(surf, /aria-label="מנגנים על [א-ת]/);
    (surf.match(/<button[^>]*>/g) || []).forEach((b) => assert.match(b, /aria-label="[^"]*[א-ת]|data-act="damp"/, x.id + ' ' + b));
  });
  assert.equal(UI.renderHtml(S.initialState()).includes('st-choice'), false, 'no picker without a moment');
});

test('nothing is sold: no payment UI or code, every instrument is free, no transfer claims', () => {
  const files = ['src/lib/music/instrumentStudio.js', 'src/components/InstrumentStudio.js'].map((f) => fs.readFileSync(path.join(root, f), 'utf8'));
  const s = answers(S.onEvent(S.initialState(), { type: 'topicStart' }), 15, 'x');
  files.push(UI.renderHtml(s), UI.renderHtml(S.onEvent(S.initialState(), { type: 'topicStart' })));
  const pay = /purchas|price|paywall|subscri|checkout|entitle|parental|premium|coin|loot|קנה|קנייה|מחיר|רכישה|מנוי|תשלום|מטבע/i;
  const claim = /improves? math|משפר[^.]{0,30}מתמטיקה/i;
  files.forEach((f) => { assert.doesNotMatch(f, pay); assert.doesNotMatch(f, claim); });
  S.PROFILES.forEach((x) => assert.deepEqual(Object.keys(x).sort(), ['basic', 'card', 'family', 'feel', 'he', 'id', 'mechanic', 'opensAt', 'samples', 'theme', 'voice']));
  assert.match(UI.renderHtml(S.initialState()), /כל הכלים בחינם/);
});

test('progress survives a reload and a broken store starts fresh', () => {
  const m = new Map();
  const store = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
  const s = answers(S.initialState(), 5, 'fractions');
  assert.equal(S.save(store, s), true);
  const back = S.load(store);
  assert.deepEqual(back.opened, s.opened);
  assert.equal(back.moment, null);
  m.set('mm.studio', '{bad');
  assert.deepEqual(S.load(store), S.initialState());
});

test('index.html has the studio card, its scripts after jamKit, and the quiz sends mm:answer', () => {
  assert.match(html, /<section id="musicGames" [^>]*>[\s\S]*id="studioCard"[\s\S]*<!-- #591 music games end -->/);
  const at = (src) => html.indexOf('<script src="' + src + '"></script>');
  assert.ok(at('src/lib/instruments.js') < at('src/lib/music/instrumentStudio.js'));
  assert.ok(at('src/components/jamKit.js') < at('src/components/InstrumentStudio.js'));
  assert.ok(at('src/lib/music/instrumentStudio.js') < at('src/components/InstrumentStudio.js'));
  assert.match(html, /new CustomEvent\('mm:answer',\{detail:\{correct,topic:q\.skill\}\}\)/);
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  ['./src/lib/music/instrumentStudio.js', './src/components/InstrumentStudio.js'].forEach((f) => assert.ok(sw.includes("'" + f + "'"), f));
});
