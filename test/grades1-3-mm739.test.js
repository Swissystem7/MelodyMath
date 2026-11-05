// MM-739 (stream B): grade ג׳ shekels and agorot (mm-cur-29) from 8 to 12
// items, and grade ב׳ division (mm-cur-16) from 2 to 6 challenge items (gaps
// G2 and G9 in docs/MM-700/curriculum-gaps.md, PR #951). Official side via
// MM-501 (PR #949) and curriculum.js. Items: grade3.js / grade2.js lateItems.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const cur = require('../src/lib/curriculum');
const g2 = require('../src/lib/curriculum/grade2');
const g3 = require('../src/lib/curriculum/grade3');
const { countWords } = require('../src/lib/exercises/patternAndWorkedExample.js');

const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const leaks = (text, answer) => new RegExp('(^|[^0-9])' + escape(answer) + '([^0-9]|$)').test(String(text || ''));
const levels = (id) => {
  const c = { 1: 0, 2: 0, 3: 0 };
  cur.itemsForTopic(id, banks.allItems()).forEach((it) => { c[it.level] += 1; });
  return c;
};
const late = [...g3.lateItems.map((x) => [g3, x]), ...g2.lateItems.map((x) => [g2, x])]
  .filter(([, x]) => x[6].key >= 73901 && x[6].key <= 73908);

test('mm-cur-29 reaches 12 items with every level present; mm-cur-16 has 6 challenge items', () => {
  assert.equal(late.length, 8);
  const a = levels('mm-cur-29');
  assert.equal(a[1] + a[2] + a[3], 12);
  assert.ok(Math.min(a[1], a[2], a[3]) >= 4, JSON.stringify(a));
  assert.equal(levels('mm-cur-16')[3], 6);
});

test('the new items ship on verified rows with the one primary music way of their standard', () => {
  late.forEach(([g, x]) => {
    const it = banks.allItems().find((i) => i.id === g.grade + '-' + x[0] + '-' + x[6].key);
    assert.ok(it && banks.isShippable(it), String(x[6].key));
    assert.ok(cur.sectionForItem(it).verified, it.id);
    assert.equal(it.music, banks.primaryWays(g.music[x[5]])[0][0], it.id);
    if (x[0] === 'division') assert.ok([2, 4, 5, 10].includes(it.table), it.id + ' keeps grade ב׳ table gating');
  });
});

test('answers are right and not given away by prompt, hint or music way', () => {
  const ans = Object.fromEntries(late.map(([, x]) => [x[6].key, x[2]]));
  assert.equal(ans[73901], 3 * 100);
  assert.equal(ans[73902], (50 + 50 + 100) / 100);
  assert.equal(ans[73903], 1000 - 450);
  assert.equal(ans[73904], 3 * 250);
  assert.equal(ans[73905], 90 / 10);
  assert.equal(ans[73906], 35 / 5);
  assert.equal(ans[73907], 8 * 5);
  assert.equal(ans[73908], (70 + 30) / 5);
  late.forEach(([g, x]) => {
    const [, prompt, answer, hint, , st, { key }] = x;
    assert.ok(!leaks(prompt, answer) && !leaks(hint, answer), String(key));
    g.music[st].forEach((w) => assert.ok(!leaks(w[1], answer), key + ' ' + w[0]));
    assert.ok(countWords(prompt) <= 15 && countWords(hint) <= 15, String(key));
  });
});
