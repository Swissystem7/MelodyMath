// End-of-topic no-music check for missing_factor topics, on the #718 mechanism (Refs #747, Refs #758, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const NM = require('../src/lib/noMusicCheck.js');
const Mastery = require('../src/lib/masteryCheck.js');

test('every missing_factor item: answer × factor = product, and the prompt says so', () => {
  Object.keys(NM.ITEMS).forEach((tid) => {
    NM.ITEMS[tid].forEach((it) => {
      assert.equal(it.answer * it.factor, it.product, it.id);
      assert.equal(it.prompt, it.factor + ' × ? = ' + it.product, it.id);
      assert.equal(it.topicId, tid);
      assert.equal(it.kind, 'missing_factor');
    });
  });
});

test('mm-cur-18, 24, 25 and 31 keep their items; no product twice in one topic', () => {
  assert.deepEqual(Object.keys(NM.ITEMS).sort(), ['mm-cur-18', 'mm-cur-24', 'mm-cur-25', 'mm-cur-31']);
  const first = NM.ITEMS['mm-cur-18'][0];
  assert.deepEqual([first.prompt, first.answer, first.grade, first.buildsFrom], ['4 × ? = 20', 5, 'ב', 'mm-cur-16']);
  assert.ok(NM.ITEMS['mm-cur-24'].some((it) => it.prompt === '6 × ? = 48'));
  Object.keys(NM.ITEMS).forEach((tid) => {
    const products = NM.ITEMS[tid].map((it) => it.product);
    assert.equal(new Set(products).size, products.length, tid + ' repeats a product');
    const ids = NM.ITEMS[tid].map((it) => it.id);
    assert.equal(new Set(ids).size, ids.length);
  });
});

test('a topic without its own items checks 3 items from its LAST level, not the first 3 in the bank', () => {
  const bank = [1, 1, 1, 2, 2, 3, 3, 3, 3].map((level, i) => ({ id: 'b' + i, skill: 'add', level }));
  const pool = NM.checkPool('mm-cur-0', bank);
  assert.equal(pool.length, NM.DEFAULT_COUNT);
  assert.deepEqual(pool.map((it) => it.id), ['b5', 'b6', 'b7']);
  assert.ok(pool.every((it) => it.level === 3));
  assert.deepEqual(NM.checkPool('mm-cur-0', []), []);
  assert.equal(NM.pickCheckItem('mm-cur-0', [], []), null);
});

test('picking reuses masteryCheck.nextPlainItem: a different question after a miss', () => {
  const a = NM.pickCheckItem('mm-cur-24', [], []);
  const b = NM.pickCheckItem('mm-cur-24', [], [a.id]);
  assert.equal(a.id, Mastery.nextPlainItem(NM.ITEMS['mm-cur-24'], []).id);
  assert.notEqual(a.id, b.id);
});

test('two misses send the child back to the picture stage (Renkl & Atkinson 2003)', () => {
  const tracker = Mastery.createMasteryTracker({ storage: null });
  const st = {};
  assert.equal(NM.afterAnswer(st, false, tracker, 'mm-cur-25'), 'retry');
  assert.equal(NM.afterAnswer(st, false, tracker, 'mm-cur-25'), 'picture');
  assert.equal(tracker.get('mm-cur-25').currentStage, 'picture');
  assert.equal(NM.afterAnswer(st, false, tracker, 'mm-cur-25'), 'retry', 'count starts again after going back');
  assert.equal(NM.afterAnswer(st, true, tracker, 'mm-cur-25'), 'pass');
  assert.equal(NM.afterAnswer(st, false, tracker, 'mm-cur-25'), 'retry', 'a right answer clears the misses');
  assert.equal(NM.MISSES_TO_PICTURE, 2);
  assert.equal(NM.SOURCE.url, 'https://doi.org/10.1207/S15326985EP3801_3');
});

test('wired into the #718 check in index.html and cached by sw.js', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /<script src="src\/lib\/masteryCheck\.js"><\/script><script src="src\/lib\/noMusicCheck\.js"><\/script>/);
  assert.match(html, /MM_NO_MUSIC_CHECK\.pickCheckItem\(rmPlanTopic,st\.items,st\.checkUsed\)/);
  assert.match(html, /MM_NO_MUSIC_CHECK\.afterAnswer\(st,ok,/);
  assert.match(html, /mountMasteryCheck\(\$\('masteryCheckHost'\),checkItem/, 'one check mechanism, not two');
  assert.ok(fs.readFileSync('sw.js', 'utf8').includes("'./src/lib/noMusicCheck.js'"));
});
