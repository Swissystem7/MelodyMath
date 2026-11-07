const test = require('node:test');
const assert = require('node:assert/strict');

const Cov = require('../pilot/js/coverage.js');
const C = require('../src/lib/curriculum.js');
const K = require('../pilot/js/checks.js');
const S = require('../pilot/js/score.js');
const U = require('../pilot/js/unit.js');

test('unit exists in coverage and has verified metadata', () => {
  const unit = Cov.unitById('parity-rhythm');
  assert.ok(unit, 'unit parity-rhythm must exist in coverage');
  assert.equal(unit.title, 'זוגי או אי־זוגי (זוגות של צלילים)');
  assert.equal(unit.subtitle, 'חלוקה לזוגות של צלילים במספרים עד 20');
  assert.equal(unit.grades, 'א׳–ב׳');

  assert.equal(unit.topics.length, 1);
  const topic = unit.topics[0];
  assert.equal(topic.id, 'parity');
  assert.equal(topic.name, 'זוגי ואי־זוגי');
  assert.deepEqual(topic.curr, ['mm-cur-13']);

  const currRow = C.topicById('mm-cur-13');
  assert.ok(currRow, 'mm-cur-13 must exist in curriculum');
  assert.equal(currRow.verified, true, 'mm-cur-13 must be a verified row');
  assert.equal(currRow.grade, 'ב');

  // Verify skill research citations
  assert.ok(unit.skill, 'skill field required');
  assert.deepEqual(unit.skill.sources, ['E6', 'E2']);
  assert.equal(unit.skill.level, 'עקיף (מחקר יחיד)');
  assert.equal(unit.skill.music, 'לשמוע צלילים בזוגות (שמאל וימין, נמוך וגבוה) ולזהות אם נשאר צליל בודד בלי בן־זוג');
  assert.equal(unit.skill.math, 'זיהוי מספרים זוגיים ואי־זוגיים עד 20 על ידי חלוקה לזוגות של 2');
  assert.equal(unit.skill.why, 'חלוקת צלילים לזוגות ימין ושמאל ממחישה בשמיעה ובמראה: אם כל צליל מוצא בן־זוג המספר זוגי, ואם נשאר צליל בודד המספר אי־זוגי (E6, E2).');
  assert.equal(unit.skill.limits, 'השמיעה הסטריאופונית והגבהים ממחישים את הזוגות; שליטה בזוגי/אי־זוגי דורשת גם מנייה וזיהוי ספרת היחידות.');
});

test('mathematical correctness for exercises and checks', () => {
  const unit = Cov.unitById('parity-rhythm');
  assert.equal(unit.questions.length, 4);

  const expectedExercises = {
    'pr-1': { n: 6, ans: 'even' },
    'pr-2': { n: 7, ans: 'odd' },
    'pr-3': { n: 10, ans: 'even' },
    'pr-4': { n: 11, ans: 'odd' }
  };

  unit.questions.forEach((q) => {
    const exp = expectedExercises[q.id];
    assert.ok(exp, 'unexpected question id ' + q.id);
    assert.equal(q.topic, 'parity');
    assert.equal(q.kind, 'choice');
    assert.equal(q.answer, exp.ans);
    assert.equal(exp.n % 2 === 0 ? 'even' : 'odd', q.answer, q.id + ' parity math');
    assert.equal(U.isCorrect(q, q.answer), true);
    assert.equal(U.isCorrect(q, q.answer === 'even' ? 'odd' : 'even'), false);
    assert.deepEqual(q.choices.map((c) => c.id), ['even', 'odd']);
  });

  const pre = K.checkFor('parity-rhythm', 'pre');
  const post = K.checkFor('parity-rhythm', 'post');

  const checkExpected = {
    'pr-pre1': { n: 8, ans: 4, expr: 'כמה זוגות של 2 יש במספר 8?' },
    'pr-pre2': { n: 14, ans: 7, expr: 'כמה זוגות של 2 יש במספר 14?' },
    'pr-post1': { n: 6, ans: 3, expr: 'כמה זוגות של 2 יש במספר 6?' },
    'pr-post2': { n: 12, ans: 6, expr: 'כמה זוגות של 2 יש במספר 12?' }
  };

  [...pre, ...post].forEach((it) => {
    const exp = checkExpected[it.id];
    assert.ok(exp, 'unexpected check item ' + it.id);
    assert.equal(it.q, exp.expr);
    assert.equal(it.answer, exp.ans);
    assert.equal(it.answer, exp.n / 2);
    assert.ok(K.isRight(it, String(it.answer)));
  });
});

