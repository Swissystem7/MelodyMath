// MM-610 pilot demo — coverage of every grades 1–3 topic, the three steps of
// every exercise (think / music / why after a right and a wrong answer), no
// answer leak before the answer, the per-unit research line, and the short
// checks without music before and after each unit.
const test = require('node:test');
const assert = require('node:assert/strict');

const C = require('../src/lib/curriculum.js');
const Cov = require('../pilot/js/coverage.js');
const X = require('../pilot/js/units.js');
const U = require('../pilot/js/unit.js');
const S = require('../pilot/js/score.js');
const K = require('../pilot/js/checks.js');

const UNITS = Cov.allUnits();
const escape = (v) => String(v).replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
// A number "leaks" when it appears on its own (not inside a longer number or a fraction).
const leaksNum = (text, n) => new RegExp('(^|[^0-9/,.])' + escape(n) + '(?![0-9/]|[.,][0-9])').test(String(text || ''));
const answerText = (q) => String(U.answerOf(q));
function leaks(q, text) {
  if (q.kind === 'choice') {
    const c = U.choiceOf(q, q.answer);
    return String(text || '').includes(c.label) || (c.sym && String(text || '').includes(c.sym));
  }
  if (q.kind === 'rhythm') return String(text || '').includes('1/2') || String(text || '').includes('חצי');
  return leaksNum(text, answerText(q));
}
const gradeRows = ['א', 'ב', 'ג'].flatMap((g) => C.rowsForGrade(g));

test('every grades 1–3 topic of curriculum.js is practised by at least one pilot exercise', () => {
  assert.equal(gradeRows.length, 31, 'grades א׳–ג׳ have 31 official rows today; update this count if curriculum.js changes');
  const m = Cov.map();
  assert.equal(m.total, gradeRows.length);
  const missing = m.rows.filter((r) => r.status !== 'covered').map((r) => r.id + ' ' + r.topic);
  assert.deepEqual(missing, [], 'grades 1–3 topics with no pilot exercise');
  assert.equal(m.covered, m.total);
  m.rows.forEach((r) => {
    assert.ok(r.units.length >= 1, r.id);
    r.units.forEach((u) => {
      const unit = Cov.unitById(u.id);
      assert.ok(unit, u.id);
      u.questions.forEach((qid) => assert.ok(unit.questions.some((q) => q.id === qid), qid));
    });
  });
});

test('every curriculum id a unit names is a real, verified row of curriculum.js', () => {
  UNITS.forEach((u) => {
    u.topics.forEach((t) => (t.curr || []).forEach((id) => {
      const row = C.topicById(id);
      assert.ok(row && row.verified, u.id + '/' + t.id + ': ' + id);
    }));
    u.questions.forEach((q) => {
      assert.ok(u.topics.some((t) => t.id === q.topic), u.id + '/' + q.id + ' topic ' + q.topic);
      (q.curr || []).forEach((id) => assert.ok(C.topicById(id), q.id + ': ' + id));
    });
  });
});

test('ids are unique across units, and each unit has topics, a lesson and 4+ exercises', () => {
  const ids = UNITS.flatMap((u) => u.questions.map((q) => q.id));
  assert.equal(new Set(ids).size, ids.length, 'exercise ids repeat');
  assert.equal(new Set(UNITS.map((u) => u.id)).size, UNITS.length);
  assert.ok(UNITS.length >= 10, 'units: ' + UNITS.length);
  UNITS.forEach((u) => {
    assert.ok(u.questions.length >= 4, u.id);
    assert.ok(u.title && u.grades && u.lesson && u.lesson.lines.length, u.id);
    u.topics.forEach((t) => assert.ok(t.advice, u.id + '/' + t.id + ' has a gap suggestion for the teacher'));
  });
});

