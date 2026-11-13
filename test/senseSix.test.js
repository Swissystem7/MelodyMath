'use strict';
// SenseSix: estimation and the circle, heard. What one sound is worth is said
// first; an estimate can rule an answer out, only an exact check proves it.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const S = require('../src/lib/music/senseSix');
const banks = require('../src/lib/banks');

const item = (music, prompt, answer) => ({ music: music, prompt: prompt, answer: answer });
const spec = (...a) => S.specForItem(item(...a));
const ev = (...a) => S.soundEvents(spec(...a));
const stage = (list, st) => list.filter((n) => n.stage === st);
const worth = (list) => list.reduce((s, n) => s + n.worth, 0);

test('a bound: even the rounded-down numbers (30 × 50) already pass the limit of a thousand', () => {
  const e = ev('roundToGroup', 'בלי לחשב במדויק: האם 34 × 52 קטן מ־1,000? (כן/לא)', 'לא');
  assert.equal(stage(e, 'limit').length, 10);
  assert.equal(stage(e, 'bound').length, 15);
  assert.equal(new Set(stage(e, 'bound').map((n) => n.row)).size, 3);
});

test('a check: the dividend in packages, then the divisor times a round anchor', () => {
  const small = spec('roundToGroup', 'בלי לחשב במדויק: האם 3,432 : 8 = 363 נכון? (כן/לא)', 'לא');
  assert.equal(small.how, 'tooSmall', 'even 8 × 400 is less than 3,432');
  const e = S.soundEvents(small);
  assert.equal(worth(stage(e, 'dividend')), 3432);
  assert.equal(worth(stage(e, 'anchorProduct')), 3200);
  assert.equal(spec('roundToGroup', 'בלי לחשב במדויק: האם 3,520 : 4 = 905 נכון? (כן/לא)', 'לא').how, 'tooBig');
  const ok = spec('roundToGroup', 'בלי לחשב במדויק: האם 3,024 : 6 = 504 נכון? (כן/לא)', 'כן');
  assert.equal(ok.how, 'exact', 'agreeing with an estimate proves nothing — the rest is checked exactly');
  const oe = S.soundEvents(ok);
  assert.equal(worth(stage(oe, 'anchorProduct')) + worth(stage(oe, 'restProduct')), worth(stage(oe, 'dividend')));
});

test('magnitude: one share of a round dividend is heard in packages of ten thousands and thousands', () => {
  const e = ev('roundToGroup', 'בלי לחשב במדויק: 46,314 : 3 קרוב ביותר ל־1,500, ל־15,000 או ל־150,000? (כתבו בלי פסיק)', 15000);
  assert.equal(worth(stage(e, 'oneShare')), 15000);
});

test('a fraction multiplier: the same phrase at the same tempo, only part of it — shorter, never quieter', () => {
  const e = ev('shortenNote', 'בלי לחשב: האם 3/4 × 5/6 קטן מ־3/4? (כן/לא)', 'כן');
  assert.equal(stage(e, 'whole').length, 6);
  assert.equal(stage(e, 'part').length, 5);
  assert.equal(new Set(e.map((n) => n.gain)).size, 1);
  const fit = ev('quarterCount', 'בלי לחשב: האם 5 : 1/4 גדול מ־5? (כן/לא)', 'כן');
  assert.equal(stage(fit, 'quarter').length, 20);
  assert.equal(stage(ev('quarterCount', 'האם כפל תמיד מגדיל? האם 6 × 1/2 גדול מ־6? (כן/לא)', 'לא'), 'halfOf').length, 3);
});

test('almost three: two full bars and one with a tick missing, then four copies', () => {
  const e = ev('roundBars', 'בלי לחשב במדויק: 2 ו־7/8 × 4 קרוב ביותר ל־8, ל־12 או ל־16?', 12);
  assert.equal(stage(e, 'tick').length, 23);
  assert.equal(stage(e, 'copy').length, 4);
});

test('the circle: a straight diameter, then three strides around and a small tick that is less than a stride', () => {
  const e = ev('piBarsAround', 'קוטר המעגל 20 ס״מ. מה היקפו בס״מ? (π ≈ 3.14)', 62.8);
  assert.equal(stage(e, 'diameter').length, 2);
  assert.equal(stage(e, 'around').length, 6);
  const bit = stage(e, 'bit')[0], stride = stage(e, 'around')[0];
  assert.ok(bit.dur < stride.dur && bit.gain < stride.gain, 'π is a bit more than 3 — never 4');
  assert.equal(spec('piBarsAround', 'היקף המעגל 31.4 ס״מ. מה הקוטר בס״מ? (π ≈ 3.14)', 10).value, 10);
});

