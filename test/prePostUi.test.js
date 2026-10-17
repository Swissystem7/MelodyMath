const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('prePost markup provides accessible group semantics, status live region, and cancel action', () => {
  // Status message has live region semantics
  assert.match(indexHtml, /id="ppMsg"[^>]*role="status"[^>]*aria-live="polite"/);

  // Choices container has accessible group role and label
  assert.match(indexHtml, /id="ppChoices"[^>]*role="group"[^>]*aria-label="אפשרויות תשובה לבדיקה"/);

  // Both Stop and Cancel actions exist in ppRun
  assert.match(indexHtml, /id="ppStop"[^>]*>סיום ושמירה<\/button>/);
  assert.match(indexHtml, /id="ppCancel"[^>]*>ביטול וחזרה<\/button>/);
});

test('ppCancelTest cleanly resets active session and advances focus to ppStartPre', () => {
  assert.match(
    indexHtml,
    /function ppCancelTest\(\)\{\s*if\(ppState\)\{endSession\(who\.classCode,who\.name,ppState\.sess\.id\);ppState=null\}\s*show\('ppRun',false\);\s*if\(\$\('ppMsg'\)\)\$\('ppMsg'\)\.textContent='הבדיקה בוטלה\.';\s*if\(\$\('ppStartPre'\)&&typeof \$\('ppStartPre'\)\.focus==='function'\)\$\('ppStartPre'\)\.focus\(\);?\s*\}/
  );
  assert.match(indexHtml, /if\(\$\('ppCancel'\)\)\$\('ppCancel'\)\.onclick=ppCancelTest;/);
});

test('ppStop halts session, preserves partial recordings, and advances focus to ppStartPre', () => {
  assert.match(
    indexHtml,
    /if\(\$\('ppStop'\)\)\$\('ppStop'\)\.onclick=\(\)=>ppHalt\('הבדיקה הופסקה\. התשובות שנרשמו עד כאן נשמרו\.',\$\('ppStartPre'\)\);/
  );
});

test('ppRender adds descriptive aria-label to choices and advances focus to first choice', () => {
  assert.match(indexHtml, /aria-label="תשובה: \$\{escapeHtml\(String\(c\)\)\}"/);
  assert.match(
    indexHtml,
    /const firstChoice=\$\('ppChoices'\)\.firstElementChild;\s*if\(firstChoice&&typeof firstChoice\.focus==='function'\)firstChoice\.focus\(\)/
  );
});

test('ppPick advances through questions and focuses ppRefresh upon completion', () => {
  assert.match(
    indexHtml,
    /ppHalt\('הבדיקה נרשמה בטאבלט הזה\.',\$\('ppRefresh'\)\);/
  );
});

test('ppStart handles empty items safely without silent failure', () => {
  const fnMatch = indexHtml.match(/function ppStart\(phase\)\{[\s\S]*?\n(?=function ppRender)/);
  assert.ok(fnMatch, 'ppStart function found in index.html');
  const fnCode = fnMatch[0];

  const elements = {
    ppMsg: { textContent: '' },
    ppRun: { classList: { remove: () => {}, add: () => {} } },
  };

  const sandbox = {
    who: { name: 'דני', classCode: 'test-class' },
    ppUnitId: () => 'u1',
    itemsForPhase: () => [],
    ppHalt: () => {},
    openSess: null,
    endTeacherSession: () => {},
    startSession: () => ({ id: 's1' }),
    checkKind: () => 'pre',
    show: () => {},
    ppRender: () => {},
    $: (id) => elements[id] || null,
  };

  vm.createContext(sandbox);
  vm.runInContext(fnCode, sandbox);

  assert.doesNotThrow(() => {
    sandbox.ppStart('pre');
  });
  assert.equal(elements.ppMsg.textContent, 'אין שאלות זמינות ליחידה זו.');
});

test('prePost complies with honesty guidelines (no medical or efficacy claims)', () => {
  const card = indexHtml.match(/id="prePost"[\s\S]*?id="ppReport"/);
  assert.ok(card, 'prePost section exists in index.html');
  assert.doesNotMatch(card[0], /ריפוי דיסקלקוליה|הבטחה להצלחה|שיפור קליני מוכח|שולט|סוגר פערים/);
  assert.match(card[0], /זו ספירה מקומית בטאבלט הזה ולא ניסוי מבוקר/);
});
