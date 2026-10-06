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

test('a custom ruler label is escaped and never breaks out of the markup', () => {
  const html = measure.renderRulerHtml({ length: 2, label: '"><script>alert(1)</script>' });
  assert.doesNotMatch(html, /<script/);
  assert.match(html, /aria-label="עצם שאורכו 2 &quot;&gt;&lt;script&gt;/);
  assert.match(html, /<p class="ruler-read">2 &quot;&gt;&lt;script&gt;/);
  assert.equal((html.match(/<\/div>/g) || []).length, 2);
});

test('a blank or non-string ruler label falls back to the unit default', () => {
  assert.equal(measure.normalizeRuler({ unit: 'cm', label: '   ' }).label, 'ס״מ');
  assert.equal(measure.normalizeRuler({ label: { bad: true } }).label, 'יחידות');
  assert.equal(measure.normalizeRuler({ label: 'קוביות' }).label, 'קוביות');
  assert.match(measure.renderRulerHtml({ length: 3, label: 'קוביות' }), /3 קוביות/);
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
