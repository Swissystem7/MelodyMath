const test = require('node:test');
const assert = require('node:assert/strict');
const pat = require('../src/lib/music/patterns');
const il = require('../src/lib/music/interleave');

test('grow with +3 gives 3, 6, 9, 12', () => {
  const p = pat.generatePattern({ type: 'grow', rule: '+3', length: 4 });
  assert.equal(p.mechanism, 'M6');
  assert.deepEqual(p.values, [3, 6, 9, 12]);
  assert.deepEqual(p.notes.map((n) => n.symbol), ['3', '6', '9', '12']);
  assert.equal(p.notes[0].pitch, 'E4');
});

test('grow with ×2 doubles from 1, and steps up from a given start', () => {
  assert.deepEqual(pat.generatePattern({ type: 'grow', rule: '×2', length: 5 }).values, [1, 2, 4, 8, 16]);
  assert.deepEqual(pat.generatePattern({ type: 'grow', rule: 'x2', length: 3, start: 3 }).values, [3, 6, 12]);
  assert.deepEqual(pat.generatePattern({ type: 'grow', rule: '+2', length: 3, start: 2 }).values, [2, 4, 6]);
  assert.equal(pat.generatePattern({ type: 'grow', rule: '-1', length: 3 }), null);
  assert.equal(pat.generatePattern({ type: 'grow', rule: '×1', length: 3 }), null);
});

test('repeat cycles the motif: ABB ABB', () => {
  const p = pat.generatePattern({ type: 'repeat', rule: 'ABB', length: 6 });
  assert.deepEqual(p.notes.map((n) => n.symbol).join(''), 'ABBABB');
  assert.deepEqual(p.values, [1, 2, 2, 1, 2, 2]);
  assert.deepEqual(p.notes.map((n) => n.pitch), ['C4', 'D4', 'D4', 'C4', 'D4', 'D4']);
  assert.equal(pat.generatePattern({ type: 'repeat', rule: 'A', length: 4 }), null);
});

test('mirror gives a symmetric pattern', () => {
  const even = pat.generatePattern({ type: 'mirror', rule: 'ABC', length: 6 });
  assert.equal(even.notes.map((n) => n.symbol).join(''), 'ABCCBA');
  assert.equal(pat.isMirror(even.values), true);
  const odd = pat.generatePattern({ type: 'mirror', rule: 'ABC', length: 5 });
  assert.equal(odd.notes.map((n) => n.symbol).join(''), 'ABCBA');
  assert.equal(pat.isMirror(odd.values), true);
  assert.equal(pat.isMirror([1, 2, 3]), false);
});

test('unknown types and lengths are refused', () => {
  assert.equal(pat.generatePattern({ type: 'spiral', rule: 'AB' }), null);
  assert.equal(pat.generatePattern({ type: 'repeat', rule: 'AB', length: 1 }), null);
  assert.equal(pat.generatePattern({ type: 'repeat', rule: 'A1', length: 4 }), null);
});

test('findRuleBreak points at the note where the echo breaks the rule', () => {
  const p = pat.generatePattern({ type: 'grow', rule: '+3', length: 4 });
  assert.equal(pat.findRuleBreak(p, [3, 6, 9, 12]), -1);
  assert.equal(pat.findRuleBreak(p, [3, 6, 10, 12]), 2);
  assert.equal(pat.findRuleBreak(p, [3, 6]), 2);
  assert.equal(pat.findRuleBreak(p, [3, 6, 9, 12, 15]), 4);
  const r = pat.generatePattern({ type: 'repeat', rule: 'AB', length: 4 });
  assert.equal(pat.findRuleBreak(r, r.notes.slice(0, 3).concat([{ value: 1 }])), 3);
});

test('a timbre without a source fails unless it says TODO', () => {
  assert.equal(pat.timbreHasSource({ instrument: 'gamelan', why: 'TODO', source: 'TODO' }), true);
  assert.equal(pat.timbreHasSource({ instrument: 'marimba' }), false);
  assert.equal(pat.timbreHasSource({ instrument: 'piano', source: '' }), false);
});

function items(spec) {
  const out = [];
  Object.keys(spec).forEach((t) => { for (let i = 0; i < spec[t]; i++) out.push({ type: t, id: t + i }); });
  return out;
}

test('interleave puts at least 2 pattern types in every round of 6', () => {
  const list = items({ repeat: 8, grow: 6, mirror: 4 });
  const r = il.interleave(list);
  assert.equal(r.ok, true);
  assert.deepEqual(r.rounds.map((x) => x.length), [6, 6, 6]);
  r.rounds.forEach((round) => assert.ok(il.typesIn(round) >= 2));
  assert.equal(r.rounds.flat().length, list.length);
  assert.deepEqual(new Set(r.rounds.flat().map((x) => x.id)).size, list.length);
});

test('interleave copes with uneven counts and a short last round', () => {
  const r = il.interleave(items({ grow: 9, mirror: 3, repeat: 2 }));
  assert.equal(r.ok, true);
  assert.deepEqual(r.rounds.map((x) => x.length), [6, 6, 2]);
});

test('interleave reports when the rule cannot be met', () => {
  assert.equal(il.interleave(items({ repeat: 6 })).ok, false);
  assert.equal(il.interleave(items({ repeat: 17, grow: 1 })).ok, false);
  assert.equal(il.roundsOk([[{ type: 'grow' }, { type: 'grow' }]]), false);
  assert.equal(il.roundsOk([[{ type: 'grow' }]]), true);
});