test('the circle from a radius: two radii meet at the centre gong; back from the circumference to half a diameter', () => {
  const r = ev('sectorAsNote', 'רדיוס המעגל 7 ס״מ. מה ההיקף בס״מ? (π ≈ 3.14)', 43.96);
  assert.equal(stage(r, 'radius').length, 2);
  assert.equal(stage(r, 'center').length, 1);
  assert.equal(stage(r, 'around').length, 6, 'each lap is a diameter: two radius strides');
  const back = ev('sectorAsNote', 'היקף המעגל 62.8 ס״מ. מה הרדיוס בס״מ? (π ≈ 3.14)', 10);
  assert.equal(stage(back, 'radius').length, 1);
  assert.equal(stage(ev('sectorAsNote', 'רדיוס מעגל הקווינטות 5 ס״מ. מה הקוטר בס״מ?', 10), 'radius').length, 2);
  assert.equal(stage(ev('sectorAsNote', 'ארבעה עיגולים חופפים ברדיוס 3.5 ס״מ צמודים זה לזה בתוך ריבוע, שניים בכל שורה. מה אורך צלע הריבוע בס״מ?', 14), 'radius').length, 4);
});

test('naming the parts of a circle: the path is heard — centre gong, straight dabke, hora along, a clap on the circle', () => {
  const path = (prompt, a) => ev('sectorAsNote', prompt, a).map((n) => n.stage).join(' ');
  assert.equal(path('איך נקרא קטע שמחבר את מרכז המעגל לנקודה על המעגל?', 'רדיוס'), 'center straight point');
  assert.equal(path('איך נקרא המיתר הארוך ביותר במעגל?', 'קוטר'), 'point straight center straight point');
  assert.equal(path('איך נקרא קטע שמחבר שתי נקודות על המעגל?', 'מיתר'), 'point straight point', 'a chord never passes the centre');
  assert.equal(path('איך נקרא החלק של המעגל שבין שתי נקודות עליו?', 'קשת'), 'point along along along point');
  assert.match(path('איך נקרא החלק של העיגול שבין שני רדיוסים לקשת שביניהם?', 'גזרה'), /^center straight point( along)+ point straight center$/);
  assert.equal(spec('sectorAsNote', 'איך נקרא קטע שמחבר שתי נקודות על המעגל?', 'קוטר'), null, 'a wrong key is never set to sound');
});

test('circle area: one r × r block, then three blocks and a bit; doubling the radius is four blocks', () => {
  const e = ev('piBarsAround', 'רדיוס העיגול 10 ס״מ. מה שטחו בסמ״ר? (π ≈ 3.14)', 314);
  assert.equal(stage(e, 'rBlock').length, 1);
  assert.equal(stage(e, 'circleBlock').length, 3);
  assert.equal(stage(e, 'bit').length, 1);
  assert.equal(spec('piBarsAround', 'רדיוס העיגול 2 מ׳. מה שטחו במ״ר? (π ≈ 3.14)', 12.56).value, 12.56);
  assert.equal(stage(ev('piBarsAround', 'מגדילים את רדיוס העיגול פי 2. פי כמה גדל השטח?', 4), 'big').length, 4);
});

test('only when the sounds give exactly the answer', () => {
  assert.equal(spec('roundToGroup', 'בלי לחשב במדויק: האם 3,024 : 6 = 504 נכון? (כן/לא)', 'לא'), null, 'a wrong key is never set to sound');
  assert.equal(spec('nextBeat', 'קוטר המעגל 20 ס״מ. מה היקפו בס״מ? (π ≈ 3.14)', 62.8), null);
  assert.equal(S.specForItem(null), null);
});

test('the bank: estimation and circle items of grade 6 are heard; no answer in the picture before it is given', () => {
  const list = banks.allItems().filter((it) => S.specForItem(it));
  assert.ok(list.length >= 15, 'played ' + list.length);
  const word = (h, w) => new RegExp('(^|[\\s.,:;—>(])' + w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '($|[\\s.,:;—<)?])').test(h);
  list.forEach((it) => {
    const s = S.specForItem(it), h = S.html(s), a = String(it.answer);
    assert.ok(/^[\d.]+$/.test(a) ? !(h.match(/[\d.]+/g) || []).includes(a) : !word(h, a), 'leak: ' + it.prompt);
    assert.ok(S.longestRun(S.soundEvents(s)) <= S.MAX_RUN, 'run: ' + it.prompt);
    assert.match(S.html(s, { revealed: true }), /בלי צליל/);
  });
});

test('play: every event goes to playVoice on the shared clock; without audio it is silent', () => {
  const s = spec('piBarsAround', 'מגדילים את רדיוס העיגול פי 2. פי כמה גדל השטח?', 4);
  const calls = [];
  const env = { playVoice: (ac, voice, hz, when) => calls.push({ voice, hz, when }), audioContext: { currentTime: 1, state: 'suspended', resume() { this.state = 'running'; } } };
  assert.deepEqual(S.play(s, env), { notes: 5 });
  assert.ok(calls.every((c) => c.when >= 1.05));
  assert.equal(env.audioContext.state, 'running');
  assert.deepEqual(S.play(s, {}), { notes: 5, silent: true });
  assert.equal(S.play(null, env), null);
  assert.equal(S.html(null), '');
});

test('index.html renders the widget and reveals after the answer; sw.js caches it', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /MM_SENSE_SIX\.play\(s6\)/);
  assert.match(html, /host\._senseSpec && typeof MM_SENSE_SIX!=='undefined'/);
  assert.match(html, /src="src\/lib\/music\/senseSix\.js"/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/senseSix\.js'/);
});
