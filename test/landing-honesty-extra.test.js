const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

test('docs/CLAIM_BOUNDARY.md exists and fences mastery/treatment claims', () => {
  const p = path.join(ROOT, 'docs/CLAIM_BOUNDARY.md');
  assert.ok(fs.existsSync(p), 'CLAIM_BOUNDARY.md missing');
  const md = read('docs/CLAIM_BOUNDARY.md');
  assert.match(md, /CLAIM_BOUNDARY|Claim boundary/i);
  assert.match(md, /mastery|שליטה|סוגרים פערים/i);
  assert.match(md, /טיפול|treatment/i);
  assert.match(md, /landing\.html/);
});

test('landing.html still states לא טיפול and refuses mastery sales copy', () => {
  const landing = read('landing.html');
  assert.match(landing, /לא טיפול/);
  assert.doesNotMatch(landing, /סוגרים פערים במתמטיקה/);
  assert.doesNotMatch(landing, /הילד שולט בכל המיומנויות/);
  assert.doesNotMatch(landing, /אימון קצבי נקשר במחקר לשיפור/);
  assert.doesNotMatch(landing, /ADHD|דיסקלקול|dyscalcul/i);
});
