const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const store = require('../src/lib/teacherStore');
const learner = require('../src/lib/learnerPlan');

function memory() {
  const m = Object.create(null);
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
  };
}

function dana() {
  const ls = memory();
  store.upsertStudent('ג1', 'דנה', ls);
  const s = store.startSession('ג1', 'דנה', 'class', ls);
  store.addItem('ג1', 'דנה', s.id, { skill: 'כפל', prompt: '3×4', correct: false }, ls);
  store.addItem('ג1', 'דנה', s.id, { skill: 'כפל', prompt: '3×4', correct: false }, ls);
  store.addItem('ג1', 'דנה', s.id, { skill: 'חיבור', prompt: '2+2', correct: true }, ls);
  return store.getStudent('ג1', 'דנה', ls);
}

// Captured from master before #468: a letter without a plan must not change by one byte.
const BEFORE = '<article class="parent-note"><p class="sheet-kicker">מכתב קצר להורה — MelodyMath — דנה · ג1</p><p>שלום,</p><p>במכשיר בבית הספר נרשם תרגול קצר של <b>דנה</b>. זה דף סיכום להורה, לא מבחן.</p><p><b>במכשיר:</b> 1 נכונות מתוך 3.</p><p><b>לפי מיומנות</b></p><ul class="err-list"><li>כפל: 0 מתוך 2</li><li>חיבור: 1 מתוך 1</li></ul><p><b>תרגילים שחזרו כשגיאה</b></p><ul class="err-list"><li>3×4 — 2 פעמים</li></ul><p class="sheet-note">המספרים הם ספירה של תשובות במכשיר הזה — לא ציון, לא אבחון, ולא הוכחה שהתרגול עוזר. MelodyMath הוא דף דפדפן בלי שרת. אין כאן טיפול ואין טענת יעילות.</p></article>';

test('a parent letter without a plan is byte-identical to the letter before #468', () => {
  const note = store.buildParentNote(dana(), { classCode: 'ג1' });
  assert.equal(store.renderParentNoteHtml(note), BEFORE);
  assert.equal('planTopic' in note, false);
  assert.equal(store.renderParentNoteHtml(store.buildParentNote(dana(), { classCode: 'ג1', plan: null })), BEFORE);
  const invalid = learner.buildLearnerPlan({ grade: 'ז' });
  assert.equal(store.renderParentNoteHtml(store.buildParentNote(dana(), { classCode: 'ג1', plan: invalid })), BEFORE);
});

test('with a plan the letter names the one topic, the hook, the weekly pace and a home tip', () => {
  const student = dana();
  const plan = learner.buildLearnerPlan({ grade: 'ג', student, name: 'דנה', now: Date.now() });
  assert.ok(plan.ok);
  const note = store.buildParentNote(student, { classCode: 'ג1', plan });
  assert.equal(note.planTopic, plan.topic);
  assert.equal(note.planHook, plan.hook);
  assert.equal(note.paceExpected, plan.paceExpected);
  assert.equal(note.paceDone, plan.paceDone);
  const html = store.renderParentNoteHtml(note);
  assert.ok(html.includes('<h3>על מה דנה עובד/ת עכשיו</h3>'));
  assert.ok(html.includes(store.escapeHtml(plan.hook)));
  assert.ok(html.includes(plan.paceDone + ' מתוך ' + plan.paceExpected + ' מפגשים השבוע.'));
  assert.ok(html.includes('<b>5 דקות בבית:</b> ' + note.homeTip));
  // The section sits after the counts and before the repeated errors; the disclaimer is unchanged.
  assert.ok(html.indexOf('לפי מיומנות') < html.indexOf('על מה דנה'));
  assert.ok(html.indexOf('על מה דנה') < html.indexOf('תרגילים שחזרו כשגיאה'));
  assert.ok(html.endsWith(BEFORE.slice(BEFORE.indexOf('<p class="sheet-note">'))));
});

test('the home tip follows the plan topic', () => {
  const tip = (topic) => store.buildParentNote(null, { plan: { ok: true, topic, hook: 'x', paceDone: 1, paceExpected: 3 } }).homeTip;
  assert.equal(tip('ספירה עד 100'), 'ספרו יחד 10 פעימות בכפיים, ואז הלאה מ-10');
  assert.equal(tip('מנייה עד 100'), 'ספרו יחד 10 פעימות בכפיים, ואז הלאה מ-10');
  assert.equal(tip('לוח כפל'), 'אמרו את הכפולות של 5 עם מחיאת כף');
  assert.equal(tip('חיסור עם פריטה'), 'פרטו שטר של 10 למטבעות');
  assert.equal(tip('כפל וחילוק שברים'), '5 דקות תרגול במכשיר, בלי לחץ');
  assert.equal(tip('מצולעים'), '5 דקות תרגול במכשיר, בלי לחץ');
});

test('index.html passes the learner plan into the parent letter', () => {
  const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(index, /buildParentNote\(student,\{[^}]*plan:typeof buildLearnerPlan==='function'\?buildLearnerPlan\(\{grade:selectedGrade,student:student,name:who\.name/);
});
