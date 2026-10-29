const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const CL = require('../src/lib/music/cubeLayers');
const banks = require('../src/lib/banks');
const cur = require('../src/lib/curriculum');
const massVol = (g) => banks.itemsForGrade(g).filter((it) => it.standard === banks.ST.MASS_VOL);
const cube = (it) => /תיבה|קובי/.test(it.prompt);
const noOverlap = (notes) => notes.every((n, i) => i === 0 || notes[i - 1].at + notes[i - 1].dur <= n.at + 1e-9);
const BOX = 'תיבה בנויה מ־3 שכבות של 5 קוביות. כמה קוביות יש בה?', ITEM = { prompt: BOX, music: CL.WAY, answer: 15 };
test('box volume (mm-cur-20) has one way, cubeLayerGroups; layerBars and gramGroups stay EXTRA', () => {
  const g2 = require('../src/lib/curriculum/grade2'), g4 = require('../src/lib/curriculum/grade4');
  assert.deepEqual(banks.primaryWays(g2.music.MASS_VOL).map((w) => w[0]), ['cubeLayerGroups']);
  assert.ok(g2.music.MASS_VOL.some((w) => w[0] === 'layerBars' && banks.isOptionalWay(w)));
  const items = cur.itemsForTopic('mm-cur-20', banks.itemsForGrade('ב'));
  assert.ok(items.length >= 12 && items.every((it) => it.music === 'cubeLayerGroups'));
  const gram = g4.music.MASS_VOL.find((w) => w[0] === 'gramGroups');
  assert.ok(gram && banks.isOptionalWay(gram));
  const kg = massVol('ד').filter((it) => !cube(it)), units = cur.itemsForTopic('mm-cur-35', banks.itemsForGrade('ד'));
  assert.equal(kg.length, 9);
  kg.forEach((it) => { assert.ok(units.includes(it), it.prompt); assert.equal(CL.specForItem(it), null); });
  const ways = [1, 2, 3, 4, 5, 6].flatMap((g) => Object.values(require('../src/lib/curriculum/grade' + g).music).flat()).filter((w) => w && w[0] === 'gramGroups');
  assert.ok(ways.length >= 1 && ways.every((w) => banks.isOptionalWay(w)) && banks.MUSIC_MECHANISMS.M2.tags.includes('gramGroups'));
  ['א', 'ב', 'ג', 'ד', 'ה', 'ו'].forEach((g) => banks.itemsForGrade(g).forEach((it) => assert.notEqual(it.music, 'gramGroups', it.prompt)));
});
test('every stack-of-layers cube item gets the widget, with the right total', () => {
  const items = massVol('ב').concat(massVol('ד')).filter(cube);
  const withWidget = items.filter((it) => CL.specForItem(it));
  assert.ok(withWidget.length >= 18, String(withWidget.length));
  withWidget.forEach((it) => {
    const s = CL.specForItem(it);
    if (/כמה קוביות יש בה/.test(it.prompt)) assert.equal(s.total, it.answer, it.prompt);
    if (/מכמה שכבות/.test(it.prompt)) assert.equal(s.layers, it.answer, it.prompt);
  });
  ['הוצאנו', 'תיבה שנייה'].forEach((w) => items.filter((it) => it.prompt.includes(w)).forEach((it) => assert.equal(CL.specForItem(it), null, it.prompt)));
});
test('layers play one after another on two families, never overlapping, and above 12 are tens and ones', () => {
  const notes = CL.plan(CL.parse(BOX), 'together');
  assert.equal(notes.length, 15);
  assert.ok(noOverlap(notes) && new Set(notes.map((n) => n.family)).size >= 2);
  for (let g = 1; g < 3; g++) {
    const prev = notes.filter((n) => n.group === g - 1), cur2 = notes.filter((n) => n.group === g);
    assert.ok(Math.min(...cur2.map((n) => n.at)) > Math.max(...prev.map((n) => n.at + n.dur)));
    assert.notEqual(prev[0].family, cur2[0].family);
  }
  const one = CL.plan(CL.parse('תיבה בנויה משכבה אחת של 3 שורות, ובכל שורה 3 קוביות. כמה קוביות יש בה?'), 'together');
  assert.equal(one.length, 9);
  assert.ok(new Set(one.map((n) => n.family)).size >= 2 && noOverlap(one));
  const dozen = CL.parse('תיבה בנויה מ־2 שכבות, ובכל שכבה 3 שורות של 4 קוביות. כמה קוביות יש בה?');
  assert.equal(dozen.perLayer, 12);
  assert.equal(CL.plan(dozen, 'together').filter((n) => n.place === 'unit').length, 24);
  [13, 20, 24, 36].forEach((per) => {
    const layer = CL.plan({ layers: 2, perLayer: per, rows: null, total: 2 * per }, 'together');
    assert.ok(noOverlap(layer) && layer.every((n) => n.place !== 'unit'), String(per));
    [0, 1].forEach((g) => {
      const mine = layer.filter((n) => n.group === g);
      assert.equal(mine.filter((n) => n.place === 'ten').length * 10 + mine.filter((n) => n.place === 'one').length, per);
      assert.ok(mine.length <= 12, per + ' plays ' + mine.length);
    });
  });
});
test('«עכשיו לבד» is silent, and a wrong answer does not move on', () => {
  const s = CL.parse('תיבה בנויה מ־2 שכבות של 6 קוביות. כמה קוביות יש בה?'), calls = [], ac = { currentTime: 0, state: 'running' }, h = CL.html(s, 'alone');
  assert.deepEqual(CL.plan(s, 'alone'), []);
  assert.equal(CL.play(s, 'alone', { audioContext: ac, playVoice: () => calls.push(1) }), null);
  assert.match(h, /עכשיו לבד/);
  assert.doesNotMatch(h, /snd-play/);
  CL.play(s, 'together', { audioContext: ac, playVoice: () => calls.push(1) });
  assert.equal(calls.length, 12);
  assert.deepEqual([CL.nextRound('together', false), CL.nextRound('alone', false), CL.nextRound('together', true), CL.nextRound('alone', true)], ['together', 'alone', 'alone', 'done']);
});
test('index.html loads the widget and renderWidget checks the answer; sw.js precaches it', () => {
  const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
  assert.match(html, /src="src\/lib\/music\/loopStack\.js"><\/script><script src="src\/lib\/music\/cubeLayers\.js">/);
  assert.match(html, /function playItemMusic\(item\)\{if\(typeof MM_CUBE_LAYERS!=='undefined'&&MM_CUBE_LAYERS\.specForItem\(item\)\)return !!MM_CUBE_LAYERS\.playFor\(item\);/);
  assert.match(html, /MM_CUBE_LAYERS\.bind\(host, MM_CUBE_LAYERS\.specForItem\(item\), \{item:item, answer:item\.answer, read:inputId\?function\(\)\{[^}]*\}:null, check:function\(v\)\{return answerOk\(item,v\);\}\}\)/);
  assert.match(fs.readFileSync(require.resolve('../sw.js'), 'utf8'), /cubeLayers\.js/);
  assert.equal((CL.bind.toString().match(/play\(spec/g) || []).length, 1);
});
function fakeHost(env) {
  const host = { innerHTML: '', onclick: null };
  CL.bind(host, CL.parse(BOX), env);
  host.go = () => host.onclick({ target: { closest: (s) => (s === '.cube-go-alone' ? {} : null) } });
  host.round = () => (host.innerHTML.match(/data-round="(\w+)"/) || [])[1];
  return host;
}
test('«עכשיו לבד» checks the answer: wrong or empty stays together, right moves on', () => {
  [['14', 'together', /cube-try[^>]*>עוד לא\. הקשיבו שוב/], ['', 'together', /cube-try[^>]*>כתבו תשובה קודם/], ['15', 'alone', null]].forEach(([given, want, msg]) => {
    const h = fakeHost({ item: ITEM, answer: 15, read: () => given });
    h.go();
    assert.equal(h.round(), want, JSON.stringify(given));
    if (msg) assert.match(h.innerHTML, msg); else assert.doesNotMatch(h.innerHTML, /cube-try/);
  });
  assert.doesNotMatch(fakeHost({ item: ITEM, answer: 15 }).innerHTML, /cube-go-alone/);
  [true, false].forEach((verdict) => {
    const seen = [], h = fakeHost({ item: ITEM, answer: 15, read: () => '14', check: (v) => { seen.push(v); return verdict; } });
    h.go();
    assert.deepEqual(seen, ['14']);
    assert.equal(h.round(), verdict ? 'alone' : 'together');
  });
});
test('bind does not autoplay; playFor is the one opening sound and is never stacked', () => {
  const { createOpenCue } = require('../src/lib/openCue');
  const calls = [], given = { v: '' }, ac = { currentTime: 0, state: 'running' };
  const h = fakeHost({ item: ITEM, answer: 15, read: () => given.v, playVoice: () => calls.push(1), audioContext: ac });
  assert.equal(calls.length, 0, 'bind autoplayed');
  const osc = [], ctx = { state: 'running', currentTime: 0, destination: {}, createOscillator() { osc.push(1); return {}; } };
  const cue = () => createOpenCue({ getContext: () => ctx, playItemMusic: (it) => !!CL.playFor(it) });
  assert.equal(cue().open(ITEM), true); assert.equal(calls.length, 15);
  ac.currentTime = 0.5;
  assert.deepEqual(CL.playFor(ITEM), { notes: 0, busy: true });
  assert.equal(cue().open(ITEM), true); assert.equal(calls.length, 15); assert.equal(osc.length, 0); assert.equal(CL.playFor({}), null);
  given.v = '15'; h.go(); ac.currentTime = 200;
  assert.equal(CL.playFor(ITEM), null);
  assert.equal(cue().open(Object.assign({}, ITEM, { noMusic: true })), false);
  assert.equal(createOpenCue({ getContext: () => ctx, isMuted: () => true, playItemMusic: () => { throw new Error('played'); } }).open(ITEM), false);
  const g = globalThis, n = [];
  g.playVoice = () => n.push(1); g.getSharedAudioContext = () => ({ currentTime: 500, state: 'running' });
  try { assert.deepEqual(CL.playFor({ prompt: BOX, music: CL.WAY }), { notes: 15 }); } finally { delete g.playVoice; delete g.getSharedAudioContext; }
  assert.equal(n.length, 15);
});
test('playFor plays the charango ten at 220 Hz, and that pitch sounds with a 440 Hz partial', () => {
  const V = require('../src/lib/instrumentVoices'), calls = [], g = globalThis;
  const prompt = 'תיבה בנויה מ־2 שכבות של 20 קוביות. כמה קוביות יש בה?';
  g.playVoice = (c, v, hz, t, d, o) => calls.push({ v, hz, gain: o && o.gain });
  g.getSharedAudioContext = () => ({ currentTime: 0, state: 'running' });
  try { assert.deepEqual(CL.playFor({ prompt, music: CL.WAY }), { notes: 4 }); }
  finally { delete g.playVoice; delete g.getSharedAudioContext; }
  const tens = calls.filter((c) => c.gain === 0.28), plan = CL.plan(CL.parse(prompt), 'together');
  assert.deepEqual(tens.filter((c) => c.v === 'pluck').map((c) => c.hz), [220, 220]);
  tens.filter((c) => c.v === 'drumHigh').forEach((c) => assert.equal(c.hz, plan.find((n) => n.voice === 'drumHigh' && n.place === 'ten').hz));
  assert.ok(tens.every((c) => c.hz >= 220));
  const seen = [], param = () => ({ value: 0, setValueAtTime(v) { seen.push(v); }, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ gain: param(), frequency: param(), connect(n) { return n; }, start() {}, stop() {} });
  V.playVoice({ currentTime: 0, sampleRate: 8000, destination: {}, createGain: node, createOscillator: node, createBiquadFilter: node, createBufferSource: node, createBuffer: (c, len, sr) => ({ sampleRate: sr, getChannelData: () => new Float32Array(len) }) }, 'pluck', 220, 0, null, { dur: 0.4, gain: 0.28 });
  assert.ok(seen.includes(220) && seen.includes(440), seen.join());
});
test('class and beat reach a silent check from a right choice; a wrong one stays quiet', () => {
  assert.deepEqual([CL.choiceStep('together', false), CL.choiceStep('together', true), CL.choiceStep('alone', false)], [
    { round: 'together', advance: false, silent: false }, { round: 'alone', advance: false, silent: true }, { round: 'alone', advance: false, silent: true }]);
  assert.equal(CL.choiceStep('alone', true).advance, true);
  const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
  ['cubeChoice(\'class\',value)', 'cubeChoice(\'beat\',value)', 'cubeChoice(\'beat\',\'מאוחר\')', 'item&&item._quiet'].forEach((s) => assert.ok(html.includes(s), s));
  const calls = [], gain = { v: 1, setValueAtTime(x) { this.v = x; } };
  const ac = { currentTime: 1, state: 'running', destination: {}, createGain: () => ({ gain, connect() {} }) };
  const s = CL.parse('תיבה בנויה מ־2 שכבות של 6 קוביות. כמה קוביות יש בה?');
  CL.play(s, 'together', { audioContext: ac, playVoice: () => calls.push(1) });
  CL.hush(ac);
  assert.equal(gain.v, 0);
  assert.equal(CL.play(s, 'alone', { audioContext: ac, playVoice: () => calls.push(1) }), null);
  CL.play(s, 'together', { audioContext: ac, playVoice: () => calls.push(1) });
  assert.equal(calls.length, 24);
});
