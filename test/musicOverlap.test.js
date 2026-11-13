'use strict';
// No bank item is played by two music modules. Two owners would mean the item's
// sound depends on the order of the branches in index.html, and that one
// module's research and tests describe an exercise the child never hears.
// (Found once: BigNumbers also claimed seven DragPlace items.)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const banks = require('../src/lib/banks');
const dir = path.join(__dirname, '..', 'src', 'lib', 'music');

test('every bank item is played by at most one music module', () => {
  const mods = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => {
    try { return [f, require(path.join(dir, f))]; } catch (e) { return null; }   // browser-only files
  }).filter((x) => x && x[1] && typeof x[1].specForItem === 'function');
  assert.ok(mods.length >= 25, 'modules: ' + mods.length);
  const twice = [];
  banks.allItems().forEach((it) => {
    const owners = mods.filter(([, m]) => { try { return !!m.specForItem(it); } catch (e) { return false; } }).map(([f]) => f);
    if (owners.length > 1) twice.push(owners.join('+') + ' | ' + it.prompt);
  });
  assert.deepEqual(twice, []);
});
