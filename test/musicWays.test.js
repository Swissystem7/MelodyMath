'use strict';
// #597 (part of #591): every grade ב׳, ג׳ and ה׳ item has a music side. Items
// that are not a music activity learn their standard through one of the
// research-backed ways in curriculum/musicWays.js — the way of their level.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = require('../src/lib/banks');
const mw = require('../src/lib/curriculum/musicWays');

const items = mw.grades.flatMap((g) => banks.itemsForGrade(g));
const activityTags = new Set(banks.GRADES.flatMap((g) => banks.itemsForGrade(g))
  .filter((it) => it.music && !it.musicNote).map((it) => it.music));
const wayOf = (it) => {
  const ways = mw.music[Object.keys(mw.music).find((k) => banks.ST[k] === it.standard)];
  return ways[Math.min(it.level, ways.length) - 1];
};

test('the ways cover grades ב, ג and ה', () => {
  assert.deepEqual(mw.grades, ['ב', 'ג', 'ה']);
  assert.ok(items.length > 600);
  items.forEach((it) => assert.ok(it.music, it.id + ' ' + it.prompt));
});

test('a way never replaces a music activity, and never reuses an activity tag', () => {
  items.forEach((it) => {
    if (it.musicNote) assert.ok(!activityTags.has(it.music), it.id + ' ' + it.music);
    else assert.ok(activityTags.has(it.music), it.id + ' ' + it.music);
  });
  Object.values(mw.music).forEach((ways) => ways.forEach(([tag]) => assert.ok(!activityTags.has(tag), tag)));
});

test('every standard is met through three different musical models, one per level', () => {
  Object.keys(mw.music).forEach((k) => {
    assert.ok(banks.ST[k], k);
    assert.equal(Object.keys(banks.ST).filter((s) => banks.ST[s] === banks.ST[k]).length, 1, k + ' shares its text');
    const ways = mw.music[k];
    assert.equal(ways.length, 3, k);
    assert.equal(new Set(ways.map(([tag]) => tag)).size, 3, k + ' repeats a tag');
    assert.equal(new Set(ways.map(([, note]) => note)).size, 3, k + ' repeats a note');
  });
  // Every standard listed is used by an item, so the file holds no dead ways.
  const used = new Set(items.filter((it) => it.musicNote).map((it) => it.standard));
  Object.keys(mw.music).forEach((k) => assert.ok(used.has(banks.ST[k]), k + ' is not used'));
});

test('each way is Hebrew, short, and carries a real source with an evidence label', () => {
  Object.values(mw.music).forEach((ways) => ways.forEach(([tag, note, src, ev]) => {
    assert.match(tag, /^[a-z][A-Za-z]+$/);
    assert.match(note, /[א-ת]/);
    assert.ok(note.length < 140, note.length + ' ' + note);
    assert.ok(banks.MUSIC_SOURCES[src], tag + ' → ' + src);
    assert.ok(['D', 'R', 'A'].includes(ev), tag + ' ' + ev);
  }));
  Object.keys(mw.sources).forEach((id) => {
    assert.match(mw.sources[id][1], /^https:\/\//, id);
    assert.deepEqual(banks.MUSIC_SOURCES[id], mw.sources[id]);
  });
});

test('a way never gives away the answer of the item it is shown with', () => {
  items.filter((it) => it.musicNote).forEach((it) => {
    const nums = it.musicNote.match(/\d+(?:[.,]\d+)*/g) || [];
    assert.ok(!nums.includes(String(it.answer)), it.id + ' ' + it.answer + ' ' + it.musicNote);
  });
});

test('an item takes the way of its level, with its source and label', () => {
  items.filter((it) => it.musicNote).forEach((it) => {
    const [tag, note, src, ev] = wayOf(it);
    assert.equal(it.music, tag, it.id);
    assert.equal(it.musicNote, note, it.id);
    assert.equal(it.musicSrc, src, it.id);
    assert.equal(it.musicEv, ev, it.id);
  });
});

test('every page that loads the bank loads the ways first, and the offline cache carries them', () => {
  ['index.html', 'program.html', 'curriculum.html'].forEach((f) => {
    const html = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    const at = html.indexOf('<script src="src/lib/banks.js">');
    const ways = html.indexOf('<script src="src/lib/curriculum/musicWays.js">');
    assert.ok(ways >= 0 && ways < at, f);
  });
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'), /'\.\/src\/lib\/curriculum\/musicWays\.js'/);
});
