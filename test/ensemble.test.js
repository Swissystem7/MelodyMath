'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const ensemble = require('../src/lib/music/ensemble.js');
const instruments = require('../src/lib/instruments.js');

test('central percussion instruments exist in instruments.js with verified http(s) sources', () => {
  assert.deepEqual(ensemble.CENTRAL_PERCUSSION, ['darbuka', 'djembe', 'tabla', 'cajon', 'taiko', 'marimba']);
  for (const id of ensemble.CENTRAL_PERCUSSION) {
    const inst = instruments.instrumentById(id);
    assert.ok(inst, 'missing central percussion ' + id);
    assert.equal(inst.family, 'percussion');
    assert.match(inst.source, /^https?:\/\//);
    assert.equal(ensemble.isCentralPercussion(id), true);
  }
});

test('ensembleForTopic picks 2-3 verified instruments anchored by central percussion across families', () => {
  const multGroup = ensemble.ensembleForTopic('multiplication', 3);
  assert.ok(multGroup);
  assert.equal(multGroup.length, 3);
  assert.equal(ensemble.isCentralPercussion(multGroup[0].id), true);
  const families = new Set(multGroup.map((x) => x.family));
  assert.ok(families.size >= 2, 'expected multiple instrument families');
  multGroup.forEach((x) => assert.match(x.source, /^https?:\/\//));

  const fracGroup = ensemble.ensembleForTopic('fractions', 3);
  assert.ok(fracGroup);
  assert.equal(fracGroup.length, 3);
  assert.equal(fracGroup[0].id, 'darbuka');
  const fracFamilies = new Set(fracGroup.map((x) => x.family));
  assert.ok(fracFamilies.size >= 3, 'fractions should span at least 3 instrument families');
});

test('buildCrossInstrumentRatio matches tempo, fraction and duration across darbuka, guitar and recorder', () => {
  const match = ensemble.buildCrossInstrumentRatio(['darbuka', 'guitar', 'recorder'], 2, 4, 120);
  assert.ok(match);
  assert.equal(match.mechanism, 'M3');
  assert.equal(match.optional, false);
  assert.equal(match.evidence, 'strong');
  assert.equal(match.bpm, 120);
  assert.equal(match.fraction, '2/4');
  assert.equal(match.reducedFraction, '1/2');
  assert.equal(match.ratio, 0.5);
  assert.equal(match.mathDisplay, '2/4 = 1/2');
  assert.equal(match.tracks.length, 3);
  for (const tr of match.tracks) {
    assert.equal(tr.bpm, 120);
    assert.equal(tr.fraction, '2/4');
    assert.equal(tr.reducedFraction, '1/2');
    assert.equal(tr.soundDurationMs, 1000);
    assert.equal(tr.barMs, 2000);
    assert.match(tr.source, /^https?:\/\//);
  }
});

test('buildEnsembleCycle combines tabla 3s + marimba 4s into common multiple 12', () => {
  const cyc = ensemble.buildEnsembleCycle([
    { id: 'tabla', step: 3 },
    { id: 'marimba', step: 4 },
  ], 90);
  assert.ok(cyc);
  assert.equal(cyc.mechanism, 'M2');
  assert.equal(cyc.optional, false);
  assert.equal(cyc.evidence, 'strong');
  assert.equal(cyc.answer, 12);
  assert.deepEqual(cyc.unisonBeats, [12]);
  assert.deepEqual(cyc.parts[0].accentBeats, [3, 6, 9, 12]);
  assert.deepEqual(cyc.parts[1].accentBeats, [4, 8, 12]);
  assert.equal(cyc.timeline.length, 12);
  assert.equal(cyc.timeline[11].unison, true);
  assert.deepEqual(cyc.timeline[11].activeIds, ['tabla', 'marimba']);

  assert.deepEqual(ensemble.checkEnsembleAnswer(cyc, 12), {
    correct: true,
    expected: 12,
    reason: 'exact',
  });
  assert.deepEqual(ensemble.checkEnsembleAnswer(cyc, 24), {
    correct: false,
    expected: 12,
    reason: 'multiple',
  });
  assert.deepEqual(ensemble.checkEnsembleAnswer(cyc, 7), {
    correct: false,
    expected: 12,
    reason: 'mismatch',
  });
});

test('buildEnsembleCycle supports 3-instrument ensemble and enforces dosage rules for M4 LCM mode', () => {
  const cyc3 = ensemble.buildEnsembleCycle([
    { id: 'taiko', step: 2 },
    { id: 'tabla', step: 3 },
    { id: 'piano', step: 4 },
  ], 100, 'lcm');
  assert.ok(cyc3);
  assert.equal(cyc3.mechanism, 'M4');
  assert.equal(cyc3.optional, true);
  assert.equal(cyc3.evidence, 'weak');
  assert.equal(cyc3.answer, 12);
  assert.deepEqual(cyc3.unisonBeats, [12]);

  // Rejects when fewer than 2 or more than 3 instruments, or without percussion
  assert.equal(ensemble.buildEnsembleCycle([{ id: 'tabla', step: 3 }]), null);
  assert.equal(ensemble.buildEnsembleCycle([
    { id: 'guitar', step: 2 },
    { id: 'piano', step: 3 },
  ]), null);
});
