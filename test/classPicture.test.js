// #418 — the teacher's class picture: one row per child with the diagnostic
// percentage, the leading gaps and where the #383 plan stands, plus the
// one-child plan sheet and a CSV that names nobody.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pic = require('../src/lib/classPicture');
const store = require('../src/lib/teacherStore');
const plan = require('../src/lib/learnerPlan');

const root = path.join(__dirname, '..');
const NOW = Date.UTC(2026, 9, 19, 9, 0, 0);

function memory() {
  const m = Object.create(null);
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
  };
}

// A student row shaped the way teacherStore writes it: one session of `kind`
// whose items are `[skill, correct]` pairs.
function student(name, grade, kind, items) {
  const row = { name: name, created: NOW - 1000, sessions: [] };
  if (grade) row.grade = grade;
  if (items) {
    row.sessions.push({
      id: 's1', kind: kind, started: NOW - 1000, ended: NOW - 900,
      items: items.map(([skill, correct]) => ({ skill: skill, prompt: skill, correct: correct, at: NOW - 1000 })),
    });
  }
  return row;
}

test('a child with a grade of their own keeps it; without one the row says it took the device grade', () => {
  const picture = pic.buildClassPicture({
    grade: 'א', now: NOW,
    students: [student('נ-3', 'ג', 'diag', [['כפל', false], ['כפל', false], ['כפל', false], ['כפל', true]]),
      student('נ-4', '', 'diag', [['מנייה', false], ['מנייה', false]])],
  });
  const own = picture.rows[0];
  const borrowed = picture.rows[1];
  assert.equal(own.grade, 'ג');
  assert.equal(own.ownGrade, 'ג');
  assert.equal(borrowed.grade, 'א');
  assert.equal(borrowed.ownGrade, '');
  assert.equal(picture.deviceGrade, 'א');
  // The plan each row carries was built on that row's grade, not on the tab's.
  assert.equal(own.plan.grade, 'ג');
  assert.match(borrowed.topic, /ספירה עד 100/);
});

test('the row names the diagnostic percentage, at most three gaps and a Hebrew plan status', () => {
  const row = pic.buildClassPicture({
    grade: 'ג', now: NOW,
    students: [student('נ-7', 'ג', 'diag', [
      ['כפל', false], ['כפל', false], ['כפל', false], ['כפל', true],
      ['חילוק', false], ['חילוק', false], ['חילוק', false], ['חילוק', false],
      ['מבנה עשרוני', false], ['מבנה עשרוני', true],
      ['שאלות מילוליות', false], ['שאלות מילוליות', false],
    ])],
  }).rows[0];
  assert.equal(row.diag, 17);
  assert.equal(row.gaps.length, 3);
  assert.equal(row.status, pic.CLASS_PICTURE_STATUS_HE.weak);
  assert.equal(row.branch, 'weak');
  assert.equal(row.paceExpected, 3);
  assert.ok(row.topic);
});

test('practice that is not a check leaves the diagnostic column empty instead of guessing one', () => {
  const row = pic.buildClassPicture({
    grade: 'ג', now: NOW,
    students: [student('נ-9', 'ג', 'practice', [['כפל', false], ['כפל', true]])],
  }).rows[0];
  assert.equal(row.diag, '');
  assert.equal(row.gaps.length, 1);
  const html = pic.renderClassPictureHtml({ rows: [row] });
  assert.match(html, /לא נרשם/);
});

test('a child with no recorded answer is a starting point, with no invented gap', () => {
  const row = pic.buildClassPicture({ grade: 'ב', now: NOW, students: [student('נ-1', '', '', null)] }).rows[0];
  assert.equal(row.branch, 'fresh');
  assert.equal(row.status, pic.CLASS_PICTURE_STATUS_HE.fresh);
  assert.deepEqual(row.gaps, []);
  assert.equal(row.diag, '');
});

test('an unknown device grade and an unknown child grade leave the row without a plan', () => {
  const row = pic.buildClassPicture({ grade: 'ז', now: NOW, students: [student('נ-2', '', 'diag', [['כפל', false]])] }).rows[0];
  assert.equal(row.grade, '');
  assert.equal(row.branch, 'invalid');
  assert.equal(row.status, pic.CLASS_PICTURE_STATUS_HE.invalid);
  assert.deepEqual(row.gaps, []);
  assert.match(pic.renderClassPictureHtml({ rows: [row] }), /לא נבחרה/);
});

test('rows that are not student objects are dropped instead of throwing on the whole class', () => {
  const picture = pic.buildClassPicture({
    grade: 'א', now: NOW,
    students: [null, 'נועה', [], { sessions: [] }, student('נ-5', '', '', null)],
  });
  assert.deepEqual(picture.rows.map((r) => r.name), ['נ-5']);
  assert.equal(pic.renderClassPictureHtml({ rows: [] }), '');
});

