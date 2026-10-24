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
  assert.equal(fb.decimalToBarFraction(1 / 3), null); // a triplet is not a note tile
  assert.equal(fb.barFractionToDecimal('1/4'), 0.25);
  assert.equal(fb.barFractionToDecimal('3/8'), 0.375);
  assert.equal(fb.barFractionToDecimal('¾'), 0.75);
  assert.equal(fb.barFractionToDecimal('?'), null);
});

test('a length above one bar stays a note fraction: 1.75 is 7/4, drawn as 1 and 3/4', () => {
  assert.equal(fb.decimalToBarFraction(1.75), '7/4');
  assert.equal(fb.decimalToBarFraction('1.75'), '7/4');
  assert.equal(fb.decimalToBarFraction('7/4'), '7/4');
  assert.equal(fb.decimalToBarFraction(1.5), '3/2');
  assert.equal(fb.decimalToBarFraction(2), '2');
  assert.equal(fb.decimalToBarFraction(2.25), '9/4');
  assert.equal(fb.barFractionToDecimal(fb.decimalToBarFraction(1.75)), 1.75);
  assert.deepEqual(fb.barsFor(1.75), ['1', '3/4']);
  assert.deepEqual(fb.barsFor('7/4'), ['1', '3/4']);
  assert.deepEqual(fb.barsFor('11/4'), ['1', '1', '3/4']);
  assert.deepEqual(fb.barsFor(2), ['1', '1']);
  assert.deepEqual(fb.barsFor(0.5), ['1/2']);
  assert.equal(fb.barsFor(1 / 5), null);
  assert.equal(fb.barsFor(1000), null); // more whole bars than the pad will draw
  assert.deepEqual(fb.splitFill(['1/4', '1/4', '1/4', '1/4', '1/4', '1/4', '1/4']), [[0, 1, 2, 3], [4, 5, 6]]);
  assert.deepEqual(fb.splitFill(['1', '3/4']), [[0], [1]]);
  assert.equal(fb.splitFill(['3/2']), null);
});

test('target 7/4 accepts seven quarter tiles and rejects the eighth', () => {
  let fill = [];
  for (let i = 0; i < 7; i++) {
    const step = fb.addTile(fill, '1/4', '7/4');
    assert.equal(step.accepted, true, 'tile ' + (i + 1));
    fill = step.fill;
  }
  assert.equal(fb.checkFill(fill, '7/4').status, 'exact');
  assert.deepEqual(fb.barsFor(fb.checkFill(fill, '7/4').sum), ['1', '3/4']);
  const over = fb.addTile(fill, '1/4', '7/4');
  assert.equal(over.accepted, false);
  assert.equal(over.over, '1/4');
  assert.equal(over.fill.length, 7);
  assert.equal(fb.checkFill(fill.concat(['1/4']), '7/4').status, 'over');
});
