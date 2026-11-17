const test = require('node:test');
const assert = require('node:assert/strict');
const g = require('../src/lib/graphListen');
const lessons = require('../src/lib/listenLessons');

test('the guided bank has identify and compare tasks, and answers stay honest', () => {
  assert.ok(lessons.LISTEN_LESSONS.length >= 6);
  const kinds = new Set(lessons.LISTEN_LESSONS.map((L) => L.kind));
  assert.ok(kinds.has('identify'));
  assert.ok(kinds.has('compare'));
  assert.ok(lessons.LISTEN_LESSONS.some((L) => L.listenFor === 'root'));
  assert.ok(lessons.LISTEN_LESSONS.some((L) => L.listenFor === 'asymptote'));
  const asy = lessons.lessonById('asy-jump');
  assert.equal(lessons.checkListenAnswer(asy, 'asy'), true);
  assert.equal(lessons.checkListenAnswer(asy, 'root'), false);
  assert.match(lessons.describeLessonHe(asy), /לא מבחן שמיעה|לא הוכחה/);
});

test('nextLesson wraps and unknown ids start at the first task', () => {
  const first = lessons.LISTEN_LESSONS[0];
  const last = lessons.LISTEN_LESSONS[lessons.LISTEN_LESSONS.length - 1];
  assert.equal(lessons.nextLesson(last.id).id, first.id);
  assert.equal(lessons.nextLesson('nope').id, first.id);
});

test('classifyHearing reads roots and asymptotes off a real sample', () => {
  const line = g.summarizeCurve(g.sampleCurve((x) => x, -3, 3, 80));
  const heard = lessons.classifyHearing(line);
  assert.equal(heard.hasRoot, true);
  assert.equal(heard.trend, 'up');
  const recip = g.summarizeCurve(g.sampleCurve((x) => (Math.abs(x) < 0.05 ? NaN : 1 / x), -4, 4, 160));
  assert.equal(lessons.classifyHearing(recip).hasAsymptote, true);
});

test('compareHearing names which sample has a root without calling it a proof', () => {
  const a = g.summarizeCurve(g.sampleCurve((x) => x * x + 1, -3, 3, 80));
  const b = g.summarizeCurve(g.sampleCurve((x) => x * x - 4, -3, 3, 80));
  const cmp = lessons.compareHearing(a, b);
  assert.equal(cmp.a.hasRoot, false);
  assert.equal(cmp.b.hasRoot, true);
  assert.match(cmp.cueHe, /רק לב׳ יש שורש/);
  assert.match(cmp.cueHe, /לא הוכחה|לא «קול הפונקציה»/);
});

test('lesson step integrity, unique identifiers, Hebrew titles, and robustness against missing or empty inputs', () => {
  const ids = lessons.LISTEN_LESSONS.map((L) => L.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, ids.length, 'Lesson IDs must be unique');

  lessons.LISTEN_LESSONS.forEach((L) => {
    assert.ok(L.id, 'Lesson must have an id');
    assert.ok(L.kind, 'Lesson must have a kind');
    assert.ok(typeof L.titleHe === 'string' && L.titleHe.trim().length > 0, 'Lesson must have a Hebrew title');
    assert.ok(typeof L.promptHe === 'string' && L.promptHe.trim().length > 0, 'Lesson must have a Hebrew prompt');
    assert.ok(typeof L.teachHe === 'string' && L.teachHe.trim().length > 0, 'Lesson must have a Hebrew teach explanation');
    assert.ok(Array.isArray(L.choices) && L.choices.length > 0, 'Lesson must have choices');
    assert.ok(L.answer != null, 'Lesson must have an answer');
  });

  assert.equal(lessons.lessonById(null), null);
  assert.equal(lessons.lessonById(undefined), null);
  assert.equal(lessons.lessonById(''), null);
  assert.equal(lessons.lessonById('non-existent-id'), null);

  assert.equal(lessons.lessonIndex(null), -1);
  assert.equal(lessons.lessonIndex(undefined), -1);
  assert.equal(lessons.lessonIndex(''), -1);

  assert.deepEqual(lessons.classifyHearing(null), { trend: 'flat', hasRoot: false, rootCount: 0, hasAsymptote: false, hasUndefined: false });
  assert.deepEqual(lessons.classifyHearing(undefined), { trend: 'flat', hasRoot: false, rootCount: 0, hasAsymptote: false, hasUndefined: false });

  assert.equal(lessons.checkListenAnswer(null, 'root'), false);
});
