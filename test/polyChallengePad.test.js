// #683: the polyrhythm challenge screen (M4, optional, grades ה׳-ו׳), Refs #665.
const test = require('node:test');
const assert = require('node:assert/strict');
const PAD = require('../src/components/PolyChallengePad.js');
const read = (f) => require('node:fs').readFileSync(require('node:path').join(__dirname, '..', f), 'utf8');

test('shown in grades ה׳-ו׳ only, as an optional extra, with voices in colour and shuffled reasons', () => {
  ['א', 'ב', 'ג', 'ד', null].forEach((g) => assert.equal(PAD.renderHtml(PAD.createState({ grade: g })), '', String(g)));
  const s = PAD.createState({ grade: 'ה', rand: () => 0 });
  const out = PAD.renderHtml(s);
  assert.match(out, /אתגר רשות[\s\S]*M2[\s\S]*2:3/);
  s.lvl.voices.forEach((v) => assert.ok(out.includes(v.colour), v.name));
  s.lvl.reason.choices.forEach((c, k) => assert.ok(out.includes('data-k="' + k + '">' + c), c));
  assert.notEqual(s.lvl.reason.answer, 0);
});

test('reason, then a check with no music, then the next level', () => {
  let s = PAD.createState({ grade: 'ו', rand: () => 0 });
  s = PAD.pickReason(s, (s.lvl.reason.answer + 1) % 3);
  assert.deepEqual([s.stage, s.status], ['reason', 'retry']);
  s = PAD.pickReason(s, s.lvl.reason.answer);
  assert.equal(s.stage, 'check');
  assert.match(PAD.renderHtml(s), /^(?![\s\S]*(data-act="play"|data-beat))[\s\S]*בדיקה בלי מוזיקה/, 'no music in the check');
  assert.equal(PAD.answerCheck(s, 5).stage, 'check');
  s = PAD.next(PAD.answerCheck(s, '6'));
  assert.deepEqual([s.lvl.id, s.stage], ['3:4', 'reason']);
});

test("two families: the child's instrument, then keys; all voices land on the meeting beat", () => {
  const s = PAD.createState({ grade: 'ה', instrument: 'darbuka' });
  const voices = PAD.voicesFor(s);
  assert.ok(voices[1] === 'keys' && voices[0] !== 'keys');
  const plan = PAD.playPlan(s.lvl, voices);
  assert.ok(plan.filter((n) => n.beat === 6).length === 2 && plan.filter((n) => n.meet).length === 2);
  assert.equal(plan.filter((n) => n.voice === 'keys').length, 3, 'beats 0, 3, 6');
});

test('mount(): hidden in grade ג׳, shown and answerable in grade ה׳', () => {
  let onClick = null;
  const el = { innerHTML: '', addEventListener: (t, fn) => { onClick = fn; }, querySelector: () => null };
  const store = new Map([['mm-grade', 'ג']]);
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) };
  try {
    assert.equal((PAD.mount(el), el.hidden), true);
    store.set('mm-grade', 'ה');
    const h = PAD.mount(el);
    assert.equal(el.hidden, false);
    onClick({ target: { closest: () => ({ getAttribute: (k) => ({ 'data-act': 'reason', 'data-k': String(h.state.lvl.reason.answer) })[k] }) } });
    assert.equal(h.state.stage, 'check');
  } finally {
    delete globalThis.localStorage;
  }
});

test('index.html has the card in the music-games panel and sw.js precaches the screen', () => {
  const html = read('index.html');
  assert.match(html, /<section id="musicGames" [^>]*>[\s\S]*id="pcCard"[\s\S]*<!-- #591 music games end -->/);
  const at = (src) => html.indexOf('<script src="' + src + '"></script>');
  ['src/lib/polyChallenge.js', 'src/components/jamKit.js'].forEach((s) => assert.ok(at(s) > 0 && at(s) < at('src/components/PolyChallengePad.js'), s));
  assert.ok(read('sw.js').includes("'./src/components/PolyChallengePad.js'"));
});
