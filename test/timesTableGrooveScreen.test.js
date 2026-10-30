// #591 proposal 2/5: the TimesTableGroove screen (M2 accented beats).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TTG = require('../src/components/TimesTableGroove.js');
const INST = require('../src/lib/instruments.js');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

test('4 × 7: the groove stops before the 7th accent, the accents carry 4, 8 ... 24', () => {
  const q = TTG.question(4, 0);
  assert.equal(q.he, '4 × 7 = ?');
  assert.equal(q.answer, 28);
  assert.deepEqual(q.played.filter((b) => b.accent).map((b) => b.product), [4, 8, 12, 16, 20, 24]);
  assert.equal(q.played.length, 27);
  assert.ok(TTG.choices(q).includes(28));
  assert.equal(new Set(TTG.choices(q)).size, 4);
});

test('every third question reads the same groove as division (grade ד׳)', () => {
  const q = TTG.question(4, 2);
  assert.equal(q.division, true);
  assert.match(q.he, /כמה קבוצות של 4 יש ב־36/);
  assert.equal(q.answer, 9);
});

test('a right answer to 4 × 7, three in a row add a layer, a wrong one keeps the layers and plays nothing', () => {
  let s = TTG.createState({ factor: 4 });
  s = TTG.answer(s, 28);
  assert.equal(s.status, 'right');
  assert.match(s.message, /4 × 7 = 28/);
  s = TTG.answer(TTG.next(s), TTG.next(s).q.answer);
  const third = TTG.next(s);
  s = TTG.answer(third, third.q.answer);
  assert.deepEqual(s.streak.layers, ['bass']);
  assert.equal(s.sound, 'layer');
  const wrong = TTG.answer(TTG.next(s), -1);
  assert.equal(wrong.status, 'retry');
  assert.equal(wrong.sound, null, 'no punishment sound');
  assert.deepEqual(wrong.streak.layers, ['bass'], 'a wrong answer never removes a layer');
  assert.equal(wrong.streak.streak, 0);
  assert.match(wrong.message, /^עוד לא\./);
});

test('#717: every M2 instrument is available from the start, with no unlock state', () => {
  const s = TTG.createState({ factor: 3 });
  assert.equal(s.unlocks, undefined, 'no unlock state');
  assert.equal(TTG.UNLOCK_LIST, undefined);
  assert.equal(s.lockedPick, null);
  const html0 = TTG.renderHtml(s);
  const m2 = INST.forTopic('multiplication').map((x) => x.id);
  assert.ok(m2.length >= 2);
  m2.forEach((id) => {
    assert.ok(TTG.INSTRUMENTS.includes(id) || id === 'tabla', id);
  });
  // #762: the child picks in #myInstCard, so this screen has no instrument buttons of its own.
  assert.doesNotMatch(html0, /data-act="instrument"|data-locked|🔒|נפתח כלי/);
  let t = s;
  for (let i = 0; i < 30; i++) t = TTG.answer(TTG.next(t), TTG.next(t).q.answer);
  assert.equal(t.unlocks, undefined);
  assert.doesNotMatch(t.message, /נפתח כלי/);
  assert.ok(!fs.existsSync(path.join(__dirname, '..', 'src/lib/music/unlocks.js')), 'unlocks.js removed');
  assert.ok(!sw.includes('unlocks.js'), 'not precached');
});

test('the groove plan: a click per beat, the instrument on accents, one more voice per layer', () => {
  const q = TTG.question(4, 0);
  const plain = TTG.groovePlan(q, 'drumHigh', [], false);
  assert.equal(plain.filter((n) => n.voice === 'woodClick').length, 27);
  assert.equal(plain.filter((n) => n.accent).length, 6);
  const full = TTG.groovePlan(q, 'drumHigh', ['bass', 'melody', 'harmony'], true);
  assert.equal(full.filter((n) => n.accent).length, 7, 'after a right answer the completing accent sounds');
  assert.equal(full.filter((n) => n.voice === 'drumLow').length, 7);
});

test('with music: tap pads and data-tap answers; without music: a plain skip-counting row, no sound', () => {
  const on = TTG.renderHtml(TTG.createState({ factor: 4 }));
  assert.match(on, /data-act="answer" data-value="28" data-tap="drumHigh"/);
  assert.match(on, /data-act="play"/);
  assert.match(on, /class="ttg-beat acc" data-beat="24">24</);
  const off = TTG.renderHtml(TTG.createState({ factor: 4, showMusic: false }));
  assert.doesNotMatch(off, /data-tap|data-act="play"/);
  assert.match(off, /4, 8, 12, 16, 20, 24, \?/);
  assert.equal(TTG.answer(TTG.createState({ factor: 4, showMusic: false }), 28).status, 'right', 'solvable with the music off');
});

test('mount(): the streak survives a reload through localStorage', () => {
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) };
  try {
    let onClick = null;
    const el = { innerHTML: '', addEventListener: (t, fn) => { if (t === 'click') onClick = fn; }, querySelector: () => null, closest: () => null };
    TTG.mount(el);
    onClick({ target: { closest: () => ({ getAttribute: (k) => ({ 'data-act': 'answer', 'data-value': '28' })[k] }) } });
    let onClick2 = null;
    const h = TTG.mount({ innerHTML: '', addEventListener: (t, fn) => { if (t === 'click') onClick2 = fn; }, querySelector: () => null, closest: () => null });
    assert.equal(h.state.streak.streak, 1);
    assert.ok(onClick2);
  } finally {
    delete globalThis.localStorage;
  }
});

test('index.html mounts the groove card in the music-games panel, scripts in order and precached', () => {
  assert.match(html, /<section id="musicGames" [^>]*>[\s\S]*id="ttgCard"[\s\S]*<!-- #591 music games end -->/);
  const at = (src) => html.indexOf('<script src="' + src + '"></script>');
  ['src/lib/music/groove.js', 'src/lib/music/streak.js'].forEach((s) => {
    assert.ok(at(s) > 0 && at(s) < at('src/components/TimesTableGroove.js'), s);
    assert.ok(sw.includes("'./" + s + "'"), s + ' precached');
  });
  assert.ok(at('src/lib/instruments.js') < at('src/components/TimesTableGroove.js'));
  assert.ok(sw.includes("'./src/components/TimesTableGroove.js'"));
});
