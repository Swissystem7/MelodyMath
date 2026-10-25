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

test('migration: each pick on the old mm-tap-instrument key (#753) moves to the new key once', () => {
  const s = memStore({ [MY.LEGACY_KEY]: 'tabla' });
  assert.equal(MY.getMyInstrument(s), 'tabla');
  assert.equal(s.map.get(MY.KEY), 'tabla');
  assert.equal(s.map.has(MY.LEGACY_KEY), false);
  const bad = memStore({ [MY.LEGACY_KEY]: 'kazoo' });
  assert.equal(MY.getMyInstrument(bad), null);
  assert.equal(bad.map.size, 0, 'an unknown old id is dropped, not copied');
  // #753's picker writes the old key after the migration: its newer pick wins, then the key is gone.
  const both = memStore({ [MY.KEY]: 'djembe', [MY.LEGACY_KEY]: 'tabla' });
  assert.equal(MY.getMyInstrument(both), 'tabla');
  assert.deepEqual([...both.map.keys()], [MY.KEY]);
  const stray = memStore({ [MY.KEY]: 'djembe', [MY.LEGACY_KEY]: 'kazoo' });
  assert.equal(MY.getMyInstrument(stray), 'djembe', 'an unknown old pick leaves the choice alone');
  assert.equal(stray.map.has(MY.LEGACY_KEY), false);
});

test('the one picker lists every instrument once, presses the choice and saves a tap', () => {
  const s = memStore({ [MY.KEY]: 'oud' });
  withWindow(s, () => {
    const el = fakeEl();
    MY.mountPicker(el);
    assert.equal((el.innerHTML.match(/data-my-inst="/g) || []).length, INST.INSTRUMENTS.length);
    assert.match(el.innerHTML, /data-my-inst="oud"[^>]*aria-pressed="true"/);
    el.onClick({ target: { closest: () => ({ getAttribute: () => 'djembe' }) } });
    assert.equal(s.map.get(MY.KEY), 'djembe');
    assert.match(el.innerHTML, /data-my-inst="djembe"[^>]*aria-pressed="true"/, 'redrawn by the event');
  });
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

test('TimesTableGroove has no picker of its own; it follows the one choice and keeps the streak', () => {
  const s = memStore();
  withWindow(s, () => {
    const el = fakeEl();
    const h = TTG.mount(el);
    assert.doesNotMatch(el.innerHTML, /data-act="instrument"|data-my-inst/);
    el.onClick(btn({ 'data-act': 'answer', 'data-value': String(h.state.q.answer) }));
    const streak = h.state.streak;
    MY.setMyInstrument('tabla');
    assert.equal(h.state.instrument, 'tabla');
    assert.equal(h.state.streak, streak, 'switching keeps the streak');
  });
});

test('TimesTableGroove respects locks: a locked pick is named, never sounded', () => {
  const locked = TTG.UNLOCK_LIST[0];
  withWindow(memStore({ [MY.KEY]: locked }), () => {
    const el = fakeEl();
    const h = TTG.mount(el);
    assert.equal(h.state.instrument, 'tabla');
    assert.equal(h.state.lockedPick, locked);
    assert.match(el.innerHTML, /🔒/);
  });
  assert.deepEqual(TTG.pick({ unlocked: [locked] }), { instrument: 'tabla', lockedPick: null }, 'no choice: tabla');
});

test('EnsembleStudio follows the one choice; a tap only previews, it is no second picker', async () => {
  const { ENSEMBLE_PRESETS, mountEnsembleStudio } = await import('../src/components/EnsembleStudio.js');
  const s = memStore({ [MY.KEY]: 'oud' });
  globalThis.MM_MY_INSTRUMENT = MY;
  try {
    withWindow(s, () => {
      let click = null;
      const el = { innerHTML: '', addEventListener(t, fn) { if (t === 'click') click = fn; } };
      const view = mountEnsembleStudio(el, { preset: ENSEMBLE_PRESETS[1], onPlay: () => {} });
      assert.equal('played' in view, false);
      assert.match(el.innerHTML, /data-instrument="oud" aria-pressed="true"/);
      click({ target: { getAttribute: (k) => (k === 'data-instrument' ? 'piano' : null) } });
      assert.equal(s.map.get(MY.KEY), 'oud', 'the choice lives in #myInstCard only');
    });
  } finally { delete globalThis.MM_MY_INSTRUMENT; }
});

test('kids reach EnsembleStudio in the music games tab; it mounts there and keeps times-table locks', async () => {
  const at = html.indexOf('id="ensCard"');
  assert.ok(at > html.indexOf('id="myInstCard"') && at < html.indexOf('<!-- #591 music games end -->'));
  assert.ok(html.indexOf('<script type="module" src="src/components/EnsembleStudio.js"></script>') > html.indexOf('src/components/TimesTableGroove.js'));
  assert.ok(sw.includes("'./src/components/EnsembleStudio.js'"));
  const el = { innerHTML: '', addEventListener(t, fn) { if (t === 'click') el.onClick = fn; } };
  const played = [];
  Object.assign(globalThis, { MM_TIMES_TABLE_GROOVE: { UNLOCK_LIST: ['oud'] }, MM_UNLOCKS: require('../src/lib/music/unlocks.js'), playInstrumentNote: (id) => played.push(id) });
  globalThis.document = { getElementById: (id) => (id === 'ensCard' ? el : null) };
  try {
    await import('../src/components/EnsembleStudio.js?entry');
    el.onClick({ target: { getAttribute: (k) => (k === 'data-instrument' ? 'oud' : null) } });
  } finally { ['document', 'MM_TIMES_TABLE_GROOVE', 'MM_UNLOCKS', 'playInstrumentNote'].forEach((k) => delete globalThis[k]); }
  assert.match(el.innerHTML, /מנגנים יחד/);
  assert.doesNotMatch(el.innerHTML, /data-my-inst|teacher|מורה/i, 'no picker and no teacher panel');
  assert.deepEqual(played, [], 'a locked instrument is never sounded');
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
  assert.equal((html.match(/id="myInstCard"/g) || []).length, 1, 'one picker, in the music games panel');
  assert.ok(html.indexOf('id="myInstCard"') > html.indexOf('id="musicGames"') && html.indexOf('id="myInstCard"') < html.indexOf('id="ttgCard"'));
});
