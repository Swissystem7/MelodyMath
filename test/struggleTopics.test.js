const test = require('node:test');
const assert = require('node:assert/strict');
const { struggleTopicsFor } = require('../src/lib/struggleTopics');
const { hookFor } = require('../src/lib/learnerPlan');
const rawData = require('../src/data/struggleTopics.json');

test('struggleTopics schema and sourceUrl validity', () => {
  assert.ok(Array.isArray(rawData));
  assert.ok(rawData.length > 0);

  rawData.forEach((row) => {
    assert.ok(row.grade, 'Row has grade');
    assert.ok(row.topicFragment, 'Row has topicFragment');
    assert.ok(row.he, 'Row has Hebrew topic name');
    assert.ok(row.sourceLabel, 'Row has sourceLabel');
    assert.ok(row.sourceUrl, 'Row has sourceUrl');
    assert.ok(typeof row.activityMin === 'number', 'Row has numeric activityMin');
    assert.ok(row.bankSkill, 'Row has bankSkill');

    const validSource = row.sourceUrl.startsWith('https://rama.gov.il/') || row.sourceUrl.startsWith('https://doi.org/');
    assert.ok(validSource, `sourceUrl must start with https://rama.gov.il/ or https://doi.org/, got: ${row.sourceUrl}`);
  });
});

test('hookFor maps מעבר עשרת to the bass-to-drums hook (#465)', () => {
  assert.equal(hookFor('מעבר עשרת'), 'בס אחד נפרט לעשר מכות תוף');
});

test('topicFragment resolves through hookFor to a non-empty hook', () => {
  rawData.forEach((row) => {
    const hook = hookFor(row.topicFragment);
    assert.ok(typeof hook === 'string' && hook.trim().length > 0, `hookFor("${row.topicFragment}") returned empty hook`);
  });
});

test('struggleTopicsFor(grade) returns at most 3 rows per grade', () => {
  const grades = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
  grades.forEach((grade) => {
    const rows = struggleTopicsFor(grade);
    assert.ok(Array.isArray(rows));
    assert.ok(rows.length <= 3, `Expected at most 3 rows for grade ${grade}, got ${rows.length}`);
    rows.forEach((r) => {
      assert.equal(r.grade, grade);
    });
  });
});
