// Test that 100 consecutive exercises per topic do not repeat numberKey within a 5-round window,
// keep same exercise type, and stay within topic grade range.

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const variety = require('../src/lib/exercises/variety.js');

// Helper to get all topics supported by variety.js
function getAllTopics() {
  // Include curriculum topic keys
  const topicRanges = variety.TOPIC_RANGES ? Object.keys(variety.TOPIC_RANGES) : [];
  // Include generic topic keys from resolveTopicKey mapping
  const generic = ['multiplication','division','addition','subtraction','fractions','counting','numberLine','patterns','symmetry','skipCounting','nextPrev','decimals'];
  const all = Array.from(new Set([...topicRanges, ...generic]));
  return all;
}

const topics = getAllTopics();

for (const topic of topics) {
  test(`100 draws for topic '${topic}' – no repeat within 5, same type, within grade range`, () => {
    const session = variety.createVarietySession(topic);
    const recent = [];
    let firstType = null;
    const { min, max } = variety.getTopicRange(topic);
    for (let i = 0; i < 100; i++) {
      const ex = session.next();
      // Ensure exercise type stays consistent
      if (i === 0) firstType = ex.exerciseType;
      else assert.equal(ex.exerciseType, firstType, `Exercise type changed at round ${i} for topic ${topic}`);

      // Ensure numberKey does not repeat within last 5
      assert.ok(!recent.includes(ex.numberKey), `numberKey ${ex.numberKey} repeated within 5-round window at round ${i}`);
      recent.push(ex.numberKey);
      if (recent.length > 5) recent.shift();

      // Ensure numeric answer within grade range where applicable
      if (typeof ex.answer === 'number') {
        assert.ok(ex.answer >= min && ex.answer <= max, `Answer ${ex.answer} out of range [${min},${max}] at round ${i}`);
      } else if (typeof ex.answer === 'string' && ex.answer.includes('/')) {
        // For fractions, check denominator not exceeding max (as a simple proxy)
        const denom = Number(ex.answer.split('/')[1]);
        if (!Number.isNaN(denom)) {
          assert.ok(denom <= max, `Fraction denominator ${denom} out of range [${min},${max}] at round ${i}`);
        }
      }
    }
  });
}
