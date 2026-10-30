const test = require('node:test');
const assert = require('node:assert/strict');
const variety = require('../src/lib/exercises/variety.js');

function getAllTopics() {
  const topicRanges = variety.TOPIC_RANGES ? Object.keys(variety.TOPIC_RANGES) : [];
  const generic = ['multiplication','division','addition','subtraction','fractions','counting','numberLine','patterns','symmetry','skipCounting','nextPrev','decimals'];
  return Array.from(new Set([...topicRanges, ...generic]));
}

for (const topic of getAllTopics()) {
  test(`100 draws for topic '${topic}' – no repeat within 5, constant type, values in range`, () => {
      const session = variety.createVarietySession(topic);
      const recent = [];
      let firstType = null;
      const { min, max } = variety.getTopicRange(topic);
      for (let i = 0; i < 100; i++) {
        const ex = session.next();
        if (i === 0) firstType = ex.exerciseType;
        else assert.equal(ex.exerciseType, firstType, `Exercise type changed at round ${i} for topic ${topic}`);
        const combo = `${ex.numberKey}|${ex.instrument}|${ex.bpm}`;
        assert.ok(!recent.includes(combo), `repeat combo ${combo} within 5‑window at round ${i}`);
        recent.push(combo);
        if (recent.length > 5) recent.shift();
        if (typeof ex.answer === 'number') {
          assert.ok(ex.answer >= min && ex.answer <= max, `Answer ${ex.answer} out of range [${min},${max}]`);
        } else if (typeof ex.answer === 'string' && ex.answer.includes('/')) {
          const denom = Number(ex.answer.split('/')[1]);
          if (!Number.isNaN(denom)) assert.ok(denom <= max, `Denominator ${denom} out of range`);
        }
      }
    });
}

