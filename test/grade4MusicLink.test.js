'use strict';
// #596 (part of #591): every grade ד׳ item learns its standard through one of
// several research-backed musical ways listed in curriculum/grade4Music.js —
// the way of the item's level — each with a source and an evidence label.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = require('../src/lib/banks');
const g4 = require('../src/lib/curriculum/grade4Music');
const g6 = require('../src/lib/curriculum/grade6');

const four = banks.itemsForGrade('ד');
const wayOf = (it) => {
  const key = Object.keys(g4.music).find((k) => banks.ST[k] === it.standard);
  const ways = g4.music[key];
  return ways[Math.min(it.level, ways.length) - 1];
};

test('every grade ד׳ item has a musical way of its level, with its source and label', () => {
  assert.equal(four.length, 134);
  four.forEach((it) => {
    const [tag, note, src, ev] = wayOf(it);
    assert.equal(it.music, tag, it.id);
    assert.equal(it.musicNote, note, it.id);
    assert.equal(it.musicSrc, src, it.id);
    assert.equal(it.musicEv, ev, it.id);
  });
});

test('every standard is met through at least two different musical models', () => {
  Object.keys(g4.music).forEach((k) => {
    assert.ok(banks.ST[k], k);
    const ways = g4.music[k];
    assert.ok(ways.length >= 2 && ways.length <= 3, k);
    assert.equal(new Set(ways.map(([tag]) => tag)).size, ways.length, k + ' repeats a tag');
    assert.equal(new Set(ways.map(([, note]) => note)).size, ways.length, k + ' repeats a note');
  });
  const byStd = {};
  four.forEach((it) => {
    const s = byStd[it.standard] || (byStd[it.standard] = { levels: new Set(), tags: new Set() });
    s.levels.add(it.level);
    s.tags.add(it.music);
  });
  Object.keys(byStd).forEach((std) => {
    if (byStd[std].levels.size >= 2) assert.ok(byStd[std].tags.size >= 2, std);
  });
});

test('each way is Hebrew, short, and carries a real source with an evidence label', () => {
  const used = new Set();
  Object.values(g4.music).forEach((ways) => ways.forEach(([tag, note, src, ev]) => {
    assert.match(tag, /^[a-z][A-Za-z]+$/);
    assert.match(note, /[א-ת]/);
    assert.ok(note.length < 140, note.length + ' ' + note);
    assert.ok(g4.sources[src], tag + ' → ' + src);
    assert.ok(['D', 'R', 'A'].includes(ev), tag + ' ' + ev);
    used.add(src);
  }));
  Object.keys(g4.sources).forEach((id) => {
    const [label, url] = g4.sources[id];
    assert.ok(used.has(id), id + ' is never used');
    assert.ok(label.length > 5, id);
    assert.match(url, /^https:\/\//, id);
    // The same research map as grade ו׳: an id shared with it is the same source.
    if (g6.sources[id]) assert.deepEqual(g4.sources[id], g6.sources[id], id);
    assert.deepEqual(banks.MUSIC_SOURCES[id], g4.sources[id]);
  });
});

test('a note never gives an item its answer', () => {
  four.forEach((it) => {
    const a = String(it.answer);
    if (/^\d{2,}$/.test(a)) assert.ok(!it.musicNote.includes(a), it.id + ' ' + a);
  });
});

test('every page that loads banks.js loads grade4Music.js before it, and works offline', () => {
  const root = path.join(__dirname, '..');
  ['index.html', 'curriculum.html', 'program.html'].forEach((page) => {
    const html = fs.readFileSync(path.join(root, page), 'utf8');
    const at = html.indexOf('<script src="src/lib/curriculum/grade4Music.js">');
    assert.ok(at > 0 && at < html.indexOf('<script src="src/lib/banks.js">'), page);
  });
  assert.ok(fs.readFileSync(path.join(root, 'sw.js'), 'utf8').includes("'./src/lib/curriculum/grade4Music.js'"));
});
