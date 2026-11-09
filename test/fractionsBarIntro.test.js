const test = require('node:test');
const assert = require('node:assert/strict');

const Cov = require('../pilot/js/coverage.js');
const C = require('../src/lib/curriculum.js');
const K = require('../pilot/js/checks.js');
const S = require('../pilot/js/score.js');
const U = require('../pilot/js/unit.js');

const escape = (v) => String(v).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const leaksNum = (text, n) => new RegExp('(^|[^0-9/,.])' + escape(n) + '(?![0-9/]|[.,][0-9])').test(String(text || ''));

test('unit exists in coverage and has verified metadata', () => {
  const unit = Cov.unitById('fractions-bar-intro');
  assert.ok(unit, 'unit fractions-bar-intro must exist in coverage');
  assert.equal(unit.title, 'חלקים ושלמים (שברים בתיבה)');
  assert.equal(unit.subtitle, 'חצי, רבע ושלם כחלקים משלם אחד');
  assert.equal(unit.grades, 'ב׳–ג׳');

  assert.equal(unit.topics.length, 1);
  const topic = unit.topics[0];
  assert.equal(topic.id, 'frac-bar');
  assert.equal(topic.name, 'חלקים ושלמים (שברים בתיבה)');
  assert.deepEqual(topic.curr, ['mm-cur-16']);

  const currRow = C.topicById('mm-cur-16');
  assert.ok(currRow, 'mm-cur-16 must exist in curriculum');
  assert.equal(currRow.verified, true, 'mm-cur-16 must be a verified row');
  assert.equal(currRow.grade, 'ב');

  // Verify skill research citations
  assert.ok(unit.skill, 'skill field required');
  assert.deepEqual(unit.skill.sources, ['E4', 'E5']);
  assert.equal(unit.skill.level, 'ישיר');
  assert.equal(unit.skill.music, 'לשמוע ולראות תיבה של 4 פעימות כשלם: 2 חצאים ממלאים שלם, ו־4 רבעים ממלאים שלם');
  assert.equal(unit.skill.math, 'חלקים ושלמים: חצי, רבע ושלם כחלקים משלם אחד (שברים יסודיים בתיבה)');
  assert.equal(unit.skill.why, 'תיבה של 4 פעימות היא שלם; תו חצי נמשך 2 פעימות (חצי תיבה) ותו רבע נמשך פעימה אחת (רבע תיבה). השמיעה ומילוי התיבה ממחישים שחלקים מצטרפים לשלם (E4, E5).');
  assert.equal(unit.skill.limits, 'ממחיש שברים יסודיים של 1/2 ו־1/4 מול שלם בתיבה של 4/4.');
});

test('mathematical correctness for exercises and checks', () => {
  const unit = Cov.unitById('fractions-bar-intro');
  assert.equal(unit.questions.length, 4);

  const expectedAnswers = {
    'fbi-1': 2,
    'fbi-2': 2,
    'fbi-3': 1,
    'fbi-4': 3
  };

  unit.questions.forEach((q) => {
    const expAns = expectedAnswers[q.id];
    assert.ok(expAns !== undefined, 'unexpected question id ' + q.id);
    assert.equal(q.answer, expAns, q.id + ' answer must equal ' + expAns);
    assert.equal(q.topic, 'frac-bar');
    assert.equal(q.kind, 'num');
    assert.equal(U.isCorrect(q, String(q.answer)), true);
  });

  const pre = K.checkFor('fractions-bar-intro', 'pre');
  const post = K.checkFor('fractions-bar-intro', 'post');

  const checkExpected = {
    'fbi-pre1': { ans: 2, expr: 'כמה חצאים יש בשלם אחד?' },
    'fbi-pre2': { ans: 4, expr: 'כמה רבעים יש בשלם?' },
    'fbi-pre3': { ans: 2, expr: 'כמה רבעים יש בחצי?' },
    'fbi-pre4': { ans: 8, expr: 'כמה רבעים יש בשני שלמים?' },
    'fbi-post1': { ans: 2, expr: 'כמה חלקי חצי דרושים לשלם?' },
    'fbi-post2': { ans: 4, expr: 'כמה חלקי רבע דרושים לשלם?' },
    'fbi-post3': { ans: 4, expr: 'כמה חצאים יש בשני שלמים?' },
    'fbi-post4': { ans: 6, expr: 'כמה חצאים יש בשלושה שלמים?' }
  };

  [...pre, ...post].forEach((it) => {
    const exp = checkExpected[it.id];
    assert.ok(exp, 'unexpected check item ' + it.id);
    assert.equal(it.q, exp.expr);
    assert.equal(it.answer, exp.ans);
    assert.ok(K.isRight(it, String(it.answer)));
  });
});

