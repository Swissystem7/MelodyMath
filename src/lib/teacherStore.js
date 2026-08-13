// MelodyMath — local roster for a 4-week unassisted trial.
//
// One מחנכת שילוב, shared school tablets, no accounts. A class code only
// namespaces keys on THIS device. The same code on another tablet does not
// sync. Reports are a local record, not a claim of mastery.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const PREFIX = 'mm-roster-v1:';
  const WHO_KEY = 'mm-who-v1';

  function normalizeCode(value) {
    return String(value == null ? '' : value).trim().replace(/\s+/g, ' ').slice(0, 24);
  }

  function storageKey(classCode) {
    return PREFIX + (normalizeCode(classCode) || 'default');
  }

  function defaultStorage() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) { /* private mode */ }
    return null;
  }

  function emptyRoster(classCode) {
    return { classCode: normalizeCode(classCode) || 'default', students: {} };
  }

  function loadRoster(classCode, storage) {
    const ls = storage || defaultStorage();
    const fallback = emptyRoster(classCode);
    if (!ls) return fallback;
    try {
      const raw = ls.getItem(storageKey(classCode));
      if (!raw) return fallback;
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || typeof data.students !== 'object' || !data.students) {
        return fallback;
      }
      return { classCode: normalizeCode(data.classCode) || fallback.classCode, students: data.students };
    } catch (e) {
      return fallback;
    }
  }

  function saveRoster(classCode, roster, storage) {
    const ls = storage || defaultStorage();
    if (!ls || !roster) return false;
    try {
      ls.setItem(storageKey(classCode), JSON.stringify(roster));
      return true;
    } catch (e) {
      return false;
    }
  }

  function listStudents(classCode, storage) {
    const roster = loadRoster(classCode, storage);
    return Object.keys(roster.students).sort(function (a, b) {
      return a.localeCompare(b, 'he');
    });
  }

  function upsertStudent(classCode, name, storage) {
    const label = normalizeCode(name);
    if (!label) return null;
    const roster = loadRoster(classCode, storage);
    if (!roster.students[label]) {
      roster.students[label] = { name: label, created: Date.now(), sessions: [] };
      saveRoster(classCode, roster, storage);
    }
    return roster.students[label];
  }

  function getStudent(classCode, name, storage) {
    const label = normalizeCode(name);
    if (!label) return null;
    return loadRoster(classCode, storage).students[label] || null;
  }

  function startSession(classCode, name, kind, storage) {
    const student = upsertStudent(classCode, name, storage);
    if (!student) return null;
    const session = {
      id: 's' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
      kind: kind || 'practice',
      started: Date.now(),
      ended: null,
      items: [],
    };
    const roster = loadRoster(classCode, storage);
    roster.students[student.name].sessions.push(session);
    saveRoster(classCode, roster, storage);
    return session;
  }

  function addItem(classCode, name, sessionId, item, storage) {
    const label = normalizeCode(name);
    const roster = loadRoster(classCode, storage);
    const student = roster.students[label];
    if (!student) return null;
    const session = student.sessions.find(function (s) { return s.id === sessionId; });
    if (!session) return null;
    const row = {
      skill: item.skill || '',
      prompt: item.prompt || '',
      answer: item.answer,
      given: item.given,
      correct: !!item.correct,
      at: Date.now(),
    };
    session.items.push(row);
    saveRoster(classCode, roster, storage);
    return row;
  }

  function endSession(classCode, name, sessionId, storage) {
    const label = normalizeCode(name);
    const roster = loadRoster(classCode, storage);
    const student = roster.students[label];
    if (!student) return null;
    const session = student.sessions.find(function (s) { return s.id === sessionId; });
    if (!session) return null;
    session.ended = Date.now();
    saveRoster(classCode, roster, storage);
    return session;
  }

  function allItems(student) {
    if (!student || !Array.isArray(student.sessions)) return [];
    return student.sessions.reduce(function (acc, session) {
      (session.items || []).forEach(function (it) { acc.push(it); });
      return acc;
    }, []);
  }

  function buildReport(student) {
    const items = allItems(student);
    const bySkill = {};
    items.forEach(function (it) {
      const k = it.skill || 'אחר';
      const g = bySkill[k] || (bySkill[k] = { skill: k, total: 0, correct: 0 });
      g.total += 1;
      if (it.correct) g.correct += 1;
    });
    let current = 0;
    let best = 0;
    items.forEach(function (it) {
      if (it.correct) {
        current += 1;
        if (current > best) best = current;
      } else {
        current = 0;
      }
    });
    const missCount = {};
    items.forEach(function (it) {
      if (it.correct) return;
      const key = it.prompt || it.skill || '?';
      if (!missCount[key]) missCount[key] = { prompt: key, skill: it.skill || '', count: 0 };
      missCount[key].count += 1;
    });
    const repeatingErrors = Object.keys(missCount)
      .map(function (k) { return missCount[k]; })
      .filter(function (x) { return x.count >= 2; })
      .sort(function (a, b) { return b.count - a.count; });
    const sessions = (student && student.sessions) || [];
    return {
      name: student && student.name ? student.name : '',
      total: items.length,
      correct: items.filter(function (it) { return it.correct; }).length,
      perSkill: Object.keys(bySkill).map(function (k) {
        const g = bySkill[k];
        return { skill: g.skill, total: g.total, correct: g.correct, accuracy: g.total ? g.correct / g.total : 0 };
      }),
      streak: { current: current, best: best },
      repeatingErrors: repeatingErrors,
      sessions: sessions.map(function (s) {
        const n = (s.items || []).length;
        const ok = (s.items || []).filter(function (it) { return it.correct; }).length;
        return {
          id: s.id,
          kind: s.kind,
          started: s.started,
          ended: s.ended,
          total: n,
          correct: ok,
        };
      }),
    };
  }

  function loadWho(storage) {
    const ls = storage || defaultStorage();
    if (!ls) return { classCode: '', name: '' };
    try {
      const raw = JSON.parse(ls.getItem(WHO_KEY) || 'null');
      if (!raw || typeof raw !== 'object') return { classCode: '', name: '' };
      return { classCode: normalizeCode(raw.classCode), name: normalizeCode(raw.name) };
    } catch (e) {
      return { classCode: '', name: '' };
    }
  }

  function saveWho(who, storage) {
    const ls = storage || defaultStorage();
    if (!ls) return;
    try {
      ls.setItem(WHO_KEY, JSON.stringify({
        classCode: normalizeCode(who && who.classCode),
        name: normalizeCode(who && who.name),
      }));
    } catch (e) { /* quota */ }
  }

  return {
    PREFIX, WHO_KEY,
    normalizeCode, storageKey, emptyRoster,
    loadRoster, saveRoster, listStudents, upsertStudent, getStudent,
    startSession, addItem, endSession, buildReport, allItems,
    loadWho, saveWho,
  };
});
