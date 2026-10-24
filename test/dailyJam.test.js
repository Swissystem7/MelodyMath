const test = require('node:test');
const assert = require('node:assert/strict');
const sch = require('../src/lib/review/scheduler');
const song = require('../src/lib/review/weeklySong');

// Topic -> primary mechanism is a parameter: master has no such map yet.
const topicPrimary = { fractions: 'M3', times: 'M2', counting: 'M1', patterns: 'M6', decimals: 'M3' };
function bank(n) {
  const out = {};
  Object.keys(topicPrimary).forEach((t) => { out[t] = Array.from({ length: n }, (_, i) => t + '-' + i); });
  return out;
}
const history = [
  { topic: 'fractions', date: '2026-10-20', correct: true },
  { topic: 'times', date: '2026-10-21', correct: false },
  { topic: 'counting', date: '2026-10-19', correct: true },
  { topic: 'patterns', date: '2026-10-22', correct: true },
];

test('Leitner intervals are 1, 2, 4 and 7 days', () => {
  assert.deepEqual(sch.INTERVALS, [1, 2, 4, 7]);
  let s = sch.review({}, 'times', true, '2026-10-01');
  assert.deepEqual(s.times, { box: 0, last: '2026-10-01', due: '2026-10-02' });
  s = sch.review(s, 'times', true, '2026-10-02');
  assert.equal(s.times.due, '2026-10-04');
  s = sch.review(s, 'times', true, '2026-10-04');
  assert.equal(s.times.due, '2026-10-08');
  s = sch.review(s, 'times', true, '2026-10-08');
  assert.equal(s.times.due, '2026-10-15');
  s = sch.review(s, 'times', true, '2026-10-15');
  assert.equal(s.times.due, '2026-10-22'); // stays in the last box
  s = sch.review(s, 'times', false, '2026-10-22');
  assert.deepEqual(s.times, { box: 0, last: '2026-10-22', due: '2026-10-23' });
});

test('due topics come from the replayed history', () => {
  const s = sch.stateFromHistory(history);
  assert.deepEqual(sch.dueTopics(s, '2026-10-21'), ['counting', 'fractions']);
  assert.deepEqual(sch.dueTopics(s, '2026-10-23'), ['counting', 'fractions', 'times', 'patterns']);
});

test('buildDailyJam picks 6-10 items from at least 3 topics, each with its topic primary', () => {
  const jam = sch.buildDailyJam('2026-10-23', history, { topicPrimary, itemsByTopic: bank(5) });
  assert.equal(jam.ok, true);
  assert.ok(jam.items.length >= 6 && jam.items.length <= 10);
  assert.ok(new Set(jam.items.map((x) => x.topic)).size >= 3);
  jam.items.forEach((x) => assert.equal(x.primary.mechanism, topicPrimary[x.topic]));
  assert.equal(jam.items.some((x) => x.primary.mechanism === 'M4'), false);
  assert.equal(jam.bonus, null);
  // mixed, not blocked: the first items are of different topics
  assert.notEqual(jam.items[0].topic, jam.items[1].topic);
});

test('the jam adds more topics when the due ones run out of items', () => {
  const small = { fractions: ['f'], times: ['t'], counting: ['c'], patterns: ['p1', 'p2', 'p3'] };
  const jam = sch.buildDailyJam('2026-10-21', history, { topicPrimary, itemsByTopic: small, count: 6 });
  assert.equal(jam.ok, true);
  assert.equal(jam.items.length, 6);
  assert.equal(new Set(jam.topics).size, 4);
});

test('the jam size stays within 6-10', () => {
  assert.equal(sch.buildDailyJam('2026-10-23', history, { topicPrimary, itemsByTopic: bank(9), count: 50 }).items.length, 10);
  assert.equal(sch.buildDailyJam('2026-10-23', history, { topicPrimary, itemsByTopic: bank(9), count: 1 }).items.length, 6);
});

test('fewer than 3 learned topics, or too few items, is no jam', () => {
  const two = history.slice(0, 2);
  assert.equal(sch.buildDailyJam('2026-10-23', two, { topicPrimary, itemsByTopic: bank(5) }).ok, false);
  const tiny = { fractions: ['f'], times: ['t'], counting: ['c'], patterns: ['p'] };
  assert.equal(sch.buildDailyJam('2026-10-23', history, { topicPrimary, itemsByTopic: tiny }).ok, false);
});

test('a weak mechanism can never be a topic primary in the jam', () => {
  ['M4', 'M5', 'M7', undefined].forEach((m) => {
    const bad = Object.assign({}, topicPrimary, { times: m });
    assert.throws(() => sch.buildDailyJam('2026-10-23', history, { topicPrimary: bad, itemsByTopic: bank(5) }), /strong primary/);
  });
});

test('the M4 bonus is an addon with evidence weak, only after completion, grades 5-6', () => {
  const jam = sch.buildDailyJam('2026-10-23', history, { topicPrimary, itemsByTopic: bank(5) });
  assert.equal(sch.bonusFor(jam, false, 5), null);
  assert.equal(sch.bonusFor(jam, true, 4), null);
  assert.deepEqual(sch.bonusFor(jam, true, 6), { mechanism: 'M4', evidence: 'weak', he: 'בונוס: פולי־ריתמוס (ראיות חלשות)' });
});

test('the schedule survives a reload through the injected storage', () => {
  const m = new Map();
  const store = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
  const s = sch.stateFromHistory(history);
  assert.equal(sch.saveState(store, s), true);
  assert.deepEqual(sch.loadState(store), s);
  assert.deepEqual(sch.loadState(null), {});
});

test('each completed day adds one bar; the song plays on day 7', () => {
  let s = song.createSong('2026-10-18');
  s = song.completeDay(s, '2026-10-18', { topics: ['times'] }).song;
  const again = song.completeDay(s, '2026-10-18');
  assert.equal(again.added, false);
  s = song.completeDay(s, '2026-10-19').song;
  assert.equal(s.bars.length, 2);
  assert.equal(song.songToPlay(s, '2026-10-23'), null);
  const played = song.songToPlay(s, '2026-10-24');
  assert.equal(played.bars.length, 2);
  assert.deepEqual(played.bars.map((b) => b.day), [1, 2]);
});

test('a missed day deletes nothing', () => {
  let s = song.createSong('2026-10-18');
  s = song.completeDay(s, '2026-10-18').song;
  s = song.completeDay(s, '2026-10-19').song;
  // 20, 21, 22 missed
  s = song.completeDay(s, '2026-10-23').song;
  assert.deepEqual(s.bars.map((b) => b.date), ['2026-10-18', '2026-10-19', '2026-10-23']);
  assert.equal(song.songToPlay(s, '2026-10-24').bars.length, 3);
});

test('a new week starts a new song and keeps the finished one', () => {
  let s = song.createSong('2026-10-18');
  s = song.completeDay(s, '2026-10-20').song;
  const r = song.completeDay(s, '2026-10-26');
  assert.equal(r.added, true);
  assert.equal(r.song.weekStart, '2026-10-25');
  assert.equal(r.song.bars.length, 1);
  assert.equal(r.song.past[0].bars.length, 1);
  const m = new Map();
  const store = { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v) };
  song.saveSong(store, r.song);
  assert.deepEqual(song.loadSong(store, '2026-11-01'), r.song);
  assert.equal(song.loadSong(null, '2026-11-01').weekStart, '2026-11-01');
});
