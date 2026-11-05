// MM-600 pilot — everything the demo remembers, in this browser's localStorage.
//
// One device, one browser: the teacher's assignment and the student's results
// meet here because both demo accounts sign in on the same device. Nothing is
// sent anywhere. Clearing the browser data (or "איפוס נתוני ההדגמה") wipes it.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MMPilotStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PREFIX = 'mmPilot.v1.';
  const KEYS = { session: PREFIX + 'session', assignments: PREFIX + 'assignments', progress: PREFIX + 'progress', lastUnit: PREFIX + 'lastUnit' };

  function create(storage) {
    const mem = {};
    const s = storage || {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      setItem: function (k, v) { mem[k] = String(v); },
      removeItem: function (k) { delete mem[k]; }
    };

    function read(key, fallback) {
      try {
        const raw = s.getItem(key);
        if (raw == null) return fallback;
        const v = JSON.parse(raw);
        return v == null ? fallback : v;
      } catch (e) { return fallback; }
    }

    function write(key, value) {
      try { s.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; }
    }

    // ---- session ----
    function session() { return read(KEYS.session, null); }
    function signIn(accountId) { write(KEYS.session, { accountId: accountId, at: Date.now() }); }
    function signOut() { try { s.removeItem(KEYS.session); } catch (e) { /* private mode */ } }

    // ---- assignments ----
    function assignments() {
      const list = read(KEYS.assignments, []);
      return Array.isArray(list) ? list : [];
    }

    function assign(a) {
      const list = assignments();
      const row = {
        id: 'as-' + Date.now().toString(36) + '-' + list.length,
        unitId: a.unitId, studentId: a.studentId, by: a.by,
        note: String(a.note || '').slice(0, 140), createdAt: Date.now()
      };
      list.push(row);
      write(KEYS.assignments, list);
      return row;
    }

    function assignmentsFor(studentId) {
      return assignments().filter(function (a) { return a.studentId === studentId; });
    }

    // ---- progress: { [studentId]: { [unitId]: { lessonDone, index, results, completedAt } } } ----
    function allProgress() {
      const p = read(KEYS.progress, {});
      return p && typeof p === 'object' && !Array.isArray(p) ? p : {};
    }

    function progress(studentId, unitId) {
      const p = allProgress();
      const row = p[studentId] && p[studentId][unitId];
      return row && typeof row === 'object'
        ? { lessonDone: !!row.lessonDone, index: Number(row.index) || 0, results: row.results || {}, completedAt: row.completedAt || null, startedAt: row.startedAt || null, pre: checkRow(row.pre), post: checkRow(row.post) }
        : { lessonDone: false, index: 0, results: {}, completedAt: null, startedAt: null, pre: null, post: null };
    }

    // MM-610: the check without music before/after a unit: { score, total, answers, at }.
    function checkRow(c) {
      return c && typeof c === 'object' && Number.isFinite(Number(c.score)) && Number(c.total) > 0
        ? { score: Number(c.score), total: Number(c.total), answers: c.answers || {}, at: c.at || null } : null;
    }

    // MM-610: the unit last opened on this device (shown first on the student's home).
    function lastUnit() { return read(KEYS.lastUnit, null); }
    function setLastUnit(id) { write(KEYS.lastUnit, id); }

    function saveProgress(studentId, unitId, row) {
      const p = allProgress();
      p[studentId] = p[studentId] || {};
      p[studentId][unitId] = row;
      return write(KEYS.progress, p);
    }

    function resetAll() {
      Object.keys(KEYS).forEach(function (k) { try { s.removeItem(KEYS[k]); } catch (e) { /* ignore */ } });
    }

    return {
      KEYS: KEYS, session: session, signIn: signIn, signOut: signOut,
      assignments: assignments, assign: assign, assignmentsFor: assignmentsFor,
      progress: progress, saveProgress: saveProgress, resetAll: resetAll,
      lastUnit: lastUnit, setLastUnit: setLastUnit
    };
  }

  return { create: create, PREFIX: PREFIX };
});
