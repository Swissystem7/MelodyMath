// MM-735 (stream B): «איך חשבת?» strategy items for mm-cur-3 — make ten and
// back to ten across a ten (gap G5 in docs/MM-700/curriculum-gaps.md, PR
// #951). Official side: Newprogramgrade1.pdf p. 6 via MM-501 (PR #949).
// Items: curriculum/grade1.js lateItems, shipped by the banks.js hook.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const cur = require('../src/lib/curriculum');
const g1 = require('../src/lib/curriculum/grade1');
const { countWords } = require('../src/lib/exercises/patternAndWorkedExample.js');

const KEYS = Array.from({ length: 8 }, (_, i) => 73501 + i);
const late = g1.lateItems.filter((x) => KEYS.includes((x[6] || {}).key));
const shipped = banks.allItems().filter((it) => it.grade === 'א' && KEYS.includes(+it.id.split('-').pop()));
const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const leaks = (text, answer) => new RegExp('(^|[^0-9])' + escape(answer) + '([^0-9]|$)').test(String(text || ''));

test('at least 8 strategy items ship on mm-cur-3, at every level, addition and subtraction', () => {
  assert.equal(late.length, 8);
  assert.equal(shipped.length, 8);
  const strategy = cur.itemsForTopic('mm-cur-3', banks.allItems()).filter((it) => (it.tags || []).includes('strategy'));
  assert.equal(strategy.length, 8);
  [1, 2, 3].forEach((lv) => assert.ok(strategy.some((it) => it.level === lv), 'level ' + lv));
  ['addition', 'subtraction'].forEach((s) => assert.ok(strategy.some((it) => it.skill === s), s));
  shipped.forEach((it) => {
    assert.ok(banks.isShippable(it), it.id);
    assert.ok(cur.sectionForItem(it).verified, it.id);
    assert.match(cur.sectionForItem(it).url, /Newprogramgrade1\.pdf$/);
    assert.match(it.prompt, /^איך חשבת /, it.id);
  });
});

test('every answer is the asked number of a split across ten', () => {
  const parse = (p) => /^איך חשבת (\d+) ([+−]) (\d+)\?/.exec(p).slice(1);
  const by = (k) => late.find((x) => x[6].key === k);
  const toTen = (a) => 10 - a; // make ten
  const [a1, , b1] = parse(by(73501)[1]).map(Number);
  assert.equal(by(73501)[2], toTen(a1));
  const [a2, , b2] = parse(by(73502)[1]).map(Number);
  assert.equal(by(73502)[2], b2 - toTen(a2));
  const [a3, , b3] = parse(by(73503)[1]).map(Number);
  assert.equal(by(73503)[2], b3 - toTen(a3));
  assert.match(by(73504)[1], /^איך חשבת שמונה ועוד שבע\?/);
  assert.equal(by(73504)[2], 8 + 7);
  const [a5, , b5] = parse(by(73505)[1]).map(Number);
  assert.equal(by(73505)[2], toTen(Math.max(a5, b5)));
  const [a6] = parse(by(73506)[1]).map(Number);
  assert.equal(by(73506)[2], a6 - 10);
  const [a7, , b7] = parse(by(73507)[1]).map(Number);
  assert.equal(by(73507)[2], b7 - (a7 - 10));
  assert.match(by(73508)[1], /^איך חשבת שתים־עשרה פחות חמש\?/);
  assert.equal(by(73508)[2], 12 - 5);
  assert.ok(b1 > toTen(a1) && b3 > toTen(a3), 'the sums cross ten');
});

test('no strategy item gives its answer away; prompts and hints fit the card', () => {
  late.forEach(([, prompt, answer, hint, , st, { key }]) => {
    assert.ok(!leaks(prompt, answer), key + ' prompt');
    assert.ok(!leaks(hint, answer), key + ' hint');
    g1.music[st].forEach((w) => assert.ok(!leaks(w[1], answer), key + ' ' + w[0]));
    assert.ok(countWords(prompt) <= 15 && countWords(hint) <= 15, String(key));
  });
});

test('music: the standard\'s one primary way (M1), with tenThenMore as the make-ten extra', () => {
  assert.deepEqual(banks.primaryWays(g1.music.ADD20).map(([t]) => t), ['callResponse']);
  assert.deepEqual(banks.primaryWays(g1.music.SUB20).map(([t]) => t), ['takeAwayBeats']);
  shipped.forEach((it) => {
    assert.equal(it.music, it.standard === banks.ST.ADD20 ? 'callResponse' : 'takeAwayBeats', it.id);
    assert.equal(banks.mechanismOf(it.music), 'M1', it.id);
    assert.ok(!it.hear, it.id);
    if (it.skill === 'addition') assert.ok(it.musicExtra.some((x) => x.music === 'tenThenMore'), it.id);
  });
});

test('topic practice keeps each strategy prompt as written (variety.js finds nothing to retune)', () => {
  const V = require('../src/lib/exercises/variety.js');
  shipped.forEach((it) => {
    for (let seed = 0; seed < 90; seed += 7) {
      for (let r = 0; r < 6; r++) {
        const m = V.generateVariant(Object.assign({}, it, { topicId: 'mm-cur-3' }), r, { seed, rounds: 6 });
        assert.ok(!m || (m.prompt === it.prompt && m.answer === it.answer), it.id + ' seed ' + seed + ' round ' + r);
      }
    }
  });
});
