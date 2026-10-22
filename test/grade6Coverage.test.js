// #559: every grade ו׳ topic of Newprogramgrade6.pdf is covered, and only
// because real bank items carry its verified tag — every sub-item of the
// topic included. Answers are recomputed here, not trusted.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cur = require('../src/lib/curriculum');
const banks = require('../src/lib/banks');
const g6 = require('../src/lib/curriculum/grade6');
const { isCorrect } = require('../src/lib/adaptive');

const ST = banks.ST;
const items = banks.itemsForGrade('ו');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('all nine grade ו׳ topics are covered, verified, in the document order, with real exercises', () => {
  assert.equal(cur.coveragePercent('ו').covered, 100);
  const p = cur.programForGrade('ו', items);
  assert.deepEqual(p.rows.map((r) => r.topic), g6.order);
  assert.equal(p.rows.length, 9);
  p.rows.forEach((r, i) => {
    assert.equal(r.status, cur.COVERED, r.topic);
    assert.ok(r.verified && r.page > 0, r.topic);
    if (i) assert.ok(r.page >= p.rows[i - 1].page, r.topic);
    assert.ok(r.exerciseCount >= 10, r.topic + ' has ' + r.exerciseCount);
    assert.ok(cur.MATRIX.find((m) => m.topic === r.topic && m.grade === 'ו').bullets.length >= 2, r.topic);
  });
  // Topic ids stay where they were; the new data row is the last one.
  assert.equal(cur.topicById('mm-cur-51').topic, 'כפל וחילוק שברים');
  assert.equal(cur.topicById('mm-cur-58').topic, 'קריאה והצגה של נתונים');
});

test('every official sub-item has at least three tagged exercises under its own topic', () => {
  g6.rows.forEach((row) => row.bullets.forEach(([text, drills]) => {
    const want = drills.map((k) => { assert.ok(ST[k], k); return ST[k]; });
    const mine = items.filter((it) => want.includes(it.standard) && cur.sectionForItem(it).topic === row.topic);
    assert.ok(mine.length >= 3, text + ' has ' + mine.length);
  }));
});

test('each new grade ו׳ standard has levels 1, 2 and 3, a verified tag and a typable answer', () => {
  Object.keys(ST).filter((k) => k.startsWith('G6_')).forEach((k) => {
    const mine = items.filter((it) => it.standard === ST[k]);
    [1, 2, 3].forEach((lv) => assert.ok(mine.some((it) => it.level === lv), k + ' level ' + lv));
    mine.forEach((it) => {
      assert.ok(cur.sectionForItem(it).verified, it.id);
      assert.ok(isCorrect(String(it.answer), it.answer), it.id);
      if (typeof it.answer === 'number' && it.answer >= 1000) assert.match(it.prompt, /בלי פסיק/, it.id);
    });
  });
});

test('plain grade ו׳ arithmetic agrees with its answers', () => {
  const frac = (s) => s.replace(/(\d+)\/(\d+)/g, '($1/$2)').replace(/(\d+) ו־\(/g, '($1+(').replace(/\+\((\d+\/\d+)\)/g, '+($1))');
  const calc = (s) => Function('return (' + frac(s).replace(/,/g, '').replace(/×/g, '*').replace(/:/g, '/').replace(/−/g, '-') + ')')();
  const value = (a) => (typeof a === 'number' ? a : calc(String(a)));
  let checked = 0;
  items.forEach((it) => {
    const m = /^([\d,.()+−×:/ ו־]+) = \?/.exec(it.prompt);
    if (!m) return;
    checked += 1;
    assert.ok(Math.abs(calc(m[1]) - value(it.answer)) < 1e-9, it.id + ': ' + it.prompt);
  });
  assert.ok(checked >= 25, 'only ' + checked + ' checked');
});

test('every page that loads the curriculum or the bank loads the grade ו׳ file first', () => {
  ['index.html', 'program.html', 'curriculum.html'].forEach((f) => {
    const html = read(f);
    ['curriculum.js', 'banks.js'].forEach((lib) => {
      const at = html.indexOf('<script src="src/lib/' + lib + '">');
      if (at < 0) return;
      const g6at = html.indexOf('<script src="src/lib/curriculum/grade6.js">');
      assert.ok(g6at >= 0 && g6at < at, f + ' ' + lib);
    });
  });
  assert.match(read('sw.js'), /curriculum\/grade6\.js/);
});
