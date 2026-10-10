const test = require('node:test');
const assert = require('node:assert/strict');
const gv = require('../src/lib/gradeVMusic');
const banks = require('../src/lib/banks');

test('dotted quarter is 1/4 × 3/2 = 3/8', () => {
  assert.equal(gv.dottedNoteFraction('dotted quarter'), '3/8');
  assert.equal(gv.dottedNoteFraction('dotted half'), '3/4');
});

test('duration division: how many eighths in a half', () => {
  assert.equal(gv.durationDivisionCount('1/2', '1/8'), 4);
  assert.equal(gv.durationDivisionCount('3/4', '1/8'), 6);
});

test('decimal Hz ratio and percent tempo match musicEngine', () => {
  assert.equal(gv.hzDecimalRatio(440, 1.5), 660);
  assert.equal(gv.tempoAfterPercent(80, 25), 100);
  assert.equal(gv.tempoAfterPercent(120, -50), 60);
});

test('mean BPM from samples and tap intervals', () => {
  assert.equal(gv.meanBpm([80, 90, 100, 110]), 95);
  assert.equal(gv.bpmFromTapIntervals([500, 500, 500, 500]), 120);
});

test('circle of fifths layout: 320px width and 44px tap targets', () => {
  const L = gv.circleFifthsLayout(320);
  assert.equal(L.width, 320);
  assert.equal(L.points.length, 12);
  assert.equal(L.points[1].angle, 30);
  const html = gv.renderCircleOfFifthsHtml(L);
  assert.equal((html.match(/class="gv-fifth"/g) || []).length, 12);
  assert.match(html, /width:44px;height:44px/);
  assert.match(html, /width="320"/);
});

test('grade ו is in GRADES with a shippable music bank', () => {
  assert.ok(banks.GRADES.includes('ו'));
  const rows = banks.rowsOf('music_grade_v', 'ו');
  assert.ok(rows.length >= 8);
  assert.ok(rows.some((r) => r.widget === 'gradeVMusic' && r.music && r.music.kind === 'tempo'));
});

test('unlockAudio is inert in Node', () => {
  assert.equal(gv.unlockAudio(), false);
});
