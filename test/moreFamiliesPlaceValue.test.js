// #665 — PLACE_VALUE above 12: two more instrument families, EXTRA beside tenExchange.
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
const above = banks.allItems().filter((it) => it.standard === banks.ST.PLACE_VALUE && ten.specForItem(it) && ten.specForItem(it).bells > 12);
const familyOf = (voice) => INSTRUMENTS.find((x) => x.voice === voice).family;
const fams = (plan) => new Set(plan.notes.map((x) => x.family));

test('PLACE_VALUE is on, and every number above 12 sounds on two families tenExchange does not play', () => {
  assert.ok(more.TOPICS.includes('PLACE_VALUE'));
  assert.ok(above.length >= 5);
  ['taiko', 'balalaika', 'recorder', 'piano'].forEach((id) => {
    above.forEach((it) => {
      const plan = more.planFor(it, mem(id));
      assert.ok(plan, it.prompt);
      assert.equal(fams(plan).size, 2, it.prompt);
      fams(plan).forEach((f) => assert.ok(!plan.heard.includes(f), f + ' is already heard'));
      assert.ok(new Set(plan.heard.concat([...fams(plan)])).size >= 3);
    });
  });
});

test('tenExchange itself is unchanged: its voices are the ones the plan counts as heard', () => {
  ['taiko', 'piano'].forEach((id) => {
    const it = above[0], s = mem(id);
    const v = ten.voicesFor(ten.specForItem(it), s);
    assert.deepEqual([...new Set(Object.values(v).map(familyOf))].sort(), more.planFor(it, s).heard.slice().sort());
  });
});

test('356: hundreds and tens on the first new family, ones on the second', () => {
  const it = above.find((x) => ten.specForItem(x).bells === 356);
  const plan = more.planFor(it, mem('recorder'));
  assert.equal(plan.notes.filter((x) => x.v === 100).length, 3);
  assert.equal(plan.notes.filter((x) => x.v === 10).length, 5);
  assert.equal(plan.notes.filter((x) => x.v === 1).length, 6);
  plan.notes.forEach((x) => assert.equal(x.family, x.v === 1 ? plan.families[1].family : plan.families[0].family));
});

test('a round number (400, 70): the second family answers the same groups', () => {
  [400, 70].forEach((n) => {
    const plan = more.planFor(above.find((x) => ten.specForItem(x).bells === n), mem('piano'));
    const [a, b] = plan.families.map((f) => plan.notes.filter((x) => x.family === f.family).map((x) => x.v));
    assert.ok(a.length > 0);
    assert.deepEqual(b, a);
  });
});

test('each new family is an instrument of that family', () => {
  const plan = more.planFor(above[0], mem('erhu'));
  plan.families.forEach((f) => assert.equal(instrumentById(f.instrument).family, f.family));
});

test('play sends every note to playVoice in the two new families', () => {
  const heard = [];
  const plan = more.planFor(above[0], mem('taiko'));
  const r = more.play(plan, { audioContext: { currentTime: 0, state: 'running' }, playVoice: (c, v) => heard.push(familyOf(v)) });
  assert.equal(heard.length, plan.notes.length);
  heard.forEach((f) => assert.ok(r.families.includes(f)));
  assert.equal(more.planFor(Object.assign({}, above[0], { noMusic: true }), mem()), null);
});

test('wired: the quiz widget mounts it and the page and offline cache load it', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /<script src="src\/lib\/music\/moreFamilies\.js"><\/script>/);
  assert.match(html, /MM_MORE_FAMILIES\.mount\(host, item\)/);
  assert.match(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), /'\.\/src\/lib\/music\/moreFamilies\.js'/);
});
