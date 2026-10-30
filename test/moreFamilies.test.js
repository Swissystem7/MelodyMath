// #665 — SUB20, WORD_REMOVE and PLACE_VALUE above 12: two more instrument
// families, EXTRA beside the topic's own way (takeAwayBeats / tenExchange).
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
const familyOf = (voice) => INSTRUMENTS.find((x) => x.voice === voice).family;
const numberOf = (it) => { const a = ten.specForItem(it); return a.kind === 'takeAway' ? a.start : a.bells; };
const itemsOf = (k) => banks.allItems().filter((it) => it.standard === banks.ST[k] && ten.specForItem(it));
const notesOf = (plan, f) => plan.notes.filter((x) => x.family === f.family).map((x) => x.v);
const CHILDREN = ['taiko', 'balalaika', 'recorder', 'piano', 'erhu'];
// Topic, how many items above 12 the bank must have, round numbers to check.
const TOPICS = [['SUB20', 5, [20]], ['WORD_REMOVE', 3, [30, 90]], ['PLACE_VALUE', 5, [400, 70]]];

TOPICS.forEach(([k, min, rounds]) => {
  const items = itemsOf(k), above = items.filter((it) => numberOf(it) > 12);

  test(k + ': on, and every item above 12 gets two families its way does not play', () => {
    assert.ok(more.TOPICS.includes(k));
    assert.ok(above.length >= min);
    CHILDREN.forEach((id) => above.forEach((it) => {
      const plan = more.planFor(it, mem(id));
      assert.ok(plan, it.prompt);
      const fams = plan.families.map((f) => f.family);
      assert.equal(new Set(fams).size, 2);
      assert.deepEqual([...new Set(plan.notes.map((x) => x.family))].sort(), fams.slice().sort());
      fams.forEach((f) => assert.ok(!plan.heard.includes(f), f + ' is already heard'));
      plan.families.forEach((f) => assert.equal(instrumentById(f.instrument).family, f.family));
    }));
  });

  test(k + ': the way itself is unchanged, its voices are the ones counted as heard', () => {
    ['taiko', 'piano', 'recorder'].forEach((id) => {
      const it = above[0], s = mem(id);
      const v = ten.voicesFor(ten.specForItem(it), s);
      assert.deepEqual([...new Set(Object.values(v).map(familyOf))].sort(), more.planFor(it, s).heard.slice().sort());
    });
  });

  test(k + ': hundreds and tens on the first new family, ones on the second', () => {
    above.filter((it) => numberOf(it) % 10).forEach((it) => {
      const n = numberOf(it), plan = more.planFor(it, mem('balalaika'));
      assert.equal(plan.number, n);
      assert.equal(plan.notes.filter((x) => x.v === 100).length, Math.floor(n / 100));
      assert.equal(plan.notes.filter((x) => x.v === 10).length, Math.floor((n % 100) / 10));
      assert.equal(plan.notes.filter((x) => x.v === 1).length, n % 10);
      plan.notes.forEach((x) => assert.equal(x.family, x.v === 1 ? plan.families[1].family : plan.families[0].family));
    });
  });

  test(k + ': a round number (' + rounds.join(', ') + '): the second family answers the same groups', () => {
    rounds.forEach((n) => {
      const plan = more.planFor(above.find((x) => numberOf(x) === n), mem('piano'));
      const [a, b] = plan.families.map((f) => notesOf(plan, f));
      assert.ok(a.length > 0);
      assert.deepEqual(b, a);
    });
  });

  test(k + ': 12 and below, and no-music items, get nothing', () => {
    items.filter((it) => numberOf(it) <= 12).forEach((it) => assert.equal(more.planFor(it, mem()), null));
    assert.equal(more.planFor(Object.assign({}, above[0], { noMusic: true }), mem()), null);
  });
});

test('a piano child on SUB20: keys and percussion are heard, so strings and winds are added', () => {
  const it = itemsOf('SUB20').find((x) => numberOf(x) > 12);
  assert.deepEqual(more.planFor(it, mem('piano')).families.map((f) => f.family), ['strings', 'winds']);
});

test('the ukulele (fractions only) is never played here, even for a ukulele child', () => {
  TOPICS.forEach(([k]) => itemsOf(k).filter((it) => numberOf(it) > 12).forEach((it) => {
    const plan = more.planFor(it, mem('ukulele'));
    plan.families.forEach((f) => assert.notEqual(f.instrument, 'ukulele'));
  }));
});

test('a topic outside the list gets nothing', () => {
  const other = banks.allItems().find((it) => ten.specForItem(it) && !more.TOPICS.some((k) => it.standard === banks.ST[k]));
  if (other) assert.equal(more.planFor(other, mem()), null);
});

test('play sends every note to playVoice in the two new families', () => {
  const heard = [];
  const plan = more.planFor(itemsOf('PLACE_VALUE').find((x) => numberOf(x) > 12), mem('taiko'));
  const r = more.play(plan, { audioContext: { currentTime: 0, state: 'running' }, playVoice: (c, v) => heard.push(familyOf(v)) });
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
