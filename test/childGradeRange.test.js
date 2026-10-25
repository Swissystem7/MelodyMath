// #671 / #693 (6): the elementary home covers grades א׳–ו׳ and says so, and the
// child-facing copy carries no middle-school topics, product jargon or age-inappropriate math.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const banks = require('../src/lib/banks.js');

test('all inline scripts in index.html compile without SyntaxError', () => {
  const scriptRegex = /<script(?![^>]*src=)([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  let count = 0;
  while ((match = scriptRegex.exec(indexHtml)) !== null) {
    const code = match[2];
    count++;
    assert.doesNotThrow(() => {
      new vm.Script(code);
    }, 'Inline script ' + count + ' has syntax errors');
  }
  assert.ok(count > 0, 'at least one inline script found');
});

test('index.html renders elementary grade buttons א׳ through ו׳ in #gradePick', () => {
  const fnMatch = indexHtml.match(/const GRADE_NOTE[\s\S]*?function paintGrade\(\)\{[\s\S]*?\n\}/);
  assert.ok(fnMatch, 'paintGrade found in index.html');

  const elements = {
    gradePick: {
      innerHTML: '',
      querySelectorAll() { return []; }
    },
    gradeNote: { textContent: '' },
    rmGradeTag: { textContent: '' },
    gateNote: { classList: { toggle() {} } },
    gateNoteDiag: { classList: { toggle() {} } },
    rmStruggleList: { innerHTML: '', appendChild() {} }
  };

  const sandbox = {
    GRADES: ['א', 'ב', 'ג', 'ד', 'ה', 'ו'],
    isGrade: g => ['א', 'ב', 'ג', 'ד', 'ה', 'ו'].includes(g),
    $: id => elements[id] || null,
    renderStruggleButtons: () => {},
    localStorage: {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); }
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(fnMatch[0], sandbox);
  sandbox.paintGrade();

  const renderedHtml = elements.gradePick.innerHTML;
  for (const g of ['א', 'ב', 'ג', 'ד', 'ה', 'ו']) {
    assert.match(renderedHtml, new RegExp(`data-grade="${g}"`), `Grade button ${g} missing from rendered gradePick`);
    assert.match(renderedHtml, new RegExp(`>${g}׳</button>`), `Label ${g}׳ missing from rendered gradePick`);
  }
  assert.match(renderedHtml, /data-grade="א" aria-pressed="true"/);
});

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
  assert.doesNotMatch(indexHtml, /המורה שולטת/);
  assert.doesNotMatch(indexHtml, /<label>BPM <input/);
});

test('exercises in index.html are age-appropriate for elementary school (grades א–ו)', () => {
  // Elementary school does not teach exponents (חזקות), negative operations, or complex tuning ratios
  assert.doesNotMatch(indexHtml, /'חזקות'/);
  assert.doesNotMatch(indexHtml, /75:64/);
  assert.doesNotMatch(indexHtml, /45:32/);
  assert.doesNotMatch(indexHtml, /64:45/);
  assert.doesNotMatch(indexHtml, /,\s*-\d+\s*,/);
});
