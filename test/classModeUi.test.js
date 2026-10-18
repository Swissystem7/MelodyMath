const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('classMode markup provides accessible group semantics and alerts', () => {
  // Group semantics on kid selection and choice options
  assert.match(indexHtml, /id="classKids"[^>]*role="group"[^>]*aria-label="בחירת תלמיד\/ה מהכיתה"/);
  assert.match(indexHtml, /id="classChoices"[^>]*role="group"[^>]*aria-label="אפשרויות תשובה"/);

  // Accessible error alert container in classGate
  assert.match(indexHtml, /id="classGateMsg"[^>]*role="alert"/);

  // Both Stop and Cancel actions in classPlay
  assert.match(indexHtml, /id="classStop"[^>]*>סיום המפגש עכשיו<\/button>/);
  assert.match(indexHtml, /id="classCancel"[^>]*>ביטול וחזרה<\/button>/);
});

test('classKids buttons have minimum 44px touch targets, focus outline, and aria-pressed selected styling', () => {
  assert.match(indexHtml, /\.class-kids button\{[^}]*min-height:44px/);
  assert.match(indexHtml, /\.class-kids button\{[^}]*min-width:44px/);
  assert.match(indexHtml, /\.class-kids button\[aria-pressed="true"\],\.class-kids button\.selected\{background:var\(--purple\);color:#fff/);
  assert.match(indexHtml, /\.class-kids button:focus-visible\{outline:3px solid var\(--purple\)/);
});

test('startClassSession shows accessible error and focuses student name if no student selected', () => {
  const fnMatch = indexHtml.match(/function startClassSession\(\)\{[\s\S]*?\n(?=function endClassSession)/);
  assert.ok(fnMatch, 'startClassSession function found in index.html');
  const fnCode = fnMatch[0];

  const elements = {
    whoStatus: { textContent: '' },
    classGateMsg: { textContent: '', hidden: true, classList: { classes: new Set(['hidden']), remove(c) { this.classes.delete(c); }, add(c) { this.classes.add(c); } } },
    studentName: { focused: false, focus() { this.focused = true; } },
  };

  const sandbox = {
    who: { name: '' },
    $: (id) => elements[id] || null,
    show: (id, visible) => {
      const el = elements[id];
      if (el) {
        if (visible) el.classList.remove('hidden');
        else el.classList.add('hidden');
      }
    },
    endTeacherSession: () => {},
    ensureTeacherSession: () => {},
    showClassCard: () => {},
    nextClassQuestion: () => {},
    classTick: () => {},
    preferLessMotion: () => false,
    CLASS_MS: 480000,
    classEndsAt: 0,
    classSeed: 1,
    classTimerId: null,
    document: { body: { classList: { add() {}, remove() {} } } },
  };

  vm.createContext(sandbox);
  vm.runInContext(fnCode, sandbox);

  sandbox.startClassSession();

  assert.equal(elements.whoStatus.textContent, 'קודם שומרים שם תלמיד/ה בסרגל.');
  assert.match(elements.classGateMsg.textContent, /יש לבחור תלמיד\/ה/);
  assert.ok(!elements.classGateMsg.classList.classes.has('hidden'), 'error message is unhidden');
  assert.equal(elements.studentName.focused, true, 'studentName receives focus');
});

test('classCancel action resets active session cleanly and advances focus to classStart', () => {
  assert.match(indexHtml, /\$\('classCancel'\)\.onclick=\(\)=>\{endTeacherSession\(\);classEndsAt=0;if\(classTimerId\)\{clearInterval\(classTimerId\);classTimerId=null\}document\.body\.classList\.remove\('class-live'\);showClassCard\('classGate'\);renderClassKids\(\);if\(\$\('classStart'\)&&typeof \$\('classStart'\)\.focus==='function'\)\$\('classStart'\)\.focus\(\)\}/);
});

test('classAgain and endClassSession advance focus without dead-end states', () => {
  assert.match(indexHtml, /function endClassSession\(\)[\s\S]*?if\(\$\('classAgain'\)&&typeof \$\('classAgain'\)\.focus==='function'\)\$\('classAgain'\)\.focus\(\)/);
  assert.match(indexHtml, /\$\('classAgain'\)\.onclick=\(\)=>\{showClassCard\('classGate'\);renderClassKids\(\);if\(\$\('classStart'\)&&typeof \$\('classStart'\)\.focus==='function'\)\$\('classStart'\)\.focus\(\)\}/);
});

test('nextClassQuestion sets descriptive aria-label on choice buttons and advances focus', () => {
  assert.match(indexHtml, /b\.setAttribute\('aria-label','תשובה: '\+String\(v\)\)/);
  assert.match(indexHtml, /if\(firstChoice&&typeof firstChoice\.focus==='function'\)firstChoice\.focus\(\)/);
});
