'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const variety = require('../src/lib/exercises/variety.js');
const instruments = require('../src/lib/instruments.js');

test('10 rounds of the same topic never repeat the same exercise twice in a row', () => {
  ['multiplication', 'division', 'addition', 'subtraction', 'fractions'].forEach(topic => {
    const session = variety.createVarietySession(topic);
    let prev = null;
    for (let r = 0; r < 10; r++) {
      const current = session.next();
      assert.ok(current, 'round ' + r + ' exercise exists');
      if (prev) {
        assert.notEqual(current.prompt, prev.prompt, 'No duplicate prompt in ' + topic);
        assert.notEqual(current.numberKey, prev.numberKey, 'No duplicate key in ' + topic);
      }
      prev = current;
    }
  });
});

test('per topic keeps the same exercise type across all rounds', () => {
  const specs = [
    { topic: 'multiplication', expectedType: 'multiplication' }, { topic: 'division', expectedType: 'division' },
    { topic: 'counting', expectedType: 'addition' }, { topic: 'nextPrev', expectedType: 'subtraction' },
    { topic: 'fractions', expectedType: 'fractions' }
  ];
  specs.forEach(spec => {
    const session = variety.createVarietySession(spec.topic);
    for (let r = 0; r < 10; r++) {
      assert.equal(session.next().exerciseType, spec.expectedType, 'exerciseType must stay ' + spec.expectedType);
    }
  });
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
  const expected = instruments.forTopic(topic).map(x => x.id);
  assert.ok(expected.length >= 2, 'multiplication has at least 2 instruments');
  const session = variety.createVarietySession(topic);
  const picked = new Set();
  for (let r = 0; r < 10; r++) {
    const ex = session.next();
    assert.ok(expected.includes(ex.instrument), 'Instrument must match topic');
    picked.add(ex.instrument);
  }
  assert.ok(picked.size >= 2, 'Multiple distinct instruments were used');
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

test('rhythm patterns vary only within the same musical method (quarters/eighths) (Refs #665)', () => {
  const session = variety.createVarietySession('counting');
  const methods = new Set(), subdivisions = new Set();
  for (let r = 0; r < 10; r++) {
    const ex = session.next();
    assert.equal(ex.rhythmPattern.meter, '4/4', 'Meter must stay consistent in 4/4');
    methods.add(ex.rhythmPattern.method);
    subdivisions.add(ex.rhythmPattern.subdivision);
  }
  assert.equal(methods.size, 1, 'Rhythm varies strictly within one musical method (steady_beat)');
  assert.ok(subdivisions.size >= 3, 'Rhythm subdivisions vary across rounds');
});

test('grade 1 per-topic ranges and safe bounds across ALL exercise types (Refs #665)', () => {
  // resolveGrade mapping tests
  assert.equal(variety.resolveGrade('mm-cur-13'), 'א', 'mm-cur-13 resolves to grade א');
  assert.equal(variety.resolveGrade({ topicId: 'mm-cur-13' }), 'א', 'object mm-cur-13 resolves to grade א');
  assert.equal(variety.resolveGrade('g1-add'), 'א', 'g1-add resolves to grade א');
  assert.equal(variety.resolveGrade({ id: 'g1-add' }), 'א', 'object g1-add resolves to grade א');

  // mm-cur-4 whole tens to 100
  const tensSession = variety.createVarietySession('mm-cur-4');
  for (let r = 0; r < 10; r++) {
    const ex = tensSession.next();
    const parts = ex.numberKey.split('+').map(Number);
    assert.ok(parts[0] % 10 === 0 && parts[1] % 10 === 0, 'operands are whole tens');
    assert.ok(ex.answer <= 100 && ex.answer % 10 === 0, 'sum is whole tens <= 100');
  }

  // ALL exercise types in grade 1 must not exceed grade bounds
  ['addition', 'subtraction', 'multiplication', 'division', 'fractions', 'counting'].forEach(type => {
    const session = variety.createVarietySession(type, { grade: 'א' });
    for (let r = 0; r < 15; r++) {
      const ex = session.next();
      if (type === 'addition') {
        assert.ok(ex.answer <= 20, `Addition answer ${ex.answer} <= 20`);
      } else if (type === 'subtraction') {
        assert.ok(ex.answer <= 20, `Subtraction answer ${ex.answer} <= 20`);
      } else if (type === 'multiplication') {
        assert.ok(ex.answer <= 20, `Multiplication ${ex.answer} <= 20 (no 10x8=80)`);
        const parts = ex.numberKey.split('*').map(Number);
        assert.ok(parts[0] <= 10 && parts[1] <= 10, 'factors bounded');
      } else if (type === 'division') {
        const [dividend, divisor] = ex.numberKey.split(':').map(Number);
        assert.ok(dividend <= 20, `Division dividend ${dividend} <= 20 (no 56:7)`);
      } else if (type === 'fractions') {
        const denom = Number(ex.answer.split('/')[1]);
        assert.ok(denom <= 4, `Fraction denominator ${denom} <= 4`);
      } else if (type === 'counting') {
        assert.ok(ex.answer <= 20, `Counting answer ${ex.answer} <= 20`);
      }
    }
  });
});
