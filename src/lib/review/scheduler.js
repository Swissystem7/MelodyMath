// MelodyMath — DailyJam: spaced, mixed daily review (#591, owner feature
// proposal 5/5).
//
// A simple Leitner schedule per topic: box 0-3 with review intervals of 1, 2,
// 4 and 7 days. A right answer moves the topic one box up, a wrong one back
// to box 0 (review tomorrow). buildDailyJam(date, history, opts) mixes 6-10
// items from at least 3 learned topics, due topics first. No new method:
// each item keeps its topic's primary mechanism (dosage rule 4), passed in
// as opts.topicPrimary because master has no topic -> primary map yet.
// A primary must be a strong-evidence mechanism (M1, M2, M3, M6); the
// polyrhythm bonus (M4, weak) is offered only after the jam is done, in
// grades ה׳-ו׳, as an addon marked evidence:'weak'.
// Dates are 'YYYY-MM-DD' strings read in UTC; state goes through an
// injectable storage (localStorage in the browser).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_REVIEW_SCHEDULER = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const INTERVALS = [1, 2, 4, 7];
  const STRONG = ['M1', 'M2', 'M3', 'M6'];
  const MIN_ITEMS = 6;
  const MAX_ITEMS = 10;
  const MIN_TOPICS = 3;
  const STORAGE_KEY = 'mm.review.leitner';
  const DAY = 86400000;

  function toDay(date) {
    const s = typeof date === 'string' ? date : new Date(date).toISOString();
    const t = Date.parse(s.slice(0, 10) + 'T00:00:00Z');
    return Number.isFinite(t) ? t : null;
  }
  function fmt(t) { return new Date(t).toISOString().slice(0, 10); }
  function addDays(date, n) { return fmt(toDay(date) + n * DAY); }
  function daysBetween(a, b) { return Math.round((toDay(b) - toDay(a)) / DAY); }

  // One review of `topic` on `date`. Returns a new state.
  function review(state, topic, correct, date) {
    const next = Object.assign({}, state || {});
    const cur = next[topic];
    const box = !cur ? 0 : correct ? Math.min(cur.box + 1, INTERVALS.length - 1) : 0;
    next[topic] = { box: box, last: fmt(toDay(date)), due: addDays(date, INTERVALS[box]) };
    return next;
  }

  // history: [{ topic, date, correct }] in any order -> Leitner state.
  function stateFromHistory(history) {
    return (history || []).slice()
      .sort(function (a, b) { return toDay(a.date) - toDay(b.date); })
      .reduce(function (s, h) { return review(s, h.topic, !!h.correct, h.date); }, {});
  }

  function dueTopics(state, date) {
    const today = toDay(date);
    return Object.keys(state || {}).filter(function (t) { return toDay(state[t].due) <= today; })
      .sort(function (a, b) { return toDay(state[a].due) - toDay(state[b].due) || (a < b ? -1 : 1); });
  }

  // opts: { topicPrimary: {topic: 'M1'|...}, itemsByTopic: {topic: [items]},
  //         count (6-10, default 8) }.
  // Returns { ok, date, topics, items: [{ topic, item, primary: { mechanism } }], bonus: null }
  // or { ok: false, reason }.
  function buildDailyJam(date, history, opts) {
    const o = opts || {};
    const primary = o.topicPrimary || {};
    const bank = o.itemsByTopic || {};
    const want = Math.max(MIN_ITEMS, Math.min(MAX_ITEMS, Number(o.count) || 8));
    const state = stateFromHistory(history);
    const learned = Object.keys(state).filter(function (t) { return (bank[t] || []).length > 0; });
    learned.forEach(function (t) {
      if (STRONG.indexOf(primary[t]) === -1) throw new Error('topic ' + t + ' needs a strong primary mechanism, got ' + primary[t]);
    });
    if (learned.length < MIN_TOPICS) return { ok: false, reason: 'fewer than ' + MIN_TOPICS + ' learned topics' };
    // Due topics first (oldest due first), then the rest by earliest due.
    const due = dueTopics(state, date).filter(function (t) { return learned.indexOf(t) !== -1; });
    const rest = learned.filter(function (t) { return due.indexOf(t) === -1; })
      .sort(function (a, b) { return toDay(state[a].due) - toDay(state[b].due) || (a < b ? -1 : 1); });
    const ordered = due.concat(rest);
    // Deal one item per topic in turn, so the jam is mixed, not blocked;
    // take in one more topic while the topics so far run out of items.
    function deal(topics) {
      const items = [];
      const used = {};
      let progress = true;
      while (items.length < want && progress) {
        progress = false;
        topics.forEach(function (t) {
          const k = used[t] || 0;
          if (items.length >= want || k >= bank[t].length) return;
          items.push({ topic: t, item: bank[t][k], primary: { mechanism: primary[t] } });
          used[t] = k + 1;
          progress = true;
        });
      }
      return items;
    }
    let n = Math.max(MIN_TOPICS, Math.min(due.length, want));
    let topics = ordered.slice(0, n);
    let items = deal(topics);
    while (items.length < want && n < ordered.length) {
      n += 1;
      topics = ordered.slice(0, n);
      items = deal(topics);
    }
    if (items.length < MIN_ITEMS) return { ok: false, reason: 'fewer than ' + MIN_ITEMS + ' items' };
    return { ok: true, date: fmt(toDay(date)), topics: topics, items: items, bonus: null };
  }

  // The M4 polyrhythm bonus: only after the jam is completed, grades 5-6.
  function bonusFor(jam, completed, grade) {
    if (!jam || !jam.ok || !completed || (grade !== 5 && grade !== 6)) return null;
    return { mechanism: 'M4', evidence: 'weak', he: 'בונוס: פולי־ריתמוס (ראיות חלשות)' };
  }

  function loadState(storage, key) {
    try {
      const raw = storage && storage.getItem(key || STORAGE_KEY);
      const v = raw ? JSON.parse(raw) : null;
      if (v && typeof v === 'object') return v;
    } catch (e) { /* unreadable storage -> start fresh */ }
    return {};
  }

  function saveState(storage, state, key) {
    if (!storage) return false;
    try {
      storage.setItem(key || STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    INTERVALS: INTERVALS,
    STRONG: STRONG,
    STORAGE_KEY: STORAGE_KEY,
    addDays: addDays,
    daysBetween: daysBetween,
    review: review,
    stateFromHistory: stateFromHistory,
    dueTopics: dueTopics,
    buildDailyJam: buildDailyJam,
    bonusFor: bonusFor,
    loadState: loadState,
    saveState: saveState,
  };
});
