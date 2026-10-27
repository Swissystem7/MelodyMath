'use strict';
// #759 (Refs #687, Refs #665): one exercise type per practice step, but the
// numbers move between ranges instead of staying in one band.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const bands = require('../src/lib/exercises/numberBands');
const banks = require('../src/lib/banks');
const adaptive = require('../src/lib/adaptive');

const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const item = (id, prompt, level = 1) => ({ id, prompt, level, skill: 'add' });

test('bandOf reads the largest number in the prompt, commas included', () => {
  assert.equal(bands.bandOf(item('a', '3 + 4 = ?')), 0);
  assert.equal(bands.bandOf(item('b', '12 + 8 = ?')), 1);
  assert.equal(bands.bandOf(item('c', '47 + 25 = ?')), 2);
  assert.equal(bands.bandOf(item('d', '1,000 − 250 = ?')), 3);
  assert.equal(bands.bandOf(item('e', '2,500,000 + 1 = ?')), 7);
  assert.equal(bands.bandOf(item('f', 'כמה פעימות?')), null);
  assert.equal(bands.bandHe(1), 'עד 20');
  assert.equal(bands.bandHe(null), '');
});

test('1+4 and 4+1 share a signature, so they count as a repeat', () => {
  assert.equal(bands.signature(item('a', '1 + 4 = ?')), bands.signature(item('b', '4 + 1 = ?')));
});

test('diversify moves to another band and skips numbers seen in the last 5', () => {
  const items = [
    item('s1', '2 + 3 = ?'), item('s2', '3 + 2 = ?'), item('s3', '4 + 5 = ?'),
    item('m1', '12 + 8 = ?'), item('l1', '40 + 30 = ?')
  ];
  const out = bands.diversify(items.slice(1), [{ id: 's1', correct: true }], items);
  assert.ok(out.length > 0);
  for (const x of out) {
    assert.notEqual(x.id, 's2', '3+2 repeats 2+3');
    assert.notEqual(bands.bandOf(x), 0, 'same band as the item just shown');
  }
});

test('diversify never empties the pool and leaves a one-band pool alone', () => {
  const one = [item('a', '1 + 2 = ?'), item('b', '3 + 4 = ?'), item('c', '5 + 4 = ?')];
  assert.deepEqual(bands.diversify(one.slice(1), [{ id: 'a' }], one), one.slice(1));
  assert.deepEqual(bands.diversify(one.slice(1), [{ id: 'b' }], one), [one[2]], '3+4 is not asked twice');
  assert.deepEqual(bands.diversify([], [{ id: 'a' }], one), []);
  const only = [item('a', '1 + 2 = ?')];
  assert.deepEqual(bands.diversify(only, [{ id: 'a' }], only), only);
});

test('on the real banks, grades א׳–ו׳, picks stay in the step and change band when they can', () => {
  let varied = 0;
  for (const grade of banks.GRADES) {
    const all = banks.itemsForGrade(grade);
    for (const skill of new Set(all.map((x) => x.skill))) {
      const items = all.filter((x) => x.skill === skill);
      const history = [];
      let lastId = null;
      for (let round = 0; round < 6; round++) {
        const pool = adaptive.eligibleExercises(items, history, lastId, 1);
        const out = bands.diversify(pool, history, items);
        assert.ok(out.length > 0, grade + '/' + skill + ' round ' + round);
        assert.ok(out.every((x) => pool.includes(x)), 'diversify only narrows the adaptive pool');
        assert.ok(out.every((x) => x.skill === skill), 'exercise type stays the same');
        const prev = items.find((x) => x.id === lastId);
        const pick = out[round % out.length];
        const seen = new Set(history.slice(-5).map((h) => bands.signature(items.find((x) => x.id === h.id))));
        let unseen = pool.filter((x) => !seen.has(bands.signature(x)) || !bands.signature(x));
        if (!unseen.length) unseen = pool;
        const spread = new Set(unseen.map(bands.bandOf).filter((b) => b != null)).size;
        if (prev && spread >= 2 && bands.bandOf(prev) != null) {
          assert.ok(out.every((x) => bands.bandOf(x) !== bands.bandOf(prev)),
            grade + '/' + skill + ': stayed in band ' + bands.bandOf(prev));
        }
        if (prev && bands.bandOf(pick) !== bands.bandOf(prev)) varied++;
        history.push({ id: pick.id, correct: true });
        lastId = pick.id;
      }
    }
  }
  assert.ok(varied > 20, 'only ' + varied + ' band changes across all grades');
});

test('the practice screen picks through diversify and shows the band', () => {
  const index = read('index.html');
  assert.match(index, /<script src="src\/lib\/exercises\/numberBands\.js"><\/script>/);
  assert.match(index, /function rpPick\(\)\{[^\n]*MM_NUMBER_BANDS\.diversify\(allowed,st\.history\|\|\[\],st\.items\)/);
  assert.match(index, /function rpRender\(\)\{[^\n]*MM_NUMBER_BANDS\.bandHe\(MM_NUMBER_BANDS\.bandOf\(it\)\)/);
  assert.match(index, /function rpRender\(\)\{[^\n]*varyTopicExercise\(rmPlanTopic,rpPick\(\)/, 'topic variety from master stays');
  assert.match(read('sw.js'), /'\.\/src\/lib\/exercises\/numberBands\.js'/);
});
