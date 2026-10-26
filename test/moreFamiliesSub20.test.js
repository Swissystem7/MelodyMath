// #665 — SUB20 above 12: two more instrument families, EXTRA beside takeAwayBeats.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const banks = require('../src/lib/banks.js');
const ten = require('../src/lib/music/takeAwayTen.js');
const more = require('../src/lib/music/moreFamilies.js');
const { instrumentById } = require('../src/lib/instruments.js');
const { KEY } = require('../src/lib/myInstrument.js');

function mem(id) { const m = new Map(id ? [[KEY, id]] : []); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; }
const items = banks.allItems().filter((it) => it.standard === banks.ST.SUB20 && ten.specForItem(it));
const above = items.filter((it) => ten.specForItem(it).start > 12);
const familyOf = (voice) => require('../src/lib/instruments.js').INSTRUMENTS.find((x) => x.voice === voice).family;

test('SUB20 is on, and every item above 12 gets two families its way does not play', () => {
  assert.ok(more.TOPICS.includes('SUB20'));
  assert.ok(above.length >= 5);
  ['taiko', 'balalaika', 'recorder', 'piano'].forEach((id) => {
    above.forEach((it) => {
      const plan = more.planFor(it, mem(id));
      assert.ok(plan, it.prompt);
      const fams = plan.families.map((f) => f.family);
      assert.equal(new Set(fams).size, 2);
      fams.forEach((f) => assert.ok(!plan.heard.includes(f), f + ' is already heard'));
      assert.ok(new Set(plan.heard.concat(fams)).size >= 3);
    });
  });
});

test('the way itself is unchanged: its voices are the ones the plan counts as heard', () => {
  const it = above[0], s = mem('balalaika');
  const v = ten.voicesFor(ten.specForItem(it), s);
  const heard = new Set(Object.values(v).map(familyOf));
  assert.deepEqual([...heard].sort(), more.planFor(it, s).heard.slice().sort());
});

test('tens on the first new family, ones on the second, from the start number', () => {
  const it = above.find((x) => ten.specForItem(x).start % 10) || above[0];
  const n = ten.specForItem(it).start;
  const plan = more.planFor(it, mem('piano'));
  assert.equal(plan.number, n);
  assert.equal(plan.notes.filter((x) => x.v === 10).length, Math.floor(n / 10));
  assert.equal(plan.notes.filter((x) => x.v === 1).length, n % 10);
  plan.notes.forEach((x) => assert.equal(x.family, x.v === 1 ? plan.families[1].family : plan.families[0].family));
});

test('a round start (20 - 6): the second family answers the same tens, so both sound', () => {
  const plan = more.planFor(above.find((x) => ten.specForItem(x).start === 20), mem('taiko'));
  const [a, b] = plan.families.map((f) => plan.notes.filter((x) => x.family === f.family).map((x) => x.v));
  assert.deepEqual(a, [10, 10]);
  assert.deepEqual(b, a);
});

test('a family is played by the child\'s instrument when it is in that family', () => {
  const it = above[0];
  const plan = more.planFor(it, mem('piano'));
  plan.families.forEach((f) => assert.equal(instrumentById(f.instrument).family, f.family));
  // The piano child: keys and percussion are heard, so strings and winds are added.
  assert.deepEqual(plan.families.map((f) => f.family), ['strings', 'winds']);
});

test('12 and below, other topics and no-music items get nothing', () => {
  items.filter((it) => ten.specForItem(it).start <= 12).forEach((it) => assert.equal(more.planFor(it, mem()), null));
  const other = banks.allItems().find((it) => it.standard === banks.ST.WORD_REMOVE && ten.specForItem(it));
  if (!more.TOPICS.includes('WORD_REMOVE')) assert.equal(more.planFor(other, mem()), null);
  assert.equal(more.planFor(Object.assign({}, above[0], { noMusic: true }), mem()), null);
});

test('play sends every note to playVoice in the two new families', () => {
  const heard = [];
  const ac = { currentTime: 0, state: 'running' };
  const plan = more.planFor(above[0], mem('taiko'));
  const r = more.play(plan, { audioContext: ac, playVoice: (c, v) => heard.push(familyOf(v)) });
  assert.equal(r.notes, plan.notes.length);
  assert.equal(heard.length, plan.notes.length);
  heard.forEach((f) => assert.ok(r.families.includes(f)));
});

test('wired: the quiz widget mounts it and the page and offline cache load it', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /<script src="src\/lib\/music\/moreFamilies\.js"><\/script>/);
  assert.match(html, /MM_MORE_FAMILIES\.mount\(host, item\)/);
  assert.match(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/moreFamilies\.js'/);
});
