'use strict';
// EarlyBeats: early number for grades 1–2, heard. One sound for one meaning,
// one world per exercise, never more than 12 sounds in a row.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const E = require('../src/lib/music/earlyBeats');
const banks = require('../src/lib/banks');

const item = (music, prompt, answer) => ({ music: music, prompt: prompt, answer: answer });
const steps = (ev) => ev.filter((n) => n.stage === 'step');
const longestRun = (ev) => {
  // beats (moments; two voices together are one beat) closer than 0.45 s count as one run
  let best = 0, run = 0, last = -9;
  [...new Set(ev.map((n) => n.at))].sort((a, b) => a - b).forEach((at) => { run = at - last < 0.45 ? run + 1 : 1; last = at; best = Math.max(best, run); });
  return best;
};

test('next and previous: a long start sound that is not counted, then ONE step up or down', () => {
  const next = E.soundEvents(E.specForItem(item('nextBeat', '6, ואז המספר הבא?', 7)));
  assert.equal(next[0].stage, 'home');
  assert.ok(next[0].dur > 2 * next[1].dur, 'the start is long');
  assert.equal(steps(next).length, 1);
  assert.ok(next[1].hz > next[0].hz, 'next goes up');
  const prev = E.soundEvents(E.specForItem(item('countDownBeats', 'המספר שלפני 20?', 19)));
  assert.ok(prev[1].hz < prev[0].hz, 'previous goes down');
});

test('counting back: the strong start is not a step; three steps go down (tof)', () => {
  const s = E.specForItem(item('countDownBeats', 'ספירה אחורה: 10, 9, 8, ?', 7));
  assert.equal(s.world, E.WORLDS.tof);
  const ev = E.soundEvents(s);
  assert.equal(ev[0].stage, 'home');
  const st = steps(ev);
  assert.equal(st.length, 3);
  assert.ok(st[0].hz > st[1].hz && st[1].hz > st[2].hz);
});

test('skip counting: the first number is an anchor; the accent lands ON the number reached (Perplexity)', () => {
  const s = E.specForItem(item('accentSkip', 'מקצב דילוגי 5: 75, 80, 85, ?', 90));
  assert.equal(s.world, E.WORLDS.hands);
  const ev = E.soundEvents(s);
  assert.equal(ev[0].stage, 'home');
  const groups = ev.filter((n) => n.group);
  assert.equal(groups.length, 15, 'three jumps of five');
  [1, 2, 3].forEach((g) => {
    const grp = groups.filter((n) => n.group === g);
    assert.deepEqual(grp.map((n) => !!n.accent), [false, false, false, false, true], 'four quiet, the fifth accented');
  });
  assert.equal(E.specForItem(item('accentSkip', 'ספירה דילוגית: 2, 4, 6, 8, ?', 10)).world, E.WORLDS.pairs);
  assert.equal(E.specForItem(item('tenBeatBars', 'מקצב עשרות: 50, 60, 70, ?', 80)).world, E.WORLDS.tombak);
});

test('fade: only the accents stay, in their places — the quiet beats are kept inside', () => {
  const s = E.specForItem(item('accentSkip', 'ספירה דילוגית: 20, 25, 30, ?', 35));
  const all = E.eventsFor(s), fade = E.eventsFor(s, 'fade');
  assert.equal(fade.length, 4, 'the anchor and three accents');
  fade.forEach((n) => assert.ok(all.some((a) => a.at === n.at), 'same moment as in the full version'));
  assert.match(E.html(s), /data-mode="fade"/);
});

test('tens and ones (tombak): ten baks gather into one tom first; then tom = ten, bak = one', () => {
  const ev = E.soundEvents(E.specForItem(item('tenBeatBars', '8 קבוצות של 10 ועוד 4 — כמה זה?', 84)));
  assert.equal(ev.filter((n) => n.stage === 'gather').length, 10);
  assert.equal(ev.filter((n) => n.stage === 'gatherTom').length, 1);
  assert.equal(ev.filter((n) => n.stage === 'tom').length, 8);
  assert.equal(ev.filter((n) => n.stage === 'bak').length, 4);
  const tom = ev.find((n) => n.stage === 'tom'), bak = ev.find((n) => n.stage === 'bak');
  assert.ok(tom.hz < bak.hz, 'low means a group of ten, not small');
});

test('to the next ten: the missing baks are quiet ghosts, and a tom closes the ten', () => {
  const ev = E.soundEvents(E.specForItem(item('tenBeatBars', 'מ־36, כמה חסר לעשר הבאה?', 4)));
  const ghosts = ev.filter((n) => n.stage === 'missing');
  assert.equal(ghosts.length, 4);
  assert.ok(ghosts.every((n) => n.gain < 0.1));
  assert.equal(ev[ev.length - 1].stage, 'closeTen');
});

