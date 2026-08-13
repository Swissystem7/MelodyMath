const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const pages = ['index.html', 'functions.html', '807.html', 'landing.html'];

function html(name) {
  return fs.readFileSync(path.join(root, name), 'utf8');
}

test('every page is Hebrew RTL and has a language tag', () => {
  for (const page of pages) {
    const h = html(page);
    assert.match(h, /lang="he"/, page);
    assert.match(h, /dir="rtl"/, page);
  }
});

test('answer fields are labelled and feedback is announced live', () => {
  const index = html('index.html');
  assert.match(index, /for="rmAnswer"|id="rmAnswer"[^>]*aria-label/);
  assert.match(index, /for="answer"|id="answer"[^>]*aria-label/);
  assert.match(index, /id="rmFeedback"[^>]*aria-live/);
  assert.match(index, /id="feedback"[^>]*aria-live/);
  const exam = html('807.html');
  assert.match(exam, /id="ans"[^>]*aria-label/);
  assert.match(exam, /id="feedback"[^>]*aria-live/);
});

test('the sonification page exposes a live region for the sweep', () => {
  const fn = html('functions.html');
  assert.match(fn, /id="live"[^>]*aria-live/);
  assert.match(fn, /sweepNarration|announceSweep/);
});

test('shared chrome respects reduced motion', () => {
  const css = fs.readFileSync(path.join(root, 'src/lib/print.css'), 'utf8');
  assert.match(css, /prefers-reduced-motion/);
  assert.match(html('index.html'), /prefers-reduced-motion/);
});

test('pages expose a main landmark and the chrome skip-link target', () => {
  const core = fs.readFileSync(path.join(root, 'src/lib/core.js'), 'utf8');
  assert.match(core, /mm-skip/);
  assert.match(core, /#main/);
  for (const page of pages) {
    assert.match(html(page), /id="main"/, page);
  }
});

test('one-tablet switcher and worksheet controls are labelled', () => {
  const index = html('index.html');
  assert.match(index, /id="rosterChips"/);
  assert.match(index, /id="worksheetSheet"/);
  assert.match(index, /id="metroToggle"/);
  assert.match(index, /id="pwaStatus"/);
  assert.match(index, /id="classBoard"/);
  assert.match(index, /id="parentLetter"/);
  assert.match(index, /id="teacherNote"/);
  assert.match(index, /id="firstRun"/);
  assert.match(index, /id="beatPrompt"/);
  assert.match(index, /id="beatFeedback"[^>]*aria-live/);
  assert.match(index, /id="certSheet"/);
});

test('shared chrome installs a labelled access toolbar', () => {
  const core = fs.readFileSync(path.join(root, 'src/lib/core.js'), 'utf8');
  assert.match(core, /id = 'mm-access'/);
  assert.match(core, /הגדרות נגישות/);
  assert.match(core, /mm-hear/);
  const css = fs.readFileSync(path.join(root, 'src/lib/print.css'), 'utf8');
  assert.match(css, /mm-contrast/);
  assert.match(css, /mm-large/);
});

test('the sonification page exposes landmarks, describe, and A/B compare', () => {
  const fn = html('functions.html');
  assert.match(fn, /id="descBtn"/);
  assert.match(fn, /id="markList"/);
  assert.match(fn, /id="gCompare"/);
  assert.match(fn, /id="lessonPlay"/);
  assert.match(fn, /id="lessonPrompt"/);
  assert.match(fn, /describeGraphHe|announceDescription/);
  assert.match(fn, /ArrowRight|keydown/);
});

test('807 can describe the model and compare log vs linear', () => {
  const exam = html('807.html');
  assert.match(exam, /id="descBtn"/);
  assert.match(exam, /id="cmpBtn"/);
  assert.match(exam, /id="tScrub"/);
  assert.match(exam, /describeExpHe/);
});

test('home and landing do not sell mastery or treatment', () => {
  const index = html('index.html');
  assert.doesNotMatch(index, /סוגרים פערים במתמטיקה/);
  assert.doesNotMatch(index, /שליטה מצוינת/);
  assert.doesNotMatch(index, /הילד שולט בכל המיומנויות/);
  const landing = html('landing.html');
  assert.doesNotMatch(landing, /רישיון כיתתי \/ בית-ספרי/);
  assert.doesNotMatch(landing, /אימון קצבי נקשר במחקר לשיפור/);
  assert.match(landing, /PARK/);
  assert.match(landing, /לא טיפול/);
});
