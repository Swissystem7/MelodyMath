// MelodyMath — SetlistGoal: a small goal for today, built as a song (#591).
//
// Proximal goals (Bandura & Schunk 1981, https://doi.org/10.1037/0022-3514.41.3.586):
// the child picks a short song (4), a song (8) or a long song (12). Every right
// answer, solved in the topic's main way, adds one box to the song. Meeting the
// goal plays the whole song on the child's instrument and saves it; a missed goal
// is saved as it is, with no failure message. No timer, no points, nothing locked.
// The next suggestion: two goals met in a row → the next size, two missed → the
// previous one. The child can always pick another size. streak.js is only read.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_SETLIST_GOAL = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'mm.setlistGoal.v1';
  const KEEP = 30;
  const GOALS = [
    { id: 'short', he: 'שיר קצר', size: 4 },
    { id: 'song', he: 'שיר', size: 8 },
    { id: 'long', he: 'שיר ארוך', size: 12 },
  ];
  // C-major pentatonic, 12 boxes, ending on the tonic. A goal of n boxes plays
  // the last n notes, so every song (4, 8 or 12) closes on C.
  const MELODY = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 392.00, 293.66, 261.63];

  let storageRef = null;
  let state = { history: [], active: null };

  function getStorage() {
    if (storageRef) return storageRef;
    try { if (typeof localStorage !== 'undefined') return localStorage; } catch (e) { /* private */ }
    return null;
  }
  function load() {
    state = { history: [], active: null };
    const s = getStorage();
    if (!s) return;
    try {
      const p = JSON.parse(s.getItem(STORAGE_KEY) || 'null');
      if (p && Array.isArray(p.history)) state = { history: p.history, active: p.active || null };
    } catch (e) { /* ignore */ }
  }
  function save() {
    const s = getStorage();
    if (s) { try { s.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }
  }
  function setStorage(s) { storageRef = s; load(); }
  function today() { return new Date().toISOString().slice(0, 10); }

  function goalById(id) { return GOALS.find(function (g) { return g.id === id; }) || null; }
  function indexOf(id) { return Math.max(0, GOALS.findIndex(function (g) { return g.id === id; })); }

  // Two goals of the same size met in a row → the next size; two missed → the previous.
  function suggestNextGoal(history) {
    const h = (history || []).filter(function (e) { return e && goalById(e.goal); });
    if (!h.length) return GOALS[0].id;
    const last = h[h.length - 1], prev = h[h.length - 2];
    const i = indexOf(last.goal);
    if (prev && prev.goal === last.goal && prev.met === last.met) {
      if (last.met) return GOALS[Math.min(i + 1, GOALS.length - 1)].id;
      return GOALS[Math.max(i - 1, 0)].id;
    }
    return last.goal;
  }

  function close() {
    const a = state.active;
    if (!a) return null;
    const entry = { goal: a.goal, target: a.target, count: a.count, met: a.count >= a.target, day: a.day, instrument: a.instrument || null };
    state.history.push(entry);
    if (state.history.length > KEEP) state.history = state.history.slice(-KEEP);
    state.active = null;
    save();
    return entry;
  }

  // A goal from an earlier day is kept as it is (met or not) before today's starts.
  function rollover(day) {
    if (state.active && state.active.day !== (day || today())) close();
    return state.active;
  }

  function start(goalId, opts) {
    const g = goalById(goalId);
    if (!g) return null;
    const o = opts || {};
    if (state.active) close();
    state.active = { goal: g.id, target: g.size, count: 0, day: o.day || today(), instrument: o.instrument || null };
    save();
    return Object.assign({}, state.active);
  }

  // Only right answers count. The answer that reaches the target closes the goal as met.
  function recordAnswer(correct, opts) {
    const a = state.active;
    if (!a) return { counted: false, active: null, justMet: false };
    if (!correct) return { counted: false, active: Object.assign({}, a), justMet: false };
    a.count += 1;
    if (opts && opts.instrument) a.instrument = opts.instrument;
    if (a.count >= a.target) {
      const entry = close();
      return { counted: true, active: null, justMet: true, song: entry };
    }
    save();
    return { counted: true, active: Object.assign({}, a), justMet: false };
  }

  // The song so far: one note per box on the child's instrument.
  function songPhrase(entry) {
    if (!entry || !entry.count) return null;
    const notes = MELODY.slice(MELODY.length - entry.target).slice(0, Math.min(entry.count, entry.target));
    const durations = notes.map(function (_, i) { return i === notes.length - 1 ? 0.5 : 0.25; });
    return { id: 'setlist', name: (goalById(entry.goal) || GOALS[0]).he, notes: notes, durations: durations, instrument: entry.instrument };
  }

  function boxesHtml(a) {
    if (!a) return '';
    let html = '';
    for (let i = 0; i < a.target; i++) html += '<span class="sg-box' + (i < a.count ? ' on' : '') + '" aria-hidden="true"></span>';
    return '<div class="sg-boxes" role="img" aria-label="' + a.count + ' מתוך ' + a.target + ' תיבות בשיר">' + html + '</div>';
  }
  function pickerHtml(suggested) {
    return GOALS.map(function (g) {
      const on = g.id === suggested;
      return '<button type="button" data-goal="' + g.id + '" aria-pressed="' + on + '">' + g.he + ' · ' + g.size + (on ? ' ⭐ מוצע' : '') + '</button>';
    }).join('');
  }

  function getActive() { return state.active ? Object.assign({}, state.active) : null; }
  function getHistory() { return state.history.slice(); }
  function resetAll() {
    state = { history: [], active: null };
    const s = getStorage();
    if (s) { try { s.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ } }
  }

  load();

  return {
    GOALS, MELODY, suggestNextGoal, start, recordAnswer, rollover, close, songPhrase,
    boxesHtml, pickerHtml, getActive, getHistory, resetAll, setStorage,
  };
});
