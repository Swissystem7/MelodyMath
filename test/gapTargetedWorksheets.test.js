// MelodyMath — gap-targeted classroom printable worksheets (MM-AUTO-760).
// Connecting classroom gap results and data & time worlds to the worksheet generator.
// Enforces RTL presentation with nickname and class code only (no PII).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const banks = require('../src/lib/banks');
const dataWorlds = require('../src/lib/music/dataWorlds');
const worksheets = require('../src/lib/worksheets');

test('banks.dataAndTimeItems returns shipped items from data strand, time standards, and dataWorlds specs', () => {
  const allDt = banks.dataAndTimeItems();
  assert.ok(allDt.length > 50, 'data and time items pool should contain extensive items');
  allDt.forEach((it) => {
    assert.ok(banks.isDataOrTimeItem(it), `every item must satisfy isDataOrTimeItem: ${it.prompt}`);
  });

  const grade2 = banks.dataAndTimeItems('ב');
  assert.ok(grade2.length >= 8, 'grade ב should have at least 8 data/time items');
  assert.ok(grade2.every((it) => it.grade === 'ב'), 'all items must match the requested grade');
});

test('banks.gapTargetedItems prioritizes items matching measured class errors', () => {
  const targetPrompt = 'כמה דקות יש בחצי שעה?';
  const targetItem = banks.allItems().find((it) => it.prompt === targetPrompt);
  assert.ok(targetItem, 'target item exists in banks');

  const errors = [{ prompt: targetPrompt, count: 5 }];
  const pool = banks.gapTargetedItems({ grade: 'ב', errors: errors });

  assert.ok(pool.length > 0, 'pool must not be empty');
  assert.equal(pool[0].prompt, targetPrompt, 'error-matched item must be prioritized at the head of the pool');
});

test('dataWorlds.printableWidget formats data world tables, tallies, lists, values and pies for worksheets', () => {
  const tableItem = {
    music: 'tableRowGroups',
    prompt: 'בטבלת החוגים רשומים: כדורגל — 12 תלמידים, מוזיקה — 8 תלמידים, ציור — 5 תלמידים. כמה תלמידים בחוג המוזיקה?',
    answer: 8,
  };
  const tableHtml = dataWorlds.printableWidget(tableItem);
  assert.match(tableHtml, /sheet-data-table/);
  assert.match(tableHtml, /כדורגל/);
  assert.match(tableHtml, /12/);
  assert.match(tableHtml, /dir="rtl"/);

  const tallyItem = {
    music: 'listToGroups',
    prompt: 'ספירת שירים בסימני ספירה: פופ — ||||| ||, רוק — |||. כמה שירי פופ נספרו?',
    answer: 7,
  };
  const tallyHtml = dataWorlds.printableWidget(tallyItem);
  assert.match(tallyHtml, /sheet-data-tally/);
  assert.match(tallyHtml, /פופ/);

  const listSpec = { kind: 'list', list: ['שיר א', 'שיר ב'], cats: ['שיר א', 'שיר ב'], world: { he: 'אנדלוס' } };
  const listHtml = dataWorlds.printableWidget(listSpec);
  assert.match(listHtml, /sheet-data-list/);
  assert.match(listHtml, /שיר א, שיר ב/);

  const valuesSpec = { kind: 'values', values: [1, 2, 2, 4], world: { he: 'שכיח' } };
  const valuesHtml = dataWorlds.printableWidget(valuesSpec);
  assert.match(valuesHtml, /sheet-data-values/);
  assert.match(valuesHtml, /1, 2, 2, 4/);

  const pieSpec = { kind: 'pie', parts: 4, yes: 3, world: { he: 'עיגול' } };
  const pieHtml = dataWorlds.printableWidget(pieSpec);
  assert.match(pieHtml, /sheet-data-pie/);
  assert.match(pieHtml, /3/);

  const hintSpec = { kind: 'custom', world: { he: 'דבקה' } };
  const hintHtml = dataWorlds.printableWidget(hintSpec);
  assert.match(hintHtml, /sheet-data-hint/);
  assert.match(hintHtml, /דבקה/);

  assert.equal(dataWorlds.isDataWorldItem(tallyItem), true);
  assert.equal(dataWorlds.isDataWorldItem({ prompt: '1 + 1', answer: 2 }), false);
  assert.equal(dataWorlds.printableWidget(null), '');
  assert.equal(dataWorlds.printableWidget({ prompt: '1 + 1', answer: 2 }), '');
});

test('banks.isDataOrTimeItem handles null, dataWorlds items, and non-data items correctly', () => {
  assert.equal(banks.isDataOrTimeItem(null), false);
  assert.equal(banks.isDataOrTimeItem({ prompt: '1 + 1', answer: 2 }), false);

  const dwItem = {
    music: 'listToGroups',
    prompt: 'ספירת שירים בסימני ספירה: פופ — ||||| ||, רוק — |||. כמה שירי פופ נספרו?',
    answer: 7,
  };
  assert.equal(banks.isDataOrTimeItem(dwItem), true);

  const clockItem = { widget: 'clock', clock: { hour: 5 }, prompt: 'שעה', answer: 5 };
  assert.equal(banks.isDataOrTimeItem(clockItem), true);
});

