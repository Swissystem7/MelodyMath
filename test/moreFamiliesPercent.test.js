// #665 — PERCENT above 12: two more instrument families, EXTRA beside percentBar.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const banks = require('../src/lib/banks.js');
const pm = require('../src/lib/music/percentMix.js');
const more = require('../src/lib/music/moreFamilies.js');
const { instrumentById, INSTRUMENTS } = require('../src/lib/instruments.js');
const { KEY } = require('../src/lib/myInstrument.js');

function mem(id) { const m = new Map(id ? [[KEY, id]] : []); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; }
const items = banks.allItems().filter((it) => it.standard === banks.ST.PERCENT && pm.specForItem(it));
const above = items.filter((it) => pm.specForItem(it).percent > 12);
const familyOf = (voice) => INSTRUMENTS.find((x) => x.voice === voice).family;
const fams = (plan) => new Set(plan.notes.map((x) => x.family));
const byPercent = (p) => above.find((x) => pm.specForItem(x).percent === p);

test('PERCENT is on, and every item above 12% sounds on two families percentBar does not play', () => {
  assert.ok(more.TOPICS.includes('PERCENT'));
  assert.ok(above.length >= 3);
  ['taiko', 'balalaika', 'recorder', 'piano'].forEach((id) => {
    above.forEach((it) => {
      const plan = more.planFor(it, mem(id));
      assert.ok(plan, it.prompt);
      assert.deepEqual(plan.heard, ['percussion']);
      assert.equal(fams(plan).size, 2, it.prompt);
      assert.ok(!fams(plan).has('percussion'));
    });
  });
});

test('percentBar itself is unchanged: one drumLow circle per beat', () => {
  const s = pm.specForItem(byPercent(25));
  assert.deepEqual([...new Set(pm.soundsOf(s).map((n) => n.voice))], ['drumLow']);
  assert.equal(pm.soundsOf(s).length, s.circles);
});

test('the child\'s own instrument plays the first new family when the bar does not use it', () => {
  const plan = more.planFor(byPercent(25), mem('piano'));
  assert.equal(plan.families[0].instrument, 'piano');
  assert.equal(more.planFor(byPercent(25), mem('ney')).families[0].instrument, 'ney');
  plan.families.forEach((f) => assert.equal(instrumentById(f.instrument).family, f.family));
});

test('25%: two tens on the first new family, five ones on the second', () => {
  const plan = more.planFor(byPercent(25), mem('taiko'));
  assert.equal(plan.number, 25);
  assert.equal(plan.notes.filter((x) => x.v === 10).length, 2);
  assert.equal(plan.notes.filter((x) => x.v === 1).length, 5);
  plan.notes.forEach((x) => assert.equal(x.family, x.v === 1 ? plan.families[1].family : plan.families[0].family));
});

test('a round percent (50%, 100%): the second family answers the same groups', () => {
  [50, 100].forEach((p) => {
    const plan = more.planFor(byPercent(p), mem('recorder'));
    const [a, b] = plan.families.map((f) => plan.notes.filter((x) => x.family === f.family).map((x) => x.v));
    assert.ok(a.length > 0);
    assert.deepEqual(b, a);
  });
});

test('10% and no-music items get nothing; play routes every note', () => {
  items.filter((it) => pm.specForItem(it).percent <= 12).forEach((it) => assert.equal(more.planFor(it, mem()), null));
  assert.equal(more.planFor(Object.assign({}, above[0], { noMusic: true }), mem()), null);
  const heard = [];
  const plan = more.planFor(byPercent(25), mem('taiko'));
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
