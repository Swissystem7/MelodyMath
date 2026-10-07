const test = require('node:test');
const assert = require('node:assert/strict');
const bar = require('../src/lib/bar44');
const { isCorrect } = require('../src/lib/adaptive');

test('1/2, 1/4 and 1/8 map onto eighths of a 4/4 bar', () => {
  assert.equal(bar.eighthsOf('1/2'), 4);
  assert.equal(bar.eighthsOf('1/4'), 2);
  assert.equal(bar.eighthsOf('1/8'), 1);
  assert.equal(bar.eighthsOf('½'), 4);
  assert.equal(bar.fractionFromEighths(4), '1/2');
  assert.equal(bar.fractionFromEighths(2), '1/4');
  assert.equal(bar.fractionFromEighths(1), '1/8');
  assert.equal(bar.fractionFromEighths(8), '1');
});

test('½ and 1/2 are the same fraction answer, and 0.5 is not required', () => {
  assert.equal(bar.sameFraction('½', '1/2'), true);
  assert.equal(bar.sameFraction('1/4', '2/8'), true);
  assert.ok(isCorrect('1/2', '1/2'));
  assert.ok(isCorrect('½', '1/2'));
  assert.ok(isCorrect('1 / 4', '1/4'));
});

test('the bar drawing names a 4/4 bar and has eight cells', () => {
  const html = bar.renderBar44Html({ fraction: '1/2' }, false);
  assert.match(html, /תיבה 4\/4/);
  assert.equal((html.match(/bar44-cell/g) || []).length, 8);
  assert.match(html, /מלא: 1\/2/);
});

test('renderBar44Html should only enable interactivity when interactive is explicitly boolean true', () => {
  // Test with string 'true' - should NOT enable interactivity (disabled buttons)
  const htmlWithString = bar.renderBar44Html({ fraction: '1/2' }, 'true');
  assert.ok(htmlWithString.includes('disabled'), 'Buttons should be disabled when interactive is string "true"');
  
  // Test with number 1 - should NOT enable interactivity (disabled buttons)
  const htmlWithNumber = bar.renderBar44Html({ fraction: '1/2' }, 1);
  assert.ok(htmlWithNumber.includes('disabled'), 'Buttons should be disabled when interactive is number 1');
  
  // Test with boolean true - SHOULD enable interactivity (no disabled buttons)
  const htmlWithBooleanTrue = bar.renderBar44Html({ fraction: '1/2' }, true);
  assert.ok(!htmlWithBooleanTrue.includes('disabled'), 'Buttons should NOT be disabled when interactive is boolean true');
  
  // Verify the specific expected output for string 'true' case
  const expected = '<div class="bar44" dir="ltr" data-filled="4"><p class="bar44-label">תיבה 4/4 · 8 שמיניות</p><div class="bar44-track" role="group" aria-label="תיבה מוזיקלית 4/4"><button type="button" class="bar44-cell on" disabled data-i="0" aria-pressed="true" aria-label="שמינית 1 · פעימה 1"><span class="bar44-beat">1</span></button><button type="button" class="bar44-cell on" disabled data-i="1" aria-pressed="true" aria-label="שמינית 2 · פעימה 1"></button><button type="button" class="bar44-cell on" disabled data-i="2" aria-pressed="true" aria-label="שמינית 3 · פעימה 2"><span class="bar44-beat">2</span></button><button type="button" class="bar44-cell on" disabled data-i="3" aria-pressed="true" aria-label="שמינית 4 · פעימה 2"></button><button type="button" class="bar44-cell" disabled data-i="4" aria-pressed="false" aria-label="שמינית 5 · פעימה 3"><span class="bar44-beat">3</span></button><button type="button" class="bar44-cell" disabled data-i="5" aria-pressed="false" aria-label="שמינית 6 · פעימה 3"></button><button type="button" class="bar44-cell" disabled data-i="6" aria-pressed="false" aria-label="שמינית 7 · פעימה 4"><span class="bar44-beat">4</span></button><button type="button" class="bar44-cell" disabled data-i="7" aria-pressed="false" aria-label="שמינית 8 · פעימה 4"></button></div><p class="bar44-read" aria-live="polite">מלא: 1/2 מהתיבה</p></div>';
  assert.equal(htmlWithString, expected);
});
