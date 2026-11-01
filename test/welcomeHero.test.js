// MelodyMath — Welcome Hero and Quick Start flow tests
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('welcomeHero provides intro: what it is, who it is for, and one start button', () => {
  assert.ok(indexHtml.includes('id="welcomeHero"'));
  assert.match(indexHtml, /מה זה MelodyMath/);
  assert.match(indexHtml, /למי זה מתאים/);
  assert.ok(indexHtml.includes('id="qsStartBtn"'));
  assert.match(indexHtml, /מתחילים עכשיו/);
});

test('quick start flow offers 2 simple steps: grade and instrument before launching first exercise', () => {
  assert.ok(indexHtml.includes('id="qsGradeStep"'));
  assert.ok(indexHtml.includes('id="qsInstStep"'));
  assert.ok(indexHtml.includes('id="qsLaunchBtn"'));
  assert.match(indexHtml, /שלב 1 מתוך 2: באיזו כיתה נתרגל היום\?/);
  assert.match(indexHtml, /שלב 2 מתוך 2: באיזה כלי נגינה ננגן\?/);
  assert.match(indexHtml, /קדימה, לתרגיל הראשון!/);
});

test('familyJamCard is placed on the home screen under practice', () => {
  assert.ok(indexHtml.includes('id="familyJamCard"'));
  const remSection = indexHtml.slice(indexHtml.indexOf('id="remediation"'), indexHtml.indexOf('</section>'));
  assert.ok(remSection.includes('id="familyJamCard"'));
  assert.ok(remSection.indexOf('id="familyJamCard"') > remSection.indexOf('id="rmStart"'));
});
