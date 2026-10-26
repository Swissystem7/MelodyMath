// #665 — WORD_REMOVE above 12: two more instrument families, EXTRA beside takeAwayBeats.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const banks = require('../src/lib/banks.js');
const ten = require('../src/lib/music/takeAwayTen.js');
const more = require('../src/lib/music/moreFamilies.js');
const { instrumentById, INSTRUMENTS } = require('../src/lib/instruments.js');
const { KEY } = require('../src/lib/myInstrument.js');

function mem(id) { const m = new Map(id ? [[KEY, id]] : []); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; }
const items = banks.allItems().filter((it) => it.standard === banks.ST.WORD_REMOVE && ten.specForItem(it));
const above = items.filter((it) => ten.specForItem(it).start > 12);
const familyOf = (voice) => INSTRUMENTS.find((x) => x.voice === voice).family;

test('WORD_REMOVE is on, and every story above 12 gets two families its way does not play', () => {
  assert.ok(more.TOPICS.includes('WORD_REMOVE'));
  assert.ok(above.length >= 3);
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
  const it = above[0], s = mem('recorder');
  const v = ten.voicesFor(ten.specForItem(it), s);
  assert.deepEqual([...new Set(Object.values(v).map(familyOf))].sort(), more.planFor(it, s).heard.slice().sort());
});

test('the whole group of the story: tens on the first new family, ones on the second', () => {
  above.forEach((it) => {
    const n = ten.specForItem(it).start;
    const plan = more.planFor(it, mem('balalaika'));
    assert.equal(plan.number, n);
    assert.equal(plan.notes.filter((x) => x.v === 10).length, Math.floor(n / 10));
    assert.equal(plan.notes.filter((x) => x.v === 1).length, n % 10);
    plan.notes.forEach((x) => assert.equal(x.family, x.v === 1 ? plan.families[1].family : plan.families[0].family));
  });
});

test('each new family is an instrument of that family; a strings child adds winds and keys', () => {
  const plan = more.planFor(above[0], mem('balalaika'));
  plan.families.forEach((f) => assert.equal(instrumentById(f.instrument).family, f.family));
  assert.deepEqual(plan.families.map((f) => f.family), ['winds', 'keys']);
});

test('stories of 12 and below, and no-music items, get nothing', () => {
  items.filter((it) => ten.specForItem(it).start <= 12).forEach((it) => assert.equal(more.planFor(it, mem()), null));
  assert.equal(more.planFor(Object.assign({}, above[0], { noMusic: true }), mem()), null);
});

test('play sends every note to playVoice in the two new families', () => {
  const heard = [];
  const plan = more.planFor(above[0], mem('taiko'));
  const r = more.play(plan, { audioContext: { currentTime: 0, state: 'running' }, playVoice: (c, v) => heard.push(familyOf(v)) });
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