test('every exercise has a thinking step, music, and why-feedback after a right and after a wrong answer', () => {
  UNITS.forEach((u) => u.questions.forEach((q) => {
    const where = u.id + '/' + q.id;
    assert.ok(q.think && q.think.length > 15, where + ' think');
    assert.ok(q.right && q.right.length > 20, where + ' why (right)');
    assert.ok(q.wrong && q.wrong.length > 20, where + ' why (wrong)');
    assert.notEqual(q.right, q.wrong, where);
    if (q.kind === 'num' || q.kind === 'choice') {
      assert.ok(S.KINDS.includes(q.music && q.music.kind), where + ' music kind ' + (q.music && q.music.kind));
      assert.ok(q.hear && q.hear.length > 15, where + ' says what is heard (works without sound)');
      const plan = S.plan(q.music, 'question');
      assert.ok(plan.notes.length >= 2, where + ' plays notes');
      assert.ok(plan.rows.length >= 1, where + ' is drawn (no sound needed)');
      assert.ok(!plan.notes.some((n) => n.role === 'home'), where + ' does not resolve before the answer');
      assert.ok(S.plan(q.music, 'right').notes.some((n) => n.role === 'home'), where + ' resolves once solved');
      plan.notes.forEach((n) => assert.ok(n.hz > 20 && n.hz < 5000 && n.dur > 0 && n.at >= 0, where));
      if (q.kind === 'choice') {
        assert.ok(q.choices.length >= 2 && U.choiceOf(q, q.answer), where + ' choices');
        assert.ok(U.isCorrect(q, q.answer));
        q.choices.filter((c) => c.id !== q.answer).forEach((c) => assert.ok(!U.isCorrect(q, c.id), where));
      } else {
        assert.ok(U.isCorrect(q, String(q.answer)), where);
        assert.ok(!U.isCorrect(q, String(q.answer + (q.tolerance || 0) + 1)), where);
        assert.ok(q.answer <= 99999 && Number.isInteger(q.answer), where + ' fits the keypad');
      }
    } else {
      assert.ok(q.music || q.kind === 'rhythm', where);
    }
  }));
});

test('no answer leak: question, think, hear, wrong-why and the drawn score never give the answer before it is answered', () => {
  UNITS.forEach((u) => u.questions.forEach((q) => {
    const where = u.id + '/' + q.id;
    if (q.kind === 'num' && leaksNum(U.questionText(q).replace('?', ''), q.answer)) assert.fail(where + ' expr names the answer');
    const legacyInQuestion = !q.kind && leaksNum(U.questionText(q).replace('?', ''), answerText(q)); // 20 − 10 = 10
    const before = [q.think, q.wrong].concat(q.kind === 'num' || q.kind === 'choice' ? [q.q, q.expr, q.show, q.hear] : []);
    if (!legacyInQuestion) before.forEach((t) => assert.ok(!leaks(q, t), where + ': ' + t));
    if (q.kind === 'num') {
      assert.ok(!leaksNum(S.describe(q.music, 'question'), q.answer), where + ' description: ' + S.describe(q.music, 'question'));
      const tokens = S.plan(q.music, 'question').rows.flatMap((r) => [r.label].concat(r.groups.flatMap((g) => [g.label].concat(g.tokens.map((k) => k.t)))));
      tokens.forEach((t) => assert.ok(!leaksNum(t, q.answer), where + ' draws ' + t));
    }
    if (!legacyInQuestion) assert.ok(q.kind === 'rhythm' ? q.right.includes('1/2') : leaks(q, q.right), where + ' why (right) names the answer: ' + q.right);
  }));
});

test('an asked value is drawn as "?" before the answer and shown once solved', () => {
  UNITS.forEach((u) => u.questions.filter((q) => q.music && q.music.kind === 'steps' && q.music.ask !== false).forEach((q) => {
    const open = S.plan(q.music, 'question').rows[0].groups[0].tokens;
    const solved = S.plan(q.music, 'right').rows[0].groups[0].tokens;
    assert.equal(open[open.length - 1].t, '?', q.id);
    assert.equal(solved[solved.length - 1].t, String(q.answer), q.id);
  }));
  const hidden = UNITS.flatMap((u) => u.questions).filter((q) => q.music && q.music.kind === 'place' && q.music.rows.some((r) => r.hide));
  assert.ok(hidden.length >= 2);
  hidden.forEach((q) => assert.ok(S.plan(q.music, 'right').rows.length >= S.plan(q.music, 'question').rows.length, q.id));
});

