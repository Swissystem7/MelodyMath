const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const printCssPath = path.join(__dirname, '..', 'src', 'lib', 'print.css');
const printCss = fs.readFileSync(printCssPath, 'utf8');

test('print.css hides all non-report cards by default in print media to isolate the student report', () => {
  assert.match(printCss, /#trialKit,#worksheetCard,#classBoardCard,#parentCard,#certCard,#lessonCard,#ramaCard\{display:none!important\}/);
});

test('print.css isolates print-lesson and hides sibling cards', () => {
  assert.match(printCss, /body\.print-lesson #lessonCard,body\.print-lesson #lessonPlans\{display:block!important\}/);
  assert.match(printCss, /body\.print-lesson #trialKit,body\.print-lesson #reportCard,body\.print-lesson #classBoardCard,body\.print-lesson #parentCard,body\.print-lesson #worksheetCard,body\.print-lesson #certCard,body\.print-lesson #ramaCard\{display:none!important\}/);
});

test('print.css isolates print-rama and hides sibling cards', () => {
  assert.match(printCss, /body\.print-rama #ramaCard,body\.print-rama #ramaSheet\{display:block!important\}/);
  assert.match(printCss, /body\.print-rama #trialKit,body\.print-rama #reportCard,body\.print-rama #classBoardCard,body\.print-rama #parentCard,body\.print-rama #worksheetCard,body\.print-rama #certCard,body\.print-rama #lessonCard\{display:none!important\}/);
});

test('print.css hides lessonCard and ramaCard during print-kit, print-sheet, print-class, print-parent and print-cert', () => {
  const modes = ['print-kit', 'print-sheet', 'print-class', 'print-parent', 'print-cert'];
  for (const mode of modes) {
    const reLesson = new RegExp(`body\\.${mode} [^;]*#lessonCard`);
    const reRama = new RegExp(`body\\.${mode} [^;]*#ramaCard`);
    assert.match(printCss, reLesson, `${mode} must hide #lessonCard`);
    assert.match(printCss, reRama, `${mode} must hide #ramaCard`);
  }
});

test('print.css isolates print-flashcards and hides sibling cards', () => {
  assert.match(printCss, /body\.print-flashcards #flashcardsCard,body\.print-flashcards #flashcardsSheet\{display:block!important\}/);
  assert.match(printCss, /body\.print-flashcards #trialKit,body\.print-flashcards #reportCard,body\.print-flashcards #classBoardCard,body\.print-flashcards #parentCard,body\.print-flashcards #worksheetCard,body\.print-flashcards #certCard,body\.print-flashcards #lessonCard,body\.print-flashcards #ramaCard\{display:none!important\}/);
});

test('print.css hides flashcardsCard during other print modes', () => {
  const modes = ['print-kit', 'print-sheet', 'print-class', 'print-parent', 'print-cert', 'print-lesson', 'print-rama'];
  for (const mode of modes) {
    const reCards = new RegExp(`body\\.${mode} [^;]*#flashcardsCard`);
    assert.match(printCss, reCards, `${mode} must hide #flashcardsCard`);
  }
});
