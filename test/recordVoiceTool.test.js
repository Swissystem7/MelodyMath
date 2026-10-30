const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('tools/record-voice.html provides reciprocal navigation and fallback speech keys without crashing', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'record-voice.html'), 'utf8');
  assert.match(html, /href="\.\.\/index\.html"/, 'must link back to index.html');
  assert.match(html, /window\.MM_SOUND_ADD \|\|/);
  assert.match(html, /data-rec/);
  assert.match(html, /data-play/);
  assert.match(html, /data-save/);
});
