const test = require('node:test');
const assert = require('node:assert/strict');
const measure = require('../src/lib/measure');

test('a cm ruler draws the object over numbered marks, and never prints the length', () => {
  const html = measure.renderRulerHtml({ unit: 'cm', length: 7 });
  assert.equal((html.match(/ruler-cell/g) || []).length, 7);
  assert.equal((html.match(/class="ruler-mark"/g) || []).length, 8, 'marks 0 to 7');
  assert.match(html, /aria-label="סרגל בס״מ: העצם מתחיל בשנתה 0 ונגמר בשנתה 7"/);
  const read = html.match(/<p class="ruler-read">([^<]*)<\/p>/)[1];
  assert.doesNotMatch(read, /\d/, 'reading the length is the exercise: ' + read);
  assert.match(read, /רווחים/, 'count the spaces, not the ticks');
  assert.doesNotMatch(html, /<script/);
});

test('an object that does not start at 0: empty cells first, the screen reader hears where it starts and ends', () => {
  const R = measure.normalizeRuler({ unit: 'cm', length: 5, start: 2 });
  assert.deepEqual([R.start, R.length], [2, 5]);
  const html = measure.renderRulerHtml({ unit: 'cm', length: 5, start: 2 });
  assert.equal((html.match(/ruler-gap/g) || []).length, 2);
  assert.equal((html.match(/ruler-cell/g) || []).length, 5);
  assert.equal((html.match(/class="ruler-mark"/g) || []).length, 8, 'marks 0 to 7');
  assert.match(html, /מתחיל בשנתה 2 ונגמר בשנתה 7/);
  assert.equal(measure.normalizeRuler({ unit: 'cm', length: 18, start: 9 }).start, 2, 'the object stays on a 20 cm ruler');
  assert.equal(measure.normalizeRuler({ length: 4, start: 3 }).start, 0, 'unit cubes always start at the first cube');
});

test('a non-standard-unit ruler defaults to "יחידות" and asks to count the cubes', () => {
  const html = measure.renderRulerHtml({ length: 4 });
  assert.match(html, /aria-label="שורה של 4 יחידות לספירה"/);
  assert.match(html, /סופרים את הקוביות/);
  assert.doesNotMatch(html, /ruler-mark/);
});

