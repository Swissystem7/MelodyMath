// #679 / #762: EnsembleStudio wiring. Moved from test/myInstrument.test.js; the
// shared store (src/lib/myInstrument.js) lives in #762, so a minimal stand-in is used here.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const MY = { KEY: 'mm.myInstrument', EVENT: 'mm:instrument', getMyInstrument: (s) => { const st = s || globalThis.localStorage; return st ? st.getItem('mm.myInstrument') : null; } };
function memStore(init) {
  const m = new Map(Object.entries(init || {}));
  return { map: m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
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

test('EnsembleStudio follows the one choice; a tap only previews, it is no second picker', async () => {
  const { ENSEMBLE_PRESETS, mountEnsembleStudio } = await import('../src/components/EnsembleStudio.js');
  const s = memStore({ [MY.KEY]: 'oud' });
  globalThis.MM_MY_INSTRUMENT = MY;
  try {
    withWindow(s, () => {
      let click = null;
      const el = { innerHTML: '', addEventListener(t, fn) { if (t === 'click') click = fn; } };
      const view = mountEnsembleStudio(el, { preset: ENSEMBLE_PRESETS[1], grade: 'ה', onPlay: () => {} });
      assert.equal('played' in view, false);
      assert.match(el.innerHTML, /data-instrument="oud" aria-pressed="true"/);
      click({ target: { getAttribute: (k) => (k === 'data-instrument' ? 'piano' : null) } });
      assert.equal(s.map.get(MY.KEY), 'oud', 'the choice lives in #myInstCard only');
    });
  } finally { delete globalThis.MM_MY_INSTRUMENT; }
});

test('kids reach EnsembleStudio in the music games tab; it mounts there and every instrument sounds (#717)', async () => {
  const at = html.indexOf('id="ensCard"');
  assert.ok(at > html.indexOf('id="musicGames"') && at < html.indexOf('<!-- #591 music games end -->'));
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
  assert.deepEqual(played, ['oud'], 'no locks: every instrument sounds');
  assert.doesNotMatch(el.innerHTML, /🔒|data-locked|disabled/);
});

