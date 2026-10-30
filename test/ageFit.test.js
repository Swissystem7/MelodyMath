'use strict';
// MelodyMath — Unit tests for Age Fit and Grade Boundaries (Refs #665 req 6).
const test = require('node:test');
const assert = require('node:assert/strict');
const ageFit = require('../src/lib/curriculum/ageFit.js');
const banks = require('../src/lib/banks.js');

test('ageFit exports canonical grade limits and validator functions', () => {
  assert.ok(ageFit.GRADE_LIMITS);
  assert.equal(ageFit.GRADE_LIMITS['א'].maxNum, 100);
  assert.equal(ageFit.GRADE_LIMITS['ב'].maxNum, 1000);
  assert.equal(ageFit.GRADE_LIMITS['ג'].maxNum, 10000);
  assert.equal(ageFit.GRADE_LIMITS['ד'].maxNum, 1000000);
  assert.equal(typeof ageFit.checkItemAgeFit, 'function');
  assert.equal(typeof ageFit.auditBank, 'function');
});

test('every exercise item currently shipped in banks.js satisfies its grade boundaries', () => {
  const items = banks.allItems();
  assert.ok(items.length > 500, 'banks must contain substantial item set');
  const audit = ageFit.auditBank(items);
  if (!audit.allValid) {
    console.error('Flagged items:', audit.flagged);
  }
  assert.equal(audit.allValid, true, `Found ${audit.flaggedCount} age-fit violations in banks.js`);
  assert.equal(audit.flaggedCount, 0);
  assert.equal(audit.validCount, items.length);
});

test('checkItemAgeFit catches out-of-grade numbers and operations', () => {
  // Number > 100 in Grade א
  const res1 = ageFit.checkItemAgeFit({ prompt: 'כמה זה 120 + 30?', answer: 150 }, 'א');
  assert.equal(res1.valid, false);
  assert.ok(res1.violations.some(v => v.includes('120') || v.includes('150')));

  // Multiplication in Grade א
  const res2 = ageFit.checkItemAgeFit({ prompt: '3 × 4 = ?', answer: 12 }, 'א');
  assert.equal(res2.valid, false);
  assert.ok(res2.violations.some(v => v.includes('כפל')));

  // Decimals in Grade ב
  const res3 = ageFit.checkItemAgeFit({ prompt: '1.5 + 2.5 = ?', answer: 4 }, 'ב');
  assert.equal(res3.valid, false);
  assert.ok(res3.violations.some(v => v.includes('שברים עשרוניים')));

  // Percentages in Grade ד
  const res4 = ageFit.checkItemAgeFit({ prompt: 'מה זה 50% מתוך 20?', answer: 10 }, 'ד');
  assert.equal(res4.valid, false);
  assert.ok(res4.violations.some(v => v.includes('אחוזים')));
});

test('checkItemAgeFit flags middle-school and secondary concepts across all grades', () => {
  // Powers / exponents
  const r1 = ageFit.checkItemAgeFit({ prompt: 'חשבו את ערך החזקה: 2^4', answer: 16 }, 'ו');
  assert.equal(r1.valid, false);
  assert.ok(r1.violations.some(v => v.includes('חזקות')));

  // Linear function slope
  const r2 = ageFit.checkItemAgeFit({ prompt: 'מהו שיפוע הישר בגרף?', answer: 2 }, 'ו');
  assert.equal(r2.valid, false);
  assert.ok(r2.violations.some(v => v.includes('שיפוע')));

  // Formal variable algebra
  const r3 = ageFit.checkItemAgeFit({ prompt: 'פתרו את המשוואה: 2x = 10', answer: 5 }, 'ו');
  assert.equal(r3.valid, false);
  assert.ok(r3.violations.some(v => v.includes('אלגברה') || v.includes('משווא')));

  // Valid Grade ו item passes
  const rOk = ageFit.checkItemAgeFit({ prompt: 'חשבו את היקף המעגל שרדיוסו 5 ס״מ (השתמשו ב־π = 3.14)', answer: 31.4 }, 'ו');
  assert.equal(rOk.valid, true);
});
