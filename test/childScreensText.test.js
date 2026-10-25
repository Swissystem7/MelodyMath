// Tests for Issue #677: No technical labels or teacher text on child screens (Refs #677, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const ChildText = require('../src/lib/childScreenText.js');
const FBP = require('../src/components/FractionBarPad.js');
const TTG = require('../src/components/TimesTableGroove.js');
const BC = require('../src/components/BeatCounter.js');
const ES = require('../src/components/EnsembleStudio.js');

function visibleChildText(html) {
  return ChildText.stripTeacherSections(html).replace(/<[^>]+>/g, ' ');
}

test('child text helper converts Latin notes to Hebrew solfege and tempos to friendly terms', () => {
  assert.equal(ChildText.noteToHebrew('C'), 'דו');
  assert.equal(ChildText.noteToHebrew('D'), 'רה');
  assert.equal(ChildText.noteToHebrew('E'), 'מי');
  assert.equal(ChildText.noteToHebrew('F'), 'פה');
  assert.equal(ChildText.noteToHebrew('G'), 'סול');
  assert.equal(ChildText.noteToHebrew('A'), 'לה');
  assert.equal(ChildText.noteToHebrew('B'), 'סי');

  assert.match(ChildText.tempoToHebrew(60), /איטי|🐢/);
  assert.match(ChildText.tempoToHebrew(90), /מתון|🎵/);
  assert.match(ChildText.tempoToHebrew(120), /מהיר|🐇/);
});

test('child-facing visible text across all exercise screens contains zero technical labels', () => {
  const screens = [
    FBP.renderHtml(FBP.createState(0, true), 'drumLow'),
    BC.renderHtml(BC.createState(0, true)),
    TTG.renderHtml({
      factor: 4, showMusic: true, instrument: 'tabla', unlocks: { unlocked: [] }, streak: { count: 0, layers: [] },
      status: 'ask', message: '',
      q: { factor: 4, k: 3, played: [{ index: 0, accent: true, product: 4 }], he: '4 × 3 = ?' }
    }),
    ES.formatCrossInstrumentCard(ES.ENSEMBLE_PRESETS[0], '')
  ];

  const forbidden = [/\bM[1-6]\b/, /\bBPM\b/i, /\bHz\b/i, /ראיות חלשות/, /\bevidence\b/i, /\bdoi\b/i, /\b[A-G]\b/];

  screens.forEach((html, i) => {
    const text = visibleChildText(html);
    forbidden.forEach((re) => {
      assert.doesNotMatch(text, re, `Screen ${i} visible text "${text}" must not show technical code ${re}`);
    });
  });
});

test('teacher info is placed strictly under collapsible details with summary למורה ▸', () => {
  const screens = [
    FBP.renderHtml(FBP.createState(0, true), 'drumLow'),
    BC.renderHtml(BC.createState(0, true)),
    ES.formatCrossInstrumentCard(ES.ENSEMBLE_PRESETS[0], '')
  ];

  screens.forEach((html) => {
    assert.match(html, /<details\b[^>]*\bclass="[^"]*teacher-info[^"]*"[^>]*>/);
    assert.match(html, /<summary[^>]*>למורה ▸<\/summary>/);
  });
});

test('teacher drawer and research citations are hidden from children by default', () => {
  const screens = [
    FBP.renderHtml(FBP.createState(0, true), 'drumLow'),
    BC.renderHtml(BC.createState(0, true)),
    ES.formatCrossInstrumentCard(ES.ENSEMBLE_PRESETS[0], '')
  ];

  screens.forEach((html) => {
    assert.match(html, /class="[^"]*teacher-only\s+hidden[^"]*"/);
    assert.match(html, /display:\s*none\s*!important/);
  });
});

test('child-facing HTML structure never renders method tags M1-M6 outside teacher container', () => {
  const fbpClean = ChildText.stripTeacherSections(FBP.renderHtml(FBP.createState(0, true), 'drumLow'));
  const bcClean = ChildText.stripTeacherSections(BC.renderHtml(BC.createState(0, true)));
  const esClean = ChildText.stripTeacherSections(ES.formatCrossInstrumentCard(ES.ENSEMBLE_PRESETS[0], ''));

  assert.doesNotMatch(fbpClean, /\bM3\b/);
  assert.doesNotMatch(bcClean, /\bM1\b/);
  assert.doesNotMatch(esClean, /\bM[1-6]\b/);
  assert.doesNotMatch(esClean, /\bBPM\b/i);
});
