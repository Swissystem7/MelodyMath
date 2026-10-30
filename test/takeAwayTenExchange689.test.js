'use strict';
// Refs #689, Refs #665: takeAwayBeats is primary only for SUB10, SUB20 and
// WORD_REMOVE; PLACE_VALUE primary is tenExchange, SUB2D primary is tensBarsBack, even/odd primary is alternateDrums. One circle per
// sound; the end-of-topic check carries no music.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const mod = require('../src/lib/music/takeAwayTen');
const banks = require('../src/lib/banks');
const uc = require('../src/lib/unitCheck');

test('takeAwayBeats: one circle per sound, beats disappear one by one', () => {
  const s = mod.takeAwayCircles(8, 3);
  assert.equal(s.circles.length, 8); // one circle per sound
  assert.equal(s.circles.filter((c) => c.kind === 'beat').length, 8);
  assert.equal(s.circles.filter((c) => c.gone).length, 3);
  assert.equal(s.remaining, 5);
  assert.deepEqual(mod.takeAwaySteps(8, 3), [8, 7, 6, 5]); // one by one
  assert.equal(mod.takeAwayCircles(5, 5).remaining, 0);
  assert.equal(mod.takeAwayCircles(3, 4), null);
  assert.equal(mod.takeAwayCircles(0, 0), null);
});

test('tenExchange: 10 bells become one drum, one circle per sound-object', () => {
  const x = mod.tenExchange(27);
  assert.equal(x.drums, 2);
  assert.equal(x.left, 7);
  assert.equal(x.circles.length, 2 + 7); // drums + leftover bells
  assert.equal(x.circles.filter((c) => c.kind === 'drum').length, 2);
  assert.equal(x.circles.filter((c) => c.kind === 'bell').length, 7);
  assert.equal(mod.tenExchange(10).drums, 1);
  assert.equal(mod.tenExchange(10).left, 0);
  assert.equal(mod.tenExchange(9).drums, 0);
  assert.equal(mod.tenExchange(-1), null);
});

