// MM-736 (stream B): open quantity estimation in grade א׳ (mm-cur-1) —
// «בערך כמה?», any answer within a range is right (gap G7 in
// docs/MM-700/curriculum-gaps.md, PR #951). Official side:
// Newprogramgrade1.pdf p. 2 via MM-501 (PR #949). The range check is
// adaptive.js isWithinTolerance, which index.html answerOk already uses for
// any item with `tolerance`; this extends its tests to the estimation items.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const cur = require('../src/lib/curriculum');
const adaptive = require('../src/lib/adaptive');
const g1 = require('../src/lib/curriculum/grade1');
const { countWords } = require('../src/lib/exercises/patternAndWorkedExample.js');

const KEYS = Array.from({ length: 6 }, (_, i) => 73601 + i);
const late = g1.lateItems.filter((x) => KEYS.includes((x[6] || {}).key));
const shipped = banks.allItems().filter((it) => it.grade === 'א' && KEYS.includes(+it.id.split('-').pop()));
const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const leaks = (text, answer) => new RegExp('(^|[^0-9])' + escape(answer) + '([^0-9]|$)').test(String(text || ''));
const shown = (prompt) => [...prompt.matchAll(/\p{Extended_Pictographic}/gu)].length;

test('6 estimation items ship on the verified counting row, 2 per level, each with a range', () => {
  assert.equal(late.length, 6);
  assert.equal(shipped.length, 6);
  [1, 2, 3].forEach((lv) => assert.equal(shipped.filter((it) => it.level === lv).length, 2, 'level ' + lv));
  shipped.forEach((it) => {
    assert.ok(banks.isShippable(it), it.id);
    assert.ok((it.tags || []).includes('estimate'), it.id);
    assert.ok(it.tolerance > 0 && it.tolerance <= Math.ceil(it.answer / 4), it.id + ' a range, not "anything goes"');
    assert.ok(cur.itemsForTopic('mm-cur-1', banks.allItems()).includes(it), it.id);
    assert.match(cur.sectionForItem(it).url, /Newprogramgrade1\.pdf$/);
  });
});

test('the answer is the true number of instruments shown, and no digit gives it away', () => {
  late.forEach(([, prompt, answer, hint, , st, { key }]) => {
    assert.equal(shown(prompt), answer, String(key));
    assert.doesNotMatch(prompt, /\d/, key + ': no digits in the prompt');
    assert.ok(!leaks(hint, answer), key + ' hint');
    g1.music[st].forEach((w) => assert.ok(!leaks(w[1], answer), key + ' ' + w[0]));
    assert.ok(countWords(prompt) <= 15 && countWords(hint) <= 15, String(key));
  });
});

test('range answers: inside the range is right, outside is wrong (adaptive.isWithinTolerance)', () => {
  shipped.forEach((it) => {
    const a = it.answer, t = it.tolerance;
    [a, a - t, a + t, a + 1].forEach((g) => assert.equal(adaptive.isWithinTolerance(String(g), a, t), true, it.id + ' ' + g));
    [a - t - 1, a + t + 1, 0].forEach((g) => assert.equal(adaptive.isWithinTolerance(String(g), a, t), false, it.id + ' ' + g));
    assert.equal(adaptive.isWithinTolerance('בערך ' + a, a, t), false, 'only a number counts');
  });
});

test('one music way: GROUP10 tenBeatBars (M2), no counted-beats cue', () => {
  assert.deepEqual(banks.primaryWays(g1.music.GROUP10).map(([t]) => t)[0], 'tenBeatBars');
  shipped.forEach((it) => {
    assert.equal(banks.mechanismOf(it.music), 'M2', it.id);
    assert.ok(!it.hear, it.id);
  });
});
