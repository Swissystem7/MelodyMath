// MelodyMath — MixtapeShuffle (Refs #889): a mixed review of mastered topics.
// Pure logic only: no DOM, audio or storage. The caller tags every item with
// `topicId` (a curriculum topic id); this module never guesses a topic.
// Primary-way check: when the caller passes a helper (index.html passes the
// real banks.js check) an item must be solved through a primary way; without
// a helper the item's own fields decide (a present wayTag that is not marked
// optional/weak). Weak mechanisms are M4/M5/M7 (see banks MUSIC_DOSAGE).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_MIXTAPE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MIXTAPE_SIZE = 8, MIN_TOPICS = 2, MAX_TOPICS = 3, INTRO_MS = 1000;
  const STRONG_MECHANISMS = ['M1', 'M2', 'M3', 'M6'];
  const WEAK_MECHANISMS = ['M4', 'M5', 'M7'];
  const SCALE = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
  const LISTEN_RE = /הקשיבו|שמעו|צלילים|listen|hear/i;

  // Identical to src/lib/worksheets.js:24-44.
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function shuffle(list, rand) {
    const a = (list || []).slice();
    const r = typeof rand === 'function' ? rand : Math.random;
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }
  function wayTagOf(it) { return (it && (it.music || it.wayTag || it.way)) || null; }
  function tagOfWay(w) { return Array.isArray(w) ? w[0] : (w && (w.music || w.tag)) || w; }
  function isPrimary(it, helpers) {
    const tag = wayTagOf(it);
    if (!it || !tag || it.noMusic) return false;
    if (typeof helpers === 'function') return !!helpers(it);
    if (helpers && typeof helpers.primaryWaysFor === 'function') {
      const ways = helpers.primaryWaysFor(it);
      return Array.isArray(ways) && ways.map(tagOfWay).indexOf(tag) >= 0;
    }
    if (helpers && typeof helpers.isPrimaryWay === 'function') return !!helpers.isPrimaryWay(tag, it);
    if (helpers && typeof helpers.primaryWays === 'function') return !!helpers.primaryWays(it);
    if (it.isOptionalWay || it.optionalWay || it.isWeakWay || it.primaryWay === false) return false;
    if (it.evidence === 'weak' || it.wayEvidence === 'weak') return false;
    const mech = it.mechanism || it.wayMechanism || it.mechanismOfWay;
    if (mech) return STRONG_MECHANISMS.indexOf(mech) >= 0;
    return true;
  }
  // Distinct eligible topic ids, in first-seen order.
  function eligibleTopics(items, masteredTopicIds, grade, helpers) {
    const mastered = new Set(masteredTopicIds || []);
    const seen = new Set(), out = [];
    (items || []).forEach(function (it) {
      if (!it || !it.topicId || !mastered.has(it.topicId)) return;
      if (grade != null && grade !== '' && it.grade !== grade) return;
      if (!isPrimary(it, helpers) || seen.has(it.topicId)) return;
      seen.add(it.topicId); out.push(it.topicId);
    });
    return out;
  }
  function canUnlock(masteredTopicIds) {
    return new Set((masteredTopicIds || []).filter(Boolean)).size >= MIN_TOPICS;
  }
  function eligibleItems(items, masteredTopicIds, grade, helpers, silent) {
    const topics = new Set(eligibleTopics(items, masteredTopicIds, grade, helpers));
    return (items || []).filter(function (it) {
      if (!it || !topics.has(it.topicId) || !isPrimary(it, helpers)) return false;
      if (grade != null && grade !== '' && it.grade !== grade) return false;
      if (silent && LISTEN_RE.test(String(it.prompt || it.text || '') + ' ' + String(it.text || ''))) return false;
      return true;
    }).map(function (it) { return Object.assign({}, it, { wayTag: wayTagOf(it) }); });
  }
  function maxRun(items) {
    let best = 0, run = 0, prev;
    (items || []).forEach(function (it) {
      const t = it && it.topicId;
      run = t && t === prev ? run + 1 : 1; prev = t;
      if (run > best) best = run;
    });
    return best;
  }
  function arrange(pools) {
    const queues = pools.map(function (p) { return { topicId: p.topicId, items: p.items.slice() }; });
    const out = []; let prev = null;
    for (;;) {
      const live = queues.filter(function (q) { return q.items.length; });
      if (!live.length) return out;
      live.sort(function (a, b) { return b.items.length - a.items.length; });
      const pick = live.find(function (q) { return q.topicId !== prev; }) || live[0];
      out.push(pick.items.shift()); prev = pick.topicId;
    }
  }
  function buildMixtape(opts) {
    const o = opts || {};
    const size = Math.max(1, Math.round(Number(o.size)) || MIXTAPE_SIZE);
    const rand = mulberry32(o.seed == null ? 1 : o.seed);
    const helpers = o.primaryWaysFor || o.helpers || o.isPrimaryWay;
    const topics = eligibleTopics(o.items, o.masteredTopicIds, o.grade, helpers);
    if (topics.length < MIN_TOPICS || !canUnlock(o.masteredTopicIds)) return { ok: false, reason: 'locked', items: [], topics: topics };
    const pool = eligibleItems(o.items, o.masteredTopicIds, o.grade, helpers, !!o.silent);
    if (pool.length < size) return { ok: false, reason: 'not-enough-items', items: [], topics: topics };
    const chosen = shuffle(topics, rand).slice(0, Math.min(MAX_TOPICS, topics.length));
    const base = Math.floor(size / chosen.length), extra = size % chosen.length;
    const queues = chosen.map(function (topicId, i) {
      const items = shuffle(pool.filter(function (it) { return it.topicId === topicId; }), rand);
      return { topicId: topicId, quota: base + (i < extra ? 1 : 0), items: items };
    });
    // Take quotas; a short queue gives its remainder to the other chosen topics.
    let picked = [];
    queues.forEach(function (q) { picked = picked.concat(q.items.splice(0, q.quota)); });
    if (picked.length < size) {
      const rest = shuffle(queues.reduce(function (a, q) { return a.concat(q.items); }, []), rand);
      picked = picked.concat(rest.slice(0, size - picked.length));
    }
    const byTopic = chosen.map(function (topicId) {
      return { topicId: topicId, items: picked.filter(function (it) { return it.topicId === topicId; }) };
    });
    const items = arrange(byTopic);
    return { ok: true, reason: null, items: items, topics: chosen.slice(), seed: o.seed == null ? 1 : o.seed, size: size };
  }
  function createSession(mix) {
    const items = Array.isArray(mix) ? mix.slice() : ((mix && mix.items) || []).slice();
    return { items: items, index: 0, answered: [], done: items.length === 0, current: items[0] || null };
  }
  function sessionIntro(session) {
    const it = session && !session.done ? (session.current || session.items[session.index]) : null;
    return { durationMs: INTRO_MS, topicId: it ? it.topicId || null : null, wayTag: it ? wayTagOf(it) : null };
  }
  function sessionAnswer(session, correct) {
    if (!session || session.done) return { advanced: false, tryAgain: false, done: true };
    if (!correct) return { advanced: false, tryAgain: true, done: false };
    const it = session.current || session.items[session.index];
    if (it) session.answered.push(it);
    session.index += 1;
    session.done = session.index >= session.items.length;
    session.current = session.done ? null : session.items[session.index];
    return { advanced: true, tryAgain: false, done: session.done, index: session.index, answered: session.answered.slice() };
  }
  function finalePlan(session, instrument) {
    const items = (session && (session.items || session.answered)) || [];
    const notes = items.map(function (it, i) {
      const hearSum = Array.isArray(it.hear) ? it.hear.reduce(function (a, n) { return a + (Number(n) || 0); }, 0) : 0;
      const v = hearSum || Number(it.answer) || i;
      return SCALE[((Math.round(v) % SCALE.length) + SCALE.length) % SCALE.length];
    });
    return { notes: notes, hz: notes.slice(), voice: (instrument && instrument.voice) || 'keys', instrument: instrument || null };
  }
  return {
    MIXTAPE_SIZE, MIN_TOPICS, MAX_TOPICS, INTRO_MS, SCALE, STRONG_MECHANISMS, WEAK_MECHANISMS,
    mulberry32, shuffle, eligibleTopics, canUnlock, buildMixtape, maxRun,
    createSession, sessionIntro, sessionAnswer, finalePlan,
  };
});
