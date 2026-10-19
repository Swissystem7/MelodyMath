const test = require('node:test');
const assert = require('node:assert/strict');
const plan = require('../src/lib/learnerPlan');
const cur = require('../src/lib/curriculum');
const NOW = 1_700_000_000_000;
function items(skill, correct, total) {
  const rows = [];
  for (let i = 0; i < total; i++) rows.push({ skill: skill, correct: i < correct });
  return rows;
}
function student(skill, correct, total, started) {
  return {
    name: 'נועה',
    sessions: [{ id: 's1', kind: 'diag', started: started == null ? NOW - 1000 : started, items: items(skill, correct, total) }],
  };
}
test('the path runs א׳ through ו׳ and a finished grade opens the next one', () => {
  const steps = plan.learningPath();
  const grades = cur.grades();
  assert.deepEqual(grades, ['א', 'ב', 'ג', 'ד', 'ה', 'ו']);
  grades.forEach((g) => assert.ok(steps.some((s) => s.grade === g), g));
  const lastA = steps.filter((s) => s.grade === 'א' && s.playable).pop();
  assert.equal(lastA.nextGrade, 'ב');
  assert.ok(lastA.nextTopic.indexOf('1,000') !== -1, lastA.nextTopic);
  const gaps = steps.filter((s) => s.status === cur.GAP);
  assert.ok(gaps.length >= 1);
  gaps.forEach((s) => assert.equal(s.playable, false));
  assert.match(plan.bridgeSentence(), /א׳ עד ו׳/);
  assert.match(plan.bridgeSentence(), /פער נשאר פער/);
});
test('each grade א׳–ג׳ starts on one music reinforcement, with a real source', () => {
  ['א', 'ב', 'ג'].forEach((g) => {
    const p = plan.buildLearnerPlan({ grade: g, now: NOW });
    assert.equal(p.ok, true);
    assert.equal(p.branch, 'fresh');
    assert.ok(p.topic);
    assert.ok(p.hook);
    assert.equal(p.paceExpected, 3);
    assert.equal(p.minutes, 8);
    assert.match(p.sourceUrl, /^https:\/\//);
    assert.equal(p.childLine.indexOf('\n'), -1);
    const html = plan.renderLearnerPlanHtml(p);
    assert.match(html, /data-branch="fresh"/);
    assert.match(html, /dir="rtl"/);
    assert.match(html, /role="progressbar"/);
    assert.doesNotMatch(html, /שולט|יעילות|טיפול|משפר מתמטיקה ב/);
    assert.match(html, /אין טענה שהקצב משפר מתמטיקה/);
  });
  const a = plan.buildLearnerPlan({ grade: 'א', now: NOW });
  assert.match(a.topic, /ספירה עד 100/);
  assert.match(a.sourceUrl, /math-basics/);
  const b = plan.buildLearnerPlan({ grade: 'ב', now: NOW });
  assert.match(b.topic, /דו־ספרתי/);
  const c = plan.buildLearnerPlan({ grade: 'ג', now: NOW });
  assert.match(plan.buildLearnerPlan({ grade: 'ג', now: NOW }).topic, /לוח כפל/);
  const later = plan.buildLearnerPlan({ grade: 'ד', now: NOW });
  assert.match(later.topic, /1\/2/);
  assert.notEqual(plan.learningPath().find((s) => s.topic === later.topic).status, cur.GAP);
});
test('weak, mixed and strong results each keep a single topic', () => {
  const weak = plan.buildLearnerPlan({
    grade: 'א', name: 'נועה', now: NOW,
    student: student('מנייה', 1, 5),
  });
  assert.equal(weak.branch, 'weak');
  assert.match(weak.topic, /ספירה עד 100/);
  assert.match(weak.adultLine, /נועה/);
  assert.match(weak.adultLine, /1 מתוך 5/);
  assert.equal(weak.paceExpected, 3);
  assert.equal(weak.gaps.length, 1);
  const both = plan.buildLearnerPlan({
    grade: 'א', now: NOW,
    perSkill: [{ skill: 'חיבור', total: 6, correct: 1 }, { skill: 'מנייה', total: 6, correct: 1 }],
  });
  assert.match(both.topic, /ספירה עד 100/);
  assert.ok(both.gaps.length >= 2 && both.gaps.length <= 3);
  const mixed = plan.buildLearnerPlan({
    grade: 'א', now: NOW,
    perSkill: [{ skill: 'מנייה', total: 2, correct: 2 }],
  });
  assert.equal(mixed.branch, 'mixed');
  assert.match(mixed.topic, /ספירה עד 100/);
  assert.match(mixed.why, /אין מספיק/);
  const strong = plan.buildLearnerPlan({
    grade: 'א', now: NOW,
    perSkill: [{ skill: 'מנייה', total: 4, correct: 4 }],
  });
  assert.equal(strong.branch, 'strong');
  assert.match(strong.topic, /מנייה עד 100/);
  assert.equal(strong.paceExpected, 2);
  assert.match(strong.adultLine, /נושא אחד/);
});
test('a strong last topic of grade א׳ opens grade ב׳', () => {
  const last = plan.learningPath().filter((s) => s.grade === 'א' && s.playable).pop();
  const p = plan.buildLearnerPlan({
    grade: 'א', now: NOW,
    perSkill: [{ skill: last.topic, total: 5, correct: 5 }],
  });
  assert.equal(p.branch, 'strong');
  assert.equal(p.grade, 'ב');
  assert.match(p.topic, /1,000/);
});
test('pace counts only sessions from the last seven days', () => {
  const recent = student('מנייה', 1, 4, NOW - 2 * 24 * 60 * 60 * 1000);
  recent.sessions.push({ id: 'old', kind: 'practice', started: NOW - 8 * 24 * 60 * 60 * 1000, items: [] });
  const p = plan.buildLearnerPlan({ grade: 'א', student: recent, now: NOW });
  assert.equal(p.paceDone, 1);
  assert.match(p.adultLine, /1 מתוך 3/);
  const html = plan.renderLearnerPlanHtml(p);
  assert.match(html, /aria-valuenow="1"/);
  assert.match(html, /width:33%/);
});
test('paceFor looks up ranges and sources, and renderLearnerPlanHtml contains typical range', () => {
  const mult = plan.paceFor('לוח כפל');
  assert.equal(mult[2], '4–8');
  assert.equal(mult[3], 'הערכה');

  assert.ok(plan.PACE.length > 0);
  plan.PACE.forEach((row) => {
    assert.ok(typeof row[4] === 'string' && row[4].trim().length > 0, 'non-empty source for ' + row[0]);
  });

  const p = plan.buildLearnerPlan({ grade: 'ג', now: NOW });
  const html = plan.renderLearnerPlanHtml(p);
  assert.match(html, /טווח טיפוסי/);
});

test('invalid grade and broken rows do not throw and do not look like a plan', () => {
  ['ז', 'constructor', 0, null].forEach((g) => {
    const p = plan.buildLearnerPlan({ grade: g, now: NOW });
    assert.equal(p.branch, 'invalid');
    assert.equal(p.ok, false);
    assert.equal(p.topic, '');
  });
  assert.equal(plan.buildLearnerPlan({ grade: 'א', perSkill: 'לא' }).branch, 'invalid');
  assert.equal(plan.buildLearnerPlan({ grade: 'א', perSkill: [{ skill: 'מנייה', total: -1, correct: 0 }] }).branch, 'invalid');
  assert.equal(plan.buildLearnerPlan({ grade: 'א', perSkill: [{ skill: 'מנייה', total: 1, correct: 2 }] }).branch, 'invalid');
  assert.equal(plan.buildLearnerPlan({ grade: 'א', perSkill: [{ total: NaN, correct: 1, skill: 'מנייה' }] }).branch, 'invalid');
  assert.doesNotThrow(() => plan.buildLearnerPlan(null));
  assert.equal(plan.buildLearnerPlan(null).branch, 'invalid');
});
