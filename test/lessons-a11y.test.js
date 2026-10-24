const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('class kids list exposes accessible list role, aria-label, and listitem buttons with aria-pressed', () => {
  assert.match(indexHtml, /id="classKids"[^>]*role="list"[^>]*aria-label="תלמידים במצב כיתה"/);
  assert.match(indexHtml, /role="listitem"\s+data-kid="\${escapeHtml\(n\)}"\s+aria-pressed="\${n===who\.name\?'true':'false'}"/);
});

test('lessons grade filter sets role="group", aria-label, and aria-pressed on filter pills', () => {
  assert.match(indexHtml, /box\.setAttribute\('role',\s*'group'\);/);
  assert.match(indexHtml, /box\.setAttribute\('aria-label',\s*'סינון שיעורים לפי כיתה'\);/);
  assert.match(indexHtml, /data-lesson-filter="\${f\.id}"\s+aria-pressed="\${on \? 'true' : 'false'}"/);
});

test('lesson stepper sets role="group", aria-label, and aria-current on step pills', () => {
  assert.match(indexHtml, /stepper\.setAttribute\('role',\s*'group'\);/);
  assert.match(indexHtml, /stepper\.setAttribute\('aria-label',\s*'שלבי השיעור'\);/);
  assert.match(indexHtml, /data-step-idx="\${idx}"\s+aria-current="\${idx === activeStepIndex \? 'step' : 'false'}"/);
});

test('multiplication and tens explorers expose accessible group roles, labels, and aria-pressed states', () => {
  assert.match(indexHtml, /id="mgGroupBtns"\s+role="group"\s+aria-label="מספר קבוצות"/);
  assert.match(indexHtml, /data-g="\${g}"\s+aria-pressed="\${g === multExplorerGroups}"/);
  assert.match(indexHtml, /id="mgSizeBtns"\s+role="group"\s+aria-label="גודל כל קבוצה"/);
  assert.match(indexHtml, /data-s="\${s}"\s+aria-pressed="\${s === multExplorerSize}"/);
  assert.match(indexHtml, /role="toolbar"\s+aria-label="פעולות עשרות ואחדות"/);
  assert.match(indexHtml, /role="group"\s+aria-label="הוספת לבני שברים"/);
});

test('number line, Euclidean wheel, and parity explorers expose accessible attributes and SVG image semantics', () => {
  assert.match(indexHtml, /id="leStepBtns"\s+role="group"\s+aria-label="גודל דילוג"/);
  assert.match(indexHtml, /data-step="\${s}"\s+aria-pressed="\${s === lineExplorerStep}"/);
  assert.match(indexHtml, /id="eucStepsBtns"\s+role="group"\s+aria-label="סה״כ צעדים במעגל"/);
  assert.match(indexHtml, /id="eucPulsesBtns"\s+role="group"\s+aria-label="צלילים פעילים"/);
  assert.match(indexHtml, /data-p="\${p}"\s+aria-pressed="\${p === euclideanPulses}"/);
  assert.match(indexHtml, /<svg[^>]*role="img"[^>]*aria-label="גלגל מקצב אוקלידי: \${euclideanPulses} קודקודים מתוך \${euclideanSteps} פעימות"/);
  assert.match(indexHtml, /id="eoNumBtns"\s+role="group"\s+aria-label="בחירת מספר לבדיקת זוגיות"/);
  assert.match(indexHtml, /data-n="\${n}"\s+aria-pressed="\${n === evenOddCount}"/);
});

test('polyrhythm and fraction division explorers wire role="group" and aria-pressed attributes', () => {
  assert.match(indexHtml, /id="polyABtns"\s+role="group"\s+aria-label="מחזור תוף א׳"/);
  assert.match(indexHtml, /data-a="\${a}"\s+aria-pressed="\${a === polyrhythmCycleA}"/);
  assert.match(indexHtml, /id="polyBBtns"\s+role="group"\s+aria-label="מחזור תוף ב׳"/);
  assert.match(indexHtml, /data-b="\${b}"\s+aria-pressed="\${b === polyrhythmCycleB}"/);
  assert.match(indexHtml, /id="fdBaseBtns"\s+role="group"\s+aria-label="משך היעד"/);
  assert.match(indexHtml, /data-base="\${k}"\s+aria-pressed="\${k === fractionDivBase}"/);
  assert.match(indexHtml, /id="fdUnitBtns"\s+role="group"\s+aria-label="יחידת החלוקה"/);
  assert.match(indexHtml, /data-unit="\${k}"\s+aria-pressed="\${k === fractionDivUnit}"/);
});
