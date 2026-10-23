'use strict';
// #591 WorldInstrumentLibrary (owner spec 6376067230; all free per 6376035473).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const LIB = require('../src/lib/music/instrumentLibrary.js');
const S = require('../src/lib/music/instrumentStudio.js');
const UI = require('../src/components/InstrumentLibrary.js');
const I = require('../src/lib/instruments.js');
const V = require('../src/lib/instrumentVoices.js');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const LICENSES = JSON.parse(read('instruments/LICENSES.json'));

test('instrumentRegistry: 24 instruments in the owner\'s four families (9/7/5/3)', () => {
  assert.equal(LIB.LIBRARY.length, 24);
  assert.equal(new Set(LIB.LIBRARY.map((x) => x.id)).size, 24, 'no duplicate ids');
  const want = {
    percussion: ['cajon', 'darbuka', 'djembe', 'gamelan', 'marimba', 'steelPan', 'tabla', 'taiko', 'xylophone'],
    strings: ['guitar', 'harp', 'koto', 'oud', 'qanun', 'sitar', 'violin'],
    winds: ['clarinet', 'flute', 'ney', 'recorder', 'trumpet'],
    keys: ['accordion', 'kalimba', 'piano'],
  };
  assert.deepEqual(LIB.FAMILIES, Object.keys(want));
  Object.keys(want).forEach((f) => assert.deepEqual(LIB.byFamily(f).map((x) => x.id).sort(), want[f], f));
});

