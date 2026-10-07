const test = require('node:test');
const assert = require('node:assert');
const mastery = require('../src/lib/mastery.js');

test('isTableMastered returns true when the student has correctly answered the questions associated with the given multiplication table', () => {
  assert.strictEqual(typeof mastery.isTableMastered, 'function');

  const catalog = [
    { id: '2x1', table: 2 },
    { id: '2x2', table: 2 },
    { id: '3x1', table: 3 }
  ];
  const history = [
    { id: '2x1', correct: true },
    { id: '2x2', correct: true }
  ];

  assert.strictEqual(mastery.isTableMastered(2, history, catalog), true);
});

test('isTableMastered returns false when some questions for the table are unanswered or incorrect', () => {
  assert.strictEqual(typeof mastery.isTableMastered, 'function');

  const catalog = [
    { id: '2x1', table: 2 },
    { id: '2x2', table: 2 }
  ];
  const historyIncomplete = [
    { id: '2x1', correct: true }
  ];
  const historyIncorrect = [
    { id: '2x1', correct: true },
    { id: '2x2', correct: false }
  ];

  assert.strictEqual(mastery.isTableMastered(2, historyIncomplete, catalog), false);
  assert.strictEqual(mastery.isTableMastered(2, historyIncorrect, catalog), false);
});

test('isTableMastered returns false for empty history or when table questions were not attempted', () => {
  assert.strictEqual(typeof mastery.isTableMastered, 'function');

  const catalog = [
    { id: '4x1', table: 4 },
    { id: '4x2', table: 4 }
  ];

  assert.strictEqual(mastery.isTableMastered(4, [], catalog), false);
  assert.strictEqual(mastery.isTableMastered(4, [{ id: '2x1', correct: true }], catalog), false);
});

test('isTableMastered correctly identifies mastery for non-core tables as well', () => {
  assert.strictEqual(typeof mastery.isTableMastered, 'function');

  const catalog = [
    { id: '7x1', table: 7 },
    { id: '7x2', table: 7 }
  ];
  const history = [
    { id: '7x1', correct: true },
    { id: '7x2', correct: true }
  ];

  assert.strictEqual(mastery.isTableMastered(7, history, catalog), true);
});
