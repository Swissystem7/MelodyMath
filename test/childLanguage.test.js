'use strict';
// Tests for child-friendly Hebrew language pass across child screens (Refs #665, complements #677).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const childLang = require('../src/lib/childLanguage.js');

test('simplifyForChild replaces clinical/diagnostic jargon with friendly child terms', () => {
  assert.equal(childLang.simplifyForChild('אבחון קצר לכיתה א׳'), 'משחק היכרות לכיתה א׳');
  assert.equal(childLang.simplifyForChild('מדגם לפי הכיתה שנבחרה'), 'שאלות קצרות לכיתה שנבחרה');
  assert.equal(childLang.simplifyForChild('מעבר אל דוח הפערים'), 'מעבר אל ההתקדמות שלי');
  assert.equal(childLang.simplifyForChild('מוקדי כשל במתמטיקה'), 'נושאים לחיזוק במתמטיקה');
  assert.equal(childLang.simplifyForChild('תרגול ברמת בסיס ורמת ביניים'), 'תרגול בשלב ראשון ושלב שני');
});

test('isChildFriendly flags technical, clinical, and adult research jargon', () => {
  assert.equal(childLang.isChildFriendly('משחק היכרות עם צלילים'), true);
  assert.equal(childLang.isChildFriendly('קצב של 80 פעימות'), true);
  assert.equal(childLang.isChildFriendly('כל הכבוד! עניתם נכון'), true);

  assert.equal(childLang.isChildFriendly('מדגם קצר וזה לא אבחון קליני'), false);
  assert.equal(childLang.isChildFriendly('שאלה ברמת M1'), false);
  assert.equal(childLang.isChildFriendly('קצב של 80 BPM'), false);
  assert.equal(childLang.isChildFriendly('תדר של 440 Hz'), false);
  assert.equal(childLang.isChildFriendly('מעטפת ADSR'), false);
  assert.equal(childLang.isChildFriendly('דוח פערים להורה'), false);
  assert.equal(childLang.isChildFriendly('זיהוי מוקדי כשל'), false);
});

test('index.html child-facing practice screens contain no visible clinical/diagnostic text', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

  // Verify child-facing text in remediation start card
  assert.doesNotMatch(html, /id="rmGradeTag"[^>]*>אבחון/);
  assert.match(html, /id="rmGradeTag"[^>]*>משחק היכרות/);

  const startCardMatch = html.match(/<div id="rmStart"[\s\S]*?<\/div>/);
  assert.ok(startCardMatch, 'rmStart card exists');
  assert.doesNotMatch(startCardMatch[0], /מדגם לפי הכיתה/);
  assert.match(startCardMatch[0], /שאלות קצרות לכיתה שנבחרה/);

  const blurbMatch = html.match(/<p id="rmStartBlurb">([\s\S]*?)<\/p>/);
  assert.ok(blurbMatch, 'rmStartBlurb exists');
  assert.doesNotMatch(blurbMatch[1], /אבחון|מדגם קצר/);
  // rmQuiz takes a typed answer, so the blurb must not promise answering by sound.
  assert.doesNotMatch(blurbMatch[1], /נענה בעזרת הצלילים/);
  assert.match(blurbMatch[1], /כותבים במקלדת/);
  assert.match(html, /id="rmAnswer"[^>]*placeholder="הקלידו תשובה"/);

  // Button text
  assert.match(html, /id="rmBegin"[^>]*>מתחילים לשחק/);

  // Beat mode stats
  assert.match(html, /id="beatDoneStats"[\s\S]*?קצב בסיום/);

  // Parents screen maintains statutory disclaimer note
  assert.match(html, /זהו מדגם למידה קצר, לא אבחון קליני/);

  // Gate note and practice-plan buttons are shown to the child
  const gateDiag = (html.match(/<span id="gateNoteDiag"[^>]*>([^<]*)<\/span>/) || [])[1] || '';
  assert.ok(gateDiag && childLang.isChildFriendly(gateDiag) && !/אבחון/.test(gateDiag), 'gateNoteDiag uses child language');
  const planActions = (html.match(/<div id="rmPlanDoneActions"[\s\S]*?<\/div>/) || [])[0] || '';
  assert.ok(planActions, 'rmPlanDoneActions exists');
  assert.doesNotMatch(planActions, /אבחון|דוח הפערים/);

  // rmReport is shown to the child right after the quiz
  assert.match(html, /<div id="rmReport"[^>]*><span class="tag">ההתקדמות שלי<\/span>/);
  assert.doesNotMatch(html, /<span class="tag">דוח פערים להורה<\/span>/);

  // Wire check: simplifyForChild is wired into index.html
  assert.match(html, /simplifyForChild/);

  // Script is precached in sw.js
  const sw = fs.readFileSync(path.resolve(__dirname, '../sw.js'), 'utf8');
  assert.ok(sw.includes('./src/lib/childLanguage.js'));
});

