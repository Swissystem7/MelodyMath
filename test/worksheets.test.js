const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const sheets = require('../src/lib/worksheets');

test('the diagnostic pack is still ten items — first two of each skill', () => {
  const d = banks.diagnosticItems();
  assert.equal(d.length, 10);
  assert.equal(d[0].skill, 'counting');
  assert.equal(d[2].skill, 'addition');
  assert.equal(d.filter((x) => x.skill === 'counting').length, 2);
});

test('class pack is counting + addition + subtraction only', () => {
  const c = banks.classItems();
  assert.ok(c.length >= 12);
  c.forEach((it) => {
    assert.ok(['counting', 'addition', 'subtraction'].includes(it.skill));
  });
});

test('a worksheet uses the same prompts as the on-screen bank', () => {
  const sheet = sheets.buildWorksheet({ pack: 'class', count: 8, seed: 7 });
  assert.equal(sheet.items.length, 8);
  const known = new Set(banks.classItems().map((x) => x.prompt));
  sheet.items.forEach((it) => assert.ok(known.has(it.prompt), it.prompt));
  assert.match(sheet.note, /אותם תרגילים/);
  assert.match(sheet.note, /לא מבחן/);
});

test('the same seed reprints the same sheet', () => {
  const a = sheets.buildWorksheet({ pack: 'practice', skills: ['addition'], count: 8, seed: 42 });
  const b = sheets.buildWorksheet({ pack: 'practice', skills: ['addition'], count: 8, seed: 42 });
  assert.deepEqual(a.items.map((x) => x.prompt), b.items.map((x) => x.prompt));
});

test('answer key is a second page the teacher can omit', () => {
  const open = sheets.renderWorksheetHtml(sheets.buildWorksheet({ pack: 'diag', withAnswers: false }));
  const key = sheets.renderWorksheetHtml(sheets.buildWorksheet({ pack: 'diag', withAnswers: true, studentName: 'נועה' }));
  assert.ok(!open.includes('מחוון למורה'));
  assert.match(key, /מחוון למורה/);
  assert.match(key, /נועה/);
  assert.match(key, /תשובה: ________________/);
  assert.equal(key.includes('<script'), false);
});

test('HTML escaping keeps a prompt with < from becoming markup', () => {
  assert.equal(sheets.escapeHtml('3 < 4'), '3 &lt; 4');
});
