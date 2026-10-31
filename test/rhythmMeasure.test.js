const test = require('node:test');
const assert = require('node:assert/strict');

const RM = require('../src/lib/music/rhythmMaster.js');
const MS = require('../src/lib/music/rhythmMeasure.js');

// ---- measurement -------------------------------------------------------

test('three parallel 12-item forms: same slots, different numbers, 6 practised + 6 unpractised', () => {
  const A = MS.buildForm('A');
  const B = MS.buildForm('B');
  const C = MS.buildForm('C');
  [A, B, C].forEach((f) => {
    assert.equal(f.length, 12);
    assert.equal(f.filter((i) => i.practised).length, 6);
    f.forEach((it) => assert.ok(it.choices.length >= 2 && it.choices.length <= 4));
  });
  A.forEach((a, i) => {
    [B[i], C[i]].forEach((b) => {
      assert.equal(a.kind, b.kind);
      assert.equal(a.voices.length, b.voices.length);
      assert.equal(a.voices.some((v) => RM.parseVoice(v).d === 2), b.voices.some((v) => RM.parseVoice(v).d === 2));
      assert.notEqual(a.prompt, b.prompt, a.slot + ' differs between forms');
      assert.ok(Math.max(a.cycle, b.cycle) / Math.min(a.cycle, b.cycle) <= 2.5, a.slot + ' similar size');
    });
  });
  A.filter((i) => !i.practised).forEach((it) => {
    assert.notEqual(it.context, 'drums', 'unpractised items use a context practice never shows');
    assert.doesNotMatch(it.prompt, /תוף|פעימ/);
  });
});

test('scoreForm splits practised and unpractised items', () => {
  const A = MS.buildForm('A');
  const all = MS.scoreForm(A, A.map((i) => i.answer));
  assert.deepEqual([all.correct, all.practised.correct, all.unpractised.correct], [12, 6, 6]);
  const half = MS.scoreForm(A, A.map((i) => (i.practised ? i.answer : 'x')));
  assert.deepEqual([half.correct, half.unpractised.correct], [6, 0]);
});

function score(unp, pr) {
  return { correct: unp + (pr || 0), total: 12, practised: { correct: pr || 0, total: 6 }, unpractised: { correct: unp, total: 6 } };
}

test('schedule: post-test opens 4 weeks after the pre-test, retention 30 days after the post-test', () => {
  const day = MS.DAY_MS;
  let r = MS.emptyRecord();
  assert.equal(MS.schedule(r, 0).next, 'pre');
  r = MS.recordTest(r, 'pre', score(2), 0);
  assert.equal(MS.schedule(r, 27 * day).next, 'practice');
  assert.equal(MS.schedule(r, 28 * day).next, 'post');
  r = MS.recordTest(r, 'post', score(4), 29 * day);
  assert.equal(r.post.early, false);
  assert.equal(MS.schedule(r, 58 * day).next, 'practice');
  assert.equal(MS.schedule(r, 59 * day).next, 'retention');
  r = MS.recordTest(r, 'retention', score(4), 60 * day);
  assert.equal(MS.schedule(r, 60 * day).next, 'done');
  assert.equal(MS.recordTest(MS.recordTest(null, 'pre', score(1), 0), 'post', score(2), day).post.early, true);
});

test('effectSize: (post - pre) / SD(pre) on unpractised items, target 0.3', () => {
  const day = MS.DAY_MS;
  const learner = (pre, post) => MS.recordTest(MS.recordTest(null, 'pre', score(pre), 0), 'post', score(post), 30 * day);
  const group = [learner(1, 2), learner(2, 3), learner(3, 3), learner(4, 5)];
  const e = MS.effectSize(group);
  // pre shares 1/6..4/6, sd = 0.2152; mean gain = 0.75/6 = 0.125 -> d = 0.581
  assert.equal(e.n, 4);
  assert.ok(Math.abs(e.d - 0.581) < 0.001, String(e.d));
  assert.equal(e.meetsTarget, true);
  const flat = MS.effectSize([learner(1, 1), learner(3, 3)]);
  assert.equal(flat.d, 0);
  assert.equal(flat.meetsTarget, false);
  assert.equal(MS.effectSize([learner(1, 3)]).d, null, 'one learner: no SD');
  const early = MS.recordTest(MS.recordTest(null, 'pre', score(1), 0), 'post', score(6), day);
  assert.equal(MS.effectSize(group.concat([early])).skipped, 1, 'an early post-test is left out');
});

test('retentionCheck: the result is kept within one item 30 days after the post-test', () => {
  const day = MS.DAY_MS;
  let r = MS.recordTest(MS.recordTest(null, 'pre', score(2), 0), 'post', score(5), 28 * day);
  assert.equal(MS.retentionCheck(r), null);
  const kept = MS.recordTest(r, 'retention', score(4), 58 * day);
  assert.deepEqual(MS.retentionCheck(kept), { days: 30, post: 5, retention: 4, retained: true });
  const lost = MS.recordTest(r, 'retention', score(3), 60 * day);
  assert.equal(MS.retentionCheck(lost).retained, false);
  assert.equal(MS.retentionCheck(MS.recordTest(r, 'retention', score(5), 40 * day)), null, 'too early does not count');
  assert.equal(MS.retentionRate([kept, lost]), 0.5);
});

test('measurement storage is injectable and keyed per learner', () => {
  const store = new Map();
  const storage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) };
  const r = MS.recordTest(null, 'pre', score(3), 5);
  assert.equal(MS.saveRecord('dana', r, storage), true);
  assert.deepEqual(MS.loadRecord('dana', storage), r);
  assert.deepEqual(MS.loadRecord('other', storage), MS.emptyRecord());
  assert.ok(store.has(MS.STORAGE_KEY));
  store.set(MS.STORAGE_KEY, '{bad');
  assert.deepEqual(MS.loadRecord('dana', storage), MS.emptyRecord(), 'corrupt data does not throw');
});
