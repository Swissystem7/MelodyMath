

const test = require('node:test');
const assert = require('node:assert/strict');

const banks = require('../src/lib/banks');
const sheets = require('../src/lib/worksheets');

test('renderWorksheetHtml includes printable widgets for chart and ruler items', () => {
  const items = ['א-data-345', 'א-data-349', 'א-measurement-321'].map(id => banks.allItems().find(x => x.id === id));
  const sheet = { title: 'MelodyMath — דף עבודה', note: 'בדיקה', pack: 'grade', seed: 1, withAnswers: false, studentName: '', classCode: '', items };
  const html = sheets.renderWorksheetHtml(sheet);

  assert.match(html, /בננות/);
  assert.ok((html.match(/🍎/g) || []).length >= 6);
  
  const bars = html.slice(html.indexOf('כחול'));
  assert.match(bars, /אדום[\s\S]{0,80}?3/);
  assert.match(bars, /ירוק[\s\S]{0,80}?2/);
  
  assert.equal((html.match(/🟫/g) || []).length, 4);
  assert.doesNotMatch(html, /4/); /* item numbers are 1-3 and bar values 5/3/2, so the only possible '4' is the pictogram count or the ruler length, both of which give the answer away */;
  assert.equal(html.includes('<script'), false);
});
