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
    { topic: 'counting', expectedType: 'counting' }, { topic: 'nextPrev', expectedType: 'counting' },
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

test('resolveGrade maps curriculum topics per grade (mm-cur-12 in grade א, mm-cur-13 in grade ב) (Refs #665)', () => {
  [['mm-cur-0', 'א'], ['mm-cur-12', 'א'], ['mm-cur-13', 'ב'], ['mm-cur-22', 'ג'], ['mm-cur-31', 'ד'], ['mm-cur-38', 'ה'], ['mm-cur-50', 'ו'], ['g1-add', 'א']].forEach(([id, g]) => {
    assert.equal(variety.resolveGrade(id), g, `${id} resolves to grade ${g}`);
    assert.equal(variety.resolveGrade({ topicId: id }), g, `object ${id} resolves to grade ${g}`);
  });
});

test('number ranges are defined per topic, not per grade only (Refs #665)', () => {
  assert.ok(variety.TOPIC_RANGES && variety.TOPIC_RANGES['mm-cur-3'], 'mm-cur-3 topic range defined');
  assert.ok(variety.TOPIC_RANGES['mm-cur-4'], 'mm-cur-4 topic range defined');
  assert.equal(variety.getTopicRange('mm-cur-3').max, 20, 'mm-cur-3 capped at 20');
  assert.equal(variety.getTopicRange('mm-cur-4').max, 100, 'mm-cur-4 whole tens to 100 in grade א');
  assert.equal(variety.getTopicRange('mm-cur-13').max, 1000, 'mm-cur-13 place value to 1000 in grade ב');
  assert.equal(variety.getTopicRange('mm-cur-14').max, 100, 'mm-cur-14 addition to 100 in grade ב');

  const s3 = variety.createVarietySession('mm-cur-3');
  for (let r = 0; r < 10; r++) assert.ok(s3.next().answer <= 20, 'mm-cur-3 answers bounded by 20');

  const s14 = variety.createVarietySession('mm-cur-14');
  let hasOver20 = false;
  for (let r = 0; r < 10; r++) {
    const ex = s14.next();
    assert.ok(ex.answer <= 100, 'mm-cur-14 answers bounded by 100');
    if (ex.answer > 20) hasOver20 = true;
  }
  assert.ok(hasOver20, 'mm-cur-14 reaches into two-digit addition beyond 20');
});

test('grade 1 per-topic ranges and safe bounds across ALL exercise types (Refs #665)', () => {
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
      if (type === 'addition' || type === 'subtraction' || type === 'counting') {
        assert.ok(ex.answer <= 20, `${type} answer ${ex.answer} <= 20`);
      } else if (type === 'multiplication') {
        assert.ok(ex.answer <= 20, `Multiplication ${ex.answer} <= 20`);
        const parts = ex.numberKey.split('*').map(Number);
        assert.ok(parts[0] <= 10 && parts[1] <= 10, 'factors bounded');
      } else if (type === 'division') {
        const [dividend] = ex.numberKey.split(':').map(Number);
        assert.ok(dividend <= 20, `Division dividend ${dividend} <= 20`);
      } else if (type === 'fractions') {
        assert.ok(Number(ex.answer.split('/')[1]) <= 4, 'Fraction denom <= 4');
      }
    }
  });
});

test('number line hides its answer, percentages leave the ukulele, and a kept sentence changes numbers (Refs #687 #665)', () => {
  const curriculum = require('../src/lib/curriculum.js');
  const banks = require('../src/lib/banks.js');
  const shows = (a, p) => new RegExp('(^|[^\\d.])' + String(a).replace(/\./g, '\\.') + '([^\\d]|$)').test(String(p));
  for (let r = 0; r < 12; r++) {
    const ex = variety.generateVariant('mm-cur-2', r, { seed: r });
    assert.equal(shows(ex.answer, ex.prompt), false, ex.prompt);
  }
  const line = curriculum.topicById('mm-cur-2');
  curriculum.itemsForTopic('mm-cur-2', banks.itemsForGrade(line.grade)).forEach((it) => {
    const ex = variety.generateVariant(Object.assign({ topicId: 'mm-cur-2' }, it), 2, { seed: 4, rounds: 6 });
    assert.equal(shows(ex.answer, ex.prompt), false, ex.prompt);
  });
  assert.equal(instruments.forTopic('percent').some((x) => x.id === 'ukulele'), false);
  assert.ok(instruments.instrumentById('ukulele').mathTopics.includes('fractions'));
  for (let r = 0; r < 6; r++) assert.notEqual(variety.generateVariant('mm-cur-53', r, { seed: r }).instrument, 'ukulele');
  assert.ok(variety.TOPIC_RANGES['mm-cur-45'] && variety.TOPIC_RANGES['mm-cur-46']);
  [
    ['mm-cur-3', 'addition', '3 פעימות תוף ועוד 2 — כמה ביחד?', 5, /פעימות תוף ועוד/],
    ['mm-cur-7', 'word_problems', 'לדנה 3 מדבקות. אמא נתנה לה עוד 2. כמה מדבקות יש לדנה?', 5, /לדנה/],
    ['mm-cur-15', 'multiplication', '3 × 9 = ?', 27, /×/],
    ['mm-cur-16', 'division', '10 עוגיות ל־2 ילדים, בשווה. כמה לכל אחד?', 5, /עוגיות/],
    ['mm-cur-23', 'subtraction', '3,800 − 600 = ? (כתבו בלי פסיק)', 3200, /כתבו בלי פסיק/],
    ['mm-cur-45', 'decimals', 'כתבו כשבר עשרוני: 7/10', 0.7, /כשבר עשרוני/],
    ['mm-cur-46', 'decimals', '0.3 + 0.4 = ?', 0.7, /\+/],
  ].forEach((c) => {
    const seen = new Set();
    for (let r = 0; r < 6; r++) {
      const ex = variety.generateVariant({ topicId: c[0], skill: c[1], prompt: c[2], answer: c[3] }, r, { seed: 4, rounds: 6 });
      assert.match(ex.prompt, c[4], c[0] + ' ' + ex.prompt);
      const range = variety.getTopicRange(c[0]);
      assert.ok(ex.answer >= range.min && ex.answer <= range.max, c[0] + ' ' + ex.answer);
      seen.add(ex.prompt);
    }
    assert.equal(seen.size, 6, c[0]);
  });
  curriculum.MATRIX.forEach((row) => {
    const ex = variety.generateVariant(row.topicId, 0, { seed: 3 });
    assert.equal(String(ex.prompt).includes('כמה פעימות נשמעו?'), false, row.topicId);
  });
});
