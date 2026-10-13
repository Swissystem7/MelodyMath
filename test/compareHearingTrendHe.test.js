const test = require('node:test');
const assert = require('node:assert/strict');
const g = require('../src/lib/graphListen');
const lessons = require('../src/lib/listenLessons');

test('compareHearing names a differing trend in Hebrew, never with the raw token', () => {
  const up = g.summarizeCurve(g.sampleCurve((x) => 1.4 * x, -3, 3, 80));
  const down = g.summarizeCurve(g.sampleCurve((x) => -1.4 * x, -3, 3, 80));
  assert.equal(up.trend, 'up');
  assert.equal(down.trend, 'down');
  const cmp = lessons.compareHearing(up, down);
  assert.equal(cmp.sameTrend, false);
  assert.match(cmp.cueHe, /המגמה שונה: א׳ עולה, ב׳ יורד\./);
  assert.doesNotMatch(cmp.cueHe, /\b(up|down|flat|then)\b/);
});

test('compareHearing says nothing about trend when both samples share it', () => {
  const a = g.summarizeCurve(g.sampleCurve((x) => x + 1, -3, 3, 80));
  const b = g.summarizeCurve(g.sampleCurve((x) => 2 * x - 1, -3, 3, 80));
  const cmp = lessons.compareHearing(a, b);
  assert.equal(cmp.sameTrend, true);
  assert.doesNotMatch(cmp.cueHe, /המגמה שונה/);
});

test('trendHe maps every graphListen trend token and falls back to flat wording', () => {
  assert.equal(lessons.trendHe('up'), 'עולה');
  assert.equal(lessons.trendHe('down'), 'יורד');
  assert.equal(lessons.trendHe('up-then-down'), 'עולה ואז יורד');
  assert.equal(lessons.trendHe('down-then-up'), 'יורד ואז עולה');
  assert.equal(lessons.trendHe('flat'), 'כמעט קבוע');
  assert.equal(lessons.trendHe(undefined), 'כמעט קבוע');
  assert.equal(lessons.trendHe('nope'), 'כמעט קבוע');
  for (const token of ['up', 'down', 'up-then-down', 'down-then-up', 'flat']) {
    assert.doesNotMatch(lessons.trendHe(token), /[a-z]/i);
  }
});

test('a parabola against a line reports the up-then-down shape in Hebrew', () => {
  const hill = g.summarizeCurve(g.sampleCurve((x) => 4 - x * x, -3, 3, 80));
  const line = g.summarizeCurve(g.sampleCurve((x) => x, -3, 3, 80));
  assert.equal(hill.trend, 'up-then-down');
  const cmp = lessons.compareHearing(hill, line);
  assert.match(cmp.cueHe, /א׳ עולה ואז יורד, ב׳ עולה\./);
});
