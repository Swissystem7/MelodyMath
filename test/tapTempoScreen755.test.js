// #755 (rebuild of #753's #750 screen wiring): the real renderWidget of
// index.html shows the tap widget for G6_MEAN tapTempo items, every tap plays
// the instrument picked on it (wood click before a pick), the pick can change
// between taps, and the taps feed the mean. The no-music check has no tap.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const TAP = require('../src/lib/exercises/tapTempoMean.js');
const MY = require('../src/lib/myInstrument.js');
const INST = require('../src/lib/instruments.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const src = html.match(/function renderWidget\(hostId, item, inputId\)\{[\s\S]*?\n\}/)[0];

function memStore(init) {
  const m = new Map(Object.entries(init || {}));
  return { map: m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
function fakeHost() {
  const cue = { listeners: [], addEventListener(t, fn) { if (t === 'click') this.listeners.push(fn); } };
  const pick = { innerHTML: '' };
  const out = { textContent: '' };
  const host = {
    innerHTML: '', onclick: null,
    classList: { names: ['hidden'], add(c) { if (!this.names.includes(c)) this.names.push(c); }, remove(c) { this.names = this.names.filter((n) => n !== c); } },
    querySelector(sel) {
      if (sel === '.btn-tap-cue') return host.innerHTML.includes('btn-tap-cue') ? cue : null;
      if (sel === '.tap-inst-pick') return pick;
      if (sel === '.tap-mean-out') return out;
      return null;
    },
  };
  // A tap: the button's own listener, then the click bubbles to the host.
  host.tap = () => { cue.listeners.forEach((fn) => fn()); host.onclick({ target: { closest: (s) => (s === '.btn-tap-cue' ? cue : null) } }); };
  host.pick = (id) => host.onclick({ target: { closest: (s) => (s === '[data-tap-inst]' ? { getAttribute: () => id } : null) } });
  host.pickEl = pick;
  host.out = out;
  return host;
}
function setup(t, store) {
  const played = [];
  global.localStorage = store;
  global.playVoice = (ac, voice) => { played.push(voice); };
  // A steady child: one tap every 0.6 s (100 BPM).
  const realNow = Date.now;
  let clock = 0;
  Date.now = () => (clock += 600);
  t.after(() => { delete global.localStorage; delete global.playVoice; Date.now = realNow; });
  const host = fakeHost();
  const ctx = { $: () => host, MM_TAP_TEMPO_MEAN: TAP, MM_MY_INSTRUMENT: MY, instrumentById: INST.instrumentById };
  vm.createContext(ctx);
  return { host, played, render: vm.runInContext(src + '\nrenderWidget;', ctx) };
}
const voiceOf = (id) => INST.instrumentById(id).voice;
const tapItem = TAP.getItems().find((it) => it.music === 'tapTempo');

test('each tap plays the picked instrument, and the pick can change between taps', (t) => {
  const store = memStore();
  const { host, played, render } = setup(t, store);
  render('rmPlanWidget', tapItem, null);
  assert.deepEqual(host.classList.names, []);
  assert.match(host.innerHTML, /tap-mean-widget/);
  ['darbuka', 'marimba', 'recorder', 'guitar'].forEach((id) => assert.match(host.innerHTML, new RegExp('data-tap-inst="' + id + '" aria-pressed="false"'), id));

  host.tap();
  host.pick('darbuka');
  assert.match(host.pickEl.innerHTML, /data-tap-inst="darbuka" aria-pressed="true"/);
  host.tap();
  host.pick('guitar');
  host.tap();
  host.pick('recorder');
  host.tap();
  host.pick('marimba');
  host.tap();
  assert.deepEqual(played, [TAP.TAP_VOICE, voiceOf('darbuka'), voiceOf('guitar'), voiceOf('recorder'), voiceOf('marimba')]);
  assert.equal(new Set(played).size, 5, 'five different voices');
  assert.equal(MY.getMyInstrument(store), 'marimba', 'the pick is kept on this device');

  assert.equal(host._tapSession.taps().length, 5, 'every tap feeds the mean');
  assert.deepEqual(host._tapSession.intervals(), [6, 6, 6, 6]);
  assert.equal(TAP.meanIntervalToBpm(host._tapSession.mean()), 100);
  assert.match(host.out.textContent, /הממוצע: 6 עש׳/);
});

test('a pick saved on the old mm-tap-instrument key plays from the first tap', (t) => {
  const { host, played, render } = setup(t, memStore({ 'mm-tap-instrument': 'guitar' }));
  render('rmPlanWidget', tapItem, null);
  assert.match(host.innerHTML, /data-tap-inst="guitar" aria-pressed="true"/);
  host.tap();
  assert.deepEqual(played, [voiceOf('guitar')]);
});

test('the end-of-topic no-music check gets no tap button', (t) => {
  const { host, render } = setup(t, memStore());
  const plain = TAP.getItems().find((it) => it.noMusic);
  render('rmPlanWidget', plain, null);
  assert.doesNotMatch(host.innerHTML, /btn-tap-cue|data-tap-inst/);
  assert.equal(host._tapSession, null);
});