test('counting on: the first addend is ONE long sound of a fixed length, then one step per unit', () => {
  const a = E.soundEvents(E.specForItem(item('callResponse', '8 + 4 = ?', 12)));
  const b = E.soundEvents(E.specForItem(item('callResponse', '5 + 4 = ?', 9)));
  assert.equal(a.filter((n) => n.stage === 'home').length, 1);
  assert.equal(steps(a).length, 4);
  assert.equal(a[0].dur, b[0].dur, 'the long sound does not encode the size of the addend');
  assert.ok(steps(a)[0].at - (a[0].at + a[0].dur) > 0.2, 'a short silence before the steps');
});

test('counting on starts from the bigger number, and says so', () => {
  const s = E.specForItem(item('twoDrums', '1 + 9 = ?', 10));
  assert.equal(s.a, 9);
  assert.equal(steps(E.soundEvents(s)).length, 1);
  assert.match(E.html(s), /מתחילים מהמספר הגדול/);
});

test('compare: stomp and clap side by side; the beats left alone are the difference', () => {
  const s = E.specForItem(item('twoDrums', 'לנועה 6 בלונים ולתום 4 בלונים. בכמה יותר בלונים לנועה?', 2));
  assert.equal(s.world, E.WORLDS.body);
  const ev = E.soundEvents(s);
  assert.equal(ev.filter((n) => n.stage === 'alone').length, 2);
  const pairs = ev.filter((n) => n.stage === 'pair');
  assert.equal(pairs.length, 8);
  const at = pairs.filter((n) => n.row === 'a').map((n) => n.at);
  assert.deepEqual(pairs.filter((n) => n.row === 'b').map((n) => n.at), at, 'the two sides start together, beat by beat');
});

test('three addends: one darbuka sound per addend — dum, tak, ka — with a pause between groups', () => {
  const ev = E.soundEvents(E.specForItem(item('tenThenMore', '2 + 3 + 4 = ?', 9)));
  assert.deepEqual([0, 1, 2].map((j) => ev.filter((n) => n.part === j).length), [2, 3, 4]);
  assert.deepEqual([0, 1, 2].map((j) => ev.find((n) => n.part === j).voice), ['drumLow', 'drumHigh', 'woodClick']);
});

test('only when the sounds give exactly the answer; never more than 12 sounds in a row', () => {
  assert.equal(E.specForItem(item('nextBeat', '6, ואז המספר הבא?', 8)), null, 'a wrong key is never set to sound');
  assert.equal(E.specForItem(item('tenThenMore', '34 + 25 = ?', 59)), null, 'too many steps to hear');
  assert.equal(E.specForItem(item('twoDrums', 'בכפר א׳ 240 תושבים ובכפר ב׳ 180. בכמה יותר תושבים יש בכפר א׳?', 60)), null);
  assert.equal(E.specForItem(item('fillBar', '6, ואז המספר הבא?', 7)), null);
  assert.equal(E.specForItem(Object.assign(item('nextBeat', '6, ואז המספר הבא?', 7), { noMusic: true })), null);
  assert.equal(E.specForItem(null), null);
});

test('the picture never shows the answer before it is given, and asks for a silent check after', () => {
  const list = banks.allItems().filter((it) => E.specForItem(it));
  list.forEach((it) => {
    const s = E.specForItem(it), open = E.html(s);
    assert.ok(!(open.match(/\d+/g) || []).includes(String(it.answer)), 'leak: ' + it.prompt);
    assert.match(E.html(s, { revealed: true }), /בלי צליל/);
    assert.ok(longestRun(E.soundEvents(s)) <= E.MAX_RUN, 'run: ' + it.prompt);
  });
});

test('the bank: most early-number items of grades 1–2 are heard, in every kind', () => {
  const list = banks.allItems().filter((it) => E.specForItem(it));
  assert.ok(list.length >= 65, 'played ' + list.length);
  assert.deepEqual([...new Set(list.map((it) => it.grade))].sort(), ['א', 'ב']);
  const kinds = new Set(list.map((it) => E.specForItem(it).kind));
  ['step', 'back', 'skip', 'tens', 'countOn', 'compare', 'parts'].forEach((k) => assert.ok(kinds.has(k), k));
});

test('play: every event goes to playVoice on the shared clock; fade plays only the accents; no audio is silent', () => {
  const s = E.specForItem(item('accentSkip', 'ספירה דילוגית: 2, 4, 6, 8, ?', 10));
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when, dest, opts) => calls.push({ voice, hz, when, opts }), audioContext: { currentTime: 1, state: 'suspended', resume() { this.state = 'running'; } } };
  assert.deepEqual(E.play(s, env), { notes: 9 });
  assert.equal(calls.length, 9);
  assert.ok(calls.every((c) => c.when >= 1.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(E.play(s, env, 'fade'), { notes: 5 });
  assert.deepEqual(E.play(s, {}), { notes: 9, silent: true });
  assert.equal(E.play(null, env), null);
});

test('index.html renders the widget, plays with the button mode, and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_EARLY_BEATS\.play\(eb, null, b\.getAttribute\('data-mode'\)\)/);
  assert.match(html, /host\._earlySpec && typeof MM_EARLY_BEATS!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/earlyBeats\.js"/);
  const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  assert.match(sw, /'\.\/src\/lib\/music\/earlyBeats\.js'/);
});