test('a custom ruler label is escaped and never breaks out of the markup', () => {
  const html = measure.renderRulerHtml({ length: 2, label: '"><script>alert(1)</script>' });
  assert.doesNotMatch(html, /<script/);
  assert.match(html, /aria-label="שורה של 2 &quot;&gt;&lt;script&gt;/);
  assert.equal((html.match(/<\/div>/g) || []).length, 2);
});

test('a blank or non-string ruler label falls back to the unit default', () => {
  assert.equal(measure.normalizeRuler({ unit: 'cm', label: '   ' }).label, 'ס״מ');
  assert.equal(measure.normalizeRuler({ label: { bad: true } }).label, 'יחידות');
  assert.equal(measure.normalizeRuler({ label: 'קוביות' }).label, 'קוביות');
  assert.match(measure.renderRulerHtml({ length: 3, label: 'קוביות' }), /3 קוביות/);
});

test('the bank: no ruler or clock item prints its answer, and some rulers start past 0', () => {
  const banks = require('../src/lib/banks');
  const items = banks.allItems().filter((it) => it.widget === 'ruler' || it.widget === 'clock');
  items.forEach((it) => {
    const html = it.widget === 'ruler' ? measure.renderRulerHtml(it.ruler) : measure.renderClockHtml(it.clock);
    const visible = html.replace(/aria-label="[^"]*"/g, '').replace(/<span class="(ruler-mark|clock-num)"[^>]*>\d+<\/span>/g, '').replace(/<[^>]+>/g, ' ');
    assert.ok(!(visible.match(/\d+/g) || []).includes(String(it.answer)), 'the picture prints the answer: ' + it.prompt);
    assert.ok(!new RegExp('(^|\\D)' + it.answer + ':00').test(it.prompt), 'the prompt states the time: ' + it.prompt);
  });
  const offset = items.filter((it) => it.ruler && it.ruler.start > 0);
  assert.ok(offset.length >= 4, 'rulers that do not start at 0: ' + offset.length);
  offset.forEach((it) => assert.equal(Number(it.answer), it.ruler.length, it.prompt));
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

test('the clock face shows the hands, not the time: the screen reader hears where they point', () => {
  const html = measure.renderClockHtml({ hour: 4 });
  assert.match(html, /aria-label="שעון: מחוג השעות הקצר מצביע על 4, ומחוג הדקות הארוך על 12"/);
  assert.doesNotMatch(html, /4:00/, 'reading the hands is the exercise');
  assert.doesNotMatch(html, /<script/);
});

test('bindRuler safely handles missing root and mounts markup to mock element', () => {
  assert.equal(measure.bindRuler(null, { length: 5 }), null);
  assert.equal(measure.bindRuler(undefined, { length: 5 }), null);

  const mockEl = { innerHTML: '' };
  const ruler = { length: 5, unit: 'cm' };
  const result = measure.bindRuler(mockEl, ruler);

  assert.deepEqual(result, {});
  assert.equal(mockEl.innerHTML, measure.renderRulerHtml(ruler));
});

test('bindClock safely handles missing root and mounts markup to mock element', () => {
  assert.equal(measure.bindClock(null, { hour: 4 }), null);
  assert.equal(measure.bindClock(undefined, { hour: 4 }), null);

  const mockEl = { innerHTML: '' };
  const clock = { hour: 4 };
  const result = measure.bindClock(mockEl, clock);

  assert.deepEqual(result, {});
  assert.equal(mockEl.innerHTML, measure.renderClockHtml(clock));
});

test('normalizeClock falls back to 12 or preserves and rounds valid hour values', () => {
  assert.deepEqual(measure.normalizeClock(null), { hour: 12 });
  assert.deepEqual(measure.normalizeClock(undefined), { hour: 12 });
  assert.deepEqual(measure.normalizeClock({}), { hour: 12 });
  assert.deepEqual(measure.normalizeClock({ hour: 'non-numeric' }), { hour: 12 });
  assert.deepEqual(measure.normalizeClock({ hour: NaN }), { hour: 12 });
  assert.deepEqual(measure.normalizeClock({ hour: 0 }), { hour: 12 });
  assert.deepEqual(measure.normalizeClock({ hour: -3 }), { hour: 12 });
  assert.deepEqual(measure.normalizeClock({ hour: 13 }), { hour: 12 });

  for (let h = 1; h <= 12; h++) {
    assert.deepEqual(measure.normalizeClock({ hour: h }), { hour: h });
  }

  assert.deepEqual(measure.normalizeClock({ hour: '5' }), { hour: 5 });
  assert.deepEqual(measure.normalizeClock({ hour: 5.2 }), { hour: 5 });
  assert.deepEqual(measure.normalizeClock({ hour: '5.8' }), { hour: 6 });
});

test('clampInt clamps to min/max range, rounds floats, and handles non-finite inputs', () => {
  assert.equal(measure.clampInt(-5, 0, 10), 0);
  assert.equal(measure.clampInt(15, 0, 10), 10);
  assert.equal(measure.clampInt(5, 0, 10), 5);

  assert.equal(measure.clampInt(4.2, 0, 10), 4);
  assert.equal(measure.clampInt(4.7, 0, 10), 5);

  assert.equal(measure.clampInt(NaN, 1, 10), 1);
  assert.equal(measure.clampInt(null, 1, 10), 1);
  assert.equal(measure.clampInt('invalid', 1, 10), 1);
  assert.equal(measure.clampInt(undefined, 1, 10), 1);
});

test('escapeHtml escapes HTML special characters and safely handles null, undefined, and numbers', () => {
  assert.equal(measure.escapeHtml('&'), '&amp;');
  assert.equal(measure.escapeHtml('<'), '&lt;');
  assert.equal(measure.escapeHtml('>'), '&gt;');
  assert.equal(measure.escapeHtml('"'), '&quot;');
  assert.equal(measure.escapeHtml("'"), '&#39;');
  assert.equal(
    measure.escapeHtml('<a href="test" name=\'me\'>Tom & Jerry</a>'),
    '&lt;a href=&quot;test&quot; name=&#39;me&#39;&gt;Tom &amp; Jerry&lt;/a&gt;'
  );

  assert.equal(measure.escapeHtml(null), '');
  assert.equal(measure.escapeHtml(undefined), '');
  assert.equal(measure.escapeHtml(123), '123');
  assert.equal(measure.escapeHtml(0), '0');
  assert.equal(measure.escapeHtml(-45.6), '-45.6');
});

