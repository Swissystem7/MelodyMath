const test = require('node:test');
const assert = require('node:assert/strict');
const access = require('../src/lib/access.js');

function memory() {
  const m = Object.create(null);
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
  };
}

test('exports setHighContrast for persisted contrast preference', () => {
  assert.strictEqual(typeof access.setHighContrast, 'function');
});

test('setHighContrast saves boolean state and returns the body class name', () => {
  const ls = memory();
  const on = access.setHighContrast(true, ls);
  assert.equal(on.highContrast, true);
  assert.equal(on.bodyClass, 'mm-contrast');
  assert.equal(JSON.parse(ls.getItem(access.ACCESS_KEY)).contrast, true);

  const off = access.setHighContrast(false, ls);
  assert.equal(off.highContrast, false);
  assert.equal(off.bodyClass, '');
  assert.equal(JSON.parse(ls.getItem(access.ACCESS_KEY)).contrast, false);
});

test('setHighContrast keeps other access prefs and reloads on next visit', () => {
  const ls = memory();
  access.saveAccess({ large: true, speak: true, contrast: false }, ls);
  const state = access.setHighContrast(true, ls);
  assert.equal(state.bodyClass, 'mm-contrast');
  const reloaded = access.loadAccess(ls);
  assert.equal(reloaded.contrast, true);
  assert.equal(reloaded.large, true);
  assert.equal(reloaded.speak, true);
});