test('lock test: statutory non-clinical notes restored and audience-scoped (FIX-737-NOTES, FIX-737-AUDIENCE)', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

  // The notes live on the teacher report panel, not on the cards the child sees.
  const teacher = (html.match(/<section id="teacherReport"[\s\S]*?<\/section>/) || [])[0] || '';
  const kid = (html.match(/<section id="remediation"[\s\S]*?<\/section>/) || [])[0] || '';
  assert.ok(teacher && kid, 'teacherReport and remediation panels exist');
  assert.match(teacher, /id="rmStartDisclaimer"[^>]*>זהו מדגם קצר, לא אבחון קליני\./);
  assert.match(teacher, /id="rmDisclaimer"[^>]*>זהו מדגם למידה קצר, לא אבחון קליני ואין כאן טענת שליטה\./);
  assert.doesNotMatch(kid, /id="rmStartDisclaimer"|id="rmDisclaimer"|אבחון קליני|טענת שליטה/);
  const report = (kid.match(/<div id="rmReport"[^\n]*/) || [])[0] || '';
  assert.ok(report, 'rmReport card exists');
  assert.doesNotMatch(report, /rmDisclaimer/);
  // The quiz summary the child reads drops the clinical clauses.
  assert.doesNotMatch(html, /מדגם קצר במכשיר — לא אבחון/);
});

test('every visible string on the child screens and in the exercise banks is child-friendly', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  const kid = (html.match(/<section id="remediation"[\s\S]*?<\/section>/) || [])[0] || '';
  assert.ok(kid, 'remediation panel exists');
  const shown = kid.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '')
    .split(/<[^>]*>/).map((s) => s.trim()).filter((s) => /[א-ת]/.test(s));
  const attrs = [...kid.matchAll(/\s(?:aria-label|placeholder|title)="([^"]*)"/g)].map((m) => m[1]);
  assert.ok(shown.length > 10, 'extracted the child screen text');
  [...shown, ...attrs].forEach((s) => assert.ok(childLang.isChildFriendly(s), 'not child-friendly: ' + s));

  const banks = require('../src/lib/banks.js');
  const items = banks.allItems();
  assert.ok(items.length > 100, 'bank items loaded');
  items.forEach((it) => {
    [it.prompt, it.hint, banks.skillHe(it.skill), banks.levelHe(it.level)].forEach((s) => {
      if (typeof s === 'string') assert.ok(childLang.isChildFriendly(s), 'bank text not child-friendly: ' + s);
    });
  });
});

test('runtime kid text goes through simplifyForChild with an isChildFriendly dev guard', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
  const fn = (html.match(/function kidText\(s\)\{[^\n]*/) || [])[0] || '';
  assert.match(fn, /\.simplifyForChild\(s\)/);
  assert.match(fn, /\.isChildFriendly\(t\)/);
  assert.match(fn, /console\.warn/);
  assert.match(html, /\$\('rmSkill'\)\.textContent=kidText\(/);
  assert.match(html, /\$\('rmSummary'\)\.innerHTML=kidText\(/);
  assert.match(html, /\$\('rmSummary'\)\.textContent=kidText\(/);
  assert.match(html, /\$\('beatMeta'\)\.textContent=kidText\(/);
  // kidText runs the real module in the browser; the same pass leaves kid summaries intact.
  const s = childLang.simplifyForChild('כל הכבוד! בשאלות של הכיתה הזו כל התשובות היו נכונות.');
  assert.equal(s, 'כל הכבוד! בשאלות של הכיתה הזו כל התשובות היו נכונות.');
  assert.ok(childLang.isChildFriendly(s));
});
