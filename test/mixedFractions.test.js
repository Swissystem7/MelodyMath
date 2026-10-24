// Grade ה׳ mixed numbers and the grade ו׳ meaning-of-percent items (#96):
// tags, answer formats and grade gating.
const test = require('node:test');
const assert = require('node:assert/strict');

const banks = require('../src/lib/banks.js');
const { isCorrect, parseMixedNumber } = require('../src/lib/adaptive.js');
const { mathHtml } = require('../src/lib/mathBidi.js');
const curriculum = require('../src/lib/curriculum.js');

const mixed = banks.allItems().filter((it) => it.standard === banks.ST.FRAC_MIXED);

test('mixed-number items ship with the grade/strand/standard tags and all three levels', () => {
  assert.ok(mixed.length >= 10, 'got ' + mixed.length + ' mixed-number items');
  mixed.forEach((it) => {
    assert.equal(it.grade, 'ה', it.id);
    assert.equal(it.skill, 'fractions', it.id);
    assert.equal(it.strand, banks.STRAND.FRAC, it.id);
    assert.equal(it.standard, banks.ST.FRAC_MIXED, it.id);
    assert.ok(banks.hasRequiredTags(it), it.id + ' is missing a tag');
    // Answers are written, not tapped, so beat mode has to skip them.
    assert.equal(it.typed, true, it.id + ' needs a typed answer');
    assert.ok(String(it.hint).trim(), it.id + ' needs a hint');
  });
  [1, 2, 3].forEach((level) => {
    assert.ok(mixed.some((it) => it.level === level), 'no mixed-number item at level ' + level);
  });
});

test('mixed-number items reach grade ה׳ practice and nothing else', () => {
  assert.ok(banks.skillsForGrade('ה').includes('fractions'));
  const ids = new Set(banks.practiceItems(['fractions'], 'ה').map((it) => it.id));
  mixed.forEach((it) => assert.ok(ids.has(it.id), it.id + ' is unreachable from grade ה׳ practice'));
  ['א', 'ב', 'ג', 'ד', 'ו'].forEach((g) => {
    const rows = banks.itemsForGrade(g).filter((it) => it.standard === banks.ST.FRAC_MIXED);
    assert.deepEqual(rows, [], 'grade ' + g + ' must not carry mixed-number items');
  });
});

test('the new items are appended, so every older item keeps its id', () => {
  // ids are RAW indexes. Inserting mid-bank would renumber everything after
  // the insertion point and orphan the rows a teacher report already holds.
  // A later append may sit after the percent-meaning items; it must not sit
  // inside the block that starts at the mixed numbers.
  const index = (it) => Number(it.id.split('-').pop());
  const mixed = banks.allItems().filter((it) => it.standard === banks.ST.FRAC_MIXED);
  const firstMixed = Math.min(...mixed.map(index));
  const meaning = banks.allItems().filter((it) => it.skill === 'percent' && String(it.prompt).includes('אחוז אחד הוא איזה חלק'));
  const lastMeaning = Math.max(...meaning.map(index));
  banks.allItems().forEach((it) => {
    const n = index(it);
    if (n > lastMeaning) return;
    if (it.standard === banks.ST.FRAC_MIXED || meaning.indexOf(it) !== -1) return;
    assert.ok(n < firstMixed, it.id + ' was renumbered');
  });
});

test('parseMixedNumber reads the textbook form and refuses a bare fraction', () => {
  assert.deepEqual(parseMixedNumber('1 ו־3/4'), { n: 7, d: 4 });
  assert.deepEqual(parseMixedNumber('1 ו 3/4'), { n: 7, d: 4 });
  assert.deepEqual(parseMixedNumber('1ו3/4'), { n: 7, d: 4 });
  assert.deepEqual(parseMixedNumber('1 3/4'), { n: 7, d: 4 });
  assert.deepEqual(parseMixedNumber('2 ו־1/3'), { n: 7, d: 3 });
  // No separator: 123/4 is one hundred twenty three quarters, not 12 ו־3/4.
  assert.equal(parseMixedNumber('123/4'), null);
  assert.equal(parseMixedNumber('3/4'), null);
  assert.equal(parseMixedNumber('2'), null);
  assert.equal(parseMixedNumber('1 ו־3/0'), null);
  assert.equal(parseMixedNumber(''), null);
  assert.equal(parseMixedNumber(null), null);
});

