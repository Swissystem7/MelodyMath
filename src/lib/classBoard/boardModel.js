// MelodyMath — what the class board (class.html) shows, built from the local
// roster only (MM-7xx stream D). Pure functions: no DOM, no storage writes.
//
// Gap rule (shown to the teacher in words, MM-502 F1): a topic is a gap for a
// student when they answered it at least MIN_TRIES times and got fewer than
// GAP_BELOW of the answers right, or missed every answer in it (at least two;
// the diagnostic asks two per topic), or missed the same question twice.
(function (root, factory) {
  const store = (typeof module === 'object' && module.exports)
    ? require('../teacherStore')
    : root;
  const api = factory(store);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MMBoardModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (store) {
  const MIN_TRIES = 3;
  const GAP_BELOW = 0.6;
  const GAP_RULE = 'פער = נושא שהתלמיד/ה ענה/תה עליו לפחות ' + MIN_TRIES
    + ' פעמים ופחות מ־' + Math.round(GAP_BELOW * 100) + '% מהתשובות נכונות, או שכל התשובות בנושא (לפחות 2) שגויות, או שאותה שאלה נענתה לא נכון פעמיים.';
  const DAY = 24 * 60 * 60 * 1000;

  function num(v) {
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  }

  function itemsOf(student) {
    const out = [];
    (student && Array.isArray(student.sessions) ? student.sessions : []).forEach(function (s) {
      if (!s || typeof s !== 'object') return;
      (Array.isArray(s.items) ? s.items : []).forEach(function (it) {
        if (it && typeof it === 'object') out.push(it);
      });
    });
    return out;
  }

  function topicStats(items) {
    const by = Object.create(null);
    items.forEach(function (it) {
      const k = String(it.skill || 'אחר');
      const t = by[k] || (by[k] = { topic: k, tries: 0, right: 0, misses: Object.create(null), repeated: false, lastAt: null });
      t.tries += 1;
      if (it.correct) t.right += 1;
      else {
        const p = String(it.prompt || '');
        t.misses[p] = (t.misses[p] || 0) + 1;
        if (p && t.misses[p] >= 2) t.repeated = true;
      }
      const at = num(it.at);
      if (at != null && (t.lastAt == null || at > t.lastAt)) t.lastAt = at;
    });
    return Object.keys(by).map(function (k) {
      const t = by[k];
      const accuracy = t.tries ? t.right / t.tries : 0;
      const gap = (t.tries >= MIN_TRIES && accuracy < GAP_BELOW) || (t.tries >= 2 && t.right === 0) || t.repeated;
      return { topic: t.topic, tries: t.tries, right: t.right, accuracy: accuracy, gap: gap, repeated: t.repeated, lastAt: t.lastAt };
    }).sort(function (a, b) { return a.topic.localeCompare(b.topic, 'he'); });
  }

  function gapReason(t) {
    if (t.repeated && t.right > 0 && !(t.tries >= MIN_TRIES && t.accuracy < GAP_BELOW)) return 'אותה שאלה פוספסה פעמיים';
    return t.right + ' נכונות מתוך ' + t.tries;
  }

  function tasksOf(student) {
    return (student && Array.isArray(student.assignments) ? student.assignments : [])
      .filter(function (a) { return a && typeof a === 'object' && a.title; });
  }

  function lastPracticeAt(items) {
    let best = null;
    items.forEach(function (it) {
      const at = num(it.at);
      if (at != null && (best == null || at > best)) best = at;
    });
    return best;
  }

  function studentRow(name, student) {
    const items = itemsOf(student);
    const topics = topicStats(items);
    const right = items.filter(function (it) { return it.correct; }).length;
    const tasks = tasksOf(student);
    const sync = student && student.sync && typeof student.sync === 'object' ? student.sync : null;
    return {
      name: name,
      grade: store.studentGrade ? store.studentGrade(student) : '',
      tries: items.length,
      right: right,
      accuracy: items.length ? right / items.length : 0,
      topics: topics,
      gaps: topics.filter(function (t) { return t.gap; }),
      tasks: tasks,
      tasksDone: tasks.filter(function (t) { return t.completed; }).length,
      lastPracticeAt: lastPracticeAt(items),
      syncedAt: sync ? num(sync.exportedAt) : null,
      importedAt: sync ? num(sync.importedAt) : null,
    };
  }

  function studentRows(roster) {
    const students = roster && roster.students ? roster.students : {};
    return Object.keys(students).sort(function (a, b) { return a.localeCompare(b, 'he'); })
      .map(function (name) { return studentRow(name, students[name]); });
  }

  function topicRows(rows) {
    const by = Object.create(null);
    rows.forEach(function (r) {
      r.topics.forEach(function (t) {
        const g = by[t.topic] || (by[t.topic] = { topic: t.topic, students: 0, tries: 0, right: 0, gapNames: [] });
        g.students += 1;
        g.tries += t.tries;
        g.right += t.right;
        if (t.gap) g.gapNames.push(r.name);
      });
    });
    return Object.keys(by).map(function (k) {
      const g = by[k];
      return { topic: g.topic, students: g.students, tries: g.tries, right: g.right, accuracy: g.tries ? g.right / g.tries : 0, gapNames: g.gapNames };
    }).sort(function (a, b) {
      return b.gapNames.length - a.gapNames.length || a.accuracy - b.accuracy || a.topic.localeCompare(b.topic, 'he');
    });
  }

  function pct(x) {
    return Math.round((Number(x) || 0) * 100) + '%';
  }

  function two(n) {
    return (n < 10 ? '0' : '') + n;
  }

  // "היום 10:05", "אתמול 18:20", "לפני 3 ימים", "12.10.2026".
  function whenText(ts, now) {
    const t = num(ts);
    if (t == null || t <= 0) return '';
    const n = num(now) || Date.now();
    const d = new Date(t);
    const startToday = new Date(n);
    startToday.setHours(0, 0, 0, 0);
    const hm = two(d.getHours()) + ':' + two(d.getMinutes());
    if (t >= startToday.getTime()) return 'היום ' + hm;
    if (t >= startToday.getTime() - DAY) return 'אתמול ' + hm;
    const days = Math.ceil((startToday.getTime() - t) / DAY);
    if (days <= 7) return 'לפני ' + days + ' ימים';
    return d.getDate() + '.' + (d.getMonth() + 1) + '.' + d.getFullYear();
  }

  // The last-sync cell: a code from the student's device, or "this device".
  function syncText(row, now) {
    if (row.syncedAt) return whenText(row.syncedAt, now);
    if (row.lastPracticeAt) return 'תרגל/ה במכשיר הזה';
    return 'עוד לא התקבל קוד';
  }

  // Older than a week, or never: the board asks for a fresh code.
  function syncStale(row, now) {
    const n = num(now) || Date.now();
    const t = row.syncedAt || row.lastPracticeAt;
    return !t || n - t > 7 * DAY;
  }

  function listClasses(storage) {
    const out = [];
    const prefix = store.PREFIX || 'mm-roster-v1:';
    try {
      const ls = storage;
      if (!ls) return out;
      const n = typeof ls.length === 'number' ? ls.length : 0;
      for (let i = 0; i < n; i++) {
        const k = ls.key(i);
        if (k && k.indexOf(prefix) === 0) {
          const c = k.slice(prefix.length);
          if (c && out.indexOf(c) < 0) out.push(c);
        }
      }
    } catch (e) { /* private mode */ }
    return out.sort(function (a, b) { return a.localeCompare(b, 'he'); });
  }

  return {
    MIN_TRIES: MIN_TRIES,
    GAP_BELOW: GAP_BELOW,
    GAP_RULE: GAP_RULE,
    itemsOf: itemsOf,
    topicStats: topicStats,
    gapReason: gapReason,
    studentRow: studentRow,
    studentRows: studentRows,
    topicRows: topicRows,
    pct: pct,
    whenText: whenText,
    syncText: syncText,
    syncStale: syncStale,
    listClasses: listClasses,
  };
});