test('pre and post checks have parallel structure', () => {
  const pre = K.checkFor('parity-rhythm', 'pre');
  const post = K.checkFor('parity-rhythm', 'post');

  assert.equal(pre.length, 2, 'pre check must have exactly 2 items');
  assert.equal(post.length, 2, 'post check must have exactly 2 items');

  const allItems = [...pre, ...post];
  const allIds = new Set();
  const allPrompts = new Set();

  allItems.forEach((it) => {
    assert.equal(it.skill, 'parity');
    assert.ok(Number.isInteger(it.answer), it.id + ' answer must be an integer');
    assert.equal(it.music, undefined, it.id + ' must not have music property');
    assert.deepEqual(Object.keys(it).sort(), ['answer', 'id', 'q', 'skill']);

    assert.ok(!allIds.has(it.id), 'duplicate check id: ' + it.id);
    assert.ok(!allPrompts.has(it.q), 'duplicate check prompt: ' + it.q);
    allIds.add(it.id);
    allPrompts.add(it.q);
  });

  // Non-repeating with respect to exercise prompts
  const unit = Cov.unitById('parity-rhythm');
  const exercisePrompts = new Set(unit.questions.flatMap((q) => [q.q, q.expr].filter(Boolean)));
  allItems.forEach((it) => {
    assert.ok(!exercisePrompts.has(it.q), it.id + ' prompt repeats exercise prompt: ' + it.q);
  });
});

test('no answer leaks before answering, and right feedback contains answer', () => {
  const unit = Cov.unitById('parity-rhythm');
  unit.questions.forEach((q) => {
    const choice = U.choiceOf(q, q.answer);
    const label = choice.label;
    const sym = choice.sym;

    // Checks before answering: think, wrong, hear, question texts
    assert.ok(!q.think.includes(label), q.id + ' think leaks answer label: ' + q.think);
    assert.ok(!q.think.includes(sym), q.id + ' think leaks answer sym: ' + q.think);
    assert.ok(!q.wrong.includes(label), q.id + ' wrong leaks answer label: ' + q.wrong);
    assert.ok(!q.wrong.includes(sym), q.id + ' wrong leaks answer sym: ' + q.wrong);
    assert.ok(!q.wrong.includes('זוגי'), q.id + ' wrong must not leak choice labels: ' + q.wrong);
    assert.ok(!q.hear.includes(label), q.id + ' hear leaks answer label: ' + q.hear);
    assert.ok(!q.hear.includes(sym), q.id + ' hear leaks answer sym: ' + q.hear);
    assert.ok(!q.q.includes(label), q.id + ' q leaks answer label: ' + q.q);
    assert.ok(!q.q.includes(sym), q.id + ' q leaks answer sym: ' + q.q);

    // Score description and tokens before answering
    const desc = S.describe(q.music, 'question');
    assert.ok(!desc.includes(label), q.id + ' music description leaks answer label: ' + desc);
    assert.ok(!desc.includes(sym), q.id + ' music description leaks answer sym: ' + desc);

    const tokens = S.plan(q.music, 'question').rows.flatMap((r) =>
      [r.label].concat(r.groups.flatMap((g) => [g.label].concat(g.tokens.map((k) => k.t))))
    );
    tokens.forEach((t) => {
      assert.ok(!String(t || '').includes(label), q.id + ' token leaks answer label: ' + t);
      assert.ok(!String(t || '').includes(sym), q.id + ' token leaks answer sym: ' + t);
    });

    // Right-why must contain the correct answer label
    assert.ok(q.right.includes(label), q.id + ' right must contain answer label: ' + q.right);
  });
});

test('music specs use kind pattern with groupBy 2, alternating L and R with stereo pan and pitches', () => {
  const unit = Cov.unitById('parity-rhythm');

  // Check demo
  const demo = unit.lesson.demo;
  assert.equal(demo.kind, 'pattern');
  assert.equal(demo.voice, 'woodBar');
  assert.equal(demo.groupBy, 2);
  assert.deepEqual(demo.seq, ['L', 'R', 'L', 'R', 'L', 'R']);
  assert.deepEqual(demo.sym, { L: '◀', R: '▶' });
  assert.deepEqual(demo.deg, { L: 0, R: 4 });
  assert.deepEqual(demo.pan, { L: -0.8, R: 0.8 });

  // Check all exercises
  const expectedLengths = { 'pr-1': 6, 'pr-2': 7, 'pr-3': 10, 'pr-4': 11 };
  unit.questions.forEach((q) => {
    const m = q.music;
    assert.equal(m.kind, 'pattern', q.id + ' kind must be pattern');
    assert.equal(m.voice, 'woodBar', q.id + ' voice must be woodBar');
    assert.equal(m.groupBy, 2, q.id + ' groupBy must be 2');
    assert.deepEqual(m.sym, { L: '◀', R: '▶' }, q.id + ' sym');
    assert.deepEqual(m.deg, { L: 0, R: 4 }, q.id + ' deg');
    assert.deepEqual(m.pan, { L: -0.8, R: 0.8 }, q.id + ' pan');

    const expLen = expectedLengths[q.id];
    assert.equal(m.seq.length, expLen, q.id + ' seq length');
    m.seq.forEach((key, idx) => {
      assert.equal(key, idx % 2 === 0 ? 'L' : 'R', q.id + ' seq[' + idx + '] must alternate L and R');
    });

    const p = S.plan(m, 'question');
    assert.equal(p.notes.length, expLen, q.id + ' plan notes length');
    p.notes.forEach((n, idx) => {
      assert.equal(n.voice, 'woodBar');
      assert.equal(n.pan, idx % 2 === 0 ? -0.8 : 0.8, q.id + ' note ' + idx + ' pan');
      assert.equal(n.hz, S.deg(idx % 2 === 0 ? 0 : 4).hz, q.id + ' note ' + idx + ' pitch');
    });
  });
});
