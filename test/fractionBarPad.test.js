// #591 proposal 1/5: the FractionBarPad screen (M3 note lengths in a 4/4 bar).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const JAM = require('../src/components/jamKit.js');
const PAD = require('../src/components/FractionBarPad.js');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function tapAll(state, ids) {
  return ids.reduce((s, id) => PAD.tapTile(s, id), state);
}

test('1/2 + 1/4 + 1/4 fills the whole bar and plays the cadence', () => {
  const s = tapAll(PAD.createState(0), ['half', 'quarter', 'quarter']);
  assert.equal(s.status, 'exact');
  assert.equal(s.sound, 'cadence');
  assert.match(s.message, /1\/2 \+ 1\/4 \+ 1\/4 = 1/);
});

test('an overflowing tile is refused, the excess is named and the fill is kept', () => {
  const s = tapAll(PAD.createState(1), ['quarter', 'eighth', 'eighth', 'quarter']);
  assert.equal(s.status, 'exact', 'quarter + 2 eighths = 1/2 already');
  const o = tapAll(PAD.createState(1), ['quarter', 'eighth', 'quarter']);
  assert.equal(o.status, 'over');
  assert.equal(o.over, '1/8');
  assert.match(o.message, /עברת ב־1\/8/);
  assert.deepEqual(o.fill, ['1/4', '1/8'], 'the refused tile is not in the bar');
  assert.equal(o.sound, 'wrong');
  const again = PAD.tapTile(o, 'eighth');
  assert.equal(again.status, 'exact', 'the child can try again at once');
});

test('"בדיקה" on a short fill says what is missing', () => {
  const s = PAD.check(tapAll(PAD.createState(0), ['half', 'quarter']));
  assert.equal(s.status, 'under');
  assert.match(s.message, /חסר 1\/4/);
});

test('a tile that is not allowed in the exercise does nothing', () => {
  const s = PAD.tapTile(PAD.createState(0), 'eighth');
  assert.deepEqual(s.fill, []);
});

test('the three-kinds exercise does not accept a fill of two kinds', () => {
  const s = tapAll(PAD.createState(3), ['half', 'quarter', 'quarter']);
  assert.notEqual(s.status, 'exact');
  const ok = tapAll(PAD.createState(3), ['half', 'quarter', 'eighth', 'eighth']);
  assert.equal(ok.status, 'exact');
});

test('1.75 is 7/4 drawn across bars: one full bar and then 3/4', () => {
  const props = { target: '1.75', allowed: ['quarter'], he: 'מלאו 1.75 — תיבה שלמה ועוד 3/4' };
  let s = PAD.createState(0, true, props);
  const empty = PAD.renderHtml(s, 'drumLow');
  assert.match(empty, /1\.75 = 7\/4/);
  assert.equal((empty.match(/class="fbp-bar(?: done)?"/g) || []).length, 2);
  for (let n = 0; n < 7; n++) s = PAD.tapTile(s, 'quarter');
  assert.equal(s.status, 'exact');
  assert.match(s.message, /התיבות מלאות בדיוק/);
  const html = PAD.renderHtml(s, 'drumLow');
  const bar = (n) => {
    const m = new RegExp('data-bar="' + n + '">([\\s\\S]*?)</div>').exec(html);
    assert.ok(m, 'bar ' + n);
    return m[1];
  };
  const first = bar(0);
  const second = bar(1);
  assert.equal((first.match(/data-seg="/g) || []).length, 4);
  assert.equal((second.match(/data-seg="/g) || []).length, 3);
  assert.doesNotMatch(first, /מחוץ ליעד/);
  assert.match(second, /מחוץ ליעד/);
  assert.match(first, /width:25%/);
});

test('decimal targets read as parts of the bar: 0.75 = 3/4', () => {
  const s = PAD.createState(4);
  assert.match(PAD.renderHtml(s, 'drumLow'), /0\.75 = 3\/4/);
  assert.equal(tapAll(s, ['half', 'quarter']).status, 'exact');
});

test('"נגן תיבה" plays one stroke per tile at 90 BPM with a click on every beat', () => {
  const plan = PAD.barPlan(['1/2', '1/4', '1/4'], 90, 'drumLow');
  const tiles = plan.filter((n) => n.kind === 'tile').map((n) => Math.round(n.at * 1000));
  assert.deepEqual(tiles, [0, 1333, 2000]);
  assert.equal(plan.filter((n) => n.kind === 'click').length, 4);
});

test('with music the tiles sound on pointerdown (data-tap); without music the same exercise is a silent fraction strip', () => {
  const on = PAD.renderHtml(PAD.createState(0, true), 'drumLow');
  assert.match(on, /data-act="tile" data-tile="half" data-tap="drumLow"/);
  assert.match(on, /data-act="play"/);
  assert.match(on, /aria-pressed="true"/);
  const off = PAD.renderHtml(PAD.createState(0, false), 'drumLow');
  assert.doesNotMatch(off, /data-tap/);
  assert.doesNotMatch(off, /data-act="play"/);
  assert.match(off, /רצועת שבר/);
  assert.match(off, /data-act="tile" data-tile="half"/);
  assert.match(off, /data-act="check"/);
  const solved = tapAll(PAD.createState(0, false), ['half', 'half']);
  assert.equal(solved.status, 'exact', 'solvable with the music off (dosage rule 5)');
});

test('mount(): clicks on tiles fill the bar and the switch turns the music off', () => {
  let onClick = null;
  const el = { innerHTML: '', addEventListener: (t, fn) => { if (t === 'click') onClick = fn; }, querySelector: () => null, closest: () => null };
  const store = new Map();
  globalThis.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) };
  try {
    const h = PAD.mount(el);
    const btn = (attrs) => ({ target: { closest: () => ({ getAttribute: (k) => attrs[k] }) } });
    onClick(btn({ 'data-act': 'tile', 'data-tile': 'half' }));
    assert.deepEqual(h.state.fill, ['1/2']);
    assert.match(el.innerHTML, /data-seg="0"/);
    onClick(btn({ 'data-act': 'music' }));
    assert.equal(h.state.showMusic, false);
    assert.equal(store.get(JAM.musicKey('fractionBarPad')), '0');
    assert.doesNotMatch(el.innerHTML, /data-tap/);
  } finally {
    delete globalThis.localStorage;
  }
});

test('index.html has the FractionBarPad card in the music-games panel and its scripts in order', () => {
  assert.match(html, /<section id="musicGames" [^>]*>[\s\S]*id="fbpCard"[\s\S]*<!-- #591 music games end -->/);
  const at = (src) => html.indexOf('<script src="' + src + '"></script>');
  ['src/lib/music/fractionBar.js', 'src/components/FractionBarPad.js'].forEach((s) => assert.ok(at(s) > 0, s + ' is loaded'));
  assert.ok(at('src/components/jamKit.js') < at('src/components/FractionBarPad.js'));
  assert.ok(at('src/lib/music/fractionBar.js') < at('src/components/FractionBarPad.js'));
});
