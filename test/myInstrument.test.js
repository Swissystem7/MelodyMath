// #679: one "my instrument" for the whole app, read by every screen.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MY = require('../src/lib/myInstrument.js');
const INST = require('../src/lib/instruments.js');
const PAD = require('../src/components/FractionBarPad.js');
const TTG = require('../src/components/TimesTableGroove.js');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function memStore(init) {
  const m = new Map(Object.entries(init || {}));
  return { map: m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
// A fake window: localStorage plus the event target that carries 'mm:instrument'.
function withWindow(store, fn) {
  const target = new EventTarget();
  globalThis.localStorage = store;
  globalThis.addEventListener = target.addEventListener.bind(target);
  globalThis.dispatchEvent = target.dispatchEvent.bind(target);
  try { return fn(); } finally {
    delete globalThis.localStorage;
    delete globalThis.addEventListener;
    delete globalThis.dispatchEvent;
  }
}
const btn = (attrs) => ({ target: { closest: () => ({ getAttribute: (k) => attrs[k] }) } });
function fakeEl() {
  const el = { innerHTML: '', onClick: null, querySelector: () => null, closest: () => null };
  el.addEventListener = (t, fn) => { if (t === 'click') el.onClick = fn; };
  return el;
}

test('no choice yet is null; a known world instrument is saved under one key', () => {
  const s = memStore();
  assert.equal(MY.getMyInstrument(s), null);
  assert.equal(MY.setMyInstrument('djembe', s), true);
  assert.equal(MY.getMyInstrument(s), 'djembe');
  assert.deepEqual([...s.map.keys()], [MY.KEY]);
});

test('any instrument of instruments.js is allowed, an unknown id never is', () => {
  const s = memStore();
  INST.INSTRUMENTS.forEach((x) => assert.equal(MY.setMyInstrument(x.id, s), true, x.id));
  MY.setMyInstrument('kora', s);
  assert.equal(MY.setMyInstrument('kazoo', s), false);
  assert.equal(MY.getMyInstrument(s), 'kora', 'the old choice stays');
  assert.equal(MY.getMyInstrument(memStore({ [MY.KEY]: 'kazoo' })), null, 'a bad stored id reads as no choice');
});

test('migration: the old mm-tap-instrument key moves to the new key once', () => {
  const s = memStore({ [MY.LEGACY_KEY]: 'tabla' });
  assert.equal(MY.getMyInstrument(s), 'tabla');
  assert.equal(s.map.get(MY.KEY), 'tabla');
  assert.equal(s.map.has(MY.LEGACY_KEY), false);
  const bad = memStore({ [MY.LEGACY_KEY]: 'kazoo' });
  assert.equal(MY.getMyInstrument(bad), null);
  assert.equal(bad.map.size, 0, 'an unknown old id is dropped, not copied');
  const both = memStore({ [MY.KEY]: 'djembe', [MY.LEGACY_KEY]: 'tabla' });
  assert.equal(MY.getMyInstrument(both), 'djembe', 'the new key wins');
});

test('instrumentFor(): the child\'s choice first, the screen default otherwise', () => {
  const s = memStore();
  assert.equal(MY.instrumentFor('darbuka', null, s), 'darbuka');
  MY.setMyInstrument('djembe', s);
  assert.equal(MY.instrumentFor('darbuka', null, s), 'djembe');
  assert.equal(MY.instrumentFor('tabla', ['tabla'], s), 'tabla', 'a screen that does not offer it keeps its own');
  assert.equal(MY.instrumentFor('tabla', ['tabla', 'djembe'], s), 'djembe');
});

test('FractionBarPad sounds the chosen instrument and switches mid-exercise without losing the bar', () => {
  withWindow(memStore({ [MY.KEY]: 'djembe' }), () => {
    const el = fakeEl();
    const h = PAD.mount(el, { instrument: 'darbuka' });
    el.onClick(btn({ 'data-act': 'tile', 'data-tile': 'half' }));
    assert.match(el.innerHTML, /data-tile="half" data-tap="drumHigh"/, 'djembe, not the darbuka default');
    const before = h.state;
    MY.setMyInstrument('darbuka');
    assert.match(el.innerHTML, /data-tile="half" data-tap="drumLow"/, 'redrawn in the new timbre');
    assert.equal(h.state, before, 'progress unchanged by the switch');
    assert.deepEqual(h.state.fill, ['1/2']);
  });
});

test('TimesTableGroove saves the picked instrument to the one key and keeps the streak', () => {
  const s = memStore();
  withWindow(s, () => {
    const el = fakeEl();
    const h = TTG.mount(el);
    el.onClick(btn({ 'data-act': 'answer', 'data-value': String(h.state.q.answer) }));
    const streak = h.state.streak;
    el.onClick(btn({ 'data-act': 'instrument', 'data-inst': 'tabla' }));
    assert.equal(s.map.get(MY.KEY), 'tabla');
    assert.equal(h.state.streak, streak, 'switching keeps the streak');
  });
});

test('one source of truth: no screen reads the old key or keeps its own key', () => {
  const files = ['index.html'];
  (function walk(d) {
    fs.readdirSync(path.join(root, d), { withFileTypes: true }).forEach((f) => {
      const p = d + '/' + f.name;
      if (f.isDirectory()) walk(p); else if (/\.js$/.test(f.name)) files.push(p);
    });
  })('src');
  files.filter((f) => f !== 'src/lib/myInstrument.js').forEach((f) => {
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    assert.doesNotMatch(src, /mm-tap-instrument|mm\.myInstrument/, f);
  });
});

test('index.html loads myInstrument.js after instruments.js and before the screens; sw precaches it', () => {
  const at = (src) => html.indexOf('<script src="' + src + '"></script>');
  assert.ok(at('src/lib/instruments.js') > 0);
  assert.ok(at('src/lib/myInstrument.js') > at('src/lib/instruments.js'));
  ['src/components/FractionBarPad.js', 'src/components/TimesTableGroove.js'].forEach((s) => assert.ok(at('src/lib/myInstrument.js') < at(s), s));
  assert.ok(sw.includes("'./src/lib/myInstrument.js'"));
});
