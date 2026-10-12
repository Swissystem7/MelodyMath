const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('../src/lib/grade3Music');
const M = require('../src/lib/musicEngine');

test('table 3 counts in 3/4 and table 6 in 6/8, so a multiple is an accent', () => {
  assert.deepEqual(G.meterForTable(3), { table: 3, timeSig: '3/4', beatsPerBar: 3 });
  assert.deepEqual(G.meterForTable(6), { table: 6, timeSig: '6/8', beatsPerBar: 6 });
  assert.equal(G.meterForTable(4), null, 'only the two tables the plan names have a meter');
  assert.equal(G.meterForTable(0), null);
  const beats = G.meterBeats(3, 4);
  assert.equal(beats.length, 12, '3 × 4 is four bars of three beats');
  assert.deepEqual(beats.filter((b) => b.accent).map((b) => b.count), [3, 6, 9, 12]);
  assert.deepEqual(beats.filter((b) => b.accent).map((b) => b.multiple), [3, 6, 9, 12]);
  assert.deepEqual(beats.map((b) => b.bar).slice(0, 4), [1, 1, 1, 2]);
  assert.deepEqual(G.meterBeats(4, 2), [], 'no meter, no beats');
  assert.match(G.meterNarration(3, 4), /3\/4/, 'a screen reader hears the meter too');
});

test('14 beats in bars of 4 is "3 שארית 2"', () => {
  assert.deepEqual(G.barsAndRemainder(14, 4), { beats: 14, perBar: 4, bars: 3, remainder: 2 });
  assert.equal(G.remainderText(G.barsAndRemainder(14, 4)), '3 שארית 2');
  assert.deepEqual(G.barsAndRemainder(12, 4).remainder, 0);
  assert.equal(G.barsAndRemainder(14, 0), null);
  assert.equal(G.barsAndRemainder(-1, 4), null);
});

test('a remainder answer is read the ways a child types it', () => {
  const want = G.barsAndRemainder(14, 4);
  ['3 שארית 2', '3שארית2', '3 ושארית 2', '3 ש 2', '3 r 2', '3, 2', '3 (2)'].forEach((given) => {
    assert.equal(G.isRemainderAnswer(given, want), true, 'expected to accept ' + given);
  });
  assert.equal(G.isRemainderAnswer('2 שארית 3', want), false, 'the pair is ordered');
  assert.equal(G.isRemainderAnswer('3', want), false, 'a non-zero remainder has to be written');
  assert.equal(G.isRemainderAnswer('3', G.barsAndRemainder(12, 4)), true, 'nobody answers "3 שארית 0"');
  assert.equal(G.isRemainderAnswer('', want), false);
  assert.equal(G.isRemainderAnswer(null, want), false);
  assert.equal(G.isRemainderAnswer('3 שארית 2', null), false);
  assert.deepEqual(G.parseRemainder('3 שארית 2'), { bars: 3, remainder: 2 });
  assert.equal(G.parseRemainder('שארית'), null);
});

test('a missed remainder is named, not just marked wrong (R5)', () => {
  const spec = { beats: 14, perBar: 4 };
  assert.match(G.remainderMiss('3', spec), /2 פעמות/, 'the bars were right, the leftover was dropped');
  assert.match(G.remainderMiss('14', spec), /כמה תיבות/, 'that was the total, not the quotient');
  assert.match(G.remainderMiss('2 שארית 6', spec), /קטנה מ־4/, 'a remainder of 6 would fill another bar');
  assert.match(G.remainderMiss('nonsense', spec), /3 שארית 2/, 'the fallback still shows the answer');
  assert.equal(G.remainderMiss('3', null), '');
});

test('"פי כמה" is the whole-number ratio, and only when it is whole', () => {
  assert.equal(G.timesMore(440, 220), 2, 'an octave');
  assert.equal(G.timesMore(120, 60), 2, 'and the same ratio in BPM');
  assert.equal(G.timesMore(660, 220), 3);
  assert.equal(G.timesMore(220, 440), null, 'the big one comes first');
  assert.equal(G.timesMore(330, 220), null, 'a fifth is not "פי" a whole number');
  assert.equal(G.timesMore(440, 0), null);
  assert.equal(G.timesMore('x', 220), null);
});

test('the rhythm grid is rows × cells, and wraps before a cell shrinks under 44px', () => {
  assert.equal(G.gridCells(3, 4), 12);
  assert.equal(G.gridCells(0, 4), null);
  assert.equal(G.gridCells(3, 20), null);
  const phone = G.gridLayout(8, 284);
  assert.equal(phone.perRow, 4, '8 steps do not fit the width a card leaves on a 360px phone');
  assert.equal(phone.wraps, 2, 'the row wraps into two half-rows of the same bar');
  assert.ok(phone.cell >= G.MIN_CELL, 'the touch target survives the wrap');
  assert.ok(phone.perRow * phone.cell + (phone.perRow - 1) * phone.gap <= 284, 'and nothing scrolls sideways');
  const wide = G.gridLayout(8, 1000);
  assert.equal(wide.perRow, 8, 'with room to spare the bar stays one row');
  assert.ok(wide.cell <= 72, 'a cell never grows past 72px');
  assert.equal(G.gridLayout(8, 0), null);
  assert.match(G.gridNarration(3, 4), /12/, 'the narration gives the total');
});

test('minutes and seconds of a tune, and Hz up to four digits', () => {
  assert.equal(G.tuneSeconds(2, 5), 125);
  assert.equal(G.tuneSeconds(1), 60, 'the seconds default to zero');
  assert.equal(G.tuneSeconds(1, 60), null, 'seconds stop at 59');
  assert.equal(G.tuneClock(125), '2:05', 'the seconds keep their leading zero');
  assert.equal(G.tuneClock(60), '1:00');
  assert.equal(G.tuneClock(-1), '');
  assert.equal(G.higherHz(1760, 880), 1760);
  assert.equal(G.higherHz(0, 880), null);
});

test('every grade-3 sound the engine is handed survives its safety clamps', () => {
  const sets = [
    G.meterEvents(6, 2, 96), G.remainderEvents(14, 4, 96),
    G.gridEvents(4, 8, 96), G.pairEvents({ a: 220, b: 440 }),
    G.pairEvents({ a: 60, b: 120, unit: 'bpm' }),
  ];
  sets.forEach((events, i) => {
    assert.ok(events.length > 0, 'event set ' + i + ' is empty');
    const notes = M.planSequence(events, 0);
    assert.equal(notes.length, events.length, 'set ' + i + ': no event was dropped as unplayable');
    notes.forEach((n) => {
      assert.ok(n.hz >= M.HZ_MIN && n.hz <= M.HZ_MAX, 'set ' + i + ': ' + n.hz + ' Hz is outside the safe range');
      assert.ok(n.gain > 0 && n.gain <= M.MAX_GAIN, 'set ' + i + ': gain ' + n.gain + ' is too loud');
    });
  });
  assert.deepEqual(G.pairEvents({ a: 0, b: 440 }), []);
  assert.match(G.pairNarration({ a: 220, b: 440 }), /הרץ/);
  assert.match(G.pairNarration({ a: 60, b: 120, unit: 'bpm' }), /פעמות לדקה/);
  assert.equal(G.pairNarration({ a: 'x' }), '');
});
