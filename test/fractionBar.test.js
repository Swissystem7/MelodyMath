const test = require('node:test');
const assert = require('node:assert/strict');
const fb = require('../src/lib/music/fractionBar');

test('sumDurations([1/2, 1/4, 1/4]) === 1 on exact fractions', () => {
  assert.equal(fb.sumDurations([1 / 2, 1 / 4, 1 / 4]), 1);
  assert.equal(fb.sumDurations(['1/2', '1/4', '1/4']), 1);
  assert.equal(fb.sumDurations(['half', 'quarter', 'eighth', 'eighth']), 1);
  // floats would give 0.30000000000000004 here; fractions do not
  assert.deepEqual(fb.sumFraction([0.1, 0.2]), { n: 3, d: 10 });
  assert.equal(fb.sumDurations([1 / 3, 1 / 3, 1 / 3]), 1);
  assert.equal(fb.sumDurations([]), 0);
  assert.equal(fb.sumDurations(['x']), null);
});

test('the pad offers whole, half, quarter, eighth and sixteenth tiles, M3 only', () => {
  assert.equal(fb.MECHANISM, 'M3');
  assert.deepEqual(fb.DURATIONS.map((x) => fb.formatFraction(fb.toFraction(x.id))), ['1', '1/2', '1/4', '1/8', '1/16']);
});

test('an exact fill is accepted', () => {
  const r = fb.checkFill(['1/2', '1/4', '1/4']);
  assert.equal(r.status, 'exact');
  assert.equal(r.sum, '1');
});

test('an overflowing fill reports the excess', () => {
  const r = fb.checkFill(['1/2', '1/4', '1/4', '1/8']);
  assert.equal(r.status, 'over');
  assert.equal(r.diff, '1/8');
  assert.equal(r.he, 'עברת ב־1/8');
});

test('a short fill reports the missing part', () => {
  const r = fb.checkFill(['1/2', '1/8']);
  assert.equal(r.status, 'under');
  assert.equal(r.diff, '3/8');
  assert.equal(r.he, 'חסר 3/8');
});

test('a target other than one bar is checked the same way', () => {
  assert.equal(fb.checkFill(['1/4', '1/4', '1/4'], '3/4').status, 'exact');
  assert.equal(fb.checkFill(['1/2', '1/2'], '3/4').diff, '1/4');
  assert.equal(fb.checkFill(['1/2'], 0).status, 'invalid');
});

test('a tile that would overflow the bar is rejected and the fill is kept', () => {
  let s = fb.addTile([], 'half');
  assert.equal(s.accepted, true);
  s = fb.addTile(s.fill, 'quarter');
  s = fb.addTile(s.fill, 'eighth');
  assert.deepEqual(s.fill, ['1/2', '1/4', '1/8']);
  assert.equal(s.check.diff, '1/8');
  const over = fb.addTile(s.fill, 'quarter');
  assert.equal(over.accepted, false);
  assert.equal(over.over, '1/8');
  assert.deepEqual(over.fill, ['1/2', '1/4', '1/8']);
  const last = fb.addTile(s.fill, '1/8');
  assert.equal(last.accepted, true);
  assert.equal(last.check.status, 'exact');
  assert.equal(fb.addTile(s.fill, 'nonsense').accepted, false);
});

test('decimals and bar fractions convert both ways', () => {
  assert.equal(fb.decimalToBarFraction(0.25), '1/4');
  assert.equal(fb.decimalToBarFraction('0.5'), '1/2');
  assert.equal(fb.decimalToBarFraction(0.375), '3/8');
  assert.equal(fb.decimalToBarFraction(1), '1');
  assert.equal(fb.decimalToBarFraction(0.2), null); // 1/5 is not a note length
  assert.equal(fb.decimalToBarFraction(1.5), '3/2'); // fractions > 1 span multiple bars (0e, Refs #665)
  assert.equal(fb.decimalToBarFraction(2.25), '9/4');
  assert.equal(fb.barFractionToDecimal('3/2'), 1.5);
  assert.equal(fb.barFractionToDecimal('1/4'), 0.25);
  assert.equal(fb.barFractionToDecimal('3/8'), 0.375);
  assert.equal(fb.barFractionToDecimal('¾'), 0.75);
  assert.equal(fb.barFractionToDecimal('?'), null);
});

test('upper bound: decimalToBarFraction caps at 4 bars and returns null beyond (Refs #665)', () => {
  assert.equal(fb.decimalToBarFraction(4), '4');
  assert.equal(fb.decimalToBarFraction(3.5), '7/2');
  assert.equal(fb.decimalToBarFraction(4.1), null, 'values > 4 must return null');
  assert.equal(fb.decimalToBarFraction(100), null, 'huge values like 100 must return null');
  assert.equal(fb.decimalToBarFraction(-0.5), null, 'negative values return null');
});

test('mixed-number representations convert both ways in standard and Hebrew notation (#723, Refs #665)', () => {
  assert.equal(fb.toMixed('3/2'), '1 1/2');
  assert.equal(fb.toMixed('3/2', { hebrew: true }), '1 ו־1/2');
  assert.equal(fb.toMixed('9/4'), '2 1/4');
  assert.equal(fb.toMixed('1/2'), '1/2');
  assert.equal(fb.toMixed(1.5), '1 1/2');

  assert.equal(fb.fromMixed('1 1/2'), '3/2');
  assert.equal(fb.fromMixed('1 ו־1/2'), '3/2');
  assert.equal(fb.fromMixed('1 ו-1/2'), '3/2');
  assert.equal(fb.fromMixed('2 1/4'), '9/4');
  assert.equal(fb.fromMixed('2 ו־1/4'), '9/4');

  // decimalToBarFraction with mixed option
  assert.equal(fb.decimalToBarFraction(1.5, { mixed: true }), '1 1/2');
  assert.equal(fb.decimalToBarFraction(1.5, { mixed: true, hebrew: true }), '1 ו־1/2');
});

test('multi-bar fillBar continuity: 1.5 is checked as one full bar plus half bar using the same mechanism (#723, Refs #665)', () => {
  const check1 = fb.checkFill(['whole', 'half'], 1.5);
  assert.equal(check1.status, 'exact');
  assert.equal(check1.sum, '3/2');
  assert.equal(check1.diff, '0');

  const check2 = fb.checkFill(['1', '1/4'], '1 1/2');
  assert.equal(check2.status, 'under');
  assert.equal(check2.diff, '1/4');
});

test('end-of-topic no-music check items exist for Grade ד mm-cur-33 (#723, Refs #665)', () => {
  assert.ok(Array.isArray(fb.NO_MUSIC_CHECK_ITEMS));
  assert.ok(fb.NO_MUSIC_CHECK_ITEMS.length >= 2);
  fb.NO_MUSIC_CHECK_ITEMS.forEach(it => {
    assert.equal(it.topic, 'mm-cur-33');
    assert.equal(it.grade, 'ד');
    assert.equal(it.noMusic, true);
    assert.equal(it.plain, true);
    assert.ok(it.prompt.length > 0);
    assert.ok(it.answer);
  });
});
