const test = require('node:test');
const assert = require('node:assert/strict');
const { findQuote, pageText } = require('../tools/verify-curriculum-quotes');

// Page 1 of the grade 1 program as poppler's pdftotext prints it: the two
// table columns take turns line by line, so the quote's last words come two
// lines after its first ones (#591).
const page1 = pageText([
  'ספירה עד 100',
  '• ספירה עד 100 קדימה וספירה אחורה הספירה מקשרת בין שמות המספרים למיקומם ברצף',
  'המספרים ומסייעת בהבנת עקרונות המבנה העשרוני. מומלץ',
  'ממספר כלשהו;',
  'להדגיש את המחזוריות שבהופעת ספרות היחידות בכל עשרת,',
].join('\n'));
const page2 = pageText('• מדידה באמצעות סרגל\nקריאת שעון מחוגים בשעות\nשלמות ובחצאי שעות;');

test('a quote split across two table columns is found on its page', () => {
  assert.equal(findQuote([page1, page2], 'ספירה עד 100 קדימה וספירה אחורה ממספר כלשהו'), 1);
});

test('a quote wrapped onto the next line still matches exactly', () => {
  assert.equal(findQuote([page1, page2], 'קריאת שעון מחוגים בשעות שלמות ובחצאי שעות'), 2);
});

test('an exact match on a later page wins over a split one on an earlier page', () => {
  const early = pageText('מדידה של זמן\nבאמצעות\nסרגל');
  assert.equal(findQuote([early, page2], 'מדידה באמצעות סרגל'), 2);
});

test('the check still fails on words out of order, missing or too far apart', () => {
  assert.equal(findQuote([page1], 'ממספר כלשהו ספירה עד 100'), 0);
  assert.equal(findQuote([page1], 'ספירה עד 100 קדימה וספירה אחורה ממספר שלם'), 0);
  // A part may only resume at the start of a line, not mid-line.
  assert.equal(findQuote([page1], 'ספירה עד 100 המבנה העשרוני'), 0);
  const far = pageText('ספירה עד\n' + 'מילה '.repeat(60) + '\n100 קדימה');
  assert.equal(findQuote([far], 'ספירה עד 100 קדימה'), 0);
  // Words from two pages never make one quote.
  assert.equal(findQuote([page1, page2], 'ממספר כלשהו; מדידה באמצעות סרגל'), 0);
});
