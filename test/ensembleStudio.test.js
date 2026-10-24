const test = require('node:test');
const assert = require('node:assert/strict');
const I = require('../src/lib/instruments.js');

const BANNED = ['ADHD', 'טיפול', 'סוגרים פערים', 'הילד שולט', 'מחקרים מוכיחים'];
const PERC = new Set(['darbuka', 'djembe', 'tabla', 'cajon', 'taiko', 'marimba']);
const MELODY = new Set(['guitar', 'oud', 'recorder', 'piano']);

function lcm(a, b) {
  let x = a;
  let y = b;
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return (a / x) * b;
}

function studio() {
  return import('../src/components/EnsembleStudio.js');
}

function fire(click, key, val) {
  click({ target: { closest: () => ({ getAttribute: (k) => (k === key ? val : null) }) } });
}

test('presets use sourced instruments, with percussion central', async () => {
  const { ENSEMBLE_PRESETS } = await studio();
  const byId = new Map(I.INSTRUMENTS.map((row) => [row.id, row]));
  const sources = new Set(I.INSTRUMENTS.map((row) => row.source));
  assert.equal(ENSEMBLE_PRESETS.length, 4);
  ENSEMBLE_PRESETS.forEach((p) => {
    assert.equal(p.instruments.length, 3, p.id);
    assert.ok(I.TOPICS[p.topicId], p.id);
    assert.equal(lcm(p.cycleA, p.cycleB), p.targetLcm, p.id);
    assert.equal(p.fraction.length, 2, p.id);
    assert.ok(sources.has(p.source) && p.source.startsWith('https://'), p.id);
    assert.ok(p.instruments.some((id) => byId.get(id).source === p.source), p.id);
    const families = new Set();
    p.instruments.forEach((id) => {
      const row = byId.get(id);
      assert.ok(row, id);
      assert.ok(PERC.has(id) || MELODY.has(id), id);
      families.add(row.family);
    });
    assert.ok(families.size >= 2, p.id);
    assert.equal(byId.get(p.instruments[0]).family, 'percussion', p.id);
    assert.ok(p.instruments.some((id) => PERC.has(id)) && p.instruments.some((id) => MELODY.has(id)), p.id);
    assert.match(p.titleHe, /[א-ת]/);
  });
});

test('the card is Hebrew RTL and isolates the ratio, fraction and LCM', async () => {
  const { ENSEMBLE_PRESETS, formatCrossInstrumentCard } = await studio();
  ENSEMBLE_PRESETS.forEach((p) => {
    const html = formatCrossInstrumentCard(p);
    const frac = p.fraction[0] + '/' + p.fraction[1];
    assert.match(html, /dir="rtl"/);
    assert.match(html, /lang="he"/);
    assert.match(html, /[א-ת]/);
    assert.ok(html.includes('<bdi dir="ltr">' + p.ratioLabel + '</bdi>'), p.id);
    assert.ok(html.includes('<bdi dir="ltr">' + frac + '</bdi>'), p.id);
    assert.ok(html.includes('<bdi dir="ltr">lcm(' + p.cycleA + ', ' + p.cycleB + ')</bdi>'), p.id);
    assert.ok(html.includes('data-ensemble-answer="' + p.targetLcm + '"'), p.id);
    assert.match(html, /שילוב כלים: כפולה משותפת/);
    assert.match(html, /data-ensemble-answer="/);
    assert.match(html, /min-width:44px;min-height:44px/);
    BANNED.forEach((word) => assert.equal(html.includes(word), false, word));
  });
});

test('taps play and the ensemble answer is checked', async () => {
  const { ENSEMBLE_PRESETS, mountEnsembleStudio } = await studio();
  const seen = [];
  globalThis.playInstrumentNote = (id) => seen.push('voice:' + id);
  try {
    for (const preset of ENSEMBLE_PRESETS) {
      const played = [];
      let click = null;
      const el = { innerHTML: '', addEventListener(type, fn) { if (type === 'click') click = fn; } };
      const view = mountEnsembleStudio(el, { preset, onPlay: (id) => played.push(id) });
      assert.match(el.innerHTML, /min-width:44px;min-height:44px/);
      fire(click, 'data-instrument', preset.instruments[0]);
      assert.deepEqual(played, [preset.instruments[0]]);
      fire(click, 'data-ensemble-answer', String(preset.targetLcm + 1));
      assert.equal(view.lastOk, false);
      assert.match(el.innerHTML, /נסו שוב/);
      assert.doesNotMatch(el.innerHTML, /נכון/);
      fire(click, 'data-ensemble-answer', String(preset.targetLcm));
      assert.equal(view.lastOk, true);
      assert.match(el.innerHTML, /נכון/);
    }
    let click = null;
    const bare = { innerHTML: '', addEventListener(type, fn) { if (type === 'click') click = fn; } };
    mountEnsembleStudio(bare, { preset: ENSEMBLE_PRESETS[1] });
    fire(click, 'data-instrument', 'djembe');
    assert.deepEqual(seen, ['voice:djembe']);
  } finally {
    delete globalThis.playInstrumentNote;
  }
});
