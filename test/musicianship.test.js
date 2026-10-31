// #591 MusicianshipPath (owner comment 6376067230 part 2): four music skills,
// progress apart from maths, timbreQuiz + pitchMatch scoring, deterministic
// items, and no "music improves maths" or buy/price text.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const MS = require('../src/lib/music/musicianship.js');
const PATH = require('../src/components/MusicianshipPath.js');
const INS = require('../src/lib/instruments.js');
const VOICES = require('../src/lib/instrumentVoices.js').VOICES;

const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

function stubStorage() {
  const m = new Map();
  return { map: m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)) };
}

test('the path teaches the four skills: rhythm, pitch, families, timbre', () => {
  assert.deepEqual(MS.SKILL_IDS, ['rhythm', 'pitch', 'families', 'timbre']);
  const items = MS.buildPath(7);
  assert.equal(items.length, 8, '8 short items = about 2-3 minutes');
  MS.SKILL_IDS.forEach((id) => assert.equal(items.filter((x) => x.skill === id).length, 2, id));
  assert.deepEqual(MS.NOTES.map((n) => n.id), ['whole', 'half', 'quarter', 'eighth']);
});

test('generation is deterministic for a seed and differs across seeds', () => {
  assert.deepEqual(MS.buildPath(42), MS.buildPath(42));
  assert.notDeepEqual(MS.buildPath(42), MS.buildPath(43));
  const p = MS.recordResult(MS.initialProgress(), { skill: 'timbre', correct: true });
  assert.deepEqual(MS.buildPath(5, p), MS.buildPath(5, p));
});

test('rhythm items: every bar is exactly 4 beats, the options differ and the answer is the heard bar', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const it = MS.rhythmItem(MS.rng(seed), seed % 2);
    assert.equal(it.options.length, 3);
    it.options.forEach((b) => assert.equal(MS.barBeats(b), 4, b.join(',')));
    assert.equal(new Set(it.options.map((b) => b.join(','))).size, 3);
    assert.deepEqual(it.options[it.answer], it.bar);
  }
  const plan = MS.rhythmPlan(['half', 'quarter', 'eighth', 'eighth'], 60);
  assert.deepEqual(plan.filter((n) => n.kind === 'note').map((n) => n.at), [0, 2, 3, 3.5]);
  assert.equal(plan.filter((n) => n.kind === 'click').length, 4);
});

test('families items use instruments.js FAMILIES and the real family of the instrument', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const it = MS.familyItem(MS.rng(seed));
    assert.deepEqual(it.options, INS.FAMILIES);
    assert.equal(it.options[it.answer], INS.instrumentById(it.instrument).family);
  }
});

test('timbre items: 2-4 choices, each with a different instrumentVoices voice, the target among them', () => {
  assert.equal(MS.timbreChoices(0), 2);
  assert.equal(MS.timbreChoices(3), 3);
  assert.equal(MS.timbreChoices(99), 4);
  for (let n = 2; n <= 4; n++) {
    for (let seed = 1; seed <= 100; seed++) {
      const it = MS.timbreItem(MS.rng(seed), n);
      assert.equal(it.options.length, n);
      const voices = it.options.map((id) => INS.instrumentById(id).voice);
      assert.equal(new Set(voices).size, n, 'voices are distinct');
      voices.forEach((v) => assert.ok(VOICES[v], v + ' is a real voice'));
      assert.equal(it.options[it.answer], it.instrument);
      assert.equal(it.voice, INS.instrumentById(it.instrument).voice);
    }
  }
});

test('scoreTimbreQuiz: right by id or index scores 1, wrong scores 0 and names the answer', () => {
  const it = { skill: 'timbre', instrument: 'oud', voice: 'pluck', options: ['taiko', 'oud', 'ney'], answer: 1 };
  assert.deepEqual(MS.scoreTimbreQuiz(it, 'oud'), { skill: 'timbre', correct: true, score: 1, chosen: 'oud', answerId: 'oud' });
  assert.equal(MS.scoreTimbreQuiz(it, 1).score, 1);
  const wrong = MS.scoreTimbreQuiz(it, 'ney');
  assert.equal(wrong.correct, false);
  assert.equal(wrong.score, 0);
  assert.equal(wrong.answerId, 'oud');
  assert.equal(MS.scoreTimbreQuiz(it, 'piano').score, 0);
});

