'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { isCorrect } = require('../src/lib/adaptive');
const banks = require('../src/lib/banks');
const engine = require('../src/lib/musicEngine');
const cof = require('../src/lib/circleOfFifths');

const music = (skill, tag) => banks.rowsOf(skill, 'ו').filter((x) => x.music === tag);

test('circle of fifths: 12 points, 30° apart, clockwise from C', () => {
  assert.equal(cof.FIFTHS.length, 12);
  assert.equal(cof.FIFTHS_HE.length, 12);
  assert.equal(cof.fifthsAngle(0, 1), 30);
  assert.equal(cof.fifthsAngle(0, 6), 180);
  assert.equal(cof.fifthsAngle(1, 0), 330);
  assert.equal(cof.fifthsAngle(0, 12), 0);
  assert.equal(cof.fifthsAngle('x', 1), null);
});

test('the circle fits 320px and every point is a 44px target with 8px between neighbours', () => {
  [0, 280, 320, 360, 390, 430, 820].forEach((w) => {
    const l = cof.fifthsLayout(w);
    assert.ok(l.size >= 320, String(w));
    assert.ok(l.target >= 44);
    assert.ok(cof.fifthsGap(l) >= 8, w + ' gap ' + cof.fifthsGap(l));
    l.points.forEach((p) => {
      assert.ok(p.x - l.target / 2 >= 0 && p.x + l.target / 2 <= l.size, w + ' x ' + p.name);
      assert.ok(p.y - l.target / 2 >= 0 && p.y + l.target / 2 <= l.size, w + ' y ' + p.name);
    });
  });
  const top = cof.fifthsLayout(320).points[0];
  assert.equal(top.name, 'C');
  assert.equal(top.x, 160);
});

test('the SVG is LTR, drawn 1:1 and labels every point for a screen reader', () => {
  const svg = cof.renderFifthsSvg(320);
  assert.ok(svg.includes('dir="ltr"'));
  assert.ok(svg.includes('width="320" height="320"'));
  assert.ok(!svg.includes('viewBox'));
  assert.equal((svg.match(/role="button"/g) || []).length, 12);
  assert.equal((svg.match(/ r="22"/g) || []).length, 12);
  assert.ok(svg.includes('aria-label="סול, 30 מעלות מדו"'));
});

test('tapped tempo: four taps give three BPMs, and their mean', () => {
  assert.deepEqual(cof.tapsToBpm([0, 750, 1500, 2250]), [80, 80, 80]);
  assert.deepEqual(cof.tapsToBpm([0, 600, 1250, 1850]), [100, 92.3, 100]);
  assert.deepEqual(cof.tapsToBpm([0]), []);
  assert.deepEqual(cof.tapsToBpm([0, 500, 400]), []);
  assert.equal(cof.meanOf([80, 81, 82, 84]), 81.75);
  assert.equal(cof.meanOf([]), null);
  assert.equal(cof.meanOf([1, 'x']), null);
});

test('dotted and triplet items agree with the music engine', () => {
  const dotted = music('fractions', 'dotted').concat(music('fractions', 'triplet'));
  assert.ok(dotted.length >= 4);
  assert.ok(isCorrect('3/8', banks.rowsOf('fractions', 'ו').find((x) => x.prompt.startsWith('רבע מנוקד')).answer));
  const f = engine.durationToFraction('dotted quarter');
  assert.equal(f.n + '/' + f.d, '3/8');
  const e = engine.durationToFraction('dotted eighth');
  assert.ok(isCorrect(e.n + '/' + e.d, music('fractions', 'dotted').find((x) => x.prompt.startsWith('שמינית')).answer));
  const t = engine.durationToFraction('eighth triplet');
  assert.ok(isCorrect(t.n + '/' + t.d, music('fractions', 'triplet')[0].answer));
});

test('ratio, tempo and mean items are arithmetically right', () => {
  music('decimals', 'ratioHz').forEach((it) => {
    const m = /(\d+) ([×:]) (\d+(?:\.\d+)?) = \?/.exec(it.prompt);
    const v = m[2] === '×' ? Number(m[1]) * Number(m[3]) : Number(m[1]) / Number(m[3]);
    assert.ok(isCorrect(String(v), it.answer), it.prompt);
  });
  music('decimals', 'meanBpm').forEach((it) => {
    const nums = it.prompt.match(/\d+/g).slice(1).map(Number);
    assert.equal(nums.length, 4, it.prompt);
    assert.ok(isCorrect(String(cof.meanOf(nums)), it.answer), it.prompt);
  });
  music('percent', 'tempo').forEach((it) => {
    const up = /(\d+) BPM (עולה|יורד) ב־(\d+)%/.exec(it.prompt);
    if (!up) return;
    const pct = Number(up[3]) * (up[2] === 'עולה' ? 1 : -1);
    assert.ok(isCorrect(String(engine.tempoChange(Number(up[1]), pct)), it.answer), it.prompt);
  });
});

test('circle-of-fifths step items agree with fifthsAngle', () => {
  const rows = music('geometry', 'circleFifths');
  assert.ok(rows.length >= 12);
  const steps = { 'לסול': 1, 'לרה': 2 };
  rows.forEach((it) => {
    const m = /^מדו (\S+) — /.exec(it.prompt);
    if (m && steps[m[1]]) assert.equal(Number(it.answer), cof.fifthsAngle(0, steps[m[1]]), it.prompt);
  });
});

test('grade ו׳ now has geometry, and the diagnostic still asks two levels of it', () => {
  assert.ok(banks.skillsForGrade('ו').includes('geometry'));
  const levels = banks.diagnosticItems('ו').filter((x) => x.skill === 'geometry').map((x) => x.level);
  assert.deepEqual(levels, [1, 2]);
});
