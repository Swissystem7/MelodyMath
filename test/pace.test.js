const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const pace = require('../src/lib/pace');
const cur = require('../src/lib/curriculum');
const plan = require('../src/lib/learnerPlan');

test('every curriculum topic has one parent goal and one typical range, and no other topic does', () => {
  const covered = pace.TOPIC_PACE.map((r) => r[0]);
  assert.deepEqual(covered.slice().sort(), cur.MATRIX.map((r) => r.topicId).sort());
  assert.equal(new Set(covered).size, covered.length);
  pace.TOPIC_PACE.forEach((row) => {
    // The anchor pins the row to its topic, so a reordered matrix fails here.
    const topic = cur.topicById(row[0]);
    assert.ok(topic.topic.indexOf(row[1]) !== -1, row[0] + ' anchor «' + row[1] + '» is not in «' + topic.topic + '»');
    assert.ok(row[2].length > 12 && /[.]$/.test(row[2]), row[0] + ' needs a full parent sentence');
    assert.ok(Number.isInteger(row[3]) && Number.isInteger(row[4]) && row[3] >= 1 && row[3] < row[4], row[0]);
    // Goals promise work, not outcomes, and never label the child.
    assert.doesNotMatch(row[2], /שולט|מובטח|חלש|מתקשה|לקוי|יבטיח/, row[0]);
  });
  assert.match(pace.topicPace('mm-cur-32').source, /Azaryahu/);
  assert.match(pace.paceNote(), /טווח טיפוסי/);
  assert.match(pace.paceNote(), /אין טענה שהקצב משפר מתמטיקה/);
});

test('topicPace resolves a topicId or the exact topic text, and nothing else', () => {
  const byId = pace.topicPace('mm-cur-24');
  assert.equal(byId.grade, 'ג');
  assert.equal(byId.weeksRange, '4–8');
  assert.equal(byId.sessionsRange, '12–24');
  assert.equal(byId.sessionsTypical, 18);
  assert.deepEqual(pace.topicPace(cur.topicById('mm-cur-24').topic), byId);
  assert.deepEqual(pace.topicPace({ topicId: 'mm-cur-24' }), byId);
  // A fuzzy lookup would hand the decimals topic the fractions topic's goal.
  assert.equal(pace.topicPace('כפל וחילוק שברים').topicId, 'mm-cur-47');
  assert.equal(pace.topicPace('כפל וחילוק שברים עשרוניים').topicId, 'mm-cur-48');
  [null, undefined, '', 'לוח כפל', 'constructor', '__proto__', 0, [], { topic: 'אין כזה' }]
    .forEach((bad) => assert.equal(pace.topicPace(bad), null, String(bad)));
});

test('the plan card and the pace table agree on the ranges they both show', () => {
  // learnerPlan keys its ranges by topic fragment; pace.js keys them by topic.
  // If the two ever drift, a parent sees two different numbers for one topic.
  plan.PACE.forEach((row) => {
    const step = plan.learningPath().filter((s) => s.topic.indexOf(row[0]) !== -1)[0];
    assert.ok(step, 'learnerPlan pace row «' + row[0] + '» matches no topic');
    const mine = pace.topicPace(step.topic);
    assert.equal(mine.sessionsPerWeek, row[1], step.topic);
    assert.equal(mine.minutes, row[2], step.topic);
    assert.equal(mine.weeksRange, row[3], step.topic);
    assert.equal(mine.source, row[4], step.topic);
  });
});

test('the page loads and precaches the module', () => {
  const root = path.join(__dirname, '..');
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /<script src="src\/lib\/pace\.js"><\/script>/);
  assert.match(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), /\.\/src\/lib\/pace\.js/);
});
