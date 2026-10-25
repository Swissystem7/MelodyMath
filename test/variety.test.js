'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const variety = require('../src/lib/exercises/variety.js');
const instruments = require('../src/lib/instruments.js');

test('10 rounds of the same topic never repeat the same exercise twice in a row', () => {
  const topics = ['multiplication', 'division', 'addition', 'subtraction', 'fractions'];

  for (const topic of topics) {
    const session = variety.createVarietySession(topic);
    let prev = null;

    for (let r = 0; r < 10; r++) {
      const current = session.next();
      assert.ok(current, 'round ' + r + ' exercise exists');
      if (prev) {
        assert.notEqual(
          current.prompt,
          prev.prompt,
          `Topic ${topic} round ${r} has identical consecutive prompt: "${current.prompt}"`
        );
        assert.notEqual(
          current.numberKey,
          prev.numberKey,
          `Topic ${topic} round ${r} has identical consecutive numberKey: "${current.numberKey}"`
        );
      }
      prev = current;
    }
  }
});

test('per topic keeps the same exercise type across all rounds', () => {
  const specs = [
    { topic: 'multiplication', expectedType: 'multiplication' },
    { topic: 'division', expectedType: 'division' },
    { topic: 'counting', expectedType: 'addition' },
    { topic: 'nextPrev', expectedType: 'subtraction' },
    { topic: 'fractions', expectedType: 'fractions' }
  ];

  for (const spec of specs) {
    const session = variety.createVarietySession(spec.topic);
    for (let r = 0; r < 10; r++) {
      const ex = session.next();
      assert.equal(
        ex.exerciseType,
        spec.expectedType,
        `Round ${r} exerciseType must stay ${spec.expectedType}, got ${ex.exerciseType}`
      );
    }
  }
});

test('numbers vary and do not repeat within 5 rounds', () => {
  const session = variety.createVarietySession('multiplication');
  const window = [];

  for (let r = 0; r < 12; r++) {
    const ex = session.next();
    assert.ok(!window.includes(ex.numberKey), `numberKey ${ex.numberKey} repeated within 5-round window at round ${r}`);
    window.push(ex.numberKey);
    if (window.length > 5) window.shift();
  }
});

test('instrument is selected via instruments.forTopic and varies across rounds', () => {
  const topic = 'multiplication';
  const expectedInstruments = instruments.forTopic(topic).map(x => x.id);
  assert.ok(expectedInstruments.length >= 2, 'multiplication has at least 2 instruments');

  const session = variety.createVarietySession(topic);
  const pickedInstruments = new Set();

  for (let r = 0; r < 10; r++) {
    const ex = session.next();
    assert.ok(
      expectedInstruments.includes(ex.instrument),
      `Instrument ${ex.instrument} must come from instruments.forTopic(${topic})`
    );
    pickedInstruments.add(ex.instrument);
  }

  assert.ok(pickedInstruments.size >= 2, 'Multiple distinct instruments were used across 10 rounds');
});

test('tempo varies across rounds within 80-130 BPM range', () => {
  const session = variety.createVarietySession('division');
  const tempos = new Set();

  for (let r = 0; r < 10; r++) {
    const ex = session.next();
    assert.ok(ex.bpm >= 80 && ex.bpm <= 130, `Tempo ${ex.bpm} outside 80-130 BPM range`);
    tempos.add(ex.bpm);
  }

  assert.ok(tempos.size >= 3, 'Tempos vary across rounds');
});

test('rhythm patterns vary across rounds', () => {
  const session = variety.createVarietySession('counting');
  const patterns = new Set();

  for (let r = 0; r < 10; r++) {
    const ex = session.next();
    assert.ok(ex.rhythmPattern && ex.rhythmPattern.id, 'Rhythm pattern defined');
    patterns.add(ex.rhythmPattern.id);
  }

  assert.ok(patterns.size >= 3, 'Rhythm patterns vary across rounds');
});
