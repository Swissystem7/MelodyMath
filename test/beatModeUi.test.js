const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('beatMode markup provides accessible group semantics and cancel action', () => {
  // Choices container has accessible group role and label
  assert.match(indexHtml, /id="beatChoices"[^>]*role="group"[^>]*aria-label="אפשרויות תשובה[^"]*"/);

  // Both Stop and Cancel actions exist in beatPlay
  assert.match(indexHtml, /id="beatStop"[^>]*>סיום התרגול<\/button>/);
  assert.match(indexHtml, /id="beatCancel"[^>]*>ביטול וחזרה<\/button>/);
});

test('beatCancel cleanly resets active session and advances focus to beatStart', () => {
  assert.match(
    indexHtml,
    /\$\('beatCancel'\)\.onclick=function\(\)\{\s*stopBeatTimer\(\);\s*endTeacherSession\(\);\s*showBeatCard\('beatGate'\);\s*if\(\$\('beatStart'\)&&typeof \$\('beatStart'\)\.focus==='function'\)\s*\$\('beatStart'\)\.focus\(\);\s*\};/
  );
});

test('endBeatSession and beatAgain manage focus without dead ends', () => {
  // Session finish advances focus to beatAgain
  assert.match(
    indexHtml,
    /function endBeatSession\(\)[\s\S]*?showBeatCard\('beatDone'\);\s*if\(\$\('beatAgain'\)&&typeof \$\('beatAgain'\)\.focus==='function'\)\s*\$\('beatAgain'\)\.focus\(\);/
  );

  // Clicking beatAgain restores focus to beatStart
  assert.match(
    indexHtml,
    /\$\('beatAgain'\)\.onclick=function\(\)\{\s*showBeatCard\('beatGate'\);\s*if\(\$\('beatStart'\)&&typeof \$\('beatStart'\)\.focus==='function'\)\s*\$\('beatStart'\)\.focus\(\);\s*\};/
  );
});

test('nextBeatQuestion adds descriptive aria-label to choices and advances focus', () => {
  assert.match(indexHtml, /b\.setAttribute\('aria-label',\s*'תשובה: '\s*\+\s*String\(v\)\);/);
  assert.match(indexHtml, /if\(box\.firstElementChild\s*&&\s*typeof box\.firstElementChild\.focus==='function'\)\s*box\.firstElementChild\.focus\(\);/);
});

test('nextBeatQuestion handles empty pool safely without throwing TypeError', () => {
  const fnMatch = indexHtml.match(/function nextBeatQuestion\(\)\{[\s\S]*?\n(?=function finishBeatPick)/);
  assert.ok(fnMatch, 'nextBeatQuestion function found in index.html');
  const fnCode = fnMatch[0];

  const elements = {
    beatPrompt: { textContent: '' },
    beatChoices: { innerHTML: 'initial' },
  };

  const sandbox = {
    beatAnswered: true,
    eligibleExercises: () => [],
    beatPool: () => [],
    beatHist: [],
    beatLastId: null,
    beatLevel: 1,
    $: (id) => elements[id] || null,
  };

  vm.createContext(sandbox);
  vm.runInContext(fnCode, sandbox);

  assert.doesNotThrow(() => {
    sandbox.nextBeatQuestion();
  });
  assert.equal(sandbox.beatAnswered, false);
  assert.equal(elements.beatPrompt.textContent, 'אין פריטים זמינים בחבילה שנבחרה.');
  assert.equal(elements.beatChoices.innerHTML, '');
});

test('beatMode complies with honesty guidelines (no medical or efficacy claims)', () => {
  assert.match(indexHtml, /לא טיפול ואין טענת יעילות/);
  assert.match(indexHtml, /לא ציון ולא הוכחה שהקצב עוזר/);
  assert.doesNotMatch(indexHtml, /ריפוי דיסקלקוליה|הבטחה להצלחה|שיפור קליני מוכח/);
});