test('a mixed answer is accepted in any written form and only in the mixed form', () => {
  assert.equal(isCorrect('1 ו־3/4', '1 ו־3/4'), true);
  assert.equal(isCorrect('1 ו 3/4', '1 ו־3/4'), true);
  assert.equal(isCorrect('1 3/4', '1 ו־3/4'), true);
  assert.equal(isCorrect('1 ו-3/4', '1 ו־3/4'), true);
  assert.equal(isCorrect('1 ו־6/8', '1 ו־3/4'), true);
  assert.equal(isCorrect('2 ו־1/4', '1 ו־3/4'), false);
  // «כתבו 7/4 כמספר מעורב» cannot be answered by copying the prompt, and the
  // other direction cannot be answered with a mixed number.
  assert.equal(isCorrect('7/4', '1 ו־3/4'), false);
  assert.equal(isCorrect('1 ו־3/4', '7/4'), false);
  assert.equal(isCorrect('1.75', '1 ו־3/4'), false);
});

test('non-plain input is still refused on the mixed path (#88)', () => {
  ['0x10', '1e1', '0b11', '1 ו־0x3/4', 'אחד ושלושה רבעים', '--1 3/4'].forEach((bad) => {
    assert.equal(isCorrect(bad, '1 ו־3/4'), false, bad);
    assert.equal(parseMixedNumber(bad), null, bad);
  });
});

test('every mixed-number item is answered by its own stated answer', () => {
  mixed.forEach((it) => {
    assert.equal(isCorrect(it.answer, it.answer), true, it.id);
    assert.equal(isCorrect(String(it.answer).replace(/ו־/, ''), it.answer), true, it.id);
  });
});

// In an RTL paragraph the connector «ו־» splits "1 ו־1/2 + 2 ו־1/4 = ?" into
// two numeric runs, and mathBidi then isolates "1/2 + 2" — the wrong half.
// No shipped prompt may put a mixed number next to an operator.
function splitsAMixedNumber(text) {
  const html = mathHtml(text);
  return /ו־\s*<span/.test(html) || /<\/span>\s*ו־/.test(html);
}

test('no mixed-number prompt is rendered with the connector outside the expression', () => {
  mixed.forEach((it) => {
    assert.equal(splitsAMixedNumber(it.prompt), false, it.id + ': ' + mathHtml(it.prompt));
    assert.equal(splitsAMixedNumber(it.hint), false, it.id + ' hint: ' + mathHtml(it.hint));
  });
  // The regression this guards: the shape that used to ship.
  assert.equal(splitsAMixedNumber('1 ו־1/2 + 2 ו־1/4 = ?'), true);
});

test('no unit-check prompt puts a mixed number next to an operator either', () => {
  const { listUnits, formItems } = require('../src/lib/unitCheck.js');
  const rows = listUnits().flatMap((u) => ['pre', 'post'].flatMap((form) => formItems(u.id, form)));
  assert.ok(rows.length > 0);
  rows.forEach((it) => {
    assert.equal(splitsAMixedNumber(it.prompt), false, it.prompt + ' → ' + mathHtml(it.prompt));
  });
  const sums = rows.filter((it) => it.skill === 'mixed_fractions' && it.level === 3);
  assert.equal(sums.length, 2);
  sums.forEach((it) => assert.match(it.prompt, /ועוד/));
});

test('grade ו׳ percent says what a percent is, not only how to take one', () => {
  const percent = banks.rowsOf('percent', 'ו');
  assert.ok(banks.skillsForGrade('ו').includes('percent'));
  const meaning = percent.find((it) => it.prompt.includes('אחוז אחד הוא איזה חלק'));
  assert.ok(meaning, 'the meaning of a percent is not in the bank');
  assert.equal(isCorrect('1/100', meaning.answer), true);
  assert.equal(isCorrect('2/200', meaning.answer), true, 'an equivalent fraction counts');
  assert.equal(isCorrect('100', meaning.answer), false);
  assert.ok(percent.some((it) => it.answer === 100 && it.prompt.includes('כל השלם')));
  // 10%/25%/50% of a quantity were already there; they must stay.
  [['50%', 80, 40], ['10%', 70, 7], ['25%', 60, 15]].forEach(([pct, of, want]) => {
    const row = percent.find((it) => it.prompt.includes(pct) && it.prompt.includes('מ־' + of));
    assert.ok(row, pct + ' of ' + of + ' is missing');
    assert.equal(row.answer, want);
  });
});

test('the coverage page no longer claims grade ה׳ has no mixed numbers', () => {
  const row = curriculum.rowsForGrade('ה')
    .find((r) => r.topic.includes('חיבור וחיסור שברים'));
  assert.ok(row);
  assert.equal(row.status, curriculum.COVERED);
  assert.ok(row.note.includes('מספרים מעורבים'));
  assert.ok(!row.note.includes('אין מספרים מעורבים'));
  const pct = curriculum.rowsForGrade('ו').find((r) => r.topic === 'אחוזים');
  assert.ok(pct.note.includes('1% = 1/100'));
});
