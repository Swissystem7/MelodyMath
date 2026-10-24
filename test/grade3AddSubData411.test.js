// #411 — grade ג׳: add/subtract up to רבבה (horizontal and vertical) and
// collecting / organizing / diagrams. Checks the bank content, not just counts.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const vert = require('../src/lib/vertical');
const curriculum = require('../src/lib/curriculum');

const addSub = banks.itemsForGrade('ג').filter((it) => it.grade === 'ג' && it.standard === banks.ST.ADD_SUB_10K);

test('every grade ג add/sub item stays within 10,000', () => {
  assert.ok(addSub.length >= 24, addSub.length);
  addSub.forEach((it) => {
    assert.equal(typeof it.answer, 'number', it.id);
    assert.ok(it.answer >= 0 && it.answer <= 10000, it.id);
    assert.ok(['addition', 'subtraction'].includes(it.skill), it.id);
  });
});

test('vertical items compute to their answer and render without capping', () => {
  const vertical = addSub.filter((it) => it.widget === 'vertical');
  assert.ok(vertical.length >= 12, vertical.length);
  vertical.forEach((it) => {
    const v = it.vert;
    assert.equal(v.op === '+' ? v.a + v.b : v.a - v.b, it.answer, it.id);
    assert.deepEqual(vert.normalizeVertical(v), { a: v.a, b: v.b, op: v.op }, it.id);
    assert.match(it.prompt, /במאונך/, it.id);
  });
  assert.ok(vertical.some((it) => it.vert.op === '-' && it.vert.a === 10000), 'subtract from 10,000');
  assert.ok(vertical.some((it) => it.vert.op === '+' && it.answer === 10000), 'add up to 10,000');
});

test('both operations come horizontal and vertical at every level', () => {
  ['addition', 'subtraction'].forEach((skill) => {
    [1, 2, 3].forEach((level) => {
      const rows = addSub.filter((it) => it.skill === skill && it.level === level);
      assert.ok(rows.some((it) => it.widget === 'vertical'), skill + ' vertical L' + level);
      assert.ok(rows.some((it) => it.widget !== 'vertical'), skill + ' horizontal L' + level);
    });
  });
});

test('horizontal exercises match their written expression', () => {
  addSub.filter((it) => /=\s*\?/.test(it.prompt)).forEach((it) => {
    const m = it.prompt.replace(/,/g, '').match(/(\d+)\s*([+−])\s*(\d+)/);
    assert.ok(m, it.id);
    const a = Number(m[1]); const b = Number(m[3]);
    assert.equal(m[2] === '+' ? a + b : a - b, it.answer, it.id);
  });
});

test('grade ג add/sub has word problems in context', () => {
  const words = addSub.filter((it) => !/=\s*\?|במאונך/.test(it.prompt));
  assert.ok(words.some((it) => it.skill === 'addition'));
  assert.ok(words.some((it) => it.skill === 'subtraction'));
});

test('grade ג data covers collecting, organizing and diagrams at levels 1–3', () => {
  const data = banks.rowsOf('data', 'ג');
  const org = data.filter((it) => it.standard === banks.ST.DATA_ORGANIZE);
  assert.deepEqual(org.map((it) => it.level).sort(), [1, 2, 3]);
  assert.ok(org.some((it) => /\|{5}/.test(it.prompt)), 'tally marks');
  [banks.ST.PICTOGRAM, banks.ST.BARCHART, banks.ST.TABLE].forEach((st) => {
    assert.ok(data.some((it) => it.standard === st), st);
  });
  [1, 2, 3].forEach((level) => assert.ok(data.some((it) => it.level === level), level));
});

test('organize items: the answer follows from the raw list', () => {
  const org = banks.rowsOf('data', 'ג').filter((it) => it.standard === banks.ST.DATA_ORGANIZE);
  const drums = org.find((it) => it.level === 1);
  const list = drums.prompt.split(':')[1].split('.')[0].split(',').map((s) => s.trim());
  assert.equal(list.filter((s) => s === 'תוף').length, drums.answer);
  const survey = org.find((it) => it.level === 3);
  const picks = survey.prompt.split(':')[1].split('.')[0].split(',').map((s) => s.trim());
  const count = (w) => picks.filter((s) => s === w).length;
  assert.equal(count('גיטרה') - count('כינור'), survey.answer);
});

test('chart items agree with their diagram data', () => {
  banks.rowsOf('data', 'ג').forEach((it) => {
    if (it.widget === 'barchart') {
      const values = it.chart.bars.map((b) => b.value);
      assert.ok(values.includes(it.answer) || values.reduce((s, v) => s + v, 0) === it.answer, it.id);
    }
    if (it.widget === 'pictogram') {
      assert.ok(it.chart.rows.every((r) => r.count % it.chart.key === 0), it.id);
    }
  });
});

test('curriculum keeps both grade ג rows covered', () => {
  const g3 = curriculum.coverageMatrix().filter((r) => r.grade === 'ג');
  assert.equal(g3.find((r) => /עד רבבה/.test(r.topic)).status, 'covered');
  assert.equal(g3.find((r) => /איסוף, ארגון, דיאגרמות/.test(r.topic)).status, 'covered');
});
