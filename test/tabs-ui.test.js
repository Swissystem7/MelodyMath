const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('all tabs have valid aria-controls and role', () => {
  const tabs = [...indexHtml.matchAll(/<button[^>]+role="tab"[^>]+aria-controls="([^"]+)"/g)];
  assert.ok(tabs.length > 0, 'Should have tabs');
  tabs.forEach(match => {
    const panelId = match[1];
    assert.match(indexHtml, new RegExp('id="' + panelId + '"[^>]+role="tabpanel"'), 'Missing panel for ' + panelId);
  });
});