test('instrumentRegistry schema: family, mechanic, samples, card and licence for every instrument', () => {
  assert.deepEqual(LIB.LIBRARY.filter((x) => x.card.source === 'TODO').map((x) => x.id), ['kalimba'], 'TODO-source in instruments.js, carried over');
  assert.deepEqual(LIB.LIBRARY.filter((x) => x.card.reviewTodo).map((x) => x.id).sort(), ['gamelan', 'koto', 'qanun', 'sitar'], 'cards awaiting the cultural adviser');
  const seen = { pair: new Set(), samples: new Set() };
  LIB.LIBRARY.forEach((x) => {
    assert.ok(I.instrumentById(x.id), x.id + ' is a sourced instrument in instruments.js');
    assert.match(x.he, /[א-ת]/, x.id);
    assert.ok(LIB.FAMILIES.includes(x.family), x.id);
    assert.ok(S.MECHANICS[x.mechanic], x.id + ' mechanic');
    assert.ok(x.samples.length >= 1 && x.samples.every((v) => V.VOICES[v]), x.id + ' samples are real voices');
    assert.equal(x.voice, x.samples[0]);
    assert.match(x.card.origin, /[א-ת]/, x.id + ' card origin');
    assert.match(x.card.how, /[א-ת]/, x.id + ' card how');
    if (x.card.source !== 'TODO') assert.match(x.card.source, /^https:\/\//, x.id + ' card source');
    x.samples.forEach((v) => assert.ok(LICENSES.voices[v], x.id + ': no LICENSES.json record for ' + v));
    const key = x.samples.slice().sort().join('+');
    assert.ok(!seen.pair.has(x.mechanic + '|' + key), 'two instruments share mechanic and samples: ' + x.id);
    assert.ok(!seen.samples.has(key), 'same sample set: ' + x.id);
    seen.pair.add(x.mechanic + '|' + key); seen.samples.add(key);
  });
});

test('mechanics follow the family: percussion tapped, strings plucked or swiped, winds held, keys multi-touch', () => {
  LIB.EXTRAS.forEach((x) => {
    const kind = LIB.KIND[x.mechanic];
    const want = { percussion: 'tap', strings: 'pluck', winds: 'hold', keys: 'keys' }[x.family];
    assert.equal(kind, want, x.id);
  });
  Object.keys(S.MECHANICS).forEach((m) => assert.ok(LIB.KIND[m], m + ' has a gesture kind'));
});

test('LICENSES.json: 100% of the voices have a record, all synthesised in code, none a third-party sample', () => {
  const voices = Object.keys(V.VOICES);
  assert.deepEqual(Object.keys(LICENSES.voices).sort(), voices.slice().sort(), 'one record per voice, no extras');
  voices.forEach((v) => {
    const r = LICENSES.voices[v];
    ['source', 'author', 'license'].forEach((k) => assert.ok(r[k], v + ' ' + k));
    assert.match(r.source, /synthesised in code/);
    assert.ok(read('SOUNDS-LICENSES.md').includes('`' + v + '`'), v + ' is in SOUNDS-LICENSES.md');
  });
  assert.equal(fs.readdirSync(path.join(root, 'instruments')).filter((f) => /\.(ogg|opus|mp3|wav|m4a|aac)$/i.test(f)).length, 0, 'no audio files');
});

test('dosageGuard: switching instrument changes only timbre and mechanic, never the topic\'s one method', () => {
  Object.keys(I.TOPICS).forEach((t) => {
    const task = { topic: t, method: S.primaryMethod(t), q: '3/4 + 1/4', answer: '1', points: 1 };
    assert.ok(LIB.dosageGuard(task), t);
    LIB.LIBRARY.forEach((x) => {
      const dressed = LIB.withInstrument(task, x.id);
      assert.deepEqual(dressed.method, task.method, t + ' / ' + x.id);
      assert.equal(dressed.answer, task.answer);
      assert.deepEqual(S.primaryMethod(t, x.id), S.primaryMethod(t));
    });
  });
  assert.equal(LIB.dosageGuard({ topic: 'x', instrument: 'piano', method: 'M3' }), true);
});

test('unlocks: six basics open from the start, then one per topic practised well, fixed order, no price field', () => {
  assert.deepEqual(LIB.basicIds(), ['darbuka', 'marimba', 'piano', 'kalimba', 'tabla', 'gamelan']);
  assert.deepEqual(LIB.unlockedIds(0), LIB.basicIds());
  for (let n = 0; n <= 18; n++) assert.equal(LIB.unlockedIds(n).length, 6 + n);
  assert.equal(LIB.unlockedIds(18).length, 24);
  assert.equal(LIB.unlockedIds(99).length, 24);
  assert.equal(LIB.nextToOpen(0), 'djembe');
  assert.equal(LIB.nextToOpen(18), null);
  assert.deepEqual(LIB.unlockedIds(7), LIB.unlockedIds(7), 'deterministic');
  const keys = new Set(LIB.LIBRARY.flatMap((x) => Object.keys(x).concat(Object.keys(x.card))));
  keys.forEach((k) => assert.doesNotMatch(k, /price|cost|buy|paid|premium|entitle|sku/i));
  assert.doesNotMatch(read('src/lib/music/instrumentLibrary.js'), /Math\.random|Date\.now|setTimeout|setInterval/);
});

test('loader: prepares only the chosen instrument, plus one idle prefetch', () => {
  const calls = [];
  const loader = LIB.createLoader((voice, hz) => { calls.push(voice); return { voice, hz }; });
  assert.deepEqual(loader.prepared(), []);
  const plan = loader.prepare('oud');
  assert.equal(plan.length, LIB.sounds(LIB.byId('oud')).length);
  assert.deepEqual(loader.prepared(), ['oud']);
  assert.ok(calls.every((v) => v === 'pluck'), 'nothing of another instrument was planned');
  loader.prepare('flute');
  assert.deepEqual(loader.prepared(), ['flute'], 'choosing another drops the first');
  loader.prefetch(LIB.nextToOpen(3));
  assert.deepEqual(loader.prepared().sort(), ['cajon', 'flute']);
  assert.equal(loader.prefetch(null), null);
  const real = LIB.createLoader(V.planVoice).prepare('trumpet');
  assert.ok(real.length > 0 && real.every((p) => p && p.oscillators.length > 0), 'planVoice runs in Node');
});

test('every card has a 10-second demo phrase in the instrument\'s own gesture', () => {
  LIB.LIBRARY.forEach((x) => {
    const plan = LIB.demoPlan(x);
    assert.ok(Math.abs(LIB.demoSeconds(plan) - LIB.DEMO_SECONDS) < 0.01, x.id + ' ' + LIB.demoSeconds(plan));
    const voices = new Set(LIB.sounds(x).map((s) => s.voice));
    plan.forEach((n) => assert.ok(voices.has(n.voice), x.id + ' plays only its own voices'));
  });
  assert.ok(LIB.demoPlan(LIB.byId('flute')).every((n) => n.dur > 1), 'winds hold long notes');
});

test('the library screen: four labelled families, locked ones say when they open, a card per open instrument', () => {
  const out = UI.renderHtml({ open: LIB.basicIds() });
  LIB.FAMILIES.forEach((f) => assert.match(out, new RegExp('<section class="lib-family" aria-labelledby="libFam-' + f + '"><h4 id="libFam-' + f + '">')));
  assert.equal((out.match(/data-act="pick"/g) || []).length, 24);
  assert.equal((out.match(/aria-disabled="true"/g) || []).length, 18);
  assert.match(out, /ייפתח אחרי 1 נושאים שתרגלתם היטב/);
  assert.match(out, /כולם בחינם/);
  assert.equal(out.includes('lib-card'), false, 'no card until one is picked');
  LIB.LIBRARY.forEach((x) => {
    const html = UI.renderHtml({ open: LIB.unlockedIds(18), id: x.id });
    assert.match(html, /<article class="lib-card" aria-labelledby="libCardHead">/, x.id);
    assert.match(html, /data-act="demo">▶ הדגמה של 10 שניות/);
    assert.match(html, /aria-label="מנגנים על [א-ת]/);
    (html.match(/<button[^>]*>/g) || []).forEach((b) => assert.match(b, /aria-label="[^"]*[א-ת]|data-act="(damp|demo)"/, x.id + ' ' + b));
  });
  assert.equal(UI.renderHtml({ open: LIB.basicIds(), id: 'harp' }).includes('lib-card'), false, 'a locked instrument has no card yet');
});

test('no buy words and no "music improves maths" claim in the library code or screen', () => {
  const texts = ['src/lib/music/instrumentLibrary.js', 'src/components/InstrumentLibrary.js', 'instruments/LICENSES.json'].map(read);
  LIB.LIBRARY.forEach((x) => texts.push(UI.renderHtml({ open: LIB.unlockedIds(18), id: x.id })));
  const pay = /purchas|price|paywall|subscri|checkout|entitle|parental|premium|coin|loot|קנה|קנייה|מחיר|רכישה|מנוי|תשלום|מטבע/i;
  const claim = /improves? math|משפר[^.]{0,30}מתמטיקה|מוזיקה משפרת/i;
  texts.forEach((t) => { assert.doesNotMatch(t, pay); assert.doesNotMatch(t, claim); });
});

test('index.html and sw.js: library lib before the studio, one card, cached offline', () => {
  const html = read('index.html');
  const at = (src) => html.indexOf('<script src="' + src + '"></script>');
  assert.ok(at('src/lib/instrumentVoices.js') >= 0 && at('src/lib/instrumentVoices.js') < at('src/lib/music/instrumentLibrary.js'));
  assert.ok(at('src/lib/instruments.js') < at('src/lib/music/instrumentLibrary.js'));
  assert.ok(at('src/lib/music/instrumentLibrary.js') < at('src/lib/music/instrumentStudio.js'), 'the studio reads MM_LIBRARY');
  assert.ok(at('src/components/InstrumentStudio.js') < at('src/components/InstrumentLibrary.js'));
  assert.equal((html.match(/id="libraryCard"/g) || []).length, 1);
  const sw = read('sw.js');
  ['./src/lib/music/instrumentLibrary.js', './src/components/InstrumentLibrary.js'].forEach((f) => assert.ok(sw.includes("'" + f + "'"), f));
});
