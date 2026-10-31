'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const RP = require('../src/lib/music/rhythmPolygon.js');
const I = require('../src/lib/instruments.js');

test('polygonFromBeats: N even beats make a regular N-gon with 360/N, N axes and N turns', () => {
  for (let n = 3; n <= 12; n++) {
    const p = RP.polygonFromBeats(n);
    assert.equal(p.sides, n);
    assert.equal(p.regular, true);
    assert.equal(p.centralAngle, Math.round(360 / n * 1e4) / 1e4);
    assert.equal(p.interiorAngle, Math.round(180 * (n - 2) / n * 1e4) / 1e4);
    assert.equal(p.axes, n, 'axes ' + n);
    assert.equal(p.rotationOrder, n, 'turns ' + n);
    assert.deepEqual([p.vertices[0].x, p.vertices[0].y], [0, -1], 'beat 0 is at the top');
    assert.match(p.nameHe, /משוכלל/);
  }
  const sq = RP.polygonFromBeats(4, 8);
  assert.deepEqual(sq.onsets, [0, 2, 4, 6]);
  assert.equal(sq.stepDeg, 45);
  assert.equal(sq.centralAngle, 90);
  assert.deepEqual(RP.polygonFromBeats([true, false, true, false, true, false]).onsets, [0, 2, 4]);
});

test('polygonFromBeats: uneven rhythms, too few beats and impossible clocks', () => {
  const p = RP.polygonFromBeats([0, 1, 3], 8);
  assert.equal(p.sides, 3);
  assert.equal(p.regular, false);
  assert.equal(p.centralAngle, null);
  assert.equal(p.axes, 0);
  assert.equal(p.rotationOrder, 1);
  const kite = RP.polygonFromBeats([0, 1, 4, 7], 8);
  assert.equal(kite.axes, 1, 'a kite has one mirror line');
  const two = RP.polygonFromBeats([0, 4], 8);
  assert.equal(two.isPolygon, false);
  assert.equal(two.sides, 0);
  assert.equal(RP.polygonFromBeats(5, 8), null, '5 even beats do not fit an 8-beat clock');
  assert.equal(RP.polygonFromBeats([0, 1.5], 4), null);
  assert.deepEqual(RP.polygonFromBeats([9, 1, 1], 8).onsets, [1], 'indices wrap and repeat once');
});

test('rotationEquivalence: a turned rhythm is the same rhythm k beats later, k*360/cycle degrees', () => {
  const a = [0, 3, 5];
  for (let k = 0; k < 8; k++) {
    const r = RP.rotationEquivalence(a, RP.rotate(a, k, 8), 8);
    assert.equal(r.equivalent, true);
    assert.equal(r.minSteps, k);
    assert.equal(r.minDegrees, k * 45);
  }
  assert.deepEqual(RP.rotationEquivalence([0, 2, 4, 6], [1, 3, 5, 7], 8).steps, [1, 3, 5, 7]);
  assert.deepEqual(RP.rotationEquivalence(4, 4, 4).degrees, [0, 90, 180, 270]);
  const mirror = RP.rotationEquivalence([0, 1, 3], [0, 2, 3], 8);
  assert.equal(mirror.equivalent, false, 'a mirror image is not a turn');
  assert.equal(RP.rotationEquivalence([0, 1], [0, 1, 2], 8).equivalent, false);
  assert.equal(RP.rotationEquivalence([true, false, true], [false, true, true]).equivalent, true);
});

test('pitch by angle is an optional weak add-on, off unless asked', () => {
  assert.deepEqual([RP.PITCH_ADDON.mechanism, RP.PITCH_ADDON.optional, RP.PITCH_ADDON.evidence], ['M5', true, 'weak']);
  assert.match(RP.PITCH_ADDON.he, /ראיות חלשות/);
  assert.ok(I.WEAK.includes(RP.PITCH_ADDON.mechanism));
  assert.equal(RP.pitchForAngle(0, 200), 200);
  assert.equal(RP.pitchForAngle(360, 200), 200);
  assert.equal(RP.pitchForAngle(180, 200), Math.round(200 * Math.SQRT2 * 100) / 100);
  const plain = RP.cyclePlan(4, 8, { bpm: 60 });
  assert.equal(plain.length, 8);
  assert.deepEqual(plain.filter((n) => n.kind === 'corner').map((n) => n.at), [0, 2, 4, 6]);
  assert.ok(plain.filter((n) => n.kind === 'corner').every((n) => n.hz === undefined));
  assert.ok(RP.cyclePlan(4, 8, { pitch: true }).filter((n) => n.kind === 'corner').every((n) => n.hz > 0));
});