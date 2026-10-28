'use strict';
// A worked example must add up: "ראו: 5 תופים ועוד 6 פעמונים הם 5 צלילים" was
// shown because the variety pass rewrote the two addends but kept the total.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const V = require('../src/lib/exercises/variety.js');

const SUM = /(\d+) תופים ועוד (\d+) פעמונים הם (\d+)/;
const worked = banks.allItems().filter((it) => it && it.kind === 'worked_example');

test('every bank worked example adds up', () => {
  assert.ok(worked.length > 0, 'the bank has worked examples');
  for (const it of worked) {
    assert.equal(it.a + it.b, it.total, it.id);
    assert.equal(Number(it.answer), it.total, it.id);
    const m = String(it.prompt).match(SUM);
    assert.ok(m, 'prompt states the sum: ' + it.prompt);
    assert.equal(+m[1] + +m[2], +m[3], it.prompt);
  }
});

test('a varied worked example still adds up, in every topic, round and seed', () => {
  let checked = 0;
  for (const it of worked) {
    for (const topic of Object.keys(V.TOPIC_RANGES)) {
      const src = Object.assign({}, it, { topicId: topic });
      for (let round = 0; round < 6; round++) {
        for (const seed of [0, 1, 7, 42, 123]) {
          const ex = V.generateVariant(src, round, { rounds: 6, seed });
          const m = String(ex.prompt).match(SUM);
          if (!m) continue;
          checked++;
          const where = `${topic} r${round} s${seed}: ${ex.prompt}`;
          assert.equal(+m[1] + +m[2], +m[3], where);
          assert.equal(Number(ex.answer), +m[3], where);
        }
      }
    }
  }
  assert.ok(checked > 0, 'some variants kept the worked-example prompt');
});