test('specForItem builds a widget spec only for takeAwayBeats and tenExchange', () => {
  const sub = mod.specForItem({ music: 'takeAwayBeats', prompt: '8 − 3 = ?' });
  assert.equal(sub.kind, 'takeAway');
  assert.equal(sub.remaining, 5);
  const pv = mod.specForItem({ music: 'tenExchange', prompt: 'כמה עשרות ב־34?' });
  assert.equal(pv.kind, 'tenExchange');
  assert.equal(pv.drums, 3);
  assert.equal(mod.specForItem({ music: 'fillBar', prompt: '8 − 3 = ?' }), null);
  assert.equal(mod.specForItem(null), null);
  assert.equal(mod.tenExchange(356).hundreds, 3);
  assert.equal(mod.tenExchange(356).drums, 5);
  // Real shipped prompts, not only toy ones: two-digit subtraction and a
  // three-digit place-value question both get circles from their own numbers.
  const shipped = banks.allItems();
  const sub2d = shipped.find((it) => it.prompt === '58 − 23 = ?');
  assert.ok(sub2d, 'shipped two-digit subtraction item exists');
  assert.equal(sub2d.music, 'tensBarsBack');
  assert.ok(sub2d.musicExtra.some((w) => w.music === 'takeAwayBeats'));
  const subSpec = mod.specForItem({ music: 'takeAwayBeats', prompt: sub2d.prompt });
  assert.equal(subSpec.remaining, 35);
  assert.equal(subSpec.circles.length, 5 + 8); // one circle per sound, not 58 dots
  assert.equal(subSpec.circles.length, mod.soundEvents(subSpec).filter((e) => e.phase === 'start').length);
  const pv356 = shipped.find((it) => /356/.test(it.prompt) && /עשרות/.test(it.prompt));
  assert.ok(pv356, 'shipped 356 place-value item exists');
  assert.equal(pv356.music, 'tenExchange');
  assert.ok(!pv356.musicExtra.some((w) => w.music === 'tenExchange'));
  assert.equal(mod.specForItem({ music: 'tenExchange', prompt: '356' }).drums, 5);
  assert.equal(mod.specForItem({ music: 'tenExchange', prompt: '200 + 30 + 4 = ?' }), null);
  const html = mod.circlesHtml(sub);
  assert.equal((html.match(/class="snd-circle /g) || []).length, 8); // one circle per sound in the DOM string
});

test('PLACE_VALUE primary is tenExchange, SUB2D primary is tensBarsBack, even/odd primary is alternateDrums', () => {
  const g1 = require('../src/lib/curriculum/grade1');
  const g2 = require('../src/lib/curriculum/grade2');
  assert.equal(banks.primaryWays(g1.music.SUB10)[0][0], 'takeAwayBeats');
  assert.equal(banks.primaryWays(g1.music.SUB20)[0][0], 'takeAwayBeats');
  assert.equal(banks.primaryWays(g2.music.SUB2D)[0][0], 'tensBarsBack');
  assert.equal(banks.primaryWays(g1.music.WORD_REMOVE)[0][0], 'takeAwayBeats');
  assert.equal(banks.primaryWays(g2.music.WORD_REMOVE)[0][0], 'takeAwayBeats');
  assert.equal(banks.primaryWays(g2.music.PLACE_VALUE)[0][0], 'tenExchange');
  assert.equal(banks.primaryWays(g2.music.EVEN_ODD)[0][0], 'alternateDrums');
  // takeAwayBeats stays EXTRA wherever it would demote a primary.
  const sub2dTakeAway = g2.music.SUB2D.find((w) => w[0] === 'takeAwayBeats');
  assert.ok(banks.isOptionalWay(sub2dTakeAway));
  assert.match(sub2dTakeAway[1], /תופים \(עשרות\) ושייקרים \(יחידות\)/);
  assert.ok(!banks.isOptionalWay(g2.music.PLACE_VALUE.find((w) => w[0] === 'tenExchange')));
  assert.ok(!banks.isOptionalWay(g2.music.SUB2D.find((w) => w[0] === 'tensBarsBack')));
  assert.ok(!g2.music.PLACE_VALUE.some((w) => w[0] === 'alternateDrums'), 'alternateDrums removed from PLACE_VALUE only');
  // takeAwayBeats primary only in SUB10/SUB20/WORD_REMOVE; tenExchange primary only in PLACE_VALUE; alternateDrums primary only in EVEN_ODD.
  for (let g = 1; g <= 6; g++) {
    const modG = require('../src/lib/curriculum/grade' + g);
    for (const [topic, ways] of Object.entries(modG.music || {})) {
      const prim = banks.primaryWays(ways).map((w) => w[0]);
      if (prim.includes('takeAwayBeats')) assert.ok(['SUB10', 'SUB20', 'WORD_REMOVE'].includes(topic), 'grade' + g + ' ' + topic);
      if (prim.includes('tenExchange')) assert.equal(topic, 'PLACE_VALUE', 'grade' + g + ' ' + topic);
      if (prim.includes('alternateDrums')) assert.equal(topic, 'EVEN_ODD', 'grade' + g + ' ' + topic);
    }
  }
  // Primary ways must come from a strongly evidenced mechanism (dosage rules).
  assert.ok(banks.MUSIC_DOSAGE.primary.includes(banks.mechanismOf('takeAwayBeats')));
  assert.ok(banks.MUSIC_DOSAGE.primary.includes(banks.mechanismOf('tensBarsBack')));
  assert.ok(banks.MUSIC_DOSAGE.primary.includes(banks.mechanismOf('alternateDrums')));
  // Shipped items carry the restored primaries; tenExchange stays an extra.
  const items = banks.allItems();
  assert.ok(items.some((it) => it.music === 'takeAwayBeats' && it.skill === 'subtraction'));
  assert.ok(items.some((it) => it.music === 'tensBarsBack' && it.skill === 'subtraction'));
  assert.ok(items.some((it) => it.music === 'tenExchange' && it.skill === 'place_value'));
  assert.ok(items.some((it) => it.music === 'alternateDrums'));
  assert.ok(!items.some((it) => it.music === 'alternateDrums' && it.skill === 'place_value'));
});

test('end-of-topic check for subtraction and place value has no music', () => {
  const unit = uc.listUnits().find((u) => u.id === 'takeaway-place-2');
  assert.ok(unit, 'silent check unit exists');
  ['pre', 'post'].forEach((form) => {
    const items = uc.formItems('takeaway-place-2', form);
    assert.equal(items.length, 6);
    items.forEach((it) => {
      assert.equal(it.music, undefined);
      assert.equal(it.hear, undefined);
    });
    assert.doesNotMatch(JSON.stringify(items), /🎵|🥁|🔔/);
  });
});

test('index.html wires the circles widget and loads the module', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /src\/lib\/music\/takeAwayTen\.js/);
  assert.match(html, /MM_TAKEAWAY_TEN/);
  assert.match(html, /MM_TAKEAWAY_TEN\.play\(sndSpec\)/);
  assert.match(html, /circlesHtml\(host\._sndSpec,\{revealed:true\}\)/);
  assert.match(html, /play\(host\._sndSpec,\{revealed:true\}\)/);
});

test('sound: play schedules every sounding beat on the shared engine voice calls', () => {
  const spec = mod.takeAwayCircles(8, 3);
  assert.equal(mod.soundEvents(spec).length, 8 + 5); // all beats, then only what remains sounds
  const calls = [];
  const ac = { currentTime: 10, state: 'running', resume() {} };
  const r = mod.play(spec, { audioContext: ac, playVoice: (c, v, hz, t) => calls.push({ v, hz, t }) });
  assert.equal(calls.length, 13);
  assert.ok(calls.every((c) => c.t >= 10 && typeof c.hz === 'number'));
  assert.equal(r.notes, 13);
  const seq = [];
  const r2 = mod.play(mod.tenExchange(27), { playSequence: (ev) => { seq.push(...ev); return { notes: ev.length }; } });
  assert.equal(seq.length, 9); // before the answer: one pass, 2 drums + 7 bells, not the exchange twice
  assert.equal(r2.notes, 9);
  assert.equal(seq.filter((e) => e.phase === 'group').length, 0);
});

test('hide: circles do not reveal the answer until revealed', () => {
  const hidden = mod.circlesHtml(mod.takeAwayCircles(8, 3));
  assert.doesNotMatch(hidden, /snd-gone/);
  assert.doesNotMatch(hidden.replace(/data-reveal="[^"]*"/, ''), /נשארו 5/);
  assert.match(hidden, /data-reveal="נשארו 5"/); // held back like #457, swapped in after submit
  const shown = mod.circlesHtml(mod.takeAwayCircles(8, 3), { revealed: true });
  assert.equal((shown.match(/snd-gone/g) || []).length, 3);
  assert.match(shown, /נשארו 5/);
  const hx = mod.circlesHtml(mod.tenExchange(34));
  assert.equal((hx.match(/snd-drum/g) || []).length, 3); // drum circle per ten, matching the sounds
  assert.doesNotMatch(hx.replace(/data-reveal="[^"]*"/, ''), /עשרות/);
  assert.ok((mod.circlesHtml(mod.tenExchange(99)).match(/snd-bell/g) || []).length <= 12);
  const sx = mod.circlesHtml(mod.tenExchange(34), { revealed: true });
  assert.equal((sx.match(/snd-drum/g) || []).length, 3);
});

test('myInstrument: the child choice (incl. legacy mm-tap-instrument) sets the voice', () => {
  const MY = require('../src/lib/myInstrument');
  const INST = require('../src/lib/instruments');
  const mem = (init) => { const m = new Map(Object.entries(init || {})); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  const legacy = mem({ 'mm-tap-instrument': 'djembe' });
  assert.equal(mod.instrumentIdFor(mod.takeAwayCircles(8, 3), legacy), 'djembe'); // legacy key migrated by myInstrument
  const calls = [];
  const ac = { currentTime: 0, state: 'running', resume() {} };
  const chosen = mem(); MY.setMyInstrument('djembe', chosen);
  const r = mod.play(mod.takeAwayCircles(5, 2), { audioContext: ac, storage: chosen, playVoice: (c, v) => calls.push(v) });
  assert.equal(r.instrument, 'djembe');
  assert.ok(calls.length > 0 && calls.every((v) => v === INST.instrumentById('djembe').voice));
  const other = mem(); MY.setMyInstrument('kora', other);
  assert.notEqual(mod.voiceFor(mod.takeAwayCircles(5, 2), other), INST.instrumentById('djembe').voice);
  assert.equal(mod.voiceFor(mod.takeAwayCircles(5, 2), mem()), INST.instrumentById('taiko').voice); // no choice: screen default
});

test('every topic has exactly one primary mechanism, this PR topics exactly one primary way, shared primaries allow-listed', () => {
  const ALLOW = ['accentSkip', 'callResponse', 'twoDrums', 'balanceBars', 'tenThenMore', 'takeAwayBeats', 'repeatedBars', 'phraseShare', 'fillBar', 'areaScore', 'noteValues', 'splitNotes', 'roundBars', 'dottedBeats', 'barsAndHalf', 'barFill', 'phraseFits', 'thousandAccents', 'sectorAsNote', 'levelNotes' /* carried ways (#591 rule 4): ג׳ MUL_COMPARE/NUM_10K carry TIMES_MORE/NUM10K, ו׳ CIRCLE/MEAN carry G6_CIRCLE_TERMS/G6_MEAN */];
  const share = {};
  for (let g = 1; g <= 6; g++) { const mg = require('../src/lib/curriculum/grade' + g); for (const [t, ways] of Object.entries(mg.music || {})) { const prim = banks.primaryWays(ways); assert.ok(prim.length >= 1, 'g' + g + ' ' + t); assert.equal(new Set(prim.map((w) => banks.mechanismOf(w[0]))).size, 1, 'g' + g + ' ' + t + ' one primary mechanism'); prim.forEach((w) => { (share[w[0]] = share[w[0]] || new Set()).add('g' + g + ':' + t); }); } }
  for (const [tag, topics] of Object.entries(share)) if (topics.size > 1) assert.ok(ALLOW.includes(tag), tag + ' shared: ' + [...topics].join(','));
  for (const tag of ALLOW) assert.ok(share[tag] && share[tag].size > 1, 'allow-list minimal: ' + tag);
  const g2 = require('../src/lib/curriculum/grade2');
  assert.deepEqual(banks.primaryWays(g2.music.PLACE_VALUE).map((w) => w[0]), ['tenExchange']); assert.deepEqual(banks.primaryWays(g2.music.EVEN_ODD).map((w) => w[0]), ['alternateDrums']); assert.deepEqual(banks.primaryWays(g2.music.SUB2D).map((w) => w[0]), ['tensBarsBack']);
});

test('asTens playback: tens are one sound each, no number plays more than 12 unit sounds', () => {
  assert.deepEqual(mod.asTens(58), [{ n: 1, v: 10 }, { n: 1, v: 10 }, { n: 1, v: 10 }, { n: 1, v: 10 }, { n: 1, v: 10 }, { n: 8, v: 1 }]);
  for (let n = 0; n <= 199; n++) assert.ok(mod.asTens(n).filter((g) => g.v === 1).reduce((s, g) => s + g.n, 0) <= 12, 'units of ' + n);
  const maxRun = (ev) => { let r = 0, m = 0; ev.forEach((e) => { r = e.v === 1 ? r + 1 : 0; m = Math.max(m, r); }); return m; };
  const ev58 = mod.soundEvents(mod.takeAwayCircles(58, 23)); assert.equal(ev58.length, 21); assert.ok(maxRun(ev58) <= 12, 'no 58 beats for 58-23');
  const ev99 = mod.soundEvents(mod.tenExchange(99)); assert.equal(ev99.length, mod.tenExchange(99).circles.length); assert.ok(ev99.length < 99 && maxRun(ev99) <= 12, 'no 99 bells in tenExchange');
  const grouped = mod.soundEvents(mod.tenExchange(27), { revealed: true });
  assert.ok(grouped.slice(0, 10).every((e) => e.kind === 'bell') && grouped[10].kind === 'drum', '10 bells then one drum, only after the answer');
  assert.ok(maxRun(grouped) <= 12);
  const soundsOf = (n) => (n > 12 ? mod.asTens(n).reduce((s, g) => s + g.n, 0) : n);
  for (const it of banks.allItems().filter((i) => i.skill === 'subtraction')) { const s = mod.specForItem({ music: 'takeAwayBeats', prompt: it.prompt }); if (s) assert.equal(mod.soundEvents(s).length, soundsOf(s.start) + soundsOf(s.remaining), it.prompt); }
});

test('specForItem detects the tenExchange widget, not only item.music', () => {
  assert.equal(mod.specForItem({ widget: 'tenExchange', prompt: '34' }).kind, 'tenExchange');
  assert.equal(mod.specForItem({ music: 'alternateDrums', musicExtra: [{ music: 'tenExchange' }], prompt: '356' }).drums, 5);
  assert.ok(banks.allItems().filter((i) => i.skill === 'place_value').some((i) => mod.specForItem(i)), 'widget reaches shipped place-value items');
});

test('subtraction above 12 gives the beat a softer voice than the drum (Refs #665)', () => {
  const plan = require('../src/lib/instrumentVoices').planVoice;
  const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  const spec = mod.takeAwayCircles(15, 3);
  const vs = mod.voicesFor(spec, mem());
  assert.ok(spec.start > 12);
  assert.notEqual(vs.beat, vs.drum);
  const beat = plan(vs.beat), drum = plan(vs.drum);
  assert.ok(beat.decay < drum.decay && beat.noise < drum.noise, 'beat is shorter and quieter than the drum');
  const heard = new Set();
  const ac = { currentTime: 0, state: 'running', resume() {} };
  mod.play(spec, { audioContext: ac, storage: mem(), playVoice: (c, v) => heard.add(v) });
  assert.ok(heard.has(vs.beat) && heard.has(vs.drum));
  const small = mod.voicesFor(mod.takeAwayCircles(8, 3), mem());
  assert.equal(small.beat, small.drum);
  const MY = require('../src/lib/myInstrument');
  const click = mem();
  MY.setMyInstrument('claves', click);
  const vsClick = mod.voicesFor(mod.takeAwayCircles(18, 4), click);
  assert.notEqual(vsClick.beat, vsClick.drum);
  assert.ok(plan(vsClick.beat).noise < plan(vsClick.drum).noise);
});

test('a ten above 12 is one longer sound on the chosen instrument (Refs #665)', () => {
  const MY = require('../src/lib/myInstrument');
  const INST = require('../src/lib/instruments');
  const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  const store = mem();
  MY.setMyInstrument('djembe', store);
  const chosen = INST.instrumentById('djembe').voice;
  const spec = mod.takeAwayCircles(13, 1);
  const events = mod.soundEvents(spec);
  const start = events.filter((e) => e.phase === 'start');
  assert.equal(spec.circles.length, start.length);
  assert.equal(start.filter((e) => e.kind === 'drum').length, 1);
  assert.equal(start.filter((e) => e.v === 1).length, 3);
  const calls = [];
  const ac = { currentTime: 0, state: 'running', resume() {} };
  const r = mod.play(spec, { audioContext: ac, storage: store, playVoice: (c, v, hz, t, dest, opts) => calls.push({ v: v, hz: hz, t: t, dur: opts && opts.dur, gain: opts && opts.gain }) });
  const opening = calls.slice(0, start.length);
  assert.equal(opening.length, 4); // 13 = 1 ten + 3 ones, one strike each
  const tens = opening.filter((c) => c.v === chosen);
  const ones = opening.filter((c) => c.v === 'woodClick');
  assert.equal(tens.length, 1);
  assert.equal(ones.length, 3);
  assert.ok(Math.abs(tens[0].dur - 0.45) < 0.001);
  assert.ok(tens[0].gain > 0.16);
  assert.ok(ones.every((c) => c.hz > tens[0].hz));
  assert.equal(calls.length, events.length);
  assert.equal(r.notes, events.length);
  const seq = [];
  mod.play(spec, { storage: store, playSequence: (ev) => { seq.push(...ev); return { notes: ev.length }; } });
  assert.equal(seq.length, events.length);
  assert.equal(seq.filter((n) => n.dur === 0.45).length, 1);
  const small = mod.takeAwayCircles(12, 2);
  const smallCalls = [];
  const rs = mod.play(small, { audioContext: ac, storage: store, playVoice: (c, v, hz, t, dest, opts) => smallCalls.push({ v: v, dur: opts && opts.dur }) });
  assert.equal(smallCalls.length, mod.soundEvents(small).length);
  assert.equal(rs.notes, smallCalls.length);
  assert.ok(smallCalls.every((c) => c.v === chosen && c.dur == null));
  const tx = mod.tenExchange(27);
  const txCalls = [];
  mod.play(tx, { audioContext: ac, playVoice: () => txCalls.push(1) });
  assert.equal(txCalls.length, tx.circles.length);
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ gain: param(), frequency: param(), connect(n) { return n; }, start() {}, stop() {} });
  const stub = { currentTime: 0, sampleRate: 8000, destination: {}, createGain: node, createOscillator: node, createBiquadFilter: node, createBufferSource: node, createBuffer: (c, len, sr) => ({ sampleRate: sr, getChannelData: () => new Float32Array(len) }) };
  const end = require('../src/lib/instrumentVoices').playVoice(stub, chosen, 110, 0, null, { dur: 0.45, gain: 0.28 });
  assert.ok(Math.abs(end - 0.45) < 0.001);
});

test('drum and bell have distinct voices, myInstrument drives one family', () => {
  const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };
  const vs = mod.voicesFor(mod.tenExchange(27), mem()); assert.notEqual(vs.drum, vs.bell);
  const MY = require('../src/lib/myInstrument'); const dj = mem(); MY.setMyInstrument('djembe', dj);
  assert.equal(mod.voicesFor(mod.tenExchange(27), dj).drum, require('../src/lib/instruments').instrumentById('djembe').voice); assert.notEqual(mod.voicesFor(mod.tenExchange(27), dj).bell, vs.drum);
  const heard = new Set(); const ac = { currentTime: 0, state: 'running', resume() {} }; mod.play(mod.tenExchange(27), { audioContext: ac, storage: mem(), playVoice: (c, v) => heard.add(v) }); assert.ok(heard.size >= 2, 'two instrument families');
});
