// MelodyMath — 15-word card limit as a shrink-only ratchet (Refs #892, Refs #665).
// FROZEN_DEBT: measured debt 30.10.2026 after fixing א-measurement-736 — 108 entries
// (103 prompts + 5 hints). It may only shrink (see tests a/b/c below).
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const { countWords } = require('../src/lib/exercises/patternAndWorkedExample.js');

const LIMIT = 15;
const FROZEN_DEBT = [
  { id: 'ב-word_problems-268', field: 'prompt', words: 18 },
  { id: 'ב-subtraction-489', field: 'hint', words: 17 },
  { id: 'ב-subtraction-492', field: 'hint', words: 17 },
  { id: 'ב-place_value-515', field: 'prompt', words: 18 },
  { id: 'ב-data-767', field: 'prompt', words: 19 },
  { id: 'ב-data-768', field: 'prompt', words: 22 },
  { id: 'ב-measurement-849', field: 'prompt', words: 17 },
  { id: 'ב-measurement-851', field: 'prompt', words: 20 },
  { id: 'ב-measurement-1061', field: 'prompt', words: 16 },
  { id: 'ב-measurement-1062', field: 'prompt', words: 20 },
  { id: 'ב-measurement-1063', field: 'prompt', words: 18 },
  { id: 'ב-measurement-1064', field: 'prompt', words: 19 },
  { id: 'ב-measurement-1208', field: 'prompt', words: 17 },
  { id: 'ב-subtraction-1280', field: 'hint', words: 17 },
  { id: 'ב-subtraction-1281', field: 'hint', words: 17 },
  { id: 'ב-subtraction-1282', field: 'hint', words: 17 },
  { id: 'ג-multiplication-530', field: 'prompt', words: 16 },
  { id: 'ג-division-536', field: 'prompt', words: 17 },
  { id: 'ג-division-537', field: 'prompt', words: 17 },
  { id: 'ג-division-538', field: 'prompt', words: 17 },
  { id: 'ג-division-539', field: 'prompt', words: 17 },
  { id: 'ג-division-540', field: 'prompt', words: 17 },
  { id: 'ג-division-541', field: 'prompt', words: 17 },
  { id: 'ג-division-542', field: 'prompt', words: 17 },
  { id: 'ג-division-543', field: 'prompt', words: 17 },
  { id: 'ג-division-544', field: 'prompt', words: 17 },
  { id: 'ג-division-545', field: 'prompt', words: 17 },
  { id: 'ג-place_value-573', field: 'prompt', words: 16 },
  { id: 'ג-multiplication-693', field: 'prompt', words: 16 },
  { id: 'ג-multiplication-694', field: 'prompt', words: 16 },
  { id: 'ג-multiplication-695', field: 'prompt', words: 16 },
  { id: 'ג-multiplication-696', field: 'prompt', words: 16 },
  { id: 'ג-multiplication-697', field: 'prompt', words: 16 },
  { id: 'ג-multiplication-698', field: 'prompt', words: 16 },
  { id: 'ג-multiplication-699', field: 'prompt', words: 16 },
  { id: 'ג-multiplication-700', field: 'prompt', words: 16 },
  { id: 'ג-division-701', field: 'prompt', words: 23 },
  { id: 'ג-division-702', field: 'prompt', words: 23 },
  { id: 'ג-division-703', field: 'prompt', words: 23 },
  { id: 'ג-division-704', field: 'prompt', words: 23 },
  { id: 'ג-division-705', field: 'prompt', words: 23 },
  { id: 'ג-measurement-751', field: 'prompt', words: 17 },
  { id: 'ג-word_problems-799', field: 'prompt', words: 16 },
  { id: 'ג-word_problems-1198', field: 'prompt', words: 16 },
  { id: 'ג-word_problems-1201', field: 'prompt', words: 16 },
  { id: 'ג-word_problems-1202', field: 'prompt', words: 18 },
  { id: 'ג-data-1277', field: 'prompt', words: 19 },
  { id: 'ג-data-1279', field: 'prompt', words: 20 },
  { id: 'ד-multiplication-900', field: 'prompt', words: 17 },
  { id: 'ד-fractions-912', field: 'prompt', words: 16 },
  { id: 'ד-measurement-930', field: 'prompt', words: 18 },
  { id: 'ד-data-933', field: 'prompt', words: 21 },
  { id: 'ד-data-934', field: 'prompt', words: 21 },
  { id: 'ד-data-935', field: 'prompt', words: 19 },
  { id: 'ד-data-945', field: 'prompt', words: 16 },
  { id: 'ד-measurement-1248', field: 'prompt', words: 17 },
  { id: 'ד-measurement-1250', field: 'prompt', words: 20 },
  { id: 'ה-fractions-611', field: 'prompt', words: 18 },
  { id: 'ה-fractions-612', field: 'prompt', words: 16 },
  { id: 'ה-fractions-613', field: 'prompt', words: 16 },
  { id: 'ה-fractions-614', field: 'prompt', words: 16 },
  { id: 'ה-fractions-617', field: 'prompt', words: 19 },
  { id: 'ה-fractions-618', field: 'prompt', words: 19 },
  { id: 'ה-fractions-619', field: 'prompt', words: 19 },
  { id: 'ה-data-635', field: 'prompt', words: 17 },
  { id: 'ה-fractions-809', field: 'prompt', words: 16 },
  { id: 'ה-place_value-954', field: 'prompt', words: 16 },
  { id: 'ה-division-987', field: 'prompt', words: 21 },
  { id: 'ה-fractions-989', field: 'prompt', words: 17 },
  { id: 'ה-fractions-990', field: 'prompt', words: 16 },
  { id: 'ה-fractions-992', field: 'prompt', words: 16 },
  { id: 'ה-fractions-995', field: 'prompt', words: 18 },
  { id: 'ה-fractions-1000', field: 'prompt', words: 20 },
  { id: 'ה-decimals-1018', field: 'prompt', words: 16 },
  { id: 'ה-geometry-1025', field: 'prompt', words: 16 },
  { id: 'ה-geometry-1029', field: 'prompt', words: 17 },
  { id: 'ה-geometry-1032', field: 'prompt', words: 22 },
  { id: 'ה-data-1041', field: 'prompt', words: 21 },
  { id: 'ה-data-1043', field: 'prompt', words: 21 },
  { id: 'ה-data-1044', field: 'prompt', words: 25 },
  { id: 'ה-data-1045', field: 'prompt', words: 16 },
  { id: 'ה-data-1046', field: 'prompt', words: 19 },
  { id: 'ה-data-1050', field: 'prompt', words: 17 },
  { id: 'ו-division-1082', field: 'prompt', words: 19 },
  { id: 'ו-division-1083', field: 'prompt', words: 22 },
  { id: 'ו-multiplication-1089', field: 'prompt', words: 19 },
  { id: 'ו-decimals-1120', field: 'prompt', words: 16 },
  { id: 'ו-decimals-1125', field: 'prompt', words: 20 },
  { id: 'ו-percent-1137', field: 'prompt', words: 20 },
  { id: 'ו-percent-1141', field: 'prompt', words: 21 },
  { id: 'ו-geometry-1148', field: 'prompt', words: 19 },
  { id: 'ו-geometry-1155', field: 'prompt', words: 21 },
  { id: 'ו-geometry-1156', field: 'prompt', words: 16 },
  { id: 'ו-geometry-1157', field: 'prompt', words: 26 },
  { id: 'ו-geometry-1158', field: 'prompt', words: 22 },
  { id: 'ו-geometry-1159', field: 'prompt', words: 17 },
  { id: 'ו-geometry-1160', field: 'prompt', words: 18 },
  { id: 'ו-geometry-1161', field: 'prompt', words: 16 },
  { id: 'ו-geometry-1162', field: 'prompt', words: 16 },
  { id: 'ו-geometry-1163', field: 'prompt', words: 19 },
  { id: 'ו-geometry-1164', field: 'prompt', words: 20 },
  { id: 'ו-geometry-1165', field: 'prompt', words: 19 },
  { id: 'ו-geometry-1166', field: 'prompt', words: 19 },
  { id: 'ו-measurement-1176', field: 'prompt', words: 17 },
  { id: 'ו-data-1186', field: 'prompt', words: 17 },
  { id: 'ו-data-1189', field: 'prompt', words: 21 },
  { id: 'ו-data-1195', field: 'prompt', words: 16 },
  { id: 'ו-data-1197', field: 'prompt', words: 18 },
];

