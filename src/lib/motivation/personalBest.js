// MelodyMath — PersonalBestEncore: an encore when the child beats their own best (#591).
//
// Competence and choice keep a game going, not outside prizes (Ryan, Rigby &
// Przybylski 2006, https://doi.org/10.1007/s11031-006-9051-8); praise for the
// strategy, never for "being smart", keeps children going after a miss
// (Mueller & Dweck 1998, https://doi.org/10.1037/0022-3514.75.1.33).
//
// - A run is one finished topic step: {correct, total, hintsUsed}. The best is
//   kept per child and topic only; nothing here reads another child's data.
// - Best = higher accuracy, or the same accuracy with fewer hints.
// - The encore is the child's own song ("השיר שלי", streak.js, read only) on
//   the child's instrument (myInstrument.instrumentFor), with a beat and a
//   drone from two other instrument families.
// - 20 minutes in a row shows a band break; a missed day costs nothing.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_PERSONAL_BEST = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const STORAGE_KEY = 'mm.personalBest.v1';
  const BREAK_MS = 20 * 60 * 1000;
  // A pause this long ends the "in a row" session.
  const IDLE_MS = 5 * 60 * 1000;
  const FALLBACK_LEAD = 'piano';

  let storageRef = null;
  function getStorage() {
    if (storageRef) return storageRef;
    try { if (typeof localStorage !== 'undefined') return localStorage; } catch (e) { /* private */ }
    return null;
  }
  function load() {
    const s = getStorage();
    try { const p = s && JSON.parse(s.getItem(STORAGE_KEY) || 'null'); return p && typeof p === 'object' ? p : {}; } catch (e) { return {}; }
  }
  function save(all) {
    const s = getStorage();
    if (s) { try { s.setItem(STORAGE_KEY, JSON.stringify(all)); } catch (e) { /* ignore */ } }
  }
  function setStorage(s) { storageRef = s; }

  // Higher accuracy wins; at the same accuracy, fewer hints win. No best yet → nothing to beat.
  function isNewBest(prev, run) {
    if (!prev || !run) return false;
    if (run.acc !== prev.acc) return run.acc > prev.acc;
    return run.h < prev.h;
  }

  function toRun(r) {
    const total = Math.max(0, Number(r && r.total) || 0);
    const correct = Math.min(total, Math.max(0, Number(r && r.correct) || 0));
    return { acc: total ? Math.round(correct / total * 1000) / 1000 : 0, h: Math.max(0, Number(r && r.hintsUsed) || 0) };
  }

  // Records a run of one child in one topic; returns {run, prev, isNew, first}.
  function recordRun(kid, topic, result) {
    const k = String(kid || 'me'), t = String(topic || 'topic');
    const run = toRun(result);
    if (!(Number(result && result.total) > 0)) return { run: run, prev: null, isNew: false, first: false };
    const all = load();
    const mine = all[k] || (all[k] = {});
    const prev = mine[t] || null;
    const isNew = isNewBest(prev, run);
    if (!prev || isNew) { mine[t] = run; save(all); }
    return { run: run, prev: prev, isNew: isNew, first: !prev };
  }
  function bestFor(kid, topic) { const m = load()[String(kid || 'me')]; return (m && m[String(topic || 'topic')]) || null; }

  // Strategy feedback by the music way the step was solved with (banks.js M1-M14).
  const STRATEGY = {
    M1: 'ספרת פעימה אחת לכל דבר',
    M2: 'השתמשת בקבוצות שוות',
    M3: 'מילאת את התיבה בחלקים',
    M4: 'חיפשת איפה המקצבים נפגשים',
    M5: 'סידרת צלילים מנמוך לגבוה',
    M6: 'מצאת את הדגם שחוזר',
    M7: 'צעדת ופנית בקצב',
    M8: 'מדדת זמן בפעימות',
    M9: 'השווית צלילים לפי היחס ביניהם',
    M10: 'פירקת לעשרות ויחידות',
    M11: 'ספרת וסידרת את הנתונים',
    M12: 'מדדת ביחידות שוות',
    M13: 'פירקת את השיר לחלקים',
    M14: 'עברת קודקוד אחרי קודקוד',
  };
  function strategyLine(mechanism, run, prev) {
    const how = STRATEGY[mechanism] || 'עבדת צעד אחרי צעד ובדקת';
    const less = prev && run && run.acc === prev.acc && run.h < prev.h ? ', והפעם עם פחות רמזים' : '';
    return 'שיא חדש שלך! ' + how + less + '. 🎶';
  }

  // The encore: the child's song on the child's instrument, plus a beat and a
  // drone from the first two families that are not the lead's own.
  function data() {
    if (root && typeof root.instrumentById === 'function') return root;
    try { return require('../instruments.js'); } catch (e) { return null; }
  }
  function mine() {
    if (root && root.MM_MY_INSTRUMENT) return root.MM_MY_INSTRUMENT;
    try { return require('../myInstrument.js'); } catch (e) { return null; }
  }
  function encorePlan(song, opts) {
    const o = opts || {}, d = data(), my = mine();
    const lead = my ? my.instrumentFor(o.fallback || FALLBACK_LEAD, null, o.storage) : (o.fallback || FALLBACK_LEAD);
    const leadX = d && d.instrumentById(lead);
    const fams = d ? d.FAMILIES.filter(function (f) { return !leadX || f !== leadX.family; }).slice(0, 2) : [];
    const backing = fams.map(function (f) { const x = d.byFamily(f)[0]; return x ? { id: x.id, family: f } : null; }).filter(Boolean);
    const phrases = (song || []).filter(function (p) { return p && p.notes && p.notes.length; });
    const len = phrases.reduce(function (n, p) { return n + p.notes.length; }, 0);
    return { lead: lead, leadFamily: leadX ? leadX.family : null, backing: backing, phrases: phrases, beats: Math.max(4, len) };
  }
  // Plays through streak.playPhrase (the app's one phrase player): melody on
  // the lead, a 0.4s beat on the first backing, a C/G drone on the second.
  // playPhrase hands its notes to the audio clock at once and cannot take them
  // back, so only the first phrase and bar go out now; the rest wait on timers
  // that stop() clears. The next exercise calls stop(), so a long song never
  // plays over it (#801 review): at most one phrase or bar still sounds.
  function playEncore(plan, S, delay, timer) {
    if (!plan || !S || typeof S.playPhrase !== 'function') return null;
    const T = timer || { set: function (f, ms) { return setTimeout(f, ms); }, clear: function (id) { clearTimeout(id); } };
    const d0 = Number(delay) || 0, parts = [];
    let t = d0;
    plan.phrases.forEach(function (p) { parts.push({ at: t, p: p, inst: plan.lead }); t += p.notes.length * 0.03 + (p.durations || []).reduce(function (a, b) { return a + b; }, 0) + 0.3; });
    const n = plan.beats;
    for (let b = 0; b < n; b += 4) {
      const k = Math.min(4, n - b), at = d0 + b * 0.4, notes = [], durs = [];
      for (let i = 0; i < k; i++) { notes.push(i ? 196.00 : 130.81); durs.push(0.37); }
      if (plan.backing[0]) parts.push({ at: at, p: { notes: notes, durations: durs }, inst: plan.backing[0].id });
      if (plan.backing[1]) parts.push({ at: at, p: { notes: [(b / 4) % 2 ? 196.00 : 130.81], durations: [k * 0.4 - 0.03] }, inst: plan.backing[1].id });
    }
    const out = [], timers = [];
    let stopped = false;
    function play(x, wait) { out.push(S.playPhrase(x.p, x.inst, null, wait)); }
    parts.forEach(function (x) {
      if (x.at <= d0) play(x, x.at);
      else timers.push(T.set(function () { if (!stopped) play(x, 0); }, Math.round(x.at * 1000)));
    });
    return {
      out: out,
      seconds: Math.max(t, d0 + n * 0.4),
      stop: function () { stopped = true; timers.forEach(function (id) { T.clear(id); }); timers.length = 0; },
    };
  }

  // "In a row": activity with no pause longer than IDLE_MS. Returns true once per session after 20 minutes.
  let since = null, last = null, shown = false;
  function tick(now) {
    const t = now == null ? Date.now() : now;
    if (last == null || t - last > IDLE_MS) { since = t; shown = false; }
    last = t;
    if (!shown && t - since >= BREAK_MS) { shown = true; return true; }
    return false;
  }
  function resetSession() { since = null; last = null; shown = false; }

  return { STORAGE_KEY, BREAK_MS, IDLE_MS, STRATEGY, isNewBest, recordRun, bestFor, strategyLine, encorePlan, playEncore, tick, resetSession, setStorage };
});
