const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('the pro upgrade button is clearly marked as a demo', () => {
  assert.match(indexHtml, /<button id="rmUpgradeBtn" class="mm-btn upgrade">שדרוג לפרו ⭐ · דמו<\/button>/);
});

test('the pro upgrade area includes a no-charge notice in Hebrew', () => {
  assert.match(indexHtml, /<span id="rmUpgradeNote" class="tag pro-demo-note">הדגמה בלבד · ללא חיוב<\/span>/);
});
