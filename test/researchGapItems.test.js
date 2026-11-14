'use strict';
// The items the per-topic research (docs/research/topics/README.md) found the
// bank was missing: one per misconception, appended last so no id moved.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');

const gap = banks.allItems().filter((it) => it.research === 'gap-2026-11-14');
const by = (re) => gap.find((it) => re.test(it.prompt));

test('seventeen gap items, each in its grade and standard, appended after everything else', () => {
  assert.equal(gap.length, 17);
  const ids = gap.map((it) => +it.id.split('-').pop());
  const others = banks.allItems().filter((it) => it.research !== 'gap-2026-11-14').map((it) => +it.id.split('-').pop());
  assert.ok(Math.min(...ids) > Math.max(...others));
  assert.deepEqual([...new Set(gap.map((it) => it.grade))].sort(), ['א', 'ב', 'ג', 'ד', 'ה', 'ו']);
  gap.forEach((it) => assert.ok(it.hint && it.standard, it.prompt));
});

test('every answer is right, worked out here and not copied', () => {
  assert.equal(by(/^3 \+ 4 = ☐ \+ 5$/).answer, 3 + 4 - 5, 'an operation on both sides (McNeil & Alibali 2005)');
  assert.equal(by(/^6 \+ 2 = 5 \+ ☐$/).answer, 6 + 2 - 5);
  assert.equal(by(/ההפרש בין 13 ל־7/).answer, 13 - 7, 'subtraction as a difference, not only take-away');
  assert.equal(by(/חסר מ־8 עד 13/).answer, 13 - 8);
  assert.equal(by(/כמה צלילים יש ביחידה שחוזרת/).answer, ['🥁', '🥁', '🔔'].length, 'the repeating unit, not "what comes next"');
  assert.equal(by(/האם 0 הוא מספר זוגי/).answer, 0 % 2 === 0 ? 'כן' : 'לא');
  assert.equal(by(/^7 \+ 9/).answer, (7 + 9) % 2 === 0 ? 'זוגי' : 'אי-זוגי');
  const beat = (n, m) => ((n - 1) % m) + 1;   // counted from 1, as musicians count
  assert.equal(by(/פעמה 14/).answer, beat(14, 4));
  assert.equal(by(/פעמה 16/).answer, beat(16, 4), 'remainder 0 is the last beat of the bar, not beat 0');
  assert.equal(by(/כל ריבוע הוא מלבן/).answer, 'כן', 'inclusion: a square has four right angles');
  assert.equal(by(/כל מלבן הוא ריבוע/).answer, 'לא');
  assert.ok(1 / 3 + 1 / 4 !== 2 / 7 && by(/1\/3 \+ 1\/4 = 2\/7/).answer === 'לא');
  assert.equal(by(/0\.125 או 0\.5/).answer, Math.max(0.125, 0.5), 'more digits is not bigger');
  const isPrime = (n) => n > 1 && Array.from({ length: Math.floor(Math.sqrt(n)) - 1 }, (_, i) => i + 2).every((d) => n % d);
  assert.equal(by(/האם 97/).answer, isPrime(97) ? 'כן' : 'לא', 'a prime need not be small');
  const scores = [7, 8, 8, 9, 9, 10], counts = {};
  scores.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
  const top = Math.max(...Object.values(counts));
  assert.equal(by(/כמה שכיחים יש/).answer, Object.values(counts).filter((c) => c === top).length, 'a set may have two modes');
  assert.equal(by(/80 BPM עלה ב־25%/).answer, (100 - 80) / 100 * 100, 'back down is measured from the new base: 20%, not 25%');
  assert.equal(by(/מ־40 ל־100/).answer, (100 - 40) / 40 * 100, 'a change can be more than 100%');
});