test('scorePitchMatch: exact = 1, within a whole tone = 0.5 with a direction, further = 0', () => {
  const it = { skill: 'pitch', mode: 'tone', ref: null, target: 4 }; // סול 392 Hz
  assert.deepEqual(MS.scorePitchMatch(it, 4), { skill: 'pitch', correct: true, score: 1, cents: 0, move: null });
  assert.equal(MS.scorePitchMatch(it, { hz: 395 }).score, 1, '13 cents off is still the same note');
  const low = MS.scorePitchMatch(it, 3); // פה, 2 semitones below
  assert.equal(low.score, 0.5);
  assert.equal(low.move, 'higher');
  const high = MS.scorePitchMatch(it, 5); // לה, 2 semitones above
  assert.equal(high.score, 0.5);
  assert.equal(high.move, 'lower');
  assert.equal(MS.scorePitchMatch(it, 0).score, 0);
  assert.equal(MS.scorePitchMatch(it, null).score, 0);
  const interval = MS.pitchItem(MS.rng(3), 1);
  assert.ok(interval.target >= 0 && interval.target < MS.SCALE.length);
  const ivl = { skill: 'pitch', mode: 'interval', ref: 0, target: 4 };
  assert.deepEqual(MS.pitchPlan(ivl).map((n) => n.kind), ['ref', 'target']);
});

