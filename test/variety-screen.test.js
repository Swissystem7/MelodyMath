'use strict';
// The topic practice screen (?topic=) draws sums through varyTopicExercise.
// mm-cur-1, mm-cur-22, mm-cur-31 and mm-cur-38 must stay in range on that path.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const variety = require('../src/lib/exercises/variety.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function varyTopicExercise() {
  const start = html.indexOf('function varyTopicExercise');
  assert.ok(start > 0, 'varyTopicExercise is in index.html');
  const end = html.indexOf('\nfunction ', start + 1);
  const sandbox = { MM_VARIETY: variety };
  vm.createContext(sandbox);
  vm.runInContext(html.slice(start, end) + '\nthis.vary = varyTopicExercise;', sandbox);
  return sandbox.vary;
}

const vary = varyTopicExercise();
const PLACE = [
  ['mm-cur-1', 10, 100],
  ['mm-cur-22', 100, 10000],
  ['mm-cur-31', 100, 1000000],
  ['mm-cur-38', 1000, 10000000],
];

test('index.html loads variety.js for the topic practice screen', () => {
  assert.match(html, /<script src="src\/lib\/exercises\/variety\.js"><\/script>/);
  assert.match(html, /varyTopicExercise\(rmPlanTopic/);
  assert.match(html, /rmPlanTopic=id/);
});

for (const [id, min, max] of PLACE) {
  test(id + ' practice sums stay inside ' + min + ' to ' + max, () => {
    assert.deepEqual(variety.getTopicRange(id), { min: min, max: max });
    const seen = [];
    for (let round = 0; round < 100; round++) {
      const ex = vary(id, { id: 'bank', prompt: 'old', answer: 0 }, round);
      assert.equal(typeof ex.answer, 'number', id + ' round ' + round);
      assert.ok(ex.answer >= min && ex.answer <= max, id + ' answer ' + ex.answer);
      assert.equal(ex.topicId, id);
      assert.notEqual(ex.prompt, 'old');
      const combo = ex.numberKey + '|' + ex.instrument + '|' + ex.bpm;
      assert.equal(seen.includes(combo), false, id + ' repeated ' + combo);
      seen.push(combo);
      if (seen.length > 5) seen.shift();
    }
  });
}
