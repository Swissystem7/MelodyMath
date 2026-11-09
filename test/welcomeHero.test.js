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

test('exactly 6 static grade buttons inside #qsGradePills each with aria-label "כיתה X׳" for א..ו', () => {
  const pillsStart = indexHtml.indexOf('id="qsGradePills"');
  assert.ok(pillsStart !== -1, '#qsGradePills must exist');
  const pillsEnd = indexHtml.indexOf('</div>', pillsStart);
  const pillsBlock = indexHtml.slice(pillsStart, pillsEnd);
  const buttonMatches = [...pillsBlock.matchAll(/<button\b[^>]*>(.*?)<\/button>/g)];
  assert.equal(buttonMatches.length, 6, 'must contain exactly 6 static buttons');

  const grades = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
  grades.forEach((g) => {
    const btn = buttonMatches.find((m) => m[0].includes(`data-qs-grade="${g}"`));
    assert.ok(btn, `button for grade ${g} exists`);
    assert.match(btn[0], new RegExp(`aria-label="כיתה ${g}׳"`));
    assert.equal(btn[1].trim(), `כיתה ${g}׳`);
  });
});

test('the 48px min-height/min-width CSS rule exists for #qsGradePills buttons', () => {
  assert.match(indexHtml, /#qsGradePills\s+button\s*\{[^}]*min-height:\s*48px/);
  assert.match(indexHtml, /#qsGradePills\s+button\s*\{[^}]*min-width:\s*48px/);
});

test('the teacher link with text כניסת מורה / לוח כיתה exists exactly once and id="welcomeHero" appears exactly once', () => {
  const heroMatches = indexHtml.match(/id="welcomeHero"/g) ?? [];
  assert.equal(heroMatches.length, 1, 'id="welcomeHero" appears exactly once');

  const teacherMatches = indexHtml.match(/כניסת מורה \/ לוח כיתה/g) ?? [];
  assert.equal(teacherMatches.length, 1, 'text כניסת מורה / לוח כיתה exists exactly once');

  assert.ok(indexHtml.includes('id="qsTeacherLink"'));
  const heroSection = indexHtml.slice(
    indexHtml.indexOf('id="welcomeHero"'),
    indexHtml.indexOf('id="rmStart"'),
  );
  assert.ok(heroSection.includes('id="qsTeacherLink"'));
  assert.ok(heroSection.includes('כניסת מורה / לוח כיתה'));
});

test('drawGrades no longer calls createElement for grade buttons', () => {
  const drawGradesSrc = indexHtml.slice(
    indexHtml.indexOf('function drawGrades()'),
    indexHtml.indexOf('function drawInsts()'),
  );
  assert.ok(drawGradesSrc.length > 0, 'drawGrades function exists');
  assert.doesNotMatch(drawGradesSrc, /createElement/);
  assert.match(drawGradesSrc, /classList\.toggle\(['"]active['"]/);
  assert.match(drawGradesSrc, /aria-pressed/);
});
