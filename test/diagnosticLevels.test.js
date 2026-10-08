const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');

test('every skill in the diagnostic is asked once at base level and once at intermediate level', () => {
  banks.GRADES.forEach((grade) => {
    const items = banks.diagnosticItems(grade);
    banks.skillsForGrade(grade).forEach((skill) => {
      const levels = items.filter((x) => x.skill === skill).map((x) => x.level);
      assert.deepEqual(levels, [1, 2], grade + ' / ' + skill + ' → ' + levels.join(','));
    });
  });
});

test('the diagnostic still holds two questions per skill of the chosen grade', () => {
  banks.GRADES.forEach((grade) => {
    const items = banks.diagnosticItems(grade);
    assert.equal(items.length, banks.skillsForGrade(grade).length * 2, grade);
    assert.ok(items.every((x) => x.grade === grade), grade);
  });
});

test('the two questions of a skill are different questions', () => {
  banks.GRADES.forEach((grade) => {
    const ids = banks.diagnosticItems(grade).map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length, grade);
  });
});

test('grade א still opens on the five-drum counting item', () => {
  const first = banks.diagnosticItems('א')[0];
  assert.equal(first.skill, 'counting');
  assert.equal(first.level, 1);
  assert.deepEqual(first.hear, [5]);
  assert.ok(first.prompt.includes('🥁🥁🥁🥁🥁'), first.prompt);
});

test('an unknown grade falls back to the grade-א diagnostic', () => {
  assert.deepEqual(
    banks.diagnosticItems('ז').map((x) => x.id),
    banks.diagnosticItems('א').map((x) => x.id)
  );
});
