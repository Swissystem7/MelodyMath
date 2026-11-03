// MM-601 pilot demo — the music of each exercise (pilot/js/music.js) and the
// curriculum ids and research claims it shows (pilot/js/unit.js, pilot/js/research.js).
const test = require('node:test');
const assert = require('node:assert/strict');

const U = require('../pilot/js/unit.js');
const M = require('../pilot/js/music.js');
const R = require('../pilot/js/research.js');
const C = require('../src/lib/curriculum.js');

const COUNTED = ['a', 'b', 'one', 'ten', 'removed', 'removed-ten'];
const counted = (notes, solved) => notes.filter((n) => COUNTED.includes(n.role) && !(solved && n.role.startsWith('removed')));
const leaks = (text, answer) => new RegExp('(^|[^0-9/])' + String(answer).replace(/[/.]/g, '\\$&') + '([^0-9/]|$)').test(text);

test('every keypad exercise plays as many notes as its numbers, and the answer resolves home', () => {
  U.QUESTIONS.filter((q) => q.kind !== 'rhythm').forEach((q) => {
    const question = M.plan(q, 'question');
    const right = M.plan(q, 'right');
    const tens = (n) => n.filter((x) => x.role === 'ten' || x.role === 'removed-ten').length;
    const value = (n) => n.length - tens(n) + 10 * tens(n);
    if (q.op === '+') assert.equal(value(counted(question)), q.a + q.b, q.id);
    else assert.equal(value(counted(question)), q.a, q.id);
    assert.equal(value(counted(right, true)), U.answerOf(q), q.id + ' solved');
    assert.ok(!question.some((n) => n.role === 'home'), q.id + ' does not resolve before the answer');
    assert.deepEqual(right.filter((n) => n.role === 'home').map((n) => n.note), ['C4', 'E4', 'G4'], q.id);
    assert.ok(!M.plan(q, 'hint').some((n) => n.role === 'home'), q.id + ' hint stays unresolved');
  });
});

test('captions, descriptions and hints never name the answer before the child answers', () => {
  U.QUESTIONS.forEach((q) => {
    const answer = U.answerOf(q);
    if (leaks(U.questionText(q), answer)) return; // e.g. 20 − 10: the 10 is in the question itself
    const open = [M.caption(q, 'question'), M.describe(q, 'question'), M.hint(q, 'quarter'), M.hint(q, 'whole'), U.hintText(q)];
    open.forEach((t) => assert.ok(!leaks(t, answer), q.id + ': ' + t));
    assert.ok(leaks(M.caption(q, 'right'), answer), q.id + ' says the answer once solved');
  });
  const q7 = U.QUESTIONS.find((q) => q.kind === 'rhythm');
  assert.doesNotMatch(M.caption(q7, 'question') + M.hint(q7, 'quarter') + M.hint(q7, 'whole'), /חצי/);
});

test('the fraction bar: two quarters plus a half fill one 4/4 bar exactly', () => {
  assert.equal(M.barFill('half').status, 'full');
  assert.equal(M.barFill('quarter').status, 'short');
  assert.equal(M.barFill('whole').status, 'over');
  const q7 = U.QUESTIONS.find((q) => q.kind === 'rhythm');
  assert.ok(U.isCorrect(q7, 'half'));
  assert.ok(!U.isCorrect(q7, 'quarter'));
  const beat = 60 / M.RHYTHM_BPM;
  const chosen = M.plan(q7, 'right').find((n) => n.role === 'chosen');
  assert.ok(Math.abs(chosen.at - 2 * beat) < 0.01);
  assert.equal(M.plan(q7, 'question').filter((n) => n.role === 'click').length, 4);
});

test('every curriculum id the demo shows is a real, quoted row of curriculum.js', () => {
  Object.keys(U.TOPICS).forEach((t) => {
    assert.ok(U.CURRICULUM[t] && U.CURRICULUM[t].length, t + ' has curriculum ids');
    U.CURRICULUM[t].forEach((id) => {
      const row = C.topicById(id);
      assert.ok(row, id);
      assert.ok(row.verified, id + ' is verified by an official quote');
      assert.ok(['א', 'ב', 'ג', 'ד'].includes(row.grade), id);
    });
  });
  assert.equal(C.topicById('mm-cur-32').strand, 'fractions');
});

test('the why-it-works panel: 3–5 claims, each with a source and what it does not show', () => {
  assert.ok(R.CLAIMS.length >= 3 && R.CLAIMS.length <= 5);
  R.CLAIMS.forEach((c) => {
    assert.match(c.source, /(19|20)\d\d/);
    assert.ok(c.shows && c.limits, c.id);
    if (c.url) assert.match(c.url, /^https:\/\//);
    assert.doesNotMatch(c.shows + c.limits, /מוכיח|הוכח|ADHD|דיסקלקול/);
  });
  assert.match(R.HONESTY, /לא נבדק/);
});
