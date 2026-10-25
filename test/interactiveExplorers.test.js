// MelodyMath — Interactive Explorer Exercises tests (Issue #688, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = require('../src/lib/banks.js');
const explorers = require('../src/lib/exercises/interactiveExplorers.js');

test('all three explorer exercise kinds exist in banks, tagged to official curriculum standards', () => {
  const all = banks.allItems();
  const singingLine = all.filter(it => it.kind === 'singing_line');
  const groupsMult = all.filter(it => it.kind === 'groups_mult');
  const evenOdd = all.filter(it => it.kind === 'even_odd');

  assert.ok(singingLine.length >= 2, 'singing line exercises must exist in bank');
  assert.ok(groupsMult.length >= 2, 'groups multiplication exercises must exist in bank');
  assert.ok(evenOdd.length >= 2, 'even/odd exercises must exist in bank');

  singingLine.forEach(it => {
    assert.equal(it.standard, banks.ST.FRAC_BAR);
    assert.equal(it.grade, 'ד');
    assert.ok(it.prompt.includes('ישר המספרים'));
  });

  groupsMult.forEach(it => {
    assert.equal(it.standard, banks.ST.MUL_B);
    assert.equal(it.grade, 'ב');
    assert.ok(it.prompt.includes('קבוצות'));
  });

  evenOdd.forEach(it => {
    assert.equal(it.standard, banks.ST.PLACE_VALUE);
    assert.equal(it.grade, 'ב');
    assert.ok(it.prompt.includes('זוגי או אי־זוגי'));
  });
});

test('every explorer exercise has at most 15 words per card (kid screen requirement)', () => {
  const all = banks.allItems().filter(it => ['singing_line', 'groups_mult', 'even_odd'].includes(it.kind));
  assert.ok(all.length >= 6);

  all.forEach(ex => {
    const res = explorers.validateExerciseCard(ex);
    assert.equal(res.valid, true, `Exercise ${ex.id} failed validation: ${res.reason}`);
    assert.ok(res.wordCount <= 15, `Exercise prompt "${ex.prompt}" has ${res.wordCount} words; must be <= 15`);
  });
});

test('interactiveExplorers module generates compliant exercise models', () => {
  const exLine = explorers.createSingingLineExercise({ pct: 50 });
  assert.equal(exLine.kind, 'singing_line');
  assert.equal(exLine.answer, '1/2');
  assert.ok(exLine.wordCount <= 15);
  assert.equal(exLine.hasMusic, true);

  const exMult = explorers.createGroupsMultExercise({ groups: 3, size: 5 });
  assert.equal(exMult.kind, 'groups_mult');
  assert.equal(exMult.answer, 15);
  assert.ok(exMult.wordCount <= 15);

  const exEven = explorers.createEvenOddExercise({ count: 8 });
  assert.equal(exEven.kind, 'even_odd');
  assert.equal(exEven.answer, 'זוגי');
  assert.ok(exEven.wordCount <= 15);

  const exOdd = explorers.createEvenOddExercise({ count: 7 });
  assert.equal(exOdd.answer, 'אי-זוגי');
});

test('validation rejects prompts exceeding 15 words or missing standard', () => {
  const longPrompt = 'זהו תרגיל ארוך במיוחד שנועד לבדוק האם המערכת חוסמת כרטיסים שיש בהם יותר מדי מילים לילד בכיתה א או ב';
  const invalid = explorers.validateExerciseCard({
    prompt: longPrompt,
    standard: banks.ST.NLINE,
    kind: 'singing_line'
  });
  assert.equal(invalid.valid, false);
  assert.match(invalid.reason, /exceeds 15 words/);

  const missingStd = explorers.validateExerciseCard({
    prompt: 'קצר ולעניין',
    kind: 'singing_line'
  });
  assert.equal(missingStd.valid, false);
  assert.match(missingStd.reason, /missing curriculum standard/);
});

test('original explorer tools remain intact in index.html in playground / lessons tab', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('id="singingLine"'), 'singingLine slider remains intact');
  assert.ok(indexHtml.includes('id="mgGroupBtns"'), 'mgGroupBtns remains intact');
  assert.ok(indexHtml.includes('id="mgSizeBtns"'), 'mgSizeBtns remains intact');
  assert.ok(indexHtml.includes('id="eoNumBtns"'), 'eoNumBtns remains intact');
});
