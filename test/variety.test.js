'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const variety = require('../src/lib/exercises/variety.js');
const instruments = require('../src/lib/instruments.js');

test('10 rounds of the same topic never repeat the same exercise twice in a row', () => {
  ['multiplication', 'division', 'addition', 'subtraction', 'fractions'].forEach(topic => {
    const session = variety.createVarietySession(topic);
    let prev = null;
    for (let r = 0; r < 10; r++) {
      const current = session.next();
      assert.ok(current);
      if (prev) { assert.notEqual(current.prompt, prev.prompt); assert.notEqual(current.numberKey, prev.numberKey); }
      prev = current;
    }
  });
});

test('per topic keeps the same exercise type across all rounds, and nextPrev never becomes subtraction', () => {
  const specs = [
    { topic: 'multiplication', expectedType: 'multiplication' }, { topic: 'division', expectedType: 'division' },
    { topic: 'counting', expectedType: 'addition' }, { topic: 'subtraction', expectedType: 'subtraction' },
    { topic: 'nextPrev', expectedType: 'nextPrev' }, { topic: 'fractions', expectedType: 'fractions' }
  ];
  specs.forEach(spec => {
    const session = variety.createVarietySession(spec.topic);
    for (let r = 0; r < 10; r++) {
      const ex = session.next();
      assert.equal(ex.exerciseType, spec.expectedType);
      if (spec.topic === 'nextPrev') assert.notEqual(ex.exerciseType, 'subtraction');
    }
  });
});

test('numbers vary and do not repeat within 5 rounds', () => {
  const session = variety.createVarietySession('multiplication'), window = [];
  for (let r = 0; r < 12; r++) {
    const ex = session.next();
    assert.ok(!window.includes(ex.numberKey));
    window.push(ex.numberKey);
    if (window.length > 5) window.shift();
  }
});

test('instrument is selected via instruments.forTopic and varies across rounds', () => {
  const topic = 'multiplication', expected = instruments.forTopic(topic).map(x => x.id);
  assert.ok(expected.length >= 2);
  const session = variety.createVarietySession(topic), picked = new Set();
  for (let r = 0; r < 10; r++) { const ex = session.next(); assert.ok(expected.includes(ex.instrument)); picked.add(ex.instrument); }
  assert.ok(picked.size >= 2);
});

test('tempo varies across rounds within 80-130 BPM range', () => {
  const session = variety.createVarietySession('division'), tempos = new Set();
  for (let r = 0; r < 10; r++) { const ex = session.next(); assert.ok(ex.bpm >= 80 && ex.bpm <= 130); tempos.add(ex.bpm); }
  assert.ok(tempos.size >= 3);
});

test('rhythm patterns vary only within the same musical method (quarters/eighths) (Refs #665)', () => {
  const session = variety.createVarietySession('counting'), methods = new Set(), subdivisions = new Set();
  for (let r = 0; r < 10; r++) {
    const ex = session.next();
    assert.equal(ex.rhythmPattern.meter, '4/4');
    methods.add(ex.rhythmPattern.method); subdivisions.add(ex.rhythmPattern.subdivision);
  }
  assert.equal(methods.size, 1);
  assert.ok(subdivisions.size >= 3);
});

test('resolveGrade maps curriculum topics per grade (mm-cur-12 in grade א, mm-cur-13 in grade ב) (Refs #665)', () => {
  [['mm-cur-0', 'א'], ['mm-cur-12', 'א'], ['mm-cur-13', 'ב'], ['mm-cur-22', 'ג'], ['mm-cur-31', 'ד'], ['mm-cur-38', 'ה'], ['mm-cur-50', 'ו'], ['g1-add', 'א']].forEach(([id, g]) => {
    assert.equal(variety.resolveGrade(id), g);
    assert.equal(variety.resolveGrade({ topicId: id }), g);
  });
});

test('number ranges are defined per topic, not per grade only (Refs #665)', () => {
  assert.ok(variety.TOPIC_RANGES && variety.TOPIC_RANGES['mm-cur-3'] && variety.TOPIC_RANGES['mm-cur-4']);
  assert.equal(variety.getTopicRange('mm-cur-3').max, 20);
  assert.equal(variety.getTopicRange('mm-cur-4').max, 100);
  assert.equal(variety.getTopicRange('mm-cur-13').max, 1000);
  assert.equal(variety.getTopicRange('mm-cur-14').max, 100);

  const s3 = variety.createVarietySession('mm-cur-3');
  for (let r = 0; r < 10; r++) assert.ok(s3.next().answer <= 20);

  const s14 = variety.createVarietySession('mm-cur-14');
  let hasOver20 = false;
  for (let r = 0; r < 10; r++) {
    const ex = s14.next();
    assert.ok(ex.answer <= 100);
    if (ex.answer > 20) hasOver20 = true;
  }
  assert.ok(hasOver20);
});

test('grade 1 per-topic ranges and safe bounds across ALL exercise types (Refs #665)', () => {
  const tensSession = variety.createVarietySession('mm-cur-4');
  for (let r = 0; r < 10; r++) {
    const ex = tensSession.next(), parts = ex.numberKey.split('+').map(Number);
    assert.ok(parts[0] % 10 === 0 && parts[1] % 10 === 0 && ex.answer <= 100 && ex.answer % 10 === 0);
  }

  ['addition', 'subtraction', 'multiplication', 'division', 'fractions', 'counting', 'nextPrev'].forEach(type => {
    const session = variety.createVarietySession(type, { grade: 'א' });
    for (let r = 0; r < 15; r++) {
      const ex = session.next();
      if (type === 'addition' || type === 'subtraction' || type === 'counting' || type === 'nextPrev') assert.ok(ex.answer <= 20);
      else if (type === 'multiplication') assert.ok(ex.answer <= 20 && ex.numberKey.split('*').map(Number).every(p => p <= 10));
      else if (type === 'division') assert.ok(Number(ex.numberKey.split(':')[0]) <= 20);
      else if (type === 'fractions') assert.ok(Number(ex.answer.split('/')[1]) <= 4);
    }
  });
});