test('each unit says which musical skill builds which math skill, with sources from the repo research', () => {
  UNITS.forEach((u) => {
    const k = u.skill;
    assert.ok(k && k.music && k.math && k.why && k.level, u.id);
    assert.ok(k.sources.length >= 1, u.id);
    k.sources.forEach((s) => assert.ok(X.SOURCES[s], u.id + ' cites ' + s + ', which is in MM-503 §2'));
    assert.doesNotMatch(k.why + (k.limits || ''), /מוכיח|הוכח(?!ה)|ADHD|דיסקלקול|מחכים את/, u.id + ' does not overclaim');
  });
  Object.values(X.SOURCES).forEach((s) => { if (s.url) { assert.match(s.url, /^https:\/\//); assert.match(s.cite, /(19|20)\d\d/); } assert.ok(s.cite.length > 5); });
});

test('every unit has a 2–3 item check before and after, without music, in parallel forms that do not repeat', () => {
  const exerciseTexts = new Set(UNITS.flatMap((u) => u.questions.flatMap((q) => [q.q, q.expr, U.questionText(q)].filter(Boolean))));
  const all = [];
  UNITS.forEach((u) => {
    const pre = K.checkFor(u.id, 'pre');
    const post = K.checkFor(u.id, 'post');
    [pre, post].forEach((items, i) => {
      assert.ok(items.length >= 2 && items.length <= 3, u.id + (i ? ' post' : ' pre') + ': ' + items.length);
      items.forEach((it) => {
        assert.equal(it.music, undefined, it.id + ' has no music');
        assert.deepEqual(Object.keys(it).sort(), ['answer', 'id', 'q'], it.id + ' is plain math: id, question, answer');
        assert.ok(Number.isInteger(it.answer), it.id);
        assert.ok(!leaksNum(it.q.replace('?', ''), it.answer), it.id + ' does not name its answer: ' + it.q);
        assert.ok(!exerciseTexts.has(it.q), it.id + ' is not a unit exercise');
        assert.ok(K.isRight(it, String(it.answer)) && !K.isRight(it, String(it.answer + 1)), it.id);
        all.push(it);
      });
    });
    const preQ = new Set(pre.map((it) => it.q));
    post.forEach((it) => assert.ok(!preQ.has(it.q), u.id + ': ' + it.id + ' repeats a pre item'));
  });
  assert.equal(new Set(all.map((it) => it.id)).size, all.length, 'check item ids repeat');
  assert.equal(new Set(all.map((it) => it.q)).size, all.length, 'check items repeat');
});

test('check scoring and the before/after comparison', () => {
  const pre = K.score('times-1', 'pre', { 'tm-pre1': '20', 'tm-pre2': '17', 'tm-pre3': '' });
  assert.equal(pre.score, 1);
  assert.equal(pre.total, 3);
  const post = K.score('times-1', 'post', { 'tm-post1': '16', 'tm-post2': '28', 'tm-post3': '12' });
  assert.equal(post.score, 3);
  assert.deepEqual(K.compare(pre, post), { pre: '1/3', post: '3/3', change: 2 });
  assert.deepEqual(K.compare(pre, null), { pre: '1/3', post: null, change: null });
  assert.equal(K.score('place-1', 'post', { 'pv-post3': '3,700' }).score, 1, 'a typed thousands comma is accepted');
});

test('topic report and stars work for a new unit', () => {
  const u = Cov.unitById('times-1');
  const r = {};
  u.questions.forEach((q) => { r[q.id] = { tries: 1, correct: true, firstTry: true }; });
  r.tm5 = { tries: 2, correct: false, revealed: true, firstTry: false };
  r.tm6 = { tries: 2, correct: true, firstTry: false };
  assert.deepEqual(U.topicReport(r, u).map((t) => [t.topic, t.status]), [['mult', 'ok'], ['table', 'ok'], ['compare', 'gap']]);
  assert.equal(U.stars(r, u), 2);
  assert.equal(U.stars({}, u), 1);
  const est = u.questions[0];
  assert.equal(U.questionText(est), '3 × 4 = ?');
  const ln5 = Cov.unitById('line-1').questions.find((q) => q.id === 'ln5');
  assert.ok(U.isCorrect(ln5, '16') && U.isCorrect(ln5, '21') && !U.isCorrect(ln5, '22'), 'estimate within tolerance');
});

test('reuse of PR #955 items is marked, and every grade-1–3 unit plays a different musical structure', () => {
  const reused = UNITS.flatMap((u) => u.questions).filter((q) => q.from955);
  assert.ok(reused.length >= 8, 'reused: ' + reused.length);
  reused.forEach((q) => assert.match(q.from955, /^MM-73\d \(7\d{4}\)$/, q.id));
  const kinds = new Set(UNITS.flatMap((u) => u.questions).filter((q) => q.music && q.music.kind).map((q) => q.music.kind));
  S.KINDS.forEach((k) => assert.ok(kinds.has(k), 'music kind ' + k + ' is used'));
});
