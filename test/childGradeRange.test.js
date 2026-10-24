// #693 (6): the elementary home covers grades א׳–ו׳ and says so, and the
// child-facing copy carries no middle-school topics or product jargon.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const banks = require('../src/lib/banks.js');

test('the banks really reach ו׳, so the title may claim א׳–ו׳', () => {
  for (const g of ['ה', 'ו']) {
    assert.ok(banks.allItems().some(i => i.grade === g), 'no items for grade ' + g);
  }
});

test('index.html names the range א׳–ו׳ in the title, banner and footer', () => {
  assert.match(indexHtml, /<title>MelodyMath \| תרגול יסודי א׳–ו׳<\/title>/);
  assert.match(indexHtml, /<b>תרגול יסודי א׳–ו׳\.<\/b>/);
  assert.match(indexHtml, /MelodyMath · תרגול יסודי א׳–ו׳ בעברית/);
  assert.doesNotMatch(indexHtml, /תרגול יסודי א׳–ד׳|תוכנית הלימודים א׳–ד׳/);
});

test('the child home has no middle-school topic or sonification jargon', () => {
  assert.doesNotMatch(indexHtml, /שיפוע פונקציה/);
  assert.doesNotMatch(indexHtml, /סוניפיקציית גרפים היא מוצר אחר/);
  assert.doesNotMatch(indexHtml, /לפסינג/);
});