function violations() {
  const out = [];
  banks.GRADES.forEach((g) => {
    banks.itemsForGrade(g).forEach((it) => {
      ['prompt', 'hint'].forEach((field) => {
        const words = countWords(it[field] || '');
        if (words > LIMIT) out.push({ id: it.id, field, words });
      });
    });
  });
  return out;
}
function byId() { return new Map(banks.allItems().map((it) => [it.id, it])); }
const keyOf = (v) => v.id + '|' + v.field;

test('card word limit: no new item exceeds 15 words in prompt or hint (#665)', () => {
  const frozen = new Set(FROZEN_DEBT.map(keyOf));
  const fresh = violations().filter((v) => !frozen.has(keyOf(v)));
  assert.deepEqual(fresh, [], 'new over-limit items (shorten to <=15 words): '
    + fresh.map((v) => v.id + ' ' + v.field + '=' + v.words).join(', '));
});

test('card word limit: frozen debt may only shrink, never grow (#665)', () => {
  const now = new Map(violations().map((v) => [keyOf(v), v.words]));
  const grown = FROZEN_DEBT.filter((f) => now.has(keyOf(f)) && now.get(keyOf(f)) > f.words);
  assert.deepEqual(grown, [], 'debt items grew beyond their frozen count: '
    + grown.map((f) => f.id + ' ' + f.field + ' ' + f.words + '->' + now.get(keyOf(f))).join(', '));
});

test('card word limit: frozen list has no stale entries (#665)', () => {
  const items = byId();
  const stale = [];
  FROZEN_DEBT.forEach((f) => {
    const it = items.get(f.id);
    if (!it) stale.push(f.id + ' ' + f.field + ' (item no longer exists)');
    else if (countWords(it[f.field] || '') <= LIMIT) {
      stale.push(f.id + ' ' + f.field + ' (now ' + countWords(it[f.field] || '') + ' words)');
    }
  });
  assert.deepEqual(stale, [], 'remove these entries from FROZEN_DEBT in '
    + 'test/cardWordLimit665.test.js — the debt list may only shrink: ' + stale.join(', '));
});

test('card word limit: grade א is clean (#665)', () => {
  const bad = [];
  banks.itemsForGrade('א').forEach((it) => {
    ['prompt', 'hint'].forEach((field) => {
      const words = countWords(it[field] || '');
      if (words > LIMIT) bad.push(it.id + ' ' + field + '=' + words);
    });
  });
  assert.deepEqual(bad, [], 'grade א over-limit items: ' + bad.join(', '));
  const fixed = byId().get('א-measurement-736');
  assert.ok(fixed, 'א-measurement-736 missing');
  assert.equal(fixed.answer, 9);
  assert.ok(countWords(fixed.prompt) <= LIMIT, fixed.prompt);
});
