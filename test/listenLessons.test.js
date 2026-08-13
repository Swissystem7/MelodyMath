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
