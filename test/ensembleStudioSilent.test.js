// #671 / #691 review item 5: EnsembleStudio ends with a no-sound stage (the
// same common multiple in symbols only) that is required for mastery, and is
// marked extra practice with weak evidence (M4), not a main screen.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = require('../src/lib/banks');

const studio = () => import('../src/components/EnsembleStudio.js');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function fire(click, key, val) {
  click({ target: { closest: () => ({ getAttribute: (k) => (k === key ? val : null) }) } });
}
function mount(mountEnsembleStudio, preset, played) {
  let click = null;
  const el = { innerHTML: '', addEventListener(type, fn) { if (type === 'click') click = fn; } };
  const view = mountEnsembleStudio(el, { preset, onPlay: (id) => played.push(id) });
  return { el, view, click: (k, v) => fire(click, k, v) };
}

test('the studio is marked extra practice with weak evidence, like the EXTRA/WEAK ways', async () => {
  const { DOSE, EXTRA_TAG_HE, ENSEMBLE_PRESETS, formatCrossInstrumentCard, formatSilentStage } = await studio();
  assert.equal(DOSE.optional, true);
  assert.equal(DOSE.evidence, 'weak');
  assert.equal(DOSE.mainScreen, false);
  assert.ok(banks.MUSIC_DOSAGE.optionalOnly.includes(DOSE.mechanism), 'common multiple by polyrhythm is a weak mechanism');
  assert.ok(!banks.MUSIC_DOSAGE.primary.includes(DOSE.mechanism));
  ENSEMBLE_PRESETS.forEach((p) => {
    [formatCrossInstrumentCard(p), formatSilentStage(p)].forEach((card) => {
      assert.match(card, /data-dose="extra"/);
      assert.ok(card.includes(EXTRA_TAG_HE), p.id);
    });
  });
  assert.equal(html.includes('EnsembleStudio'), false, 'not mounted as a main screen');
});

test('the silent stage is symbols only: no instrument, no tap, no sound', async () => {
  const { ENSEMBLE_PRESETS, formatSilentStage } = await studio();
  ENSEMBLE_PRESETS.forEach((p) => {
    const card = formatSilentStage(p);
    assert.match(card, /data-stage="silent"/);
    assert.ok(card.includes('<bdi dir="ltr">lcm(' + p.cycleA + ', ' + p.cycleB + ') = ?</bdi>'), p.id);
    assert.ok(card.includes('data-ensemble-answer="' + p.targetLcm + '"'), p.id);
    assert.doesNotMatch(card, /data-instrument|data-tap|<audio/);
    const shown = card.replace(/data-preset="[^"]*"/, '');
    p.instruments.forEach((id) => assert.equal(shown.includes(id), false, p.id + ' ' + id));
    ['דרבוקה', 'ג׳מבה', 'טאבלה', 'קחון', 'גיטרה', 'חלילית', 'פסנתר'].forEach((he) => assert.equal(card.includes(he), false, p.id + ' ' + he));
    assert.match(card, /min-width:44px;min-height:44px/);
  });
});

test('mastery needs the silent stage: the sounded answer alone does not master', async () => {
  const { ENSEMBLE_PRESETS, mountEnsembleStudio } = await studio();
  for (const preset of ENSEMBLE_PRESETS) {
    const played = [];
    const m = mount(mountEnsembleStudio, preset, played);
    assert.equal(m.view.stage, 'music');
    m.click('data-ensemble-answer', String(preset.targetLcm));
    assert.equal(m.view.lastOk, true);
    assert.equal(m.view.stage, 'silent');
    assert.equal(m.view.mastered, false, preset.id + ': sound stage alone is not mastery');
    assert.match(m.el.innerHTML, /data-stage="silent"/);
    assert.match(m.el.innerHTML, /בלי צלילים/);
    m.click('data-instrument', preset.instruments[0]);
    assert.deepEqual(played, [], 'no sound in the silent stage');
    m.click('data-ensemble-answer', String(preset.targetLcm + 1));
    assert.equal(m.view.lastOk, false);
    assert.equal(m.view.mastered, false);
    assert.match(m.el.innerHTML, /נסו שוב/);
    m.click('data-ensemble-answer', String(preset.targetLcm));
    assert.equal(m.view.stage, 'done');
    assert.equal(m.view.mastered, true, preset.id);
    assert.match(m.el.innerHTML, /פתרתם גם בלי צלילים/);
  }
});
