const test = require('node:test');
const assert = require('node:assert/strict');
const measure = require('../src/lib/measure');

test('a ruler names its unit and reports the measured length', () => {
  const html = measure.renderRulerHtml({ unit: 'cm', length: 7 });
  assert.match(html, /אורכו 7 ס״מ/);
  assert.equal((html.match(/ruler-cell/g) || []).length, 7);
  assert.doesNotMatch(html, /<script/);
});

test('a non-standard-unit ruler defaults to "יחידות"', () => {
  const html = measure.renderRulerHtml({ length: 4 });
  assert.match(html, /4 יחידות/);
});

test('ruler length is clamped to a sane range', () => {
  const R = measure.normalizeRuler({ length: 999 });
  assert.ok(R.length <= 20);
  const R2 = measure.normalizeRuler({ length: -3 });
  assert.equal(R2.length, 1);
});

test('the clock hand angle is 30 degrees per whole hour, minute hand fixed at 12', () => {
  assert.equal(measure.clockHandAngle(12), 0);
  assert.equal(measure.clockHandAngle(3), 90);
  assert.equal(measure.clockHandAngle(6), 180);
  assert.equal(measure.clockHandAngle(9), 270);
});

test('the clock face announces the whole hour', () => {
  const html = measure.renderClockHtml({ hour: 4 });
  assert.match(html, /מראה השעה 4:00/);
  assert.match(html, /4:00/);
  assert.doesNotMatch(html, /<script/);
});
