'use strict';
// Screen render and wiring tests for WIRE-749-750 (Refs #749, Refs #750, Refs #690, Refs #665).
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const tempoPercent = require('../src/lib/exercises/tempoPercent.js');
const tapTempoMean = require('../src/lib/exercises/tapTempoMean.js');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

function mockContainer() {
  return { innerHTML: '', classList: { classes: new Set(['hidden']), remove(c) { this.classes.delete(c); }, add(c) { this.classes.add(c); } } };
}

test('tempoPercent play buttons sound the instrument from the shared pick, no own picker', () => {
  const buttons = [];
  const box = Object.assign(mockContainer(), {
    querySelectorAll: () => buttons.splice(0, buttons.length, ...[...box.innerHTML.matchAll(/data-act="([a-z-]+)"/g)].map((m) => ({
      act: m[1], getAttribute() { return this.act; }, addEventListener(t, f) { this.click = f; } }))) && buttons,
  });
  const item = tempoPercent.getTempoPercentItems()[0];
  let pick = null;
  const played = [];
  const mounted = tempoPercent.mount(box, item, { instrument: () => pick, play: (voice, pitch, when) => played.push({ voice, pitch, when }) });
  assert.ok(mounted && !box.classList.classes.has('hidden'));
  assert.ok(box.innerHTML.includes('tempo-circles-widget'));
  assert.ok(!box.innerHTML.includes('data-instrument'), 'the picker is the shared one in index.html');
  assert.deepEqual(buttons.map((b) => b.act), ['play-base', 'play-changed', 'play-both']);

  buttons[0].click();
  assert.equal(played.length, 8);
  assert.ok(played.every((p) => p.voice === tapTempoMean.TAP_VOICE), 'no pick plays the wood click');
  pick = 'darbuka';
  played.length = 0;
  buttons[2].click();
  assert.equal(played.length, 16);
  assert.ok(played.every((p) => p.voice === 'drumLow'));
  assert.equal(mounted.play('changed').instrument, 'darbuka');
});

test('G6_MEAN screen wires attachTapButton to the instrument the child picked (#750)', () => {
  const vm = require('node:vm');
  const instruments = require('../src/lib/instruments.js');
  const src = indexHtml.match(/function renderWidget\(hostId, item, inputId\)\{[\s\S]*?\n\}/)[0] + '\n' +
    indexHtml.match(/const TAP_PICKS=[\s\S]*?\nfunction bindTapPicker\(host\)\{[\s\S]*?\n\}/)[0];
  const el = (attrs) => ({ attrs, on: {}, classList: { toggle() {} }, getAttribute(k) { return attrs[k]; },
    setAttribute(k, v) { attrs[k] = v; }, addEventListener(t, f) { this.on[t] = f; }, click() { this.on.click && this.on.click(); } });
  const tapBtn = el({});
  let pills = [], pillsOf = null;
  const host = Object.assign(mockContainer(), {
    querySelector: (sel) => (sel === '.btn-tap-cue' && host.innerHTML.includes('btn-tap-cue') ? tapBtn : null),
    querySelectorAll() {
      if (pillsOf !== host.innerHTML) {
        pillsOf = host.innerHTML;
        pills = [...pillsOf.matchAll(/data-instrument="([a-z]+)"/g)].map((m) => el({ 'data-instrument': m[1] }));
      }
      return pills;
    },
  });
  const store = {};
  const ctx = { $: () => host, MM_TAP_TEMPO_MEAN: tapTempoMean, instrumentById: instruments.instrumentById,
    localStorage: { getItem: (k) => store[k] || null, setItem: (k, v) => { store[k] = String(v); } } };
  vm.createContext(ctx);
  const renderWidget = vm.runInContext(src + '\nrenderWidget;', ctx);
  const played = [];
  const saved = { playVoice: globalThis.playVoice, getSharedAudioContext: globalThis.getSharedAudioContext };
  globalThis.playVoice = (ac, voice) => { played.push(voice); return true; };
  globalThis.getSharedAudioContext = () => null;
  try {
    const item = tapTempoMean.getItems().find((it) => it.music === 'tapTempo');
    renderWidget('widgetHost', item, 'answer');
    assert.ok(!host.classList.classes.has('hidden'));
    assert.ok(host.innerHTML.includes('tap-mean-widget') && host.innerHTML.includes('btn-tap-cue'));
    assert.deepEqual(pills.map((b) => b.attrs['data-instrument']), ['darbuka', 'marimba', 'recorder', 'guitar']);
    tapBtn.click();
    assert.deepEqual(played, [tapTempoMean.TAP_VOICE], 'no pick plays the wood click');
    pills.find((b) => b.attrs['data-instrument'] === 'guitar').click();
    assert.equal(store['mm-tap-instrument'], 'guitar');
    tapBtn.click();
    pills.find((b) => b.attrs['data-instrument'] === 'darbuka').click();
    tapBtn.click();
    assert.deepEqual(played.slice(1), [instruments.instrumentById('guitar').voice, instruments.instrumentById('darbuka').voice]);
    // The no-music check gets no tap button.
    renderWidget('widgetHost', tapTempoMean.getItems().find((it) => it.noMusic), 'answer');
    assert.ok(!host.innerHTML.includes('btn-tap-cue'));
  } finally {
    Object.assign(globalThis, saved);
  }
});

test('index.html and sw.js wire tempoPercent and tapTempoMean to screen and precache', () => {
  assert.ok(indexHtml.includes('src/lib/exercises/tempoPercent.js'));
  assert.ok(indexHtml.includes('src/lib/exercises/tapTempoMean.js'));
  assert.ok(indexHtml.includes('MM_TEMPO_PERCENT.mount'));
  assert.ok(indexHtml.includes('MM_TAP_TEMPO_MEAN.attachTapButton(host, { instrument: pickedInstrument })'));
  assert.ok(swJs.includes("'./src/lib/exercises/tempoPercent.js'"));
  assert.ok(swJs.includes("'./src/lib/exercises/tapTempoMean.js'"));
});
