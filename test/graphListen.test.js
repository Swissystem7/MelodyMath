const test = require('node:test');
const assert = require('node:assert/strict');
const g = require('../src/lib/graphListen');

test('sampleCurve walks xmin→xmax and swallows a throwing fn as NaN', () => {
  const s = g.sampleCurve((x) => x, -2, 2, 4);
  assert.equal(s.length, 5);
  assert.equal(s[0].x, -2);
  assert.equal(s[4].x, 2);
  assert.equal(s[2].y, 0);
  const bad = g.sampleCurve(() => { throw new Error('boom'); }, 0, 1, 8);
  assert.ok(bad.every((p) => !isFinite(p.y)));
  assert.deepEqual(g.sampleCurve(null, 0, 1, 10), []);
});

test('roots of x²−4 sit at −2 and 2, and y = x + 1 has no root on [0, 2]', () => {
  const quad = g.findRoots(g.sampleCurve((x) => x * x - 4, -4, 4, 200));
  assert.equal(quad.length, 2);
  assert.ok(Math.abs(quad[0].x + 2) < 0.05);
  assert.ok(Math.abs(quad[1].x - 2) < 0.05);
  const none = g.findRoots(g.sampleCurve((x) => x + 1, 0, 2, 40));
  assert.equal(none.length, 0);
});

test('a parabola has one minimum; |x| is down-then-up', () => {
  const ext = g.findExtrema(g.sampleCurve((x) => x * x, -3, 3, 120));
  assert.ok(ext.some((e) => e.kind === 'min' && Math.abs(e.x) < 0.15));
  const abs = g.summarizeCurve(g.sampleCurve((x) => Math.abs(x), -4, 4, 80));
  assert.equal(abs.trend, 'down-then-up');
});

test('√(x) from −4 to 4 is undefined on the left and defined on the right', () => {
  const spans = g.findUndefinedSpans(g.sampleCurve((x) => (x >= 0 ? Math.sqrt(x) : NaN), -4, 4, 80));
  assert.ok(spans.length >= 1);
  assert.ok(spans[0].from < 0);
  assert.ok(spans[0].to <= 0.2);
});

test('1/x marks an asymptote near zero', () => {
  const asy = g.findAsymptotes(g.sampleCurve((x) => (Math.abs(x) < 0.05 ? NaN : 1 / x), -4, 4, 160));
  assert.ok(asy.length >= 1);
  assert.ok(asy.some((a) => Math.abs(a.x) < 0.6));
});

test('Hebrew description names a root and refuses to call itself the voice of the function', () => {
  const sum = g.summarizeCurve(g.sampleCurve((x) => x, -3, 3, 60));
  const text = g.describeGraphHe(sum);
  assert.match(text, /שורש/);
  assert.match(text, /איקס 0/);
  assert.match(text, /לא הוכחה|לא «קול הפונקציה»|לא "קול הפונקציה"/);
  assert.equal(sum.trend, 'up');
  const yi = g.findYIntercept(sum.samples);
  assert.ok(yi);
  assert.ok(Math.abs(yi.y) < 0.05);
});

test('landmarks are ordered by x and the stepper stays inside the sample list', () => {
  const sum = g.summarizeCurve(g.sampleCurve((x) => x * x - 1, -3, 3, 80));
  const marks = g.landmarksOf(sum);
  assert.ok(marks.length >= 3);
  for (let i = 1; i < marks.length; i++) assert.ok(marks[i].x >= marks[i - 1].x);
  assert.match(g.describeLandmarkHe(marks[0]), /התחלה|איקס/);
  assert.equal(g.stepIndex(0, 1, 5), 1);
  assert.equal(g.stepIndex(0, -1, 5), 0);
  assert.equal(g.stepIndex(4, 1, 5), 4);
  const i0 = g.indexNearX(sum.samples, 0);
  assert.ok(Math.abs(sum.samples[i0].x) < 0.2);
  const next = g.nextLandmarkIndex(marks, marks[0].x, 1);
  assert.ok(next >= 1);
});

test('exponential helpers match M(t)=M0·q^t and describe growth without calling it a proof', () => {
  assert.equal(g.expValue(200, 1.5, 2), 450);
  const series = g.expSeries(100, 2, 3, 6);
  assert.equal(series[0], 100);
  assert.equal(series[series.length - 1], 800);
  const he = g.describeExpHe({ M0: 100, q: 2, t: 3 });
  assert.match(he, /גדילה/);
  assert.match(he, /800/);
  assert.match(he, /ייצוג/);
  assert.doesNotMatch(he, /משפר|טיפול|יעילות/);
  assert.equal(g.expValue(10, -1, 2), null);
});
