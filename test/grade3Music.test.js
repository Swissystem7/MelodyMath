const test = require('node:test');
const assert = require('node:assert/strict');
const g3 = require('../src/lib/grade3Music');

test('divideBeats and formatRemainderAnswer for 14 into bars of 4', () => {
  assert.deepEqual(g3.divideBeats(14, 4), { quotient: 3, remainder: 2 });
  assert.equal(g3.formatRemainderAnswer(3, 2), '3 שארית 2');
});

test('matchRemainderAnswer accepts Hebrew remainder phrasing with flexible spaces', () => {
  assert.equal(g3.matchRemainderAnswer('3 שארית 2', '3 שארית 2'), true);
  assert.equal(g3.matchRemainderAnswer('3שארית2', '3 שארית 2'), false);
  assert.equal(g3.matchRemainderAnswer('4 שארית 0', '3 שארית 2'), false);
  assert.equal(g3.matchRemainderAnswer('3 שארית 2', '3שארית2'), false);
});

test('sequencer cells are at least 44px wide at 360px (wraps columns)', () => {
  const lay = g3.sequencerLayout(360, 8, 4);
  assert.ok(lay);
  assert.ok(lay.cellPx >= 44);
  assert.ok(lay.colsPerRow < 8);
});

test('rectangle area and tune seconds helpers', () => {
  assert.equal(g3.rectangleArea(4, 8), 32);
  assert.equal(g3.tuneToSeconds(2, 30), 150);
  assert.equal(g3.higherHz(880, 3520), 3520);
});

test('music_g3 bank items carry widgets and remainder item validates via itemAnswerCorrect', () => {
  const banks = require('../src/lib/banks');
  const rows = banks.rowsOf('music_g3', 'ג');
  assert.ok(rows.length >= 10);
  assert.ok(rows.every((it) => it.widget && it.g3));
  const rem = rows.find((it) => it.widget === 'g3remainder' && it.answer === '3 שארית 2');
  assert.ok(rem);
  assert.equal(g3.itemAnswerCorrect(rem, '3 שארית 2'), true);
  assert.equal(g3.itemAnswerCorrect(rem, '2 שארית 6'), false);
});
