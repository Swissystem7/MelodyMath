'use strict';
// MixtapeShuffle first slice (Refs #889): pure module + wiring guards.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const M = require('../src/lib/mixtape.js');
const banks = require('../src/lib/banks.js');
const cur = require('../src/lib/curriculum.js');
const instruments = require('../src/lib/instruments.js');
const MASTERED = ['tA', 'tB', 'tC'];
const mk = (topicId, n, extra) => Object.assign({ id: topicId + '-' + n, topicId, grade: 'א', prompt: topicId + ' שאלה ' + n + ' = ?', answer: n, music: 'way' + topicId }, extra || {});
function rich(perTopic) { const out = []; MASTERED.forEach((t) => { for (let n = 1; n <= (perTopic || 6); n++) out.push(mk(t, n)); }); return out; }
const ids = (mix) => mix.items.map((it) => it.id);
// Same primary-way check index.html passes (mixtapePrimary).
const primaryHelper = (item) => !!item && !!item.music && banks.primaryWays(banks.waysCarried(item.grade, item.standard)).map((w) => w[0]).includes(item.music) && banks.MUSIC_DOSAGE.primary.includes(banks.mechanismOf(item.music));

test('fixed seed is deterministic and a different seed differs on a rich fixture', () => {
  const a = M.buildMixtape({ items: rich(), masteredTopicIds: MASTERED, seed: 42 });
  const b = M.buildMixtape({ items: rich(), masteredTopicIds: MASTERED, seed: 42 });
  const c = M.buildMixtape({ items: rich(), masteredTopicIds: MASTERED, seed: 99 });
  assert.ok(a.ok && b.ok && c.ok);
  assert.deepEqual(ids(a), ids(b)); assert.deepEqual(a.topics, b.topics); assert.notDeepEqual(ids(a), ids(c));
});
test('only mastered topics are drawn, and the grade filter is honoured', () => {
  const items = rich().concat([mk('tX', 1), mk('tX', 2), mk('tX', 3), mk('tX', 4)]);
  for (let seed = 0; seed < 20; seed++) {
    const mix = M.buildMixtape({ items, masteredTopicIds: MASTERED, seed });
    assert.ok(mix.ok && mix.items.every((it) => MASTERED.includes(it.topicId)), 'unmastered tX leaked, seed ' + seed);
  }
  const mixed = rich().map((it) => (it.topicId === 'tC' ? Object.assign({}, it, { grade: 'ב' }) : it));
  const g = M.buildMixtape({ items: mixed, masteredTopicIds: MASTERED, grade: 'א', seed: 5 });
  assert.ok(g.ok && g.items.every((it) => it.grade === 'א' && it.topicId !== 'tC'));
  assert.deepEqual(M.eligibleTopics(mixed, MASTERED, 'א').sort(), ['tA', 'tB']);
});
test('8 items over 2-3 topics, balanced, maxRun 1; never a run of 3 in 200 seeds', () => {
  const mix = M.buildMixtape({ items: rich(), masteredTopicIds: MASTERED, seed: 42 });
  assert.equal(mix.items.length, 8); assert.equal(mix.items.length, M.MIXTAPE_SIZE);
  assert.ok(mix.topics.length >= 2 && mix.topics.length <= 3 && mix.topics.every((t) => MASTERED.includes(t)));
  const c = {}; mix.items.forEach((it) => { c[it.topicId] = (c[it.topicId] || 0) + 1; });
  const vals = Object.values(c); assert.ok(Math.max(...vals) - Math.min(...vals) <= 1, 'quotas balanced: ' + vals.join(','));
  assert.equal(M.maxRun(mix.items), 1);
  for (let seed = 0; seed < 200; seed++) {
    const m = M.buildMixtape({ items: rich(), masteredTopicIds: MASTERED, seed });
    assert.ok(m.ok && m.items.length === 8 && m.topics.length >= 2 && m.topics.length <= 3 && M.maxRun(m.items) < 3, 'seed ' + seed);
  }
});
test('locked below 2 mastered topics, and not-enough-items below 8 eligible', () => {
  assert.equal(M.canUnlock([]), false); assert.equal(M.canUnlock(['tA']), false); assert.equal(M.canUnlock(['tA', 'tB']), true);
  assert.deepEqual(M.buildMixtape({ items: rich(), masteredTopicIds: ['tA'], seed: 1 }), { ok: false, reason: 'locked', items: [], topics: ['tA'] });
  assert.equal(M.buildMixtape({ items: rich(), masteredTopicIds: [], seed: 1 }).reason, 'locked');
  const few = [mk('tA', 1), mk('tA', 2), mk('tB', 1), mk('tB', 2), mk('tB', 3)];
  const short = M.buildMixtape({ items: few, masteredTopicIds: ['tA', 'tB'], seed: 1 });
  assert.equal(short.ok, false); assert.equal(short.reason, 'not-enough-items'); assert.deepEqual(short.items, []);
});
test('primary way only (fixture): weak, optional, extra-only and noMusic items are excluded', () => {
  const items = rich();
  MASTERED.forEach((t, i) => {
    items.push(mk(t, 91 + i, { music: 'weakWay' + t, mechanism: 'M4', evidence: 'weak' }));
    items.push(mk(t, 94 + i, { music: 'optWay' + t, mechanism: 'M5', isOptionalWay: true }));
    items.push(mk(t, 97 + i, { music: 'extraOnly' + t, primaryWay: false, musicExtra: [{ music: 'extraOnly' + t, evidence: 'weak' }] }));
    items.push(mk(t, 100 + i, { music: 'way' + t, noMusic: true }));
  });
  for (let seed = 0; seed < 20; seed++) {
    const mix = M.buildMixtape({ items, masteredTopicIds: MASTERED, seed });
    assert.ok(mix.ok, 'seed ' + seed);
    mix.items.forEach((it) => {
      assert.equal(it.wayTag, it.music);
      assert.ok(!/weakWay|optWay|extraOnly/.test(it.wayTag), it.id + ' drew ' + it.wayTag);
      assert.ok(!it.noMusic && it.evidence !== 'weak' && !it.isOptionalWay && it.primaryWay !== false && !M.WEAK_MECHANISMS.includes(it.mechanism || ''), it.id);
    });
  }
});
test('primary way on the real bank: every drawn wayTag is primary and strong, never an extra', () => {
  const grade = 'א'; const base = banks.itemsForGrade(grade); const pool = [];
  cur.rowsForGrade(grade).forEach((row) => cur.itemsForTopic(row.topicId, base).forEach((it) => pool.push(Object.assign({}, it, { topicId: row.topicId }))));
  const mastered = [...new Set(pool.map((it) => it.topicId))];
  assert.ok(pool.length >= 8 && mastered.length >= 2, 'real-bank pool is usable');
  const mix = M.buildMixtape({ items: pool, masteredTopicIds: mastered, grade, seed: 7, primaryWaysFor: primaryHelper });
  assert.ok(mix.ok, mix.reason); assert.equal(mix.items.length, 8);
  mix.items.forEach((it) => {
    const ways = banks.waysCarried(it.grade, it.standard);
    assert.ok(banks.primaryWays(ways).map((w) => w[0]).includes(it.wayTag), it.id + ' ' + it.wayTag);
    assert.ok(banks.MUSIC_DOSAGE.primary.includes(banks.mechanismOf(it.wayTag)), it.id + ' ' + it.wayTag);
    assert.ok(!ways.filter(banks.isOptionalWay).map((w) => w[0]).includes(it.wayTag), it.id + ' optional way');
    assert.ok(!(it.musicExtra || []).some((x) => x.music === it.wayTag), it.id + ' way rides as musicExtra');
  });
});
test('session: a wrong answer never advances (twice), correct answers advance in order', () => {
  const mix = M.buildMixtape({ items: rich(), masteredTopicIds: MASTERED, seed: 42 });
  const s = M.createSession(mix); const first = s.current;
  assert.equal(s.done, false); assert.equal(s.index, 0);
  [0, 1].forEach(() => {
    const r = M.sessionAnswer(s, false);
    assert.deepEqual([r.advanced, r.tryAgain, r.done], [false, true, false]);
    assert.equal(s.index, 0); assert.equal(s.answered.length, 0); assert.equal(s.current, first);
  });
  mix.items.forEach((it, i) => { const r = M.sessionAnswer(s, true); assert.equal(r.advanced, true); assert.equal(s.answered[i], it); assert.equal(r.done, i === mix.items.length - 1); });
  assert.equal(s.done, true); assert.equal(s.current, null);
  assert.deepEqual(s.answered.map((it) => it.id), ids(mix), 'answered preserves drawn order');
  assert.equal(M.sessionAnswer(s, true).advanced, false, 'no advance past the end');
});
test('finalePlan: 8 notes in item order with the instrument voice; intro is 1000ms with wayTag', () => {
  const mix = M.buildMixtape({ items: rich(), masteredTopicIds: MASTERED, seed: 42 });
  const s = M.createSession(mix); const intro = M.sessionIntro(s);
  assert.equal(intro.durationMs, 1000); assert.equal(intro.durationMs, M.INTRO_MS);
  assert.equal(intro.topicId, mix.items[0].topicId); assert.equal(intro.wayTag, mix.items[0].wayTag);
  const darbuka = instruments.instrumentById('darbuka'); const plan = M.finalePlan(s, darbuka);
  assert.equal(plan.notes.length, 8); assert.deepEqual(plan.hz, plan.notes);
  assert.equal(plan.voice, darbuka.voice); assert.equal(plan.instrument, darbuka);
  assert.deepEqual(plan.notes, mix.items.map((it) => M.SCALE[((Number(it.answer) % 8) + 8) % 8]), 'notes follow item order');
  assert.ok(plan.notes.every((hz) => M.SCALE.includes(hz)));
  assert.equal(M.finalePlan(s, null).voice, 'keys', 'default voice without an instrument');
});
test('silent: listen-worded items (Hebrew and English) drop out; items stay solvable without music', () => {
  const items = rich(5);
  ['הקשיבו וספרו: 2 + 2 = ?', 'שמעו את הצליל: 3 + 1 = ?', 'צלילים: כמה זה 4 + 1?', 'Listen: 2 + 3 = ?', 'Hear the beat: 1 + 4 = ?']
    .forEach((prompt, i) => items.push(mk(MASTERED[i % 3], 50 + i, { prompt, hear: [2] })));
  const mix = M.buildMixtape({ items, masteredTopicIds: MASTERED, seed: 3, silent: true });
  assert.ok(mix.ok, mix.reason); assert.equal(mix.items.length, 8);
  mix.items.forEach((it) => {
    assert.doesNotMatch(String(it.prompt), /הקשיבו|שמעו|צלילים|listen|hear/i, it.id + ' needs listening while silent');
    assert.ok(typeof it.prompt === 'string' && it.prompt.trim().length > 0 && it.answer != null && String(it.answer).trim() !== '', it.id + ' solvable without music');
  });
  const s = M.createSession(mix); // no-music path: silent session runs to completion with no audio
  while (!s.done) assert.equal(M.sessionAnswer(s, true).advanced, true);
  assert.deepEqual(s.answered.map((it) => it.id), ids(mix)); assert.equal(M.finalePlan(s, null).notes.length, 8);
});
test('index.html loads mixtape.js with the locked Hebrew text, and sw.js precaches it', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.ok(html.includes('<script src="src/lib/mixtape.js"></script>'));
  assert.ok(html.includes('המיקסטייפ נפתח אחרי ששולטים בשני נושאים'), 'locked Hebrew text present');
  assert.ok(html.includes('id="mixtapeStart"'), 'child-panel entry point present');
  assert.ok(fs.readFileSync('sw.js', 'utf8').includes("'./src/lib/mixtape.js'"));
});
