'use strict';
// #595 (part of #591): every grade א׳ item learns its standard through one of
// several research-backed musical ways listed in curriculum/grade1.js — the
// way of the item's level — with a source and an evidence label.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = require('../src/lib/banks');
const g1 = require('../src/lib/curriculum/grade1');

const one = banks.itemsForGrade('א');
const keyOf = (it) => Object.keys(g1.music).find((k) => banks.ST[k] === it.standard);

test('every grade א׳ item has a music way', () => {
  assert.equal(one.length, 245);
  one.forEach((it) => {
    assert.ok(keyOf(it), it.id + ' ' + it.standard);
    assert.ok(it.music && it.musicNote && it.musicSrc && it.musicEv, it.id);
  });
});

test('every standard is met through three different musical models', () => {
  Object.keys(g1.music).forEach((k) => {
    assert.ok(banks.ST[k], k);
    const ways = g1.music[k];
    assert.equal(ways.length, 3, k);
    assert.equal(new Set(ways.map(([tag]) => tag)).size, 3, k + ' repeats a tag');
    assert.equal(new Set(ways.map(([, note]) => note)).size, 3, k + ' repeats a note');
  });
});

test('each way is Hebrew, short, and carries a real source with an honest label', () => {
  Object.values(g1.music).forEach((ways) => ways.forEach(([tag, note, src, ev]) => {
    assert.match(tag, /^[a-z][A-Za-z]+$/);
    assert.match(note, /[א-ת]/);
    assert.ok(note.length < 140, note.length + ' ' + note);
    assert.ok(g1.sources[src], tag + ' → ' + src);
    // The evaluated programmes in the #591 map taught fractions, not א׳ topics.
    assert.ok(['R', 'A'].includes(ev), tag + ' ' + ev);
  }));
  Object.keys(g1.sources).forEach((id) => {
    const [label, url] = g1.sources[id];
    assert.ok(label.length > 5, id);
    assert.match(url, /^https:\/\//, id);
    assert.deepEqual(banks.MUSIC_SOURCES[id], g1.sources[id], id + ' differs from another grade file');
  });
});

test('an item takes the way of its level, and its note never states the answer', () => {
  one.forEach((it) => {
    const ways = g1.music[keyOf(it)];
    const [tag, note, src, ev] = ways[Math.min(it.level, ways.length) - 1];
    assert.deepEqual([it.music, it.musicNote, it.musicSrc, it.musicEv], [tag, note, src, ev], it.id);
    assert.doesNotMatch(note, new RegExp('(^|\D)' + it.answer + '(\D|$)'), it.id + ' ' + it.prompt);
  });
});

test('every page that loads banks.js loads grade1.js before it, and the app caches it', () => {
  ['index.html', 'curriculum.html', 'program.html'].forEach((page) => {
    const html = fs.readFileSync(path.join(__dirname, '..', page), 'utf8');
    const at = html.indexOf('<script src="src/lib/curriculum/grade1.js">');
    assert.ok(at > 0 && at < html.indexOf('<script src="src/lib/banks.js">'), page);
  });
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /curriculum\/grade1\.js/);
});