test('progress lives under its own key, apart from every maths key', () => {
  assert.equal(MS.STORAGE_KEY, 'mm.musicianship.progress');
  const s = stubStorage();
  const p = MS.recordResult(MS.recordResult(MS.initialProgress(), { skill: 'rhythm', correct: true }), { skill: 'pitch', correct: false, score: 0.5 });
  assert.ok(MS.saveProgress(s, p));
  assert.deepEqual([...s.map.keys()], [MS.STORAGE_KEY]);
  assert.deepEqual(MS.loadProgress(s).skills.rhythm, { tries: 1, correct: 1 });
  assert.deepEqual(MS.loadProgress(s).skills.pitch, { tries: 1, correct: 0 }, 'a close pitch is a try, not a correct');
  assert.deepEqual(MS.loadProgress(stubStorage()), MS.initialProgress());
  const bad = stubStorage(); bad.setItem(MS.STORAGE_KEY, '{oops');
  assert.deepEqual(MS.loadProgress(bad), MS.initialProgress());

  // Every other storage key in the app (maths mastery, review, groove, ...) differs.
  const files = ['index.html'].concat(
    fs.readdirSync(path.join(root, 'src', 'lib')).filter((f) => f.endsWith('.js')).map((f) => 'src/lib/' + f),
    fs.readdirSync(path.join(root, 'src', 'lib', 'music')).filter((f) => f.endsWith('.js') && f !== 'musicianship.js').map((f) => 'src/lib/music/' + f));
  const keys = new Set();
  files.forEach((f) => {
    const src = fs.readFileSync(path.join(root, f), 'latin1');
    for (const m of src.matchAll(/['"](mm[.-][A-Za-z0-9.\-_]+)['"]/g)) keys.add(m[1]);
  });
  assert.ok(keys.size > 3, 'found the other keys');
  keys.forEach((k) => assert.ok(!k.startsWith('mm.musicianship'), k));
  const code = (rel) => read(rel).split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  const lib = code('src/lib/music/musicianship.js') + code('src/components/MusicianshipPath.js');
  assert.doesNotMatch(lib, /mastery|mm-access|mm\.review|mm\.groove|teacherStore|recordAttempt/, 'the path never reads or writes maths records');
});

test('a whole path through the screen saves only the musicianship key', () => {
  let onClick = null;
  const el = { innerHTML: '', addEventListener: (t, fn) => { if (t === 'click') onClick = fn; }, querySelector: () => null, closest: () => null };
  const s = stubStorage();
  const h = PATH.mount(el, { storage: s, seed: 11 });
  const click = (attrs) => onClick({ target: { closest: () => ({ getAttribute: (k) => attrs[k] }) } });
  assert.match(el.innerHTML, /data-act="skip"/, 'skippable');
  click({ 'data-act': 'start' });
  let guard = 0;
  while (h.state.phase === 'item' && guard++ < 20) {
    const it = h.state.items[h.state.i];
    if (it.skill === 'pitch') { click({ 'data-act': 'key', 'data-key': String(it.target) }); click({ 'data-act': 'check' }); }
    else click({ 'data-act': 'opt', 'data-opt': String(it.answer) });
    assert.ok(h.state.result.correct, it.skill);
    click({ 'data-act': 'next' });
  }
  assert.equal(h.state.phase, 'done');
  assert.deepEqual([...s.map.keys()], [MS.STORAGE_KEY]);
  const saved = MS.loadProgress(s);
  assert.equal(saved.paths, 1);
  MS.SKILL_IDS.forEach((id) => assert.deepEqual(saved.skills[id], { tries: 2, correct: 2 }, id));
  assert.match(el.innerHTML, /סיימתם את מסלול המוזיקליות/);
});

test('skip ends the offer without touching storage; pitch needs a key before "בדיקה"', () => {
  const st = PATH.skip(PATH.createState(1));
  assert.equal(st.phase, 'skipped');
  let s = PATH.start(PATH.createState(1));
  while (s.items[s.i].skill !== 'pitch') s = PATH.next(PATH.answer(s, 0));
  const noKey = PATH.answer(s, null);
  assert.equal(noKey.result, null);
  assert.match(noKey.message, /בחרו קודם צליל/);
});

test('render: Hebrew labels, aria on every option group, pitch keys sound on pointerdown', () => {
  let s = PATH.start(PATH.createState(9));
  const seen = new Set();
  for (let i = 0; i < s.items.length; i++) {
    const html = PATH.renderHtml(s);
    const it = s.items[s.i];
    seen.add(it.skill);
    assert.match(html, /role="group" aria-label="[^"]+"/);
    assert.match(html, /aria-live="polite"/);
    if (it.skill === 'pitch') assert.match(html, /data-tap="woodBar" data-hz="261\.63"/);
    if (it.skill === 'rhythm') assert.match(html, /aria-label="תיבה 1: [^"]+"/);
    if (it.skill === 'timbre') assert.doesNotMatch(html, /msp-opt[^>]*data-tap/, 'the choices do not give the answer away');
    s = PATH.next(PATH.answer(s, it.skill === 'pitch' ? it.target : it.answer));
  }
  assert.equal(seen.size, 4);
  assert.equal(PATH.playPlan(PATH.start(PATH.createState(9))).length > 0, true);
});

test('no transfer claim and no buy/price words in the path texts', () => {
  const texts = read('src/lib/music/musicianship.js').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n') +
    read('src/components/MusicianshipPath.js').split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  const html = read('index.html');
  const offers = [...html.matchAll(/<button[^>]*data-msp-offer[^>]*>[^<]*<\/button>/g)].map((m) => m[0]);
  assert.equal(offers.length, 2, 'offered after the remediation plan and after a beat-mode session');
  const all = texts + offers.join('\n');
  assert.doesNotMatch(all, /(משפר|משפרת|מחזק|מחזקת|עוזר|עוזרת|מקדם|מקדמת|מפתח|מפתחת)[^.<'"]{0,40}(חשבון|מתמטיק|ציונ|הישג)/);
  assert.doesNotMatch(all, /(music|musicianship)[^.]{0,30}(improves?|boosts?|helps?|raises?)[^.]{0,30}(math|grades|scores)/i);
  assert.doesNotMatch(all, /(^|[^א-ת])(קנה|קנו|מחיר|רכישה|מנוי|לרכוש|תשלום)([^א-ת]|$)/);
  assert.doesNotMatch(all, /price|purchase|subscri|paywall|checkout/i);
});

test('index.html: path card in the music-games panel, scripts in order, sw caches them', () => {
  assert.match(html(), /<section id="musicGames" [^>]*>[\s\S]*id="mspCard"[\s\S]*<!-- #591 music games end -->/);
  const h = html();
  const at = (src) => h.indexOf('<script src="' + src + '"></script>');
  ['src/lib/instruments.js', 'src/components/jamKit.js', 'src/lib/music/musicianship.js'].forEach((s) => assert.ok(at(s) > 0 && at(s) < at('src/components/MusicianshipPath.js'), s));
  const sw = read('sw.js');
  assert.match(sw, /'\.\/src\/lib\/music\/musicianship\.js'/);
  assert.match(sw, /'\.\/src\/components\/MusicianshipPath\.js'/);
  function html() { return read('index.html'); }
});

test('no topic music way changes: instruments.js TOPICS keep one mechanism each', () => {
  const before = JSON.stringify(INS.TOPICS);
  MS.buildPath(3);
  assert.equal(JSON.stringify(INS.TOPICS), before);
  assert.doesNotMatch(read('src/lib/music/musicianship.js'), /TOPICS\s*\[|mechanism\s*=/);
});
