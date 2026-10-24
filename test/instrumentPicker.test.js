const test = require('node:test');
const assert = require('node:assert/strict');
const Logic = require('../src/lib/instrumentPicker.js');
const UI = require('../src/components/InstrumentPicker.js');
const I = require('../src/lib/instruments.js');

test('InstrumentPicker exposes 4 child families, each with at least 3 valid instruments', () => {
  const families = Logic.CHILD_FAMILIES;
  assert.equal(families.length, 4);
  const allKnown = new Set(I.INSTRUMENTS.map((x) => x.id));
  families.forEach((fam) => {
    assert.ok(fam.id && fam.labelHe);
    assert.ok(fam.instruments.length >= 3, `Family ${fam.id} must have >= 3 instruments`);
    fam.instruments.forEach((id) => assert.ok(allKnown.has(id), `Instrument ${id} in ${fam.id} must exist`));
  });
});

test('no instrument is locked or disabled, and zero payment/level gates exist', () => {
  const html = UI.renderPickerHtml({ selectedId: 'darbuka' });
  [/disabled/, /locked/i, /lock/i, /coin/i, /level/i].forEach((re) => assert.doesNotMatch(html, re));
});

test('picker persistence saves and recalls by child ID', () => {
  const mockStorage = new Map();
  globalThis.localStorage = { getItem: (k) => mockStorage.get(k) || null, setItem: (k, v) => mockStorage.set(k, String(v)) };
  try {
    assert.equal(Logic.getChildInstrument('child_A', 'darbuka'), 'darbuka');
    Logic.saveChildInstrument('child_A', 'kora');
    assert.equal(Logic.getChildInstrument('child_A', 'darbuka'), 'kora');
    assert.equal(Logic.getChildInstrument('child_B', 'darbuka'), 'darbuka');
  } finally {
    delete globalThis.localStorage;
  }
});

test('needsPitch substitutes unpitched drums with a pitched voice fallback', () => {
  assert.equal(Logic.resolveInstrumentVoice('darbuka', { needsPitch: false }).voice, 'drumLow');
  const pitched = Logic.resolveInstrumentVoice('darbuka', { needsPitch: true, fallbackPitchVoice: 'woodBar' });
  assert.equal(pitched.isSubstituted, true);
  assert.equal(pitched.voice, 'woodBar');
  assert.equal(Logic.resolveInstrumentVoice('oud', { needsPitch: true }).isSubstituted, false);
});

test('pickEnsembleVoices with voices=2 defaults to two different instrument families', () => {
  const voices = Logic.pickEnsembleVoices({ voices: 2, preferredInstrument: 'darbuka' });
  assert.equal(voices.length, 2);
  const fam1 = Logic.getFamilyForInstrument(voices[0]);
  const fam2 = Logic.getFamilyForInstrument(voices[1]);
  assert.ok(fam1 && fam2);
  assert.notEqual(fam1.id, fam2.id, 'Voices must come from two distinct families');
});

test('UI buttons are at least 44px touch targets and contain no technical codes', () => {
  const html = UI.renderPickerHtml({ selectedId: 'darbuka' });
  assert.match(html, /min-width:44px/);
  assert.match(html, /min-height:44px/);
  assert.match(html, /role="region"/);
  assert.match(html, /role="group"/);
  [/M[1-7]/, /mm-cur/, /percussion/i, /evidence/i, /weak/i].forEach((re) => assert.doesNotMatch(html, re));
});
