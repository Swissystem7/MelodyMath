'use strict';
// #591: every item of a grade with a ways file learns its standard through
// music. A prompt that already plays sound is a music activity; every other
// item takes the research-backed way of its level from the grade file, with a
// source and an evidence label. Grades without a ways file are untouched.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = require('../src/lib/banks');

const FILES = { 'ו': require('../src/lib/curriculum/grade6'), 'א': require('../src/lib/curriculum/grade1'), 'ד': require('../src/lib/curriculum/grade4'), 'ה': require('../src/lib/curriculum/grade5'), 'ג': require('../src/lib/curriculum/grade3'), 'ב': require('../src/lib/curriculum/grade2') };
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

const keyOf = (file, it) => Object.keys(file.music).find((k) => banks.ST[k] === it.standard);
const wayOf = (file, it) => {
  const ways = file.music[keyOf(file, it)];
  return ways && ways[Math.min(it.level, ways.length) - 1];
};

Object.keys(FILES).forEach((grade) => {
  const file = FILES[grade];
  const items = banks.itemsForGrade(grade);

  test('grade ' + grade + ': every item has a music side, activity or way', () => {
    assert.ok(items.length > 100);
    items.forEach((it) => assert.ok(it.music, it.id + ' ' + it.prompt));
    items.forEach((it) => {
      if (it.musicNote) {
        assert.ok(it.musicSrc && it.musicEv, it.id);
        const way = wayOf(file, it);
        assert.ok(way, it.id + ' has no way for ' + it.standard + ' level ' + it.level);
        assert.deepEqual([it.music, it.musicNote, it.musicSrc, it.musicEv], way, it.id);
      } else {
        assert.ok(banks.MUSIC_SOURCES[it.musicSrc] && it.musicEv, it.id + ' activity ' + it.music);
      }
    });
  });

  test('grade ' + grade + ': every standard with items is met through at least two musical models', () => {
    Object.keys(file.music).forEach((k) => {
      assert.ok(banks.ST[k], grade + ' ' + k + ' is not a bank standard');
      const ways = file.music[k];
      assert.ok(ways.length >= 2 && ways.length <= 3, k);
      assert.equal(new Set(ways.map(([tag]) => tag)).size, ways.length, k + ' repeats a tag');
      assert.equal(new Set(ways.map(([, note]) => note)).size, ways.length, k + ' repeats a note');
    });
    const byStd = {};
    items.filter((it) => it.musicNote).forEach((it) => {
      const s = byStd[it.standard] || (byStd[it.standard] = { levels: new Set(), tags: new Set() });
      s.levels.add(it.level);
      s.tags.add(it.music);
    });
    Object.keys(byStd).forEach((std) => {
      if (byStd[std].levels.size >= 2) assert.ok(byStd[std].tags.size >= 2, grade + ' ' + std);
    });
    // A way tag is never an activity tag of the same grade.
    const activityTags = new Set(items.filter((it) => !it.musicNote).map((it) => it.music));
    Object.values(file.music).forEach((ways) => ways.forEach(([tag]) => assert.ok(!activityTags.has(tag), grade + ' ' + tag)));
  });

  test('grade ' + grade + ': each way is Hebrew, short, and carries a real source with an evidence label', () => {
    Object.values(file.music).forEach((ways) => ways.forEach(([tag, note, src, ev]) => {
      assert.match(tag, /^[a-z][A-Za-z0-9]+$/);
      assert.match(note, /[א-ת]/);
      assert.ok(note.length < 140, note.length + ' ' + note);
      assert.ok(file.sources[src], grade + ' ' + tag + ' → ' + src);
      assert.ok(['D', 'R', 'A'].includes(ev), tag + ' ' + ev);
    }));
    Object.keys(file.sources).forEach((id) => {
      const [label, url] = file.sources[id];
      assert.ok(label.length > 5, id);
      assert.match(url, /^https:\/\//, id);
      assert.deepEqual(banks.MUSIC_SOURCES[id], file.sources[id], id + ' differs between grade files');
    });
  });
});

test('grade א׳: a prompt that plays sound is a music activity, not a way', () => {
  const items = banks.itemsForGrade('א');
  const hear = items.filter((it) => it.hear && it.hear.length);
  const g1 = items.filter((it) => it.g1);
  assert.ok(hear.length >= 10 && g1.length >= 3);
  hear.forEach((it) => assert.equal(it.music, 'hearBeats', it.id));
  g1.forEach((it) => assert.equal(it.music, 'g1' + it.g1.kind.charAt(0).toUpperCase() + it.g1.kind.slice(1), it.id));
  hear.concat(g1).forEach((it) => assert.equal(it.musicNote, undefined, it.id));
  assert.equal(items.filter((it) => it.musicNote).length, items.length - hear.length - g1.length);
});

test('grade ד׳: a 4/4-bar fraction item is music notation already, an activity and not a way', () => {
  const items = banks.itemsForGrade('ד');
  const bars = items.filter((it) => it.widget === 'bar44');
  assert.ok(bars.length >= 10);
  bars.forEach((it) => assert.equal(it.music, 'bar44Notes', it.id));
  bars.forEach((it) => assert.equal(it.musicNote, undefined, it.id));
  assert.equal(items.filter((it) => it.musicNote).length, items.length - bars.length);
});

test('grade ה׳: the music activities of #106 keep their tag and take no way', () => {
  const items = banks.itemsForGrade('ה');
  const acts = items.filter((it) => !it.musicNote);
  assert.ok(acts.length >= 30);
  acts.forEach((it) => assert.ok(['bars', 'lcm', 'mixedBar', 'bpm', 'secPerBeat', 'drumsMeet', 'meters', 'hzChart'].includes(it.music), it.id + ' ' + it.music));
  assert.equal(items.filter((it) => it.musicNote).length, items.length - acts.length);
});

test('grade ג׳: the #105 activities keep their tag and the g3 widgets become activities, no way', () => {
  const items = banks.itemsForGrade('ג');
  const g3 = items.filter((it) => it.g3);
  assert.ok(g3.length >= 20);
  g3.forEach((it) => assert.equal(it.music, 'g3' + it.g3.kind.charAt(0).toUpperCase() + it.g3.kind.slice(1), it.id));
  const acts = items.filter((it) => !it.musicNote);
  acts.forEach((it) => assert.ok(it.g3 || ['meters', 'tuneTime', 'stepGrid', 'leftoverBeats', 'howManyTimes', 'hzCompare'].includes(it.music), it.id + ' ' + it.music));
  assert.equal(items.filter((it) => it.musicNote).length, items.length - acts.length);
});

test('grade ב׳: the #103 activities keep their tag and take no way', () => {
  const items = banks.itemsForGrade('ב');
  const acts = items.filter((it) => !it.musicNote);
  assert.ok(acts.length >= 50);
  acts.forEach((it) => assert.ok(['beatsBars', 'twoInstruments', 'evenOdd', 'registers', 'halfBar'].includes(it.music), it.id + ' ' + it.music));
  assert.equal(items.filter((it) => it.musicNote).length, items.length - acts.length);
});

test('every item of every grade has a music side: 1193/1193', () => {
  const all = banks.allItems();
  assert.equal(all.length, 1193);
  assert.equal(all.filter((it) => it.music).length, all.length);
  assert.equal(all.filter((it) => it.musicNote && !(it.musicSrc && it.musicEv)).length, 0);
  assert.deepEqual(banks.GRADES.filter((g) => !FILES[g]), []);
});

test('a music-side file adds no curriculum rows, loads before banks.js on every page, and is cached offline', () => {
  [['א', 'grade1'], ['ד', 'grade4'], ['ה', 'grade5'], ['ג', 'grade3'], ['ב', 'grade2']].forEach(([grade, name]) => {
    const file = FILES[grade];
    assert.equal(file.rows, undefined, name);
    assert.deepEqual(file.items, [], name);
    ['index.html', 'program.html', 'curriculum.html'].forEach((f) => {
      const html = read(f);
      const at = html.indexOf('<script src="src/lib/banks.js">');
      const fat = html.indexOf('<script src="src/lib/curriculum/' + name + '.js">');
      assert.ok(at > 0 && fat >= 0 && fat < at, f + ' ' + name);
    });
    assert.ok(read('sw.js').includes('curriculum/' + name + '.js'), name);
  });
  assert.ok(Number(read('sw.js').match(/melodymath-offline-v(\d+)/)[1]) >= 27, 'a new asset, so CACHE moves');
});
