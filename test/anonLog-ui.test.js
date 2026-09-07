const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

test('index.html includes script src for anonLog.js', () => {
  assert.match(indexHtml, /<script\s+src="src\/lib\/anonLog\.js"><\/script>/);
  const anonAt = indexHtml.indexOf('src/lib/anonLog.js');
  const teacherAt = indexHtml.indexOf('src/lib/teacherStore.js');
  assert.ok(anonAt !== -1 && teacherAt !== -1);
  assert.ok(anonAt < teacherAt, 'anonLog.js should load before teacherStore.js');
});

test('index.html logTeacherItem body references logAttempt', () => {
  assert.match(indexHtml, /function logTeacherItem\s*\(/);
  const m = indexHtml.match(/function logTeacherItem\([^)]*\)\{[^}]+\}/);
  assert.ok(m, 'expected logTeacherItem function body');
  assert.match(m[0], /logAttempt/);
  assert.match(m[0], /typeof logAttempt\s*===\s*['"]function['"]/);
});

test('sw.js precaches anonLog.js when sw lists lib files', () => {
  const listsLibs = /src\/lib\//.test(sw);
  assert.ok(listsLibs, 'sw.js is expected to list src/lib assets');
  if (listsLibs) {
    assert.match(sw, /['"]\.\/src\/lib\/anonLog\.js['"]/);
  }
});
