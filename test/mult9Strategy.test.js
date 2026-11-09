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
  const unit = Cov.unitById('mult-9-strategy');
  assert.ok(unit, 'unit mult-9-strategy must exist in coverage');
  assert.equal(unit.title, 'כפל ב-9 (פחות קבוצה)');
  assert.equal(unit.subtitle, 'אסטרטגיית 9 × n = 10 × n − n בלוח הכפל');
  assert.equal(unit.grades, 'ג׳');

  assert.equal(unit.topics.length, 1);
  const topic = unit.topics[0];
  assert.equal(topic.id, 'strat9');
  assert.equal(topic.name, 'כפל ב־9 (פחות קבוצה)');
  assert.deepEqual(topic.curr, ['mm-cur-24']);

  const currRow = C.topicById('mm-cur-24');
  assert.ok(currRow, 'mm-cur-24 must exist in curriculum');
  assert.equal(currRow.verified, true, 'mm-cur-24 must be a verified row');
  assert.equal(currRow.grade, 'ג');

  // Verify skill research citations
  assert.ok(unit.skill, 'skill field required');
  assert.deepEqual(unit.skill.sources, ['E8', 'E2']);
  assert.equal(unit.skill.level, 'עקיף (מחקר יחיד)');
});

test('mathematical correctness for exercises and checks', () => {
  const unit = Cov.unitById('mult-9-strategy');
  assert.equal(unit.questions.length, 4);

  const factors = { 'm9-1': 2, 'm9-2': 5, 'm9-3': 6, 'm9-4': 9 };
  unit.questions.forEach((q) => {
    const n = factors[q.id];
    assert.ok(n, 'unexpected question id ' + q.id);
    assert.equal(q.answer, 9 * n, q.id + ' answer must equal 9 * n');
    assert.equal(q.topic, 'strat9');
    assert.equal(q.kind, 'num');
    assert.equal(U.isCorrect(q, String(q.answer)), true);
  });

  const pre = K.checkFor('mult-9-strategy', 'pre');
  const post = K.checkFor('mult-9-strategy', 'post');

  const checkExpected = {
    'm9-pre1': { n: 4, ans: 36, expr: '4 × 9 = ?' },
    'm9-pre2': { n: 7, ans: 63, expr: '7 × 9 = ?' },
    'm9-pre3': { n: 6, ans: 54, expr: '6 × 9 = ?' },
    'm9-pre4': { n: 9, ans: 81, expr: '9 × 9 = ?' },
    'm9-post1': { n: 3, ans: 27, expr: '3 × 9 = ?' },
    'm9-post2': { n: 8, ans: 72, expr: '8 × 9 = ?' },
    'm9-post3': { n: 5, ans: 45, expr: '5 × 9 = ?' },
    'm9-post4': { n: 2, ans: 18, expr: '2 × 9 = ?' }
  };

  [...pre, ...post].forEach((it) => {
    const exp = checkExpected[it.id];
    assert.ok(exp, 'unexpected check item ' + it.id);
    assert.equal(it.q, exp.expr);
    assert.equal(it.answer, exp.ans);
    assert.equal(it.answer, 9 * exp.n);
    assert.ok(K.isRight(it, String(it.answer)));
  });
});

test('pre and post checks have parallel structure', () => {
  const pre = K.checkFor('mult-9-strategy', 'pre');
  const post = K.checkFor('mult-9-strategy', 'post');

  assert.equal(pre.length, 4, 'pre check must have exactly 4 items');
  assert.equal(post.length, 4, 'post check must have exactly 4 items');

  const allItems = [...pre, ...post];
  const allIds = new Set();
  const allPrompts = new Set();

  allItems.forEach((it) => {
    assert.equal(it.skill, 'strat9');
    assert.ok(Number.isInteger(it.answer), it.id + ' answer must be an integer');
    assert.equal(it.music, undefined, it.id + ' must not have music property');
    assert.deepEqual(Object.keys(it).sort(), ['answer', 'id', 'q', 'skill']);

    assert.ok(!allIds.has(it.id), 'duplicate check id: ' + it.id);
    assert.ok(!allPrompts.has(it.q), 'duplicate check prompt: ' + it.q);
    allIds.add(it.id);
    allPrompts.add(it.q);
  });

  // Non-repeating with respect to exercise prompts
  const unit = Cov.unitById('mult-9-strategy');
  const exercisePrompts = new Set(unit.questions.flatMap((q) => [q.q, q.expr]));
  allItems.forEach((it) => {
    assert.ok(!exercisePrompts.has(it.q), it.id + ' prompt repeats exercise prompt: ' + it.q);
  });
});

test('no answer leaks before answering, and right feedback contains answer', () => {
  const unit = Cov.unitById('mult-9-strategy');
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

test('music specs use kind durations with beats 10, exactly 9 sounded beats and 1 rest per bar', () => {
  const unit = Cov.unitById('mult-9-strategy');

  // Check demo
  const demo = unit.lesson.demo;
  assert.equal(demo.kind, 'durations');
  assert.equal(demo.beats, 10);
  assert.equal(demo.beat, 0.22);
  assert.equal(demo.bars.length, 2);
  demo.bars.forEach((bar, idx) => {
    assert.equal(bar.length, 10, 'demo bar ' + idx + ' must have 10 elements');
    const sounded = bar.filter((n) => !n.rest);
    const rests = bar.filter((n) => n.rest);
    assert.equal(sounded.length, 9, 'demo bar ' + idx + ' must have 9 sounded beats');
    assert.equal(rests.length, 1, 'demo bar ' + idx + ' must have 1 rest');
    sounded.forEach((s) => {
      assert.equal(s.len, 1);
      assert.equal(s.voice, 'woodBar');
    });
    assert.equal(rests[0].len, 1);
    assert.equal(rests[0].label, 'שקט');
  });

  // Check all exercises
  const expectedBarCounts = { 'm9-1': 2, 'm9-2': 5, 'm9-3': 6, 'm9-4': 9 };
  unit.questions.forEach((q) => {
    const m = q.music;
    assert.equal(m.kind, 'durations', q.id + ' kind must be durations');
    assert.equal(m.beats, 10, q.id + ' beats must be 10');
    assert.equal(m.beat, 0.22, q.id + ' beat must be 0.22');
    assert.equal(m.bars.length, expectedBarCounts[q.id], q.id + ' bar count');

    m.bars.forEach((bar, barIdx) => {
      assert.equal(bar.length, 10, q.id + ' bar ' + barIdx + ' length must be 10');
      const sounded = bar.filter((n) => !n.rest);
      const rests = bar.filter((n) => n.rest);
      assert.equal(sounded.length, 9, q.id + ' bar ' + barIdx + ' must have 9 sounded beats');
      assert.equal(rests.length, 1, q.id + ' bar ' + barIdx + ' must have 1 rest');

      sounded.forEach((s) => {
        assert.equal(s.len, 1);
        assert.equal(s.voice, 'woodBar');
      });
      assert.equal(rests[0].len, 1);
      assert.equal(rests[0].label, 'שקט');
    });
  });
});
