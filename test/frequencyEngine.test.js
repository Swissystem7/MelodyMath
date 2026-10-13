const test = require('node:test');
const assert = require('node:assert/strict');
const me = require('../src/lib/musicEngine');

// ---------- the numbers behind the lab ----------

test('an octave is ×2 and a child may answer 2, 2:1, 2/1 or פי 2', () => {
  assert.equal(me.ratioToHz(220, 2, 1), 440);
  assert.equal(me.ratioText(2, 1), '2:1');
  assert.equal(me.ratioText(4, 2), '2:1');
  ['2', '2:1', '2/1', 'פי 2', '2.0'].forEach((answer) => {
    assert.equal(me.ratioMatches(answer, 2, 1), true, answer);
  });
  ['', '1', '0', '3:2', 'שתיים', '2:0'].forEach((answer) => {
    assert.equal(me.ratioMatches(answer, 2, 1), false, answer);
  });
});

test('a fifth is 3:2 and a fourth is 4:3, and 1.5 passes for the fifth', () => {
  assert.equal(me.ratioToHz(220, 3, 2), 330);
  assert.equal(me.ratioToHz(220, 4, 3), 880 / 3);
  assert.equal(me.hzText(me.ratioToHz(220, 4, 3)), '293.3 Hz');
  assert.equal(me.hzText(330), '330 Hz');
  assert.equal(me.ratioMatches('1.5', 3, 2), true);
  assert.equal(me.ratioMatches('3/2', 3, 2), true);
  assert.equal(me.ratioMatches('1.4', 3, 2), false);
});

test('the harmonic series is arithmetic: every gap is f0', () => {
  const series = me.harmonicSeries(110, 6);
  assert.deepEqual(series.map((h) => h.hz), [110, 220, 330, 440, 550, 660]);
  assert.deepEqual(series.map((h) => h.gap), [0, 110, 110, 110, 110, 110]);
  assert.equal(me.commonDifference(series.map((h) => h.hz)), 110);
  assert.equal(me.commonDifference([110, 220, 330, 441]), null);
  assert.equal(me.commonDifference([220]), null);
  assert.deepEqual(me.harmonicSeries(110, 0), []);
  assert.deepEqual(me.harmonicSeries(0, 6), []);
  assert.deepEqual(me.harmonicSeries(110, 99), []);
});

test('the monochord is an inverse ratio: a shorter string sounds higher', () => {
  assert.equal(me.monochordHz(220, '1/2'), 440);
  assert.equal(me.monochordHz(220, '2/3'), 330);
  assert.equal(me.monochordHz(220, '1/1'), 220);
  assert.equal(me.monochordInterval('1/2'), 'octave');
  assert.equal(me.monochordInterval('2/3'), 'fifth');
  assert.equal(me.monochordInterval('3/4'), 'fourth');
  assert.equal(me.monochordInterval('4/5'), 'majorthird');
  assert.equal(me.monochordInterval('3/5'), null, '5/3 is not one of the named intervals');
  assert.equal(me.monochordHz(220, '3/2'), null, 'more than the whole string is not a stop');
  assert.equal(me.monochordHz(0, '1/2'), null);
});

test('every slider stop is a simple fraction of the string and stays in the safe range', () => {
  const stops = me.stringStops();
  assert.equal(stops.length, 8);
  assert.deepEqual(stops[0], { n: 1, d: 1 });
  assert.deepEqual(stops[stops.length - 1], { n: 1, d: 2 });
  stops.forEach((f) => {
    assert.ok(f.n <= f.d, me.fractionText(f));
    assert.ok(f.d <= 8, 'stops stay readable: ' + me.fractionText(f));
    const hz = me.monochordHz(220, f);
    assert.equal(me.clampHz(hz), hz, me.fractionText(f) + ' → ' + hz);
  });
  // The stops only rise: dragging towards a shorter string never drops the pitch.
  const pitches = stops.map((f) => me.monochordHz(220, f));
  pitches.slice(1).forEach((hz, i) => assert.ok(hz > pitches[i]));
});

test('the 12-TET fifth is a hair under 3:2, as a plain number', () => {
  const tet = me.temperedRatio(7);
  assert.ok(Math.abs(tet - 1.498307) < 1e-6);
  assert.equal(me.temperedRatio(12), 2, 'twelve equal steps are exactly an octave');
  assert.equal(me.ratioDriftPercent(tet, 1.5), -0.11);
  assert.equal(me.ratioDriftPercent(2, 1), 100);
  assert.equal(me.ratioDriftPercent(1, 0), null);
  assert.equal(me.temperedRatio('x'), null);
});
