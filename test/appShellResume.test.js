// MM-716 — resume after reload: index.html saves the diagnostic run per
// student and forgets it on cancel / restart. Browser behaviour is covered by
// e2e/app-shell/resume.spec.js; this keeps the wiring from silently dropping.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('the diagnostic run is saved after each render and each answer', () => {
  assert.match(html, /function mmRunSave\(\)/);
  assert.match(html, /rmAns\.push\(\{skill:q\.skill,correct\}\);if\(typeof mmRunSave==='function'\)mmRunSave\(\);/);
  assert.match(html, /function rmRender\(\)\{[^\n]*if\(typeof mmRunSave==='function'\)mmRunSave\(\)\}/);
});

test('the saved run is per student, expires, and is checked against the item list', () => {
  assert.match(html, /'mm-run-v1:'\+\(w\.name\?/);
  assert.match(html, /MM_RUN_TTL=12\*3600\*1000/);
  assert.match(html, /items\.length!==r\.n\|\|String\(items\[0\]&&items\[0\]\.prompt\)!==r\.first/);
});

test('cancel, "אבחון חדש" and start over forget the run; resume runs on load', () => {
  assert.match(html, /\['rmCancel','rmRestart','rmPlanRestart'\]\.forEach\(id=>\{if\(\$\(id\)\)\$\(id\)\.addEventListener\('click',mmRunClear\)\}\);\s*mmRunResume\(\);/);
  assert.match(html, /id="rmResumeRestart"/);
});
