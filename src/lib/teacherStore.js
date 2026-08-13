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

  function addNote(classCode, name, text, storage) {
    const label = normalizeCode(name);
    const body = String(text == null ? '' : text).replace(/\s+/g, ' ').trim().slice(0, 280);
    if (!label || !body) return null;
    const roster = loadRoster(classCode, storage);
    const student = roster.students[label];
    if (!student) return null;
    if (!Array.isArray(student.notes)) student.notes = [];
    const note = { at: Date.now(), text: body };
    student.notes.push(note);
    saveRoster(classCode, roster, storage);
    return note;
  }

  function listNotes(student) {
    if (!student || !Array.isArray(student.notes)) return [];
    return student.notes.slice();
  }

  function itemsSince(student, sinceTs) {
    const all = allItems(student);
    const since = Number(sinceTs);
    if (!Number.isFinite(since)) return all;
    return all.filter(function (it) { return Number(it.at) >= since; });
  }

  function buildClassOverview(classCode, storage) {
    const roster = loadRoster(classCode, storage);
    const names = Object.keys(roster.students).sort(function (a, b) {
      return a.localeCompare(b, 'he');
    });
    return names.map(function (name) {
      const student = roster.students[name];
      const report = buildReport(student);
      const sessions = student.sessions || [];
      const last = sessions.length ? sessions[sessions.length - 1] : null;
      return {
        name: name,
        total: report.total,
        correct: report.correct,
        accuracy: report.total ? report.correct / report.total : 0,
        repeating: report.repeatingErrors.length,
        sessions: sessions.length,
        lastAt: last ? last.started : null,
        lastKind: last ? last.kind : '',
        notes: listNotes(student).length,
      };
    });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function buildParentNote(student, extras) {
    const o = extras || {};
    const since = o.since;
    const items = itemsSince(student, since);
    const report = buildReport(student ? { name: student.name, sessions: [{ items: items }] } : null);
    // Rebuild per-skill from the (possibly sliced) items while keeping name/errors.
    const name = student && student.name ? student.name : '';
    const classCode = o.classCode || '';
    const observation = String(o.observation || '').replace(/\s+/g, ' ').trim().slice(0, 280);
    const lastNotes = listNotes(student);
    const lastNote = lastNotes.length ? lastNotes[lastNotes.length - 1].text : '';
    return {
      title: 'מכתב קצר להורה — MelodyMath',
      name: name,
      classCode: classCode,
      total: report.total,
      correct: report.correct,
      perSkill: report.perSkill,
      repeatingErrors: report.repeatingErrors,
      observation: observation || lastNote,
      disclaimer: 'המספרים הם ספירה של תשובות במכשיר הזה — לא ציון, לא אבחון, ולא הוכחה שהתרגול עוזר. MelodyMath הוא דף דפדפן בלי שרת. אין כאן טיפול ואין טענת יעילות.',
    };
  }

  function buildCertificate(student, extras) {
    const o = extras || {};
    const report = buildReport(student);
    const name = student && student.name ? student.name : '';
    const when = o.when || '';
    return {
      title: 'תעודת תרגול — MelodyMath',
      name: name,
      classCode: o.classCode || '',
      when: when,
      total: report.total,
      correct: report.correct,
      perSkill: report.perSkill,
      line: (name ? name + ' תרגל/ה' : 'תרגול') + ' במכשיר הזה.',
      disclaimer: 'זו ספירה של תרגילים במכשיר — לא ציון, לא הצטיינות, לא אבחון, ולא הוכחה שהתרגול עוזר. MelodyMath הוא דף דפדפן בלי שרת.',
    };
  }

  function renderCertificateHtml(cert) {
    const c = cert || buildCertificate(null, {});
    const who = [c.name, c.classCode].filter(Boolean).join(' · ');
    const skills = (c.perSkill || []).map(function (s) {
      return '<li>' + escapeHtml(s.skill) + ': ' + s.correct + ' מתוך ' + s.total + '</li>';
    }).join('');
    return '<article class="cert">'
      + '<p class="sheet-kicker">' + escapeHtml(c.title) + '</p>'
      + '<h2>' + escapeHtml(c.line) + '</h2>'
      + (who ? '<p class="cert-who">' + escapeHtml(who) + '</p>' : '')
      + (c.when ? '<p>' + escapeHtml(c.when) + '</p>' : '')
      + '<p class="cert-count"><b>' + c.correct + '</b> נכונות מתוך <b>' + c.total + '</b> במכשיר הזה.</p>'
      + (skills ? '<ul class="err-list">' + skills + '</ul>' : '<p>עדיין אין פירוט מיומנות.</p>')
      + '<p class="sheet-note">' + escapeHtml(c.disclaimer) + '</p>'
      + '</article>';
  }

  function renderParentNoteHtml(note) {
    const n = note || buildParentNote(null, {});
    const who = [n.name, n.classCode].filter(Boolean).join(' · ');
    const skills = (n.perSkill || []).map(function (s) {
      return '<li>' + escapeHtml(s.skill) + ': ' + s.correct + ' מתוך ' + s.total + '</li>';
    }).join('');
    const errs = (n.repeatingErrors || []).map(function (e) {
      return '<li>' + escapeHtml(e.prompt) + ' — ' + e.count + ' פעמים</li>';
    }).join('');
    return '<article class="parent-note">'
      + '<p class="sheet-kicker">' + escapeHtml(n.title) + (who ? ' — ' + escapeHtml(who) : '') + '</p>'
      + '<p>שלום,</p>'
      + '<p>במכשיר בבית הספר נרשם תרגול קצר'
      + (n.name ? ' של <b>' + escapeHtml(n.name) + '</b>' : '')
      + '. זה דף סיכום להורה, לא מבחן.</p>'
      + '<p><b>במכשיר:</b> ' + n.correct + ' נכונות מתוך ' + n.total + '.</p>'
      + (skills ? '<p><b>לפי מיומנות</b></p><ul class="err-list">' + skills + '</ul>' : '')
      + '<p><b>תרגילים שחזרו כשגיאה</b></p>'
      + (errs ? '<ul class="err-list">' + errs + '</ul>' : '<p>אין תרגיל שנפסל פעמיים או יותר במדגם הזה.</p>')
      + (n.observation ? '<p><b>הערת המורה:</b> ' + escapeHtml(n.observation) + '</p>' : '')
      + '<p class="sheet-note">' + escapeHtml(n.disclaimer) + '</p>'
      + '</article>';
  }

  function exportRoster(classCode, storage) {
    const roster = loadRoster(classCode, storage);
    return JSON.stringify({
      v: 1,
      exported: Date.now(),
      note: 'MelodyMath local roster. Not a cloud backup and not an official school record.',
      classCode: roster.classCode,
      students: roster.students,
    });
  }

  function importRoster(classCode, raw, storage) {
    let data;
    try {
      data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch (e) {
      return { ok: false, error: 'not-json' };
    }
    if (!data || typeof data !== 'object' || typeof data.students !== 'object' || !data.students) {
      return { ok: false, error: 'shape' };
    }
    const roster = loadRoster(classCode, storage);
    let added = 0;
    let merged = 0;
    Object.keys(data.students).forEach(function (name) {
      const incoming = data.students[name];
      if (!incoming || typeof incoming !== 'object') return;
      const sessions = Array.isArray(incoming.sessions) ? incoming.sessions : [];
      if (!roster.students[name]) {
        roster.students[name] = { name: name, created: incoming.created || Date.now(), sessions: sessions };
        added += 1;
        return;
      }
      const have = {};
      roster.students[name].sessions.forEach(function (s) { if (s && s.id) have[s.id] = true; });
      sessions.forEach(function (s) {
        if (s && s.id && !have[s.id]) {
          roster.students[name].sessions.push(s);
          have[s.id] = true;
          merged += 1;
        }
      });
    });
    saveRoster(classCode, roster, storage);
    return { ok: true, added: added, merged: merged };
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

  // Four tap-targets for grades א–ב. Nearby integers, never the key twice.
  function makeChoices(answer, rng) {
    const roll = typeof rng === 'function' ? rng : Math.random;
    const n = Number(answer);
    if (!Number.isFinite(n)) return [String(answer)];
    const opts = [n];
    const around = [n - 1, n + 1, n - 2, n + 2, n + 3, n - 3, n + 4, Math.max(0, n - 4), n === 0 ? 1 : 0];
    around.forEach(function (c) {
      if (opts.length >= 4) return;
      if (Number.isFinite(c) && c >= 0 && opts.indexOf(c) === -1) opts.push(c);
    });
    let guard = 0;
    while (opts.length < 4 && guard++ < 30) {
      const c = Math.max(0, n + Math.floor(roll() * 9) - 4);
      if (opts.indexOf(c) === -1) opts.push(c);
    }
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(roll() * (i + 1));
      const tmp = opts[i];
      opts[i] = opts[j];
      opts[j] = tmp;
    }
    return opts;
  }

  function jsonKey(key) {
    return 'mm:v1:' + String(key || '');
  }

  function loadJson(key, fallback, storage) {
    const ls = storage || defaultStorage();
    if (!ls) return fallback;
    try {
      const raw = ls.getItem(jsonKey(key)) || ls.getItem(String(key));
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function saveJson(key, value, storage) {
    const ls = storage || defaultStorage();
    if (!ls) return false;
    try {
      ls.setItem(jsonKey(key), JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
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
    addNote, listNotes, itemsSince, buildClassOverview,
    buildParentNote, renderParentNoteHtml, buildCertificate, renderCertificateHtml, escapeHtml,
    loadWho, saveWho, makeChoices, exportRoster, importRoster,
    loadJson, saveJson, jsonKey,
  };
});
