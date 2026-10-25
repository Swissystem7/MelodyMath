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
  assert.doesNotMatch(blurbMatch[1], /אבחון קליני/);
  assert.match(blurbMatch[1], /מדגם קצר/);
  assert.match(blurbMatch[1], /נענה בעזרת הצלילים/);

  // Button text
  assert.match(html, /id="rmBegin"[^>]*>מתחילים לשחק/);

  // Beat mode stats
  assert.match(html, /id="beatDoneStats"[\s\S]*?קצב בסיום/);

  // Parents screen maintains statutory disclaimer note
  assert.match(html, /זהו מדגם למידה קצר, לא אבחון קליני/);

  // Wire check: simplifyForChild is wired into index.html
  assert.match(html, /simplifyForChild/);

  // Script is precached in sw.js
  const sw = fs.readFileSync(path.resolve(__dirname, '../sw.js'), 'utf8');
  assert.ok(sw.includes('./src/lib/childLanguage.js'));
});

test('lock test: statutory non-clinical notes restored and audience-scoped (FIX-737-NOTES, FIX-737-AUDIENCE)', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

  // 1. rmStartBlurb has short sample and non-medical statement without clinical jargon
  const blurbMatch = html.match(/<p id="rmStartBlurb">([\s\S]*?)<\/p>/);
  assert.ok(blurbMatch, 'rmStartBlurb exists');
  assert.match(blurbMatch[1], /מדגם קצר/);
  assert.doesNotMatch(blurbMatch[1], /אבחון קליני/);
  assert.match(html, /id="rmStartDisclaimer"[^>]*>זהו מדגם קצר, לא אבחון קליני/);

  // 2. Practice-plan text in rmReport contains 'לא אבחון קליני'
  assert.match(html, /זהו מדגם קצר במכשיר — לא אבחון קליני/);

  // 3. All-correct message in rmReport contains 'לא אבחון ואין כאן טענת שליטה'
  assert.match(html, /זה מדגם קצר במכשיר — לא אבחון ואין כאן טענת שליטה/);

  // 4. Parents disclaimer on #rmReport maintains statutory note
  assert.match(html, /id="rmDisclaimer"[^>]*>זהו מדגם למידה קצר, לא אבחון קליני ואין כאן טענת שליטה/);
});
