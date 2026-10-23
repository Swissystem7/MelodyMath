'use strict';
// #591: every grade ו׳ item has a music side. Items that are not a music
// activity get the music link of their standard from curriculum/grade6.js,
// shown in the feedback once the child has answered.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = require('../src/lib/banks');
const g6 = require('../src/lib/curriculum/grade6');

const six = banks.itemsForGrade('ו');
const ACTIVITIES = ['dotted', 'triplet', 'durationDiv', 'ratioHz', 'meanBpm', 'tempo', 'circleFifths', 'mean', 'bars'];

test('every grade ו׳ item has a music tag', () => {
  assert.ok(six.length > 150);
  six.forEach((it) => assert.ok(it.music, it.id + ' ' + it.prompt));
});

test('a link never replaces a music activity, and never reuses its tag', () => {
  six.forEach((it) => {
    if (it.musicNote) assert.ok(!ACTIVITIES.includes(it.music), it.id + ' ' + it.music);
    else assert.ok(ACTIVITIES.includes(it.music), it.id + ' ' + it.music);
  });
  Object.values(g6.music).forEach(([tag]) => assert.ok(!ACTIVITIES.includes(tag), tag));
});

test('every link names a bank standard, is Hebrew, and does not give an answer away', () => {
  Object.keys(g6.music).forEach((k) => assert.ok(banks.ST[k], k));
  Object.values(g6.music).forEach(([, note]) => {
    assert.match(note, /[א-ת]/);
    assert.ok(note.length < 140, note);
  });
  six.filter((it) => it.musicNote).forEach((it) => {
    assert.equal(it.musicNote, g6.music[Object.keys(g6.music).find((k) => banks.ST[k] === it.standard)][1]);
  });
});

test('other grades are untouched', () => {
  ['א', 'ב', 'ג', 'ד', 'ה'].forEach((g) => {
    banks.itemsForGrade(g).forEach((it) => assert.equal(it.musicNote, undefined, it.id));
  });
});

test('the feedback shows the link only after answering, in the diagnostic and the plan', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const fn = (name) => html.split('\n').find((l) => l.startsWith('function ' + name + '('));
  assert.ok(fn('musicNoteHtml').includes('mathHtml(it.musicNote)'));
  assert.ok(fn('rmCheck').includes('${musicNoteHtml(q)}'));
  assert.ok(fn('rpCheck').includes('${musicNoteHtml(it)}'));
  assert.ok(!fn('rmRender').includes('musicNote'));
  assert.ok(!fn('rpRender').includes('musicNote'));
});
