const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { mathHtml, mathRuns, setMath } = require('../src/lib/mathBidi');
const sheets = require('../src/lib/worksheets');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const LTR = '<span class="math-ltr" dir="ltr">';

test('a bare expression is one isolated LTR run (issue #93: "40 + 40 = ?")', () => {
  assert.equal(mathHtml('40 + 40 = ?'), LTR + '40 + 40 = ?</span>');
  assert.equal(mathHtml('☐ = 20 + 70'), LTR + '☐ = 20 + 70</span>');
  assert.equal(mathHtml('4 = 10 − ☐'), LTR + '4 = 10 − ☐</span>');
  assert.equal(mathHtml('3 × 3 = ?'), LTR + '3 × 3 = ?</span>');
  assert.equal(mathHtml('3/4 + 1/4 = ?'), LTR + '3/4 + 1/4 = ?</span>');
  assert.equal(mathHtml('10 : 2 = ?'), LTR + '10 : 2 = ?</span>');
});

test('Hebrew around an expression stays outside the LTR span', () => {
  assert.equal(mathHtml('4+4 עשרות. התשובה: 80'), LTR + '4+4</span> עשרות. התשובה: 80');
  assert.equal(mathHtml('חשבו במאונך: 47 + 25'), 'חשבו במאונך: ' + LTR + '47 + 25</span>');
  assert.equal(mathHtml('השעון מראה 3:00. מה השעה?'), 'השעון מראה ' + LTR + '3:00</span>. מה השעה?');
});

test('Hebrew-only text, plain numbers and labelled sequences are left alone', () => {
  assert.equal(mathHtml('כמה תופים? 🥁🥁🥁🥁'), 'כמה תופים? 🥁🥁🥁🥁');
  assert.equal(mathHtml(80), '80');
  // "2: 50" is a label colon, not division: the sequence keeps reading right to left.
  assert.deepEqual(mathRuns('ספירה אחורה מ־50 בדילוגי 2: 50, 48, 46, ?'), []);
  assert.equal(mathHtml(null), '');
});

test('mathHtml escapes HTML inside and outside the math runs', () => {
  assert.equal(mathHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  assert.equal(mathHtml('3 < 5 & "x"'), LTR + '3 &lt; 5</span> &amp; &quot;x&quot;');
});

test('setMath writes the wrapped HTML into an element', () => {
  const el = { innerHTML: '' };
  setMath(el, '40 + 40 = ?');
  assert.equal(el.innerHTML, LTR + '40 + 40 = ?</span>');
  assert.doesNotThrow(() => setMath(null, 'x'));
});

test('every prompt renderer in index.html goes through setMath, not textContent', () => {
  for (const id of ['prompt', 'rmPrompt', 'rmPlanPrompt', 'classPrompt', 'beatPrompt']) {
    assert.ok(indexHtml.includes("setMath($('" + id + "'),"), id + ' is not rendered with setMath');
  }
  assert.doesNotMatch(indexHtml, /textContent=(current|q|it)\.prompt/);
  assert.doesNotMatch(indexHtml, /\$\{(current|q|it)\.(hint|answer)\}/);
  assert.doesNotMatch(indexHtml, /\+(beatCurrent|classCurrent)\.(hint|answer)\b/);
  assert.match(indexHtml, /<script src="src\/lib\/mathBidi\.js"><\/script>\s*<script src="src\/lib\/worksheets\.js">/);
  assert.match(indexHtml, /\.math-ltr\{direction:ltr;unicode-bidi:isolate/);
});

test('answer inputs and choice buttons are LTR', () => {
  for (const id of ['answer', 'rmAnswer', 'rmPlanAnswer']) {
    assert.match(indexHtml, new RegExp('<input id="' + id + '" dir="ltr"'));
  }
  assert.equal((indexHtml.match(/b\.className='choice';\s*b\.dir='ltr';/g) || []).length, 2);
});

test('printed worksheets and the answer key keep expressions LTR', () => {
  const sheet = sheets.buildWorksheet({ pack: 'grade', grade: 'ב', count: 24, seed: 3, withAnswers: true });
  sheet.items.unshift({ skill: 'addition', he: 'חיבור', prompt: '40 + 40 = ?', answer: 80, hint: '4+4 עשרות' });
  const html = sheets.renderWorksheetHtml(sheet);
  assert.ok(html.includes('<p class="prompt">' + LTR + '40 + 40 = ?</span></p>'));
  assert.ok(html.includes('(' + LTR + '4+4</span> עשרות)'));
});

test('the offline cache lists mathBidi.js', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.ok(sw.includes("'./src/lib/mathBidi.js'"));
});

test('index.html names its icon so Chrome does not log a favicon.ico 404', () => {
  assert.match(indexHtml, /<link rel="icon" href="icons\/icon\.svg"/);
});
