const test = require('node:test');
const assert = require('node:assert/strict');
const flashcards = require('../src/lib/flashcards');

test('flashcards provides all 4 canonical topics', () => {
  const topics = ['addition', 'multiplication', 'fractions', 'rhythms'];
  topics.forEach((t) => {
    const item = flashcards.getTopic(t);
    assert.ok(item, `topic ${t} should exist`);
    assert.ok(item.items.length >= 8, `topic ${t} should have at least 8 items`);
  });
});

test('renderFlashcardsHtml generates expected count and escapes HTML safely', () => {
  const html = flashcards.renderFlashcardsHtml({ topic: 'addition', count: 4 });
  assert.match(html, /flashcards-sheet/);
  assert.match(html, /ערכת כרטיסיות גזירה/);
  assert.match(html, /7 \+ 5 = \?/);
  assert.match(html, /12/);
  assert.match(html, /✂ גזרו או קפלו/);
  const items = html.match(/class="flashcard-item"/g) || [];
  assert.equal(items.length, 4);
});

test('renderFlashcardsHtml defaults to 8 items if count not specified', () => {
  const html = flashcards.renderFlashcardsHtml({ topic: 'multiplication' });
  const items = html.match(/class="flashcard-item"/g) || [];
  assert.equal(items.length, 8);
  assert.match(html, /לוח הכפל ומקצבים/);
});

test('renderFlashcardsHtml handles unknown topic gracefully by falling back to addition', () => {
  const html = flashcards.renderFlashcardsHtml({ topic: 'nonexistent' });
  assert.match(html, /חיבור וחיסור עד 20/);
});
