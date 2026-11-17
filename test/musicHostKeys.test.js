'use strict';
// Every music widget keeps its spec on the shared host under its own key.
// Two modules sharing a key would reveal one module's spec through the other's
// html (this happened once: DivisorWorlds reused DivisionBeats' _divSpec).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('each host spec key is set by exactly one module', () => {
  const sets = [...html.matchAll(/host\.(_\w+Spec)=(?!null)(\w+);/g)].map((m) => m[1]);
  assert.ok(sets.length >= 20, 'found ' + sets.length);
  const dup = sets.filter((k, i) => sets.indexOf(k) !== i);
  assert.deepEqual(dup, []);
});

test('each host spec key is revealed by exactly one module, and reset with the others', () => {
  const reveals = [...html.matchAll(/if\(host\.(_\w+Spec) && typeof (MM_\w+)!=='undefined'\)\{ host\.innerHTML=(MM_\w+)\.html\(host\.(_\w+Spec),\{revealed:true\}\)/g)];
  assert.ok(reveals.length >= 20, 'found ' + reveals.length);
  const owner = {};
  reveals.forEach((m) => {
    assert.equal(m[2], m[3], 'the same module checks and renders');
    assert.equal(m[1], m[4], 'the same key is checked and rendered');
    assert.ok(!owner[m[1]] || owner[m[1]] === m[2], m[1] + ' is revealed by ' + owner[m[1]] + ' and ' + m[2]);
    owner[m[1]] = m[2];
    assert.match(html, new RegExp('host\\.' + m[1] + '=null;'), m[1] + ' is reset');
  });
});
