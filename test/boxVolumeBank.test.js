const test = require('node:test');
const assert = require('node:assert/strict');

const banks = require('../src/lib/banks');
const cur = require('../src/lib/curriculum');

// Grade ב׳ box volume by counting cubes (#410). Every item that builds a box
// out of layers is recomputed from its own wording, so a typo in a number or
// in the answer fails here instead of in front of a class.
const NUM = '(\\d+|אחת)';
const n = (s) => (s === 'אחת' ? 1 : Number(s));
const FORMS = [
  [new RegExp('^תיבה בנויה מ(?:־|ש)' + NUM + ' שכבות?, ובכל שכבה ' + NUM + ' שורות של ' + NUM + ' קוביות\\. כמה קוביות יש בה\\?$'), (m) => n(m[1]) * n(m[2]) * n(m[3])],
  [new RegExp('^תיבה בנויה מ(?:־|ש)כבה ' + NUM + ' של ' + NUM + ' שורות, ובכל שורה ' + NUM + ' קוביות\\. כמה קוביות יש בה\\?$'), (m) => n(m[1]) * n(m[2]) * n(m[3])],
  [/^תיבה בנויה מ־(\d+) שכבות של (\d+) קוביות\. כמה קוביות יש בה\?$/, (m) => n(m[1]) * n(m[2])],
  [/^תיבה בנויה מ־(\d+) שכבות של (\d+) קוביות\. הוסיפו לה עוד שכבה כזאת\. כמה קוביות יש בה עכשיו\?$/, (m) => (n(m[1]) + 1) * n(m[2])],
  [/^בתיבה (\d+) קוביות, ובכל שכבה (\d+) קוביות\. מכמה שכבות היא בנויה\?$/, (m) => n(m[1]) / n(m[2])],
  [/^תיבה אחת בנויה מ־(\d+) שכבות של (\d+) קוביות, ותיבה שנייה מ־(\d+) שכבות של (\d+) קוביות\. בכמה קוביות יש בראשונה יותר\?$/, (m) => n(m[1]) * n(m[2]) - n(m[3]) * n(m[4])],
];

const boxes = () => banks.rowsOf('measurement', 'ב')
  .filter((it) => it.standard === banks.ST.MASS_VOL && /תיבה/.test(it.prompt) && /שכב/.test(it.prompt));

function expected(prompt) {
  for (const [re, f] of FORMS) {
    const m = re.exec(prompt);
    if (m) return f(m);
  }
  return null;
}

test('every grade ב box-volume item has an answer that follows from its prompt', () => {
  const items = boxes();
  assert.ok(items.length >= 10, items.length);
  items.forEach((it) => {
    const want = expected(it.prompt);
    assert.notEqual(want, null, 'unrecognised box prompt: ' + it.prompt);
    assert.ok(Number.isInteger(want) && want > 0 && want <= 100, it.prompt);
    assert.equal(Number(it.answer), want, it.prompt);
    assert.ok(it.hint, 'hint: ' + it.prompt);
    assert.doesNotMatch(it.hint, new RegExp('(^|\\D)' + want + '(\\D|$)'), 'hint gives the answer away: ' + it.prompt);
  });
});

test('box volume reaches past layers × cubes at every level', () => {
  const items = boxes();
  [1, 2, 3].forEach((level) => {
    assert.ok(items.filter((it) => it.level === level).length >= 3, 'level ' + level);
  });
  assert.ok(items.some((it) => /מכמה שכבות/.test(it.prompt)), 'missing-layer item');
  assert.ok(items.some((it) => /עוד שכבה/.test(it.prompt)), 'add-a-layer item');
  assert.ok(items.some((it) => /תיבה שנייה/.test(it.prompt)), 'compare-two-boxes item');
  assert.ok(items.some((it) => /שורות/.test(it.prompt) && it.level === 3), 'rows × columns × layers item');
});

test('box volume items get unique ids, and the curriculum row is covered only because they exist', () => {
  const ids = boxes().map((it) => it.id);
  assert.equal(new Set(ids).size, ids.length);
  ids.forEach((id) => assert.match(id, /^ב-measurement-\d+$/));
  const row = cur.rowsForGrade('ב').find((r) => r.strand === 'measure' && /נפח תיבות/.test(r.topic));
  assert.ok(row, 'curriculum row for box volume');
  assert.equal(row.status, cur.COVERED);
  assert.match(row.note, /השוואת תיבות/);
});
