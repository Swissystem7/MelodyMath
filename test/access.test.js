const test = require('node:test');
const assert = require('node:assert/strict');
const access = require('../src/lib/access');

function memory() {
  const m = Object.create(null);
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
  };
}

test('prefs default to off and ignore garbage', () => {
  const ls = memory();
  assert.deepEqual(access.loadAccess(ls), access.normalizePrefs({}));
  ls.setItem(access.ACCESS_KEY, '{');
  assert.equal(access.loadAccess(ls).speak, false);
  assert.deepEqual(access.normalizePrefs({ contrast: 1, extra: true }).contrast, true);
  assert.equal(Object.prototype.hasOwnProperty.call(access.normalizePrefs({ extra: true }), 'extra'), false);
});

test('toggle persists on the device store and body classes follow', () => {
  const ls = memory();
  const on = access.toggleAccess('contrast', ls);
  assert.equal(on.contrast, true);
  assert.deepEqual(access.bodyClassList(on), ['mm-contrast']);
  const off = access.toggleAccess('contrast', ls);
  assert.equal(off.contrast, false);
  assert.deepEqual(access.bodyClassList({ large: true, quiet: true }), ['mm-large', 'mm-quiet']);
  assert.equal(access.toggleAccess('nope', ls).speak, false);
});

test('speech helpers are inert in Node and refuse an empty string', () => {
  assert.equal(access.speakHebrew('שלום'), false);
  assert.equal(access.speakIfEnabled('שלום', { speak: true }), false);
  assert.doesNotThrow(() => access.cancelSpeech());
});

test('wait after an answer stretches only when the teacher asked, not under reduced motion', () => {
  assert.equal(access.waitAfterAnswer({}, false), 700);
  assert.equal(access.waitAfterAnswer({ wait: true }, false), 1400);
  assert.equal(access.waitAfterAnswer({ wait: true }, true), 200);
});

test('hear groups are capped and rejected when they are not countable beats', () => {
  assert.deepEqual(access.sanitizeHear([3, 2]), [3, 2]);
  assert.equal(access.sanitizeHear([0]), null);
  assert.equal(access.sanitizeHear([13]), null);
  assert.equal(access.sanitizeHear('5'), null);
  assert.deepEqual(access.setActiveHear([5]), [5]);
  assert.deepEqual(access.getActiveHear(), [5]);
  assert.equal(access.setActiveHear([]), null);
});

test('currentPromptText reads the visible class-mode prompt first', () => {
  const nodes = {
    '#classPlay:not(.hidden) #classPrompt': { textContent: '  כמה תופים?  ' },
    '#prompt': { textContent: 'other' },
  };
  const doc = {
    querySelector: (sel) => nodes[sel] || null,
  };
  assert.equal(access.currentPromptText(doc), 'כמה תופים?');
  assert.equal(access.currentPromptText({ querySelector: () => null }), '');
});
