const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const checkHtml = fs.readFileSync(path.join(root, 'check.html'), 'utf8');

test('check.html provides reciprocal header and footer navigation links', () => {
  assert.match(checkHtml, /<p class="note"><a href="index\.html">← חזרה לתרגול<\/a>/);
  assert.match(checkHtml, /<footer>[\s\S]*href="index\.html"[\s\S]*חזרה לתרגול[\s\S]*<\/footer>/);
  assert.match(checkHtml, /<footer>[\s\S]*href="curriculum\.html"[\s\S]*כיסוי תוכנית[\s\S]*<\/footer>/);
  assert.match(checkHtml, /<footer>[\s\S]*href="offer\.html"[\s\S]*ניסוי כיתתי[\s\S]*<\/footer>/);
  assert.match(checkHtml, /footer a:focus-visible\{outline:3px solid var\(--purple\);outline-offset:2px\}/);
});

test('quiz card provides accessible choices group semantics and cancel button', () => {
  assert.match(checkHtml, /<div class="choices" id="quizChoices" role="group" aria-label="אפשרויות תשובה"><\/div>/);
  assert.match(checkHtml, /<button type="button" id="quizCancel" class="secondary">ביטול הבדיקה וחזרה<\/button>/);
});

test('quiz lifecycle isolates report section during test and wires cancellation', () => {
  // Report card must be hidden when starting quiz so students only see quiz items
  assert.match(checkHtml, /\$\('setup'\)\.classList\.add\('hidden'\);\s*\n\s*\$\('report'\)\.classList\.add\('hidden'\);\s*\n\s*\$\('quiz'\)\.classList\.remove\('hidden'\);/);

  // Cancellation ends session cleanly, restores setup and report, and updates status
  assert.match(checkHtml, /function cancelQuiz\(\) \{[\s\S]*?\$\('quiz'\)\.classList\.add\('hidden'\);/);
  assert.match(checkHtml, /function cancelQuiz\(\) \{[\s\S]*?\$\('setup'\)\.classList\.remove\('hidden'\);/);
  assert.match(checkHtml, /function cancelQuiz\(\) \{[\s\S]*?\$\('report'\)\.classList\.remove\('hidden'\);/);
  assert.match(checkHtml, /function cancelQuiz\(\) \{[\s\S]*?\$\('setupStatus'\)\.textContent = 'הבדיקה בוטלה\.';/);
  assert.match(checkHtml, /function cancelQuiz\(\) \{[\s\S]*?\$\('startPre'\)\.focus\(\);/);

  // Completion restores report and advances focus
  assert.match(checkHtml, /function answer\(given\) \{[\s\S]*?\$\('report'\)\.classList\.remove\('hidden'\);/);
  assert.match(checkHtml, /function answer\(given\) \{[\s\S]*?\$\('showReport'\)\.focus\(\);/);

  // Button wiring
  assert.match(checkHtml, /\$\('quizCancel'\)\.onclick = cancelQuiz;/);
});