test('the picture reads the roster for a class code, grades included', () => {
  const ls = memory();
  const sess = store.startSession('שילוב', 'נועה', 'diag', ls);
  store.addItem('שילוב', 'נועה', sess.id, { skill: 'כפל', prompt: '3×4', correct: false }, ls);
  store.addItem('שילוב', 'נועה', sess.id, { skill: 'כפל', prompt: '4×4', correct: false }, ls);
  store.endSession('שילוב', 'נועה', sess.id, ls);
  store.upsertStudent('שילוב', 'דני', ls);
  store.setStudentGrade('שילוב', 'נועה', 'ג', ls);
  const picture = pic.buildClassPicture({ classCode: 'שילוב', grade: 'א', now: NOW, storage: ls });
  assert.deepEqual(picture.rows.map((r) => r.name), ['דני', 'נועה']);
  const noa = pic.findPictureRow(picture, 'נועה');
  assert.equal(noa.grade, 'ג');
  assert.equal(noa.diag, 0);
  assert.equal(noa.gaps.length, 1);
  assert.equal(pic.findPictureRow(picture, 'מי שלא קיים'), null);
  // Another class code on the same tablet is a different picture.
  assert.deepEqual(pic.buildClassPicture({ classCode: 'אחרת', grade: 'א', now: NOW, storage: ls }).rows, []);
});

test('the table is one row per child, with a button that opens that child and a grade picker', () => {
  const picture = pic.buildClassPicture({
    grade: 'ג', now: NOW,
    students: [student('נ-3', 'ג', 'diag', [['כפל', false], ['כפל', true]]), student('<נ>', '', '', null)],
  });
  const html = pic.renderClassPictureHtml(picture);
  pic.CLASS_PICTURE_COLS.forEach((col) => assert.match(html, new RegExp('<th scope="col">' + col + '</th>')));
  assert.equal((html.match(/data-plan-kid=/g) || []).length, 2);
  assert.equal((html.match(/data-grade-kid=/g) || []).length, 2);
  assert.match(html, /<caption class="sr-only">/);
  assert.match(html, /<option value="ג" selected>/);
  assert.match(html, /aria-label="כיתה של נ-3"/);
  // A name a teacher typed is text, never markup.
  assert.match(html, /data-plan-kid="&lt;נ&gt;"/);
  assert.doesNotMatch(html, /<נ>/);
});

test('opening a child shows the #383 plan card plus the gaps behind it', () => {
  const row = pic.buildClassPicture({
    grade: 'ג', now: NOW,
    students: [student('נ-3', 'ג', 'diag', [['כפל', false], ['כפל', false], ['חילוק', false], ['חילוק', true]])],
  }).rows[0];
  const sheet = pic.renderStudentPlanHtml(row);
  assert.match(sheet, /class="mm-plan"/);
  assert.match(sheet, new RegExp(plan.buildLearnerPlan({ grade: 'ג', student: null, now: NOW }).disclaimer.slice(0, 20)));
  assert.match(sheet, /תוכנית אישית · נ-3 · כיתה ג׳/);
  assert.match(sheet, /אחוז אבחון/);
  row.gaps.forEach((g) => assert.ok(sheet.includes(g), g + ' should be listed'));
  assert.match(pic.renderStudentPlanHtml(null), /בחרו שם בטבלה/);
});

test('a borrowed grade is said out loud on the printed plan sheet', () => {
  const row = pic.buildClassPicture({ grade: 'ב', now: NOW, students: [student('נ-6', '', '', null)] }).rows[0];
  assert.match(pic.renderStudentPlanHtml(row), /כיתה ב׳ \(כיתת המכשיר\)/);
});

test('the CSV carries row numbers, never a name or a class code', () => {
  const picture = pic.buildClassPicture({
    classCode: 'שילוב-ג', grade: 'ג', now: NOW,
    students: [student('נועה כהן', 'ג', 'diag', [['כפל', false], ['כפל', true]]), student('דני', '', '', null)],
  });
  const csv = pic.classPictureCsv(picture.rows);
  const lines = csv.split('\n');
  assert.equal(lines[0], pic.CLASS_PICTURE_CSV_HEAD.join(','));
  assert.equal(lines.length, 3);
  assert.match(lines[1], /^1,ג,50,/);
  assert.match(lines[2], /^2,ג,,/);
  assert.doesNotMatch(csv, /נועה|כהן|דני|שילוב/);
  assert.doesNotMatch(csv, /תעודת זהות|מספר זהות|כינוי|שם/);
  assert.equal(pic.classPictureCsv(null), pic.CLASS_PICTURE_CSV_HEAD.join(','));
  assert.equal(pic.classPictureCsv([null]), pic.CLASS_PICTURE_CSV_HEAD.join(','));
});

test('a gap or status holding a comma or a quote stays one CSV field', () => {
  const csv = pic.classPictureCsv([{ grade: 'ג', diag: 40, gaps: ['כפל, חילוק', 'שארית "קשה"'], status: 'חזרה ליסודות', paceDone: 1, paceExpected: 3 }]);
  assert.match(csv, /"כפל, חילוק"/);
  assert.match(csv, /"שארית ""קשה"""/);
  assert.equal(csv.split('\n').length, 2);
});

