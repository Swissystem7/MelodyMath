const test = require('node:test');
const assert = require('node:assert/strict');
const bc = require('../src/lib/music/beatCounter');

function fill(round) {
  let r = round;
  for (let i = 0; i < r.count; i++) r = bc.placeObject(r, i).round;
  return r;
}

test('the primary way is M1 and it builds to M2; M5 is never primary', () => {
  const r = bc.createRound({ count: 7 });
  assert.equal(r.primary.mechanism, 'M1');
  assert.equal(r.primary.buildsTo, 'M2');
  assert.notEqual(r.primary.mechanism, 'M5');
  assert.equal(r.instrument, 'handbells');
});

test('one object per beat: beats and objects match one-to-one', () => {
  let r = bc.createRound({ count: 7, bpm: 80 });
  assert.equal(r.slots.length, 7);
  assert.equal(bc.isMatched(r), false);
  r = fill(r);
  assert.equal(bc.placedCount(r), 7);
  assert.equal(bc.isMatched(r), true);
  assert.equal(bc.checkTotal(r, 7), true);
  assert.equal(bc.checkTotal(r, '7'), true);
  assert.equal(bc.checkTotal(r, 8), false);
  assert.equal(bc.checkTotal(r, ''), false);
});

test('a second tap on the same beat is refused with a gentle hint', () => {
  const r = bc.createRound({ count: 3 });
  const a = bc.placeObject(r, 1);
  assert.equal(a.accepted, true);
  const b = bc.placeObject(a.round, 1);
  assert.equal(b.accepted, false);
  assert.equal(b.hint, 'כל צליל = חפץ אחד');
  assert.equal(bc.placedCount(b.round), 1);
  assert.equal(bc.placeObject(r, 5).accepted, false);
  assert.equal(bc.placedCount(r), 0); // placeObject does not mutate
});

test('the second round changes tempo or instrument and asks more, less or equal', () => {
  const first = bc.createRound({ count: 7, bpm: 80 });
  assert.equal(bc.secondRound(first, {}), null); // same tempo and instrument is not a new round
  const faster = bc.secondRound(first, { bpm: 140 });
  assert.equal(faster.count, 7);
  assert.equal(bc.compareRounds(first, faster), 'equal');
  assert.equal(bc.checkCompare(first, faster, 'שווה'), true);
  assert.equal(bc.checkCompare(first, faster, 'more'), false);
  const kalimba = bc.secondRound(first, { instrument: 'kalimba', count: 9 });
  assert.equal(kalimba.instrument, 'kalimba');
  assert.equal(bc.compareRounds(first, kalimba), 'more');
  assert.equal(bc.compareRounds(first, bc.secondRound(first, { bpm: 60, count: 5 })), 'less');
});

test('the M5 extra is weak evidence and appears only after the solve', () => {
  assert.equal(bc.addonFor(false), null);
  const addon = bc.addonFor(true);
  assert.equal(addon.mechanism, 'M5');
  assert.equal(addon.evidence, 'weak');
  assert.equal(addon.he, 'תרגול נוסף (ראיות חלשות)');
});

test('invalid rounds are refused', () => {
  assert.equal(bc.createRound({ count: 0 }), null);
  assert.equal(bc.createRound({ count: 21 }), null);
  assert.equal(bc.createRound({ count: 5, bpm: 500 }), null);
});