test('pre and post checks have parallel structure', () => {
  const pre = K.checkFor('fractions-bar-intro', 'pre');
  const post = K.checkFor('fractions-bar-intro', 'post');

  assert.equal(pre.length, 4, 'pre check must have exactly 4 items');
  assert.equal(post.length, 4, 'post check must have exactly 4 items');

  const allItems = [...pre, ...post];
  const allIds = new Set();
  const allPrompts = new Set();

  allItems.forEach((it) => {
    assert.equal(it.skill, 'frac-bar');
    assert.ok(Number.isInteger(it.answer), it.id + ' answer must be an integer');
    assert.equal(it.music, undefined, it.id + ' must not have music property');
    assert.deepEqual(Object.keys(it).sort(), ['answer', 'id', 'q', 'skill']);

    assert.ok(!allIds.has(it.id), 'duplicate check id: ' + it.id);
    assert.ok(!allPrompts.has(it.q), 'duplicate check prompt: ' + it.q);
    allIds.add(it.id);
    allPrompts.add(it.q);
  });

  // Non-repeating with respect to exercise prompts
  const unit = Cov.unitById('fractions-bar-intro');
  const exercisePrompts = new Set(unit.questions.flatMap((q) => [q.q, q.expr]));
  allItems.forEach((it) => {
    assert.ok(!exercisePrompts.has(it.q), it.id + ' prompt repeats exercise prompt: ' + it.q);
  });
});

test('no answer leaks before answering, and right feedback contains answer', () => {
  const unit = Cov.unitById('fractions-bar-intro');
  unit.questions.forEach((q) => {
    const ans = q.answer;

    // Checks before answering: think, wrong, hear, question texts
    assert.ok(!leaksNum(q.think, ans), q.id + ' think leaks answer: ' + q.think);
    assert.ok(!leaksNum(q.wrong, ans), q.id + ' wrong leaks answer: ' + q.wrong);
    assert.ok(!leaksNum(q.hear, ans), q.id + ' hear leaks answer: ' + q.hear);
    assert.ok(!leaksNum(q.q.replace('?', ''), ans), q.id + ' q leaks answer: ' + q.q);
    assert.ok(!leaksNum(q.expr.replace('?', ''), ans), q.id + ' expr leaks answer: ' + q.expr);

    // Score description and tokens before answering
    const desc = S.describe(q.music, 'question');
    assert.ok(!leaksNum(desc, ans), q.id + ' music description leaks answer: ' + desc);

    const tokens = S.plan(q.music, 'question').rows.flatMap((r) =>
      [r.label].concat(r.groups.flatMap((g) => [g.label].concat(g.tokens.map((k) => k.t))))
    );
    tokens.forEach((t) => {
      assert.ok(!leaksNum(t, ans), q.id + ' token leaks answer: ' + t);
    });

    // Right-why must contain the correct answer numeral
    assert.ok(leaksNum(q.right, ans), q.id + ' right must contain answer: ' + q.right);
  });
});

test('music specs use kind durations with beats 4', () => {
  const unit = Cov.unitById('fractions-bar-intro');

  // Check demo
  const demo = unit.lesson.demo;
  assert.equal(demo.kind, 'durations');
  assert.equal(demo.beats, 4);
  assert.equal(demo.beat, 0.45);
  assert.equal(demo.bars.length, 1);
  demo.bars.forEach((bar) => {
    const totalLen = bar.reduce((acc, note) => acc + note.len, 0);
    assert.equal(totalLen, 4, 'demo bar total length must be 4 beats');
  });

  // Check all exercises
  unit.questions.forEach((q) => {
    const m = q.music;
    assert.equal(m.kind, 'durations', q.id + ' kind must be durations');
    assert.equal(m.beats, 4, q.id + ' beats must be 4');
    assert.equal(m.beat, 0.45, q.id + ' beat must be 0.45');
    assert.ok(m.bars.length >= 1, q.id + ' must have at least 1 bar');

    m.bars.forEach((bar, barIdx) => {
      const totalLen = bar.reduce((acc, note) => acc + note.len, 0);
      assert.equal(totalLen, 4, q.id + ' bar ' + barIdx + ' total length must be 4 beats');
    });
  });
});
