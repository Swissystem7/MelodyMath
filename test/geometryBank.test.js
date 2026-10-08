const test = require('node:test');
const assert = require('node:assert/strict');

const banks = require('../src/lib/banks');
const geo = require('../src/lib/geometryShapes');
const { isCorrect } = require('../src/lib/adaptive');

const geometry = (grade) => banks.rowsOf('geometry', grade);
const GEO_STANDARDS = [banks.ST.GEO_SORT, banks.ST.RIGHT_ANGLE, banks.ST.ANGLE_KINDS, banks.ST.TRI_SORT,
  banks.ST.PARALLEL, banks.ST.QUAD_SORT, banks.ST.BOX];

test('angleKind names the four angle kinds and refuses what is not an angle', () => {
  assert.equal(geo.angleKind(30), 'חדה');
  assert.equal(geo.angleKind(89.6), 'ישרה');
  assert.equal(geo.angleKind(90), 'ישרה');
  assert.equal(geo.angleKind(91), 'קהה');
  assert.equal(geo.angleKind(180), 'שטוחה');
  [0, -10, 181, 360, NaN, 'abc', null].forEach((d) => assert.equal(geo.angleKind(d), null, String(d)));
});

test('triangleByAngles sorts by the largest angle and rejects angles that are not a triangle', () => {
  assert.equal(geo.triangleByAngles(60, 60, 60), 'חד־זווית');
  assert.equal(geo.triangleByAngles(90, 45, 45), 'ישר־זווית');
  assert.equal(geo.triangleByAngles(100, 40, 40), 'קהה־זווית');
  assert.equal(geo.triangleByAngles(90, 90, 10), null);
  assert.equal(geo.triangleByAngles(180, 0, 0), null);
  assert.equal(geo.triangleByAngles('x', 90, 90), null);
});

test('every grade א׳–ד׳ has tagged geometry items at the base and intermediate level', () => {
  banks.GRADES.forEach((g) => {
    assert.ok(banks.skillsForGrade(g).includes('geometry'), g);
    const rows = geometry(g);
    assert.ok(rows.length >= 12, g + ' has ' + rows.length);
    [1, 2, 3].forEach((lv) => assert.ok(rows.some((it) => it.level === lv), g + ' level ' + lv));
    rows.forEach((it) => {
      assert.equal(it.strand, banks.STRAND.GEO, it.id);
      assert.ok(GEO_STANDARDS.includes(it.standard), it.id + ' ' + it.standard);
    });
  });
});

test('grade ג׳ angle and triangle answers agree with geometryShapes', () => {
  const rows = geometry('ג');
  let angles = 0;
  let triangles = 0;
  rows.forEach((it) => {
    const one = it.prompt.match(/^זווית של (\d+) מעלות/);
    if (one) {
      angles += 1;
      assert.equal(it.answer, geo.angleKind(Number(one[1])), it.id);
    }
    const three = it.prompt.match(/זוויות המשולש הן (\d+), (\d+) ו־(\d+) מעלות/);
    if (three) {
      triangles += 1;
      assert.equal(it.answer, geo.triangleByAngles(three[1], three[2], three[3]), it.id);
    }
  });
  assert.ok(angles >= 3);
  assert.ok(triangles >= 1);
});

test('a choice question always offers its own answer, and the answer is typeable', () => {
  ['ג', 'ד'].forEach((g) => {
    geometry(g).forEach((it) => {
      if (/ או /.test(it.prompt)) assert.ok(it.prompt.includes(String(it.answer)), it.id);
      assert.ok(isCorrect(String(it.answer), it.answer), it.id);
    });
  });
  // The hyphen in a term is not something a child should fail on.
  assert.ok(isCorrect('חד זווית', 'חד־זווית'));
  assert.ok(isCorrect('ישר-זווית', 'ישר־זווית'));
  assert.ok(!isCorrect('חד־זווית', 'קהה־זווית'));
});

test('the diagnostic and personal practice for ג׳ and ד׳ reach the new geometry items', () => {
  ['ג', 'ד'].forEach((g) => {
    const diag = banks.diagnosticItems(g).filter((it) => it.skill === 'geometry');
    assert.deepEqual(diag.map((it) => it.level), [1, 2], g);
    assert.ok(diag.every((it) => it.grade === g), g);
    assert.equal(banks.practiceItems(['geometry'], g).length, geometry(g).length, g);
  });
  assert.equal(banks.coverage().geometry.grade, 'א׳–ד׳');
});

test('item ids of the existing bank did not move', () => {
  const ids = banks.allItems().map((it) => it.id);
  ['א-data-345', 'א-data-349', 'א-measurement-321'].forEach((id) => assert.ok(ids.includes(id), id));
  const newIds = geometry('ג').concat(geometry('ד')).map((it) => Number(it.id.split('-').pop()));
  const oldMax = Math.max(...banks.allItems()
    .filter((it) => it.grade === 'א' || it.grade === 'ב')
    .map((it) => Number(it.id.split('-').pop())));
  assert.ok(Math.min(...newIds) > oldMax, 'new items sit after every older item');
});
