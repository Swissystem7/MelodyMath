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
    assert.ok(html.includes('<bdi dir="ltr">' + p.cycleA + '</bdi>') && html.includes('<bdi dir="ltr">' + p.cycleB + '</bdi>'), p.id);
    assert.match(html, /אחרי כמה פעימות הכלים נפגשים שוב\?/);
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
      const view = mountEnsembleStudio(el, { preset, grade: 'ה', onPlay: (id) => played.push(id) });
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

// Kid-facing text never shows the code name lcm(a, b) (Refs #679).
test('no kid-facing ensemble or polyrhythm text contains "lcm("', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const { ENSEMBLE_PRESETS, formatCrossInstrumentCard, mountEnsembleStudio } = await studio();
  const shown = ENSEMBLE_PRESETS.flatMap((p) => [
    p.titleHe,
    formatCrossInstrumentCard(p, 'נכון.', p.instruments[0], [], true),
    formatCrossInstrumentCard(p, '', null, [], false),
  ]);
  const el = { innerHTML: '' };
  mountEnsembleStudio(el, { grade: 'ו' });
  shown.push(el.innerHTML);
  shown.forEach((s) => assert.equal(/lcm\(/i.test(s), false, s));
  // Quoted strings and markup text in the UI sources (identifiers such as lcmOf( are code, not text).
  const root = path.join(__dirname, '..');
  const src = fs.readFileSync(path.join(root, 'src/components/EnsembleStudio.js'), 'utf8');
  const strings = src.match(/'(?:[^'\\\n]|\\.)*'/g) || [];
  strings.forEach((s) => assert.equal(/lcm\(/i.test(s), false, s));
  // index.html (polyrhythm lesson and explorer): no standalone lcm( outside ${...} code.
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8').replace(/\$\{[^}]*\}/g, '');
  assert.deepEqual(html.match(/(?<![\w.])lcm\(/gi) || [], []);
});

test('the LCM exercise is offered only in grades ה׳–ו׳', async () => {
  const { ENSEMBLE_PRESETS, LCM_GRADES, lcmOffered, mountEnsembleStudio } = await studio();
  assert.deepEqual(LCM_GRADES, ['ה', 'ו']);
  ['א', 'ב', 'ג', 'ד'].forEach((g) => {
    assert.equal(lcmOffered(g), false, g);
    let click = null;
    const el = { innerHTML: '', addEventListener(type, fn) { if (type === 'click') click = fn; } };
    const view = mountEnsembleStudio(el, { preset: ENSEMBLE_PRESETS[0], grade: g, onPlay() {} });
    assert.doesNotMatch(el.innerHTML, /data-ensemble-answer=|כפולה משותפת|נפגשים שוב/, g);
    assert.match(el.innerHTML, view.preset.topicId === 'fractions' ? /data-instrument="darbuka"/ : /data-instrument="cajon"/, g);
    fire(click, 'data-ensemble-answer', '6');
    assert.equal(view.lastOk, null, g);
  });
  ['ה', 'ו'].forEach((g) => {
    assert.equal(lcmOffered(g), true, g);
    const el = { innerHTML: '' };
    mountEnsembleStudio(el, { grade: g });
    assert.match(el.innerHTML, /data-ensemble-answer=/, g);
  });
  const store = { getItem: (k) => (k === 'mm-grade' ? 'ד' : null) };
  const el = { innerHTML: '' };
  mountEnsembleStudio(el, { storage: store, locked: [] });
  assert.doesNotMatch(el.innerHTML, /data-ensemble-answer=/);
});

// Fractions start in grade ג׳: grades א׳–ב׳ never see a fraction tile (Refs #762).
test('grades א׳–ב׳ see no fraction tile; ג׳–ו׳ keep the 1/2 tile', async () => {
  const { ENSEMBLE_PRESETS, FRACTION_GRADES, fractionOffered, mountEnsembleStudio } = await studio();
  assert.deepEqual(FRACTION_GRADES, ['ג', 'ד', 'ה', 'ו']);
  ['א', 'ב'].forEach((g) => {
    assert.equal(fractionOffered(g), false, g);
    ENSEMBLE_PRESETS.forEach((p) => {
      const el = { innerHTML: '', addEventListener() {} };
      const view = mountEnsembleStudio(el, { preset: p, grade: g, onPlay() {} });
      assert.equal(view.preset.topicId === 'fractions', false, g + ' ' + p.id);
      assert.doesNotMatch(el.innerHTML, /\d+\/\d+|השבר/, g + ' ' + p.id);
      assert.match(el.innerHTML, /data-instrument="/, 'instruments stay playable');
    });
  });
  FRACTION_GRADES.forEach((g) => {
    const el = { innerHTML: '', addEventListener() {} };
    const view = mountEnsembleStudio(el, { preset: ENSEMBLE_PRESETS[0], grade: g, onPlay() {} });
    assert.equal(view.preset.id, 'half-bar', g);
    assert.match(el.innerHTML, /1\/2/, g);
  });
});

test('no locks (#717): no ensemble instrument is locked or disabled', async () => {
  const { ENSEMBLE_PRESETS, formatCrossInstrumentCard, mountEnsembleStudio } = await studio();
  ENSEMBLE_PRESETS.forEach((p) => {
    const el = { innerHTML: '', addEventListener() {} };
    mountEnsembleStudio(el, { preset: p, grade: 'ו', storage: { getItem: () => null }, onPlay() {} });
    assert.doesNotMatch(el.innerHTML, /disabled|data-locked|🔒/, p.id);
  });
  assert.equal(typeof formatCrossInstrumentCard, 'function');
});

// No grade selected: the 1/2 tile stays hidden (Refs #762).
test('with no grade selected the fraction tile is hidden', async () => {
  const { ENSEMBLE_PRESETS, fractionOffered, mountEnsembleStudio } = await studio();
  assert.equal(fractionOffered(null), false);
  assert.equal(fractionOffered(undefined), false);
  const el = { innerHTML: '', addEventListener() {} };
  const view = mountEnsembleStudio(el, { preset: ENSEMBLE_PRESETS[0], storage: { getItem: () => null }, onPlay() {} });
  assert.equal(view.preset.topicId === 'fractions', false);
  assert.doesNotMatch(el.innerHTML, /\d+\/\d+|השבר/);
  assert.match(el.innerHTML, /data-instrument="/);
});