test('buildWorksheet handles empty pool safely with noPii metadata', () => {
  const sheet = worksheets.buildWorksheet({
    pack: 'grade',
    grade: 'nonexistentGrade',
    nickname: 'חוקר-חלל',
    classCode: 'C-01',
    noPii: true,
  });
  assert.equal(sheet.items.length, 0);
  assert.equal(sheet.note, 'אין פריטים בחבילה שנבחרה.');
  assert.equal(sheet.nickname, 'חוקר-חלל');
  assert.equal(sheet.classCode, 'C-01');
  assert.equal(sheet.studentName, '');
  assert.equal(sheet.noPii, true);
});

test('worksheets.buildWorksheet and buildGapTargetedWorksheet generate gap-targeted printable pack for data and time', () => {
  const sheet = worksheets.buildGapTargetedWorksheet({ grade: 'ב', count: 8, seed: 101 });
  assert.equal(sheet.pack, 'gapTargeted');
  assert.equal(sheet.items.length, 8);
  assert.match(sheet.note, /חבילה ממוקדת פערים — עולמות נתונים וזמן/);
  assert.ok(sheet.items.every((it) => banks.isDataOrTimeItem(it)), 'all items belong to data/time/gap pool');
});

test('strict privacy / no PII: gap-targeted sheets scrub real student names and display nickname + class code only', () => {
  const sheet = worksheets.buildWorksheet({
    pack: 'gapTargeted',
    grade: 'ג',
    count: 6,
    studentName: 'ישראל ישראלי',
    nickname: 'כוכב3',
    classCode: 'כיתה-ג1',
  });

  assert.equal(sheet.studentName, '', 'real student name must be stripped in gap-targeted worksheets');
  assert.equal(sheet.nickname, 'כוכב3');
  assert.equal(sheet.classCode, 'כיתה-ג1');
  assert.equal(sheet.noPii, true);

  const html = worksheets.renderWorksheetHtml(sheet);
  assert.ok(!html.includes('ישראל ישראלי'), 'real student name must never appear in HTML output');
  assert.match(html, /כוכב3/);
  assert.match(html, /כיתה-ג1/);
});

test('renderWorksheetHtml enforces RTL direction and nickname/classCode header fields', () => {
  const sheet = worksheets.buildWorksheet({
    pack: 'gapTargeted',
    count: 4,
    nickname: 'שועל-זריז',
    classCode: 'C-554',
  });
  const html = worksheets.renderWorksheetHtml(sheet);

  assert.match(html, /<div class="sheet-page" dir="rtl">/);
  assert.match(html, /<p class="sheet-nick-fields" dir="rtl">הכינוי שלי: שועל-זריז \| קוד כיתה: C-554<\/p>/);
  assert.match(html, /כתבו כינוי, לא שם אמיתי/);
  assert.match(html, /תשובה: ________________/);
});

test('printableWidget in worksheets renders clock faces and dataWorlds widgets', () => {
  const clockItem = {
    widget: 'clock',
    clock: { hour: 4 },
    prompt: 'איזו שעה מראה השעון?',
    answer: 4,
  };
  const clockHtml = worksheets.printableWidget(clockItem);
  assert.match(clockHtml, /sheet-clock/);
  assert.match(clockHtml, /4:00/);

  const tableItem = {
    music: 'tableRowGroups',
    prompt: 'בטבלת החוגים רשומים: שחייה — 10, כדורסל — 6. כמה בשחייה?',
    answer: 10,
  };
  const tableWidgetHtml = worksheets.printableWidget(tableItem);
  assert.match(tableWidgetHtml, /sheet-data-table/);
  assert.match(tableWidgetHtml, /שחייה/);
});

test('gap-targeted worksheet includes teacher answer key with hints when withAnswers is true', () => {
  const sheet = worksheets.buildWorksheet({
    pack: 'gapTargeted',
    grade: 'ב',
    count: 4,
    withAnswers: true,
    nickname: 'קודקוד2',
    classCode: 'B-77',
  });
  const html = worksheets.renderWorksheetHtml(sheet);

  assert.match(html, /מחוון למורה — לא לחלק לתלמידים/);
  assert.match(html, /<ol><li>1\./);
  assert.ok(!html.includes('undefined'), 'no undefined values in key output');
});

test('index.html provides gap-targeted option in sheetPack and calls buildGapTargetedWorksheet with classroom errors', () => {
  const indexPath = path.join(__dirname, '..', 'index.html');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');

  assert.match(indexHtml, /<option value="gapTargeted">חבילה כיתתית ממוקדת פערים \(נתונים וזמן\)<\/option>/);
  assert.match(indexHtml, /buildGapTargetedWorksheet/);
  assert.match(indexHtml, /buildClassOverview/);
  assert.match(indexHtml, /classHist/);
  assert.match(indexHtml, /noPii:\s*isGap/);
});
