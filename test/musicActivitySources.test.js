'use strict';
// #591 audit item 2: every item with a music side — a way or a music
// activity — names a known source and an evidence label.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');

test('every music item cites a known source with D, R or A', () => {
  const missing = banks.allItems()
    .filter((it) => it.music && !(banks.MUSIC_SOURCES[it.musicSrc] && ['D', 'R', 'A'].includes(it.musicEv)))
    .map((it) => it.grade + ' ' + it.music);
  assert.deepEqual([...new Set(missing)], []);
});

test('a music activity claims D only on a fraction item', () => {
  banks.allItems()
    .filter((it) => !it.musicNote && it.musicEv === 'D')
    .forEach((it) => assert.equal(it.skill.includes('fraction'), true, it.id + ' ' + it.music));
});