test('the leading gaps are the weakest mapped topics, at most three and never the same topic twice', () => {
  // In grade א׳ both חיבור and חיסור land on «בתחום 10»: one gap, not two.
  assert.deepEqual(
    plan.topGaps({ grade: 'א', perSkill: [{ skill: 'חיבור', total: 4, correct: 1 }, { skill: 'חיסור', total: 4, correct: 0 }] }).length,
    1,
  );
  const three = plan.topGaps({
    grade: 'ג',
    perSkill: [{ skill: 'כפל', total: 4, correct: 1 }, { skill: 'חילוק', total: 4, correct: 0 },
      { skill: 'מבנה עשרוני', total: 4, correct: 2 }, { skill: 'שאלות מילוליות', total: 4, correct: 1 }],
  });
  assert.equal(three.length, 3);
  // Weakest first.
  assert.match(three[0], /שארית/);
  // 80% and up is not a gap, and neither is an unusable input.
  assert.deepEqual(plan.topGaps({ grade: 'א', perSkill: [{ skill: 'מנייה', total: 5, correct: 4 }] }), []);
  assert.deepEqual(plan.topGaps({ grade: 'ז', perSkill: [{ skill: 'כפל', total: 4, correct: 0 }] }), []);
  assert.deepEqual(plan.topGaps({ grade: 'א', perSkill: 'לא רשימה' }), []);
  assert.deepEqual(plan.topGaps(null), []);
});

test('index.html mounts the class picture, and print-plan isolates one child', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const printCss = fs.readFileSync(path.join(root, 'src', 'lib', 'print.css'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(index, /src\/lib\/classPicture\.js/);
  ['classPictureCard', 'classPicture', 'classPictureEmpty', 'classPlanSheet', 'classPlanActions',
    'picRefresh', 'picCsv', 'picPrint', 'picClose'].forEach((id) => {
    assert.match(index, new RegExp('id="' + id + '"'), 'index.html needs #' + id);
  });
  assert.match(index, /renderClassPicture\(\)/);
  assert.match(index, /printMode\('print-plan'\)/);
  assert.match(index, /id="classPlanSheet"[^>]*tabindex="-1"/);
  assert.match(printCss, /#classPictureCard\{display:none!important\}/);
  assert.match(printCss, /body\.print-plan #classPictureCard,body\.print-plan #classPlanSheet\{display:block!important\}/);
  assert.match(printCss, /body\.print-plan #classPicture,body\.print-plan #classPictureEmpty\{display:none!important\}/);
  ['print-kit', 'print-sheet', 'print-class', 'print-parent', 'print-cert', 'print-lesson', 'print-rama'].forEach((mode) => {
    assert.match(printCss, new RegExp('body\\.' + mode + ' #classPictureCard'), mode + ' must hide the picture card');
  });
  assert.match(sw, /classPicture\.js/);
});

test('printMode clears every other print mode, so two cards never print together', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const modes = index.match(/const PRINT_MODES=\[([^\]]*)\]/);
  assert.ok(modes, 'index.html needs a PRINT_MODES list');
  ['print-kit', 'print-sheet', 'print-class', 'print-parent', 'print-cert', 'print-lesson', 'print-rama', 'print-plan']
    .forEach((mode) => assert.ok(modes[1].includes("'" + mode + "'"), mode + ' belongs in PRINT_MODES'));
  // No handler may still add a print class behind printMode's back.
  assert.doesNotMatch(index, /classList\.add\('print-/);
});

test('the class picture names no color: the palette stays in src/sefirot.css', () => {
  // Same value-position shape designTokens.test.js uses: «#418» is an issue
  // reference, «background:#fff» is a color literal.
  const src = fs.readFileSync(path.join(root, 'src', 'lib', 'classPicture.js'), 'utf8');
  const colors = Array.from(src.matchAll(/(?:[:,?=]|\|\||\b(?:solid|dashed|dotted|px)\s)\s*["'`]?(#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\))/g), (m) => m[1]);
  assert.deepEqual(colors, []);
  assert.match(fs.readFileSync(path.join(root, 'src', 'sefirot.css'), 'utf8'), /\.class-picture/);
});

test('the plan sheet is not a click target: only the table rows open a child', () => {
  const row = pic.buildClassPicture({ grade: 'ב', now: NOW, students: [student('נ-8', 'ב', '', null)] }).rows[0];
  // index.html binds every [data-plan-kid] inside #classPicture to openStudentPlan.
  // The sheet lands in #classPlanSheet, so it must not carry that hook.
  assert.doesNotMatch(pic.renderStudentPlanHtml(row), /data-plan-kid=/);
  assert.match(pic.renderStudentPlanHtml(row), /data-plan-for="נ-8"/);
});
