// #671 / #691 review item 4: the division questions of TimesTableGroove are
// division by grouping (חילוק להכלה), grade ב׳ topic mm-cur-16 in the
// progression map, not grade ד׳.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const TTG = require('../src/components/TimesTableGroove.js');
const CUR = require('../src/lib/curriculum.js');
const PROG = require('../src/lib/curriculum/progression.js');

const read = (p) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

test('every division question is topic mm-cur-16 (grade ב׳), every product question mm-cur-15', () => {
  TTG.FACTORS.forEach((f) => {
    for (let n = 0; n < 12; n++) {
      const q = TTG.question(f, n);
      assert.equal(q.topicId, q.division ? 'mm-cur-16' : 'mm-cur-15', f + ' #' + n);
    }
  });
  assert.equal(CUR.topicById(TTG.TOPIC.division).grade, 'ב');
  assert.equal(CUR.topicById(TTG.TOPIC.multiplication).grade, 'ב');
  assert.match(CUR.topicById(TTG.TOPIC.division).topic, /להכלה/);
});

test('division builds on the multiplication groove in the progression map', () => {
  assert.ok(PROG.PREREQ[TTG.TOPIC.division][0].includes(TTG.TOPIC.multiplication));
  assert.ok(PROG.BUILDS_TO[TTG.TOPIC.multiplication].includes(TTG.TOPIC.division));
});

test('the division question asks how many groups, never a ratio (that would be mm-cur-26)', () => {
  const q = TTG.question(6, 2);
  assert.equal(q.division, true);
  assert.match(q.he, /^כמה קבוצות של 6 יש ב־\d+\?$/);
  assert.doesNotMatch(q.he, /פי כמה/);
  assert.equal(q.answer * 6, q.factor * q.k);
});

test('no grade ד׳ label is left on the groove or the screen', () => {
  ['src/components/TimesTableGroove.js', 'src/lib/music/groove.js'].forEach((p) => {
    assert.equal(read(p).includes('ד׳'), false, p);
  });
  const html = TTG.renderHtml(TTG.createState({ factor: 4, n: 2 }));
  assert.match(html, /כיתות ב׳–ג׳/);
  assert.equal(html.includes('ד׳'), false);
});
