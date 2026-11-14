// MelodyMath — local roster for a 4-week unassisted trial.
//
// One מחנכת שילוב, shared school tablets, no accounts. A class code only
// namespaces keys on THIS device. The same code on another tablet does not
// sync. Reports are a local record, not a claim of mastery.
((root, factory) => {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, () => {
  const assignmentApi = (typeof module === 'object' && module.exports)
    ? require('./assignment')
    : (typeof globalThis !== 'undefined' ? globalThis : {});

  const PREFIX = 'mm-roster-v1:';
  const WHO_KEY = 'mm-who-v1';

  function normalizeCode(value) {
    return String(value == null ? '' : value).trim().replace(/\s+/g, ' ').slice(0, 24);
  }

  // Roster keys are student names a teacher typed or that came out of an
  // imported JSON file. A name that already lives on Object.prototype
  // ('__proto__', 'constructor', 'toString', ...) makes roster.students[name]
  // hand back the prototype instead of a student row, and every write after
  // that lands on every object in the page. Such a name is never a student.
  function studentLabel(name) {
    const label = normalizeCode(name);
    if (!label || label in Object.prototype) return '';
    return label;
  }

  // A roster row may carry the grade the teacher picked for that child. The
  // class picture needs it per child, because one tablet is shared by a
  // מחנכת שילוב whose group spans grades — the grade showing on screen is not
  // every child's grade. Anything that is not א׳–ו׳ stays unknown, never a
  // guess: a wrong grade would build a plan from the wrong topic path.
  function gradeLabel(value) {
    const first = String(value == null ? '' : value).trim().slice(0, 1);
    return ['א', 'ב', 'ג', 'ד', 'ה', 'ו'].indexOf(first) >= 0 ? first : '';
  }

  function studentGrade(student) {
    return gradeLabel(student?.grade);
  }

  function ownStudent(roster, label) {
    const students = roster?.students;
    if (!students || !label || !Object.hasOwn(students, label)) return null;
    return students[label] || null;
  }

  // A student row is the object upsertStudent writes. A hand-edited or
  // truncated export, or a build that imported without checking, can leave
  // roster.students[name] as null, a bare string, a number or an array.
  // Every reader then does student.sessions / student.assignments on it, so
  // the class board, the practice loop and the next import all throw for
  // the whole class. Such a row holds no sessions anyway: drop it.
  function isStudentRow(row) {
    return !!row && typeof row === 'object' && !Array.isArray(row);
  }

  function cleanStudents(map) {
    const out = {};
    Object.keys(map).forEach((key) => {
      if (key in Object.prototype) return;
      if (!isStudentRow(map[key])) return;
      out[key] = map[key];
    });
    return out;
  }

  function storageKey(classCode) {
    return PREFIX + (normalizeCode(classCode) || 'default');
  }

  function defaultStorage() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (_e) { /* private mode */ }
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
      return { classCode: normalizeCode(data.classCode) || fallback.classCode, students: cleanStudents(data.students) };
    } catch (_e) {
      return fallback;
    }
  }

  function saveRoster(classCode, roster, storage) {
    const ls = storage || defaultStorage();
    if (!ls || !roster) return false;
    try {
      ls.setItem(storageKey(classCode), JSON.stringify(roster));
      return true;
    } catch (_e) {
      return false;
    }
  }

  function listStudents(classCode, storage) {
    return listClassStudents(classCode, storage).map((row) => row.name);
  }

  function listClassStudents(classCode, storage) {
    const roster = loadRoster(classCode, storage);
    return Object.keys(roster.students).sort((a, b) => a.localeCompare(b, 'he')).map((name) => {
      const student = roster.students[name];
      return { name: student.name, created: student.created, grade: studentGrade(student) };
    });
  }

  // Returns the grade now on the row: '' when the teacher cleared it (the class
  // picture then falls back to the tablet's grade), or null when nothing was
  // written — no such student, or a value that is not א׳–ו׳.
  function setStudentGrade(classCode, name, grade, storage) {
    const raw = String(grade == null ? '' : grade).trim();
    const g = gradeLabel(raw);
    if (raw && !g) return null;
    const roster = loadRoster(classCode, storage);
    const student = ownStudent(roster, studentLabel(name));
    if (!student) return null;
    if (g) student.grade = g;
    else delete student.grade;
    saveRoster(classCode, roster, storage);
    return g;
  }

  // A hand-edited or partially imported roster may carry a student row with
  // no `sessions` array. Every writer below pushes into it, so repair it here.
  function ensureSessions(student) {
    if (student && !Array.isArray(student.sessions)) student.sessions = [];
    return student;
  }

  function upsertStudent(classCode, name, storage) {
    const label = studentLabel(name);
    if (!label) return null;
    const roster = loadRoster(classCode, storage);
    if (!ownStudent(roster, label)) {
      roster.students[label] = { name: label, created: Date.now(), sessions: [], assignments: [] };
      saveRoster(classCode, roster, storage);
    } else if (!Array.isArray(roster.students[label].assignments)) {
      roster.students[label].assignments = [];
    }
    return ensureSessions(roster.students[label]);
  }

  function getStudent(classCode, name, storage) {
    return ownStudent(loadRoster(classCode, storage), studentLabel(name));
  }

  function startSession(classCode, name, kind, storage) {
    const student = upsertStudent(classCode, name, storage);
    if (!student) return null;
    const session = {
      id: `s${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
      kind: kind || 'practice',
      started: Date.now(),
      ended: null,
      items: [],
    };
    // When the tablet cannot persist (storage quota, private mode), the
    // upsert above was not saved and a fresh load has no such student.
    // Fall back to the in-memory row so the practice loop keeps running
    // instead of throwing from inside the answer handler.
    const roster = loadRoster(classCode, storage);
    const target = ensureSessions(ownStudent(roster, student.name) || student);
    if (!ownStudent(roster, student.name)) roster.students[student.name] = target;
    target.sessions.push(session);
    saveRoster(classCode, roster, storage);
    return session;
  }

  function addItem(classCode, name, sessionId, item, storage) {
    const label = studentLabel(name);
    const roster = loadRoster(classCode, storage);
    const student = ensureSessions(ownStudent(roster, label));
    if (!student) return null;
    const session = student.sessions.find((s) => s && s.id === sessionId);
    if (!session) return null;
    if (!Array.isArray(session.items)) session.items = [];
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
    const label = studentLabel(name);
    const roster = loadRoster(classCode, storage);
    const student = ensureSessions(ownStudent(roster, label));
    if (!student) return null;
    const session = student.sessions.find((s) => s && s.id === sessionId);
    if (!session) return null;
    session.ended = Date.now();
    saveRoster(classCode, roster, storage);
    return session;
  }

  function allItems(student) {
    if (!student || !Array.isArray(student.sessions)) return [];
    return student.sessions.reduce((acc, session) => {
      ((session?.items) || []).forEach((it) => { if (it) acc.push(it); });
      return acc;
    }, []);
  }

  function buildReport(student) {
    const items = allItems(student);
    // Null-prototype maps: an imported item whose skill or prompt is a
    // prototype key (constructor, __proto__) must count like any other text
    // instead of vanishing from the report and writing into Object.prototype.
    const bySkill = Object.create(null);
    items.forEach((it) => {
      const k = it.skill || 'אחר';
      if (!bySkill[k]) {
        bySkill[k] = { skill: k, total: 0, correct: 0 };
      }
      const g = bySkill[k];
      g.total += 1;
      if (it.correct) g.correct += 1;
    });
    let current = 0;
    let best = 0;
    items.forEach((it) => {
      if (it.correct) {
        current += 1;
        if (current > best) best = current;
      } else {
        current = 0;
      }
    });
    const missCount = Object.create(null);
    items.forEach((it) => {
      if (it.correct) return;
      const key = it.prompt || it.skill || '?';
      if (!missCount[key]) missCount[key] = { prompt: key, skill: it.skill || '', count: 0 };
      missCount[key].count += 1;
    });
    const repeatingErrors = Object.keys(missCount)
      .map((k) => missCount[k])
      .filter((x) => x.count >= 2)
      .sort((a, b) => b.count - a.count);
    const sessions = ((student?.sessions) || []).filter((s) => s && typeof s === 'object');
    return {
      name: student?.name ? student.name : '',
      total: items.length,
      correct: items.filter((it) => it.correct).length,
      perSkill: Object.keys(bySkill).map((k) => {
        const g = bySkill[k];
        return { skill: g.skill, total: g.total, correct: g.correct, accuracy: g.total ? g.correct / g.total : 0 };
      }),
      streak: { current: current, best: best },
      repeatingErrors: repeatingErrors,
      sessions: sessions.map((s) => {
        const n = (s.items || []).length;
        const ok = (s.items || []).filter((it) => it.correct).length;
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

  function assignTask(classCode, name, task, storage) {
    const label = studentLabel(name);
    const row = assignmentApi.normalizeAssignment
      ? assignmentApi.normalizeAssignment(task)
      : null;
    if (!label || !row) return null;
    const roster = loadRoster(classCode, storage);
    const student = ownStudent(roster, label);
    if (!student) return null;
    if (!Array.isArray(student.assignments)) student.assignments = [];
    student.assignments.push(row);
    saveRoster(classCode, roster, storage);
    return row;
  }

  function listAssignments(classCode, name, storage) {
    const student = getStudent(classCode, name, storage);
    if (assignmentApi.assignmentsForStudent) {
      return assignmentApi.assignmentsForStudent(student);
    }
    if (!student || !Array.isArray(student.assignments)) return [];
    return student.assignments.slice();
  }

  function assignmentProgressRow(row) {
    if (!row) return null;
    return {
      id: row.id,
      title: row.title,
      skill: row.skill || '',
      completed: !!row.completed,
      completedAt: row.completed ? row.completedAt : null,
      assignedAt: row.assignedAt,
    };
  }

  function listStudentProgress(classCode, name, storage) {
    const student = getStudent(classCode, name, storage);
    if (!student) return null;
    return cleanAssignments(student.assignments).map(assignmentProgressRow);
  }

  function listClassStudentsProgress(classCode, storage) {
    return listClassStudents(classCode, storage).map((row) => {
      const tasks = listStudentProgress(classCode, row.name, storage) || [];
      const done = tasks.filter((t) => t.completed).length;
      return {
        name: row.name,
        created: row.created,
        tasks: tasks,
        completedCount: done,
        totalCount: tasks.length,
      };
    });
  }

  function addNote(classCode, name, text, storage) {
    const label = studentLabel(name);
    const body = String(text == null ? '' : text).replace(/\s+/g, ' ').trim().slice(0, 280);
    if (!label || !body) return null;
    const roster = loadRoster(classCode, storage);
    const student = ownStudent(roster, label);
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

  function noteText(note) {
    const raw = note && typeof note === 'object' ? note.text : null;
    return String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim().slice(0, 280);
  }

  // Two tablets never share a clock reading to the millisecond by accident, so
  // the timestamp plus the text is enough to tell a re-import from a new note.
  function noteKey(note) {
    return `${String(note && note.at != null ? note.at : '')}\x00${noteText(note)}`;
  }

  // Notes come off another tablet's JSON file: keep the shape addNote writes,
  // drop rows with no text, and never carry the same note in twice.
  function cleanNotes(list) {
    if (!Array.isArray(list)) return [];
    const seen = Object.create(null);
    const out = [];
    list.forEach((n) => {
      const text = noteText(n);
      if (!text) return;
      const at = Number(n.at);
      const row = { at: Number.isFinite(at) ? at : Date.now(), text: text };
      const key = noteKey(row);
      if (seen[key]) return;
      seen[key] = true;
      out.push(row);
    });
    return out;
  }

  // Assignments come off another tablet's JSON file too. Run each row through
  // the same normalizer assignTask uses, drop rows with no title, and never
  // carry the same id in twice. Without the normalizer (browser load order)
  // keep rows that at least look like assignments.
  function cleanAssignments(list) {
    if (!Array.isArray(list)) return [];
    const seen = Object.create(null);
    const out = [];
    list.forEach((raw) => {
      if (!raw || typeof raw !== 'object') return;
      const row = assignmentApi.normalizeAssignment
        ? assignmentApi.normalizeAssignment(raw)
        : (raw.id && raw.title ? raw : null);
      if (!row) return;
      const key = String(row.id);
      if (seen[key]) return;
      seen[key] = true;
      out.push(row);
    });
    return out;
  }

  // Sessions come off the same JSON file. A hand-edited or truncated export
  // can hold `null`, a bare string, or a session whose `items` is not a list.
  // Every reader below does `s.items` / `s.id` on each entry, so one such row
  // would throw from the class board, the report and the practice loop for
  // that student on every later visit. Keep object rows only, give each a
  // real items list, and never carry the same session id in twice.
  function cleanSessions(list) {
    if (!Array.isArray(list)) return [];
    const seen = Object.create(null);
    const out = [];
    list.forEach((s) => {
      if (!s || typeof s !== 'object' || Array.isArray(s)) return;
      if (s.id != null) {
        const key = String(s.id);
        if (seen[key]) return;
        seen[key] = true;
      }
      const items = Array.isArray(s.items)
        ? s.items.filter((it) => it && typeof it === 'object')
        : [];
      out.push(Object.assign({}, s, { items: items }));
    });
    return out;
  }

  function itemsSince(student, sinceTs) {
    const all = allItems(student);
    const since = Number(sinceTs);
    if (!Number.isFinite(since)) return all;
    return all.filter((it) => Number(it.at) >= since);
  }

  // The class board names the most recent session. Sessions are stored in
  // the order they arrived, and importRoster appends another tablet's rows
  // after the local ones, so the last array entry may be older than a
  // session already here. Pick the latest start time instead; rows without
  // a usable start time fall back to array order.
  function latestSession(sessions) {
    let best = null;
    let bestAt = -Infinity;
    (Array.isArray(sessions) ? sessions : []).forEach((s) => {
      if (!s || typeof s !== 'object') return;
      const at = Number(s.started);
      const when = Number.isFinite(at) ? at : -Infinity;
      if (!best || when >= bestAt) { best = s; bestAt = when; }
    });
    return best;
  }

  function buildClassOverview(classCode, storage) {
    const roster = loadRoster(classCode, storage);
    const names = Object.keys(roster.students).sort((a, b) => a.localeCompare(b, 'he'));
    return names.map((name) => {
      const student = roster.students[name];
      const report = buildReport(student);
      const sessions = student.sessions || [];
      const last = latestSession(sessions);
      return {
        name: name,
        grade: studentGrade(student),
        total: report.total,
        totalPractices: report.total,
        correct: report.correct,
        accuracy: report.total ? report.correct / report.total : 0,
        successRate: report.total ? report.correct / report.total : 0,
        perSkill: report.perSkill,
        skills: report.perSkill,
        repeatingErrors: report.repeatingErrors,
        errors: report.repeatingErrors,
        repeating: report.repeatingErrors.length,
        sessions: sessions.length,
        sessionsCount: sessions.length,
        lastAt: last ? last.started : null,
        lastKind: last ? last.kind : '',
        notes: listNotes(student).length,
      };
    });
  }

  function getDashboardData(rawOrCode, storage) {
    let roster;
    if (rawOrCode && typeof rawOrCode === 'object' && rawOrCode.students) {
      roster = rawOrCode;
    } else if (typeof rawOrCode === 'string' && rawOrCode.trim().startsWith('{')) {
      try {
        roster = JSON.parse(rawOrCode);
      } catch (_e) {
        roster = loadRoster(rawOrCode, storage);
      }
    } else if (typeof rawOrCode === 'string' || rawOrCode == null) {
      roster = loadRoster(rawOrCode, storage);
    } else {
      roster = { students: {} };
    }
    const studentsMap = (roster?.students) || {};
    const names = Object.keys(studentsMap).sort((a, b) => a.localeCompare(b, 'he'));
    return names.map((name) => {
      const student = studentsMap[name];
      const report = buildReport(student);
      const sessions = (student?.sessions) || [];
      const last = latestSession(sessions);
      return {
        name: name,
        total: report.total,
        totalPractices: report.total,
        correct: report.correct,
        accuracy: report.total ? report.correct / report.total : 0,
        successRate: report.total ? report.correct / report.total : 0,
        perSkill: report.perSkill,
        skills: report.perSkill,
        repeatingErrors: report.repeatingErrors,
        errors: report.repeatingErrors,
        repeating: report.repeatingErrors.length,
        sessions: sessions.length,
        sessionsCount: sessions.length,
        lastAt: last ? last.started : null,
        lastKind: last ? last.kind : '',
        notes: listNotes(student).length,
      };
    });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  function buildParentNote(student, extras) {
    const o = extras || {};
    const since = o.since;
    const items = itemsSince(student, since);
    const report = buildReport(student ? { name: student.name, sessions: [{ items: items }] } : null);
    // Rebuild per-skill from the (possibly sliced) items while keeping name/errors.
    const name = student?.name ? student.name : '';
    const classCode = o.classCode || '';
    const observation = String(o.observation || '').replace(/\s+/g, ' ').trim().slice(0, 280);
    const lastNotes = listNotes(student);
    const lastNote = lastNotes.length ? lastNotes[lastNotes.length - 1].text : '';
    // The one topic from buildLearnerPlan, when the caller has it. Older callers
    // pass no plan and get the same note (and the same HTML) as before.
    const plan = o.plan && o.plan.ok !== false && o.plan.topic ? {
      planTopic: String(o.plan.topic),
      planHook: String(o.plan.hook || ''),
      paceDone: Number(o.plan.paceDone) || 0,
      paceExpected: Number(o.plan.paceExpected) || 0,
      homeTip: homeTipFor(o.plan.topic),
    } : null;
    return Object.assign({
      title: 'מכתב קצר להורה — MelodyMath',
      name: name,
      classCode: classCode,
      total: report.total,
      correct: report.correct,
      perSkill: report.perSkill,
      repeatingErrors: report.repeatingErrors,
      observation: observation || lastNote,
      disclaimer: 'המספרים הם ספירה של תשובות במכשיר הזה — לא ציון, לא אבחון, ולא הוכחה שהתרגול עוזר. MelodyMath הוא דף דפדפן בלי שרת. אין כאן טיפול ואין טענת יעילות.',
    }, plan);
  }

  // A 5-minute thing to do at home, picked by a fragment of the plan topic.
  // «כפל וחילוק שברים» is fractions, not the times table, so it gets the default.
  function homeTipFor(topic) {
    const t = String(topic || '');
    if (/ספירה|מנייה/.test(t)) return 'ספרו יחד 10 פעימות בכפיים, ואז הלאה מ-10';
    if (/כפל/.test(t) && !/שבר/.test(t)) return 'אמרו את הכפולות של 5 עם מחיאת כף';
    if (/חיסור/.test(t)) return 'פרטו שטר של 10 למטבעות';
    return '5 דקות תרגול במכשיר, בלי לחץ';
  }

  function buildCertificate(student, extras) {
    const o = extras || {};
    const report = buildReport(student);
    const name = student?.name ? student.name : '';
    const when = o.when || '';
    return {
      title: 'תעודת תרגול — MelodyMath',
      name: name,
      classCode: o.classCode || '',
      when: when,
      total: report.total,
      correct: report.correct,
      perSkill: report.perSkill,
      line: `${name ? `${name} תרגל/ה` : 'תרגול'} במכשיר הזה.`,
      disclaimer: 'זו ספירה של תרגילים במכשיר — לא ציון, לא הצטיינות, לא אבחון, ולא הוכחה שהתרגול עוזר. MelodyMath הוא דף דפדפן בלי שרת.',
    };
  }

  function renderCertificateHtml(cert) {
    const c = cert || buildCertificate(null, {});
    const who = [c.name, c.classCode].filter(Boolean).join(' · ');
    const skills = (c.perSkill || []).map((s) => `<li>${escapeHtml(s.skill)}: ${s.correct} מתוך ${s.total}</li>`).join('');
    return '<article class="cert">'
      + '<p class="sheet-kicker">' + escapeHtml(c.title) + '</p>'
      + '<h2>' + escapeHtml(c.line) + '</h2>'
      + (who ? `<p class="cert-who">${escapeHtml(who)}</p>` : '')
      + (c.when ? `<p>${escapeHtml(c.when)}</p>` : '')
      + '<p class="cert-count"><b>' + c.correct + '</b> נכונות מתוך <b>' + c.total + '</b> במכשיר הזה.</p>'
      + (skills ? `<ul class="err-list">${skills}</ul>` : '<p>עדיין אין פירוט מיומנות.</p>')
      + '<p class="sheet-note">' + escapeHtml(c.disclaimer) + '</p>'
      + '</article>';
  }

  function renderParentNoteHtml(note) {
    const n = note || buildParentNote(null, {});
    const who = [n.name, n.classCode].filter(Boolean).join(' · ');
    const skills = (n.perSkill || []).map((s) => `<li>${escapeHtml(s.skill)}: ${s.correct} מתוך ${s.total}</li>`).join('');
    const errs = (n.repeatingErrors || []).map((e) => `<li>${escapeHtml(e.prompt)} — ${e.count} פעמים</li>`).join('');
    return '<article class="parent-note">'
      + '<p class="sheet-kicker">' + escapeHtml(n.title) + (who ? ` — ${escapeHtml(who)}` : '') + '</p>'
      + '<p>שלום,</p>'
      + '<p>במכשיר בבית הספר נרשם תרגול קצר'
      + (n.name ? ` של <b>${escapeHtml(n.name)}</b>` : '')
      + '. זה דף סיכום להורה, לא מבחן.</p>'
      + '<p><b>במכשיר:</b> ' + n.correct + ' נכונות מתוך ' + n.total + '.</p>'
      + (skills ? `<p><b>לפי מיומנות</b></p><ul class="err-list">${skills}</ul>` : '')
      + (n.planTopic ? '<section class="parent-plan"><h3>על מה ' + escapeHtml(n.name || 'הילד/ה') + ' עובד/ת עכשיו</h3>'
        + '<p>' + escapeHtml(n.planTopic) + (n.planHook ? ` — <span class="parent-plan-hook">${escapeHtml(n.planHook)}</span>` : '')
        + '. ' + n.paceDone + ' מתוך ' + n.paceExpected + ' מפגשים השבוע.</p>'
        + '<p><b>5 דקות בבית:</b> ' + escapeHtml(n.homeTip) + '</p></section>' : '')
      + '<p><b>תרגילים שחזרו כשגיאה</b></p>'
      + (errs ? `<ul class="err-list">${errs}</ul>` : '<p>אין תרגיל שנפסל פעמיים או יותר במדגם הזה.</p>')
      + (n.observation ? `<p><b>הערת המורה:</b> ${escapeHtml(n.observation)}</p>` : '')
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
    } catch (_e) {
      return { ok: false, error: 'not-json' };
    }
    if (!data || typeof data !== 'object' || typeof data.students !== 'object' || !data.students) {
      return { ok: false, error: 'shape' };
    }
    const roster = loadRoster(classCode, storage);
    let added = 0;
    let merged = 0;
    let notes = 0;
    let assignments = 0;
    let skipped = 0;
    Object.keys(data.students).forEach((rawName) => {
      const incoming = data.students[rawName];
      // Same rule as loadRoster: a row that is not an object holds a value
      // every reader would throw on. Count it so the teacher sees it was
      // dropped instead of vanishing.
      if (!isStudentRow(incoming)) { skipped += 1; return; }
      // Same rule as upsertStudent: trimmed, 24 chars, never a prototype key.
      // Otherwise a row lands under a name getStudent can never look up.
      const name = studentLabel(rawName);
      if (!name) { skipped += 1; return; }
      const sessions = cleanSessions(incoming.sessions);
      const incomingNotes = cleanNotes(incoming.notes);
      const incomingAssignments = cleanAssignments(incoming.assignments);
      if (!ownStudent(roster, name)) {
        roster.students[name] = {
          name: name,
          created: incoming.created || Date.now(),
          grade: gradeLabel(incoming.grade),
          sessions: sessions,
          assignments: incomingAssignments,
          notes: incomingNotes,
        };
        added += 1;
        notes += incomingNotes.length;
        assignments += incomingAssignments.length;
        return;
      }
      // A grade set on this tablet wins: the teacher typed it here, and the
      // other tablet's export may be weeks old. An unset grade is filled in.
      if (!studentGrade(roster.students[name])) {
        const incomingGrade = gradeLabel(incoming.grade);
        if (incomingGrade) roster.students[name].grade = incomingGrade;
      }
      const have = {};
      ensureSessions(roster.students[name]);
      roster.students[name].sessions.forEach((s) => { if (s?.id) have[s.id] = true; });
      sessions.forEach((s) => {
        if (s?.id && !have[s.id]) {
          roster.students[name].sessions.push(s);
          have[s.id] = true;
          merged += 1;
        }
      });
      const target = roster.students[name];
      if (!Array.isArray(target.notes)) target.notes = [];
      const haveNotes = Object.create(null);
      target.notes.forEach((n) => { haveNotes[noteKey(n)] = true; });
      incomingNotes.forEach((n) => {
        const key = noteKey(n);
        if (haveNotes[key]) return;
        haveNotes[key] = true;
        target.notes.push(n);
        notes += 1;
      });
      // Tasks the teacher assigned on the other tablet ride along the same
      // way: new ids are appended, ids already here are left untouched so a
      // task completed on this tablet is not reset by a stale export.
      if (!Array.isArray(target.assignments)) target.assignments = [];
      const haveAssignments = Object.create(null);
      target.assignments.forEach((a) => { if (a?.id) haveAssignments[String(a.id)] = true; });
      incomingAssignments.forEach((a) => {
        if (haveAssignments[String(a.id)]) return;
        haveAssignments[String(a.id)] = true;
        target.assignments.push(a);
        assignments += 1;
      });
    });
    saveRoster(classCode, roster, storage);
    return { ok: true, added: added, merged: merged, notes: notes, assignments: assignments, skipped: skipped };
  }

  // One Hebrew line for the roster-import message. Every counter importRoster
  // returns is named, so the teacher sees that notes and tasks came along too
  // and that rows with an unusable name were dropped instead of vanishing.
  function summarizeImport(res) {
    if (!res?.ok) {
      return res && res.error === 'not-json' ? 'הקובץ אינו JSON תקין.' : 'מבנה הקובץ לא מתאים.';
    }
    const n = (v) => Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
    const added = n(res.added), merged = n(res.merged), notes = n(res.notes);
    const assignments = n(res.assignments), skipped = n(res.skipped);
    const parts = [];
    if (added) parts.push(`${added} תלמידים חדשים`);
    if (merged) parts.push(`${merged} מפגשים שמוזגו`);
    if (notes) parts.push(`${notes} הערות מורה`);
    if (assignments) parts.push(`${assignments} משימות`);
    let text = parts.length
      ? `יובא: ${parts.join(', ')}.`
      : 'הקובץ נקרא, אבל לא היה בו דבר חדש למכשיר הזה.';
    if (skipped) text += ` ${skipped} שורות לא תקינות (שם או מבנה) לא יובאו.`;
    return text;
  }

  // The remembered student goes through the same rule as the roster: a name
  // the roster refuses (prototype key) must not come back as the current
  // student, or the bar says the name is saved while every answer is dropped.
  function loadWho(storage) {
    const ls = storage || defaultStorage();
    if (!ls) return { classCode: '', name: '' };
    try {
      const raw = JSON.parse(ls.getItem(WHO_KEY) || 'null');
      if (!raw || typeof raw !== 'object') return { classCode: '', name: '' };
      return { classCode: normalizeCode(raw.classCode), name: studentLabel(raw.name) };
    } catch (_e) {
      return { classCode: '', name: '' };
    }
  }

  // Four tap-targets. Nearby integers, or unit-fraction distractors.
  function makeChoices(answer, rng) {
    const roll = typeof rng === 'function' ? rng : Math.random;
    const raw = String(answer == null ? '' : answer).trim();
    if (/^\d+\/\d+$/.test(raw) || raw === '½' || raw === '¼' || raw === '⅛') {
      const pool = ['1/2', '1/4', '1/8', '1', '3/4', '0'];
      const opts = [raw === '½' ? '1/2' : raw === '¼' ? '1/4' : raw === '⅛' ? '1/8' : raw];
      pool.forEach((c) => {
        if (opts.length >= 4) return;
        if (opts.indexOf(c) === -1) opts.push(c);
      });
      for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(roll() * (i + 1));
        const tmp = opts[i];
        opts[i] = opts[j];
        opts[j] = tmp;
      }
      return opts;
    }
    const n = Number(answer);
    if (!Number.isFinite(n)) return [String(answer)];
    const opts = [n];
    const around = [n - 1, n + 1, n - 2, n + 2, n + 3, n - 3, n + 4, Math.max(0, n - 4), n === 0 ? 1 : 0];
    around.forEach((c) => {
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
    if (key == null) return '';
    const clean = String(key).trim();
    if (!clean) return '';
    return `mm:v1:${clean}`;
  }

  function loadJson(key, fallback, storage) {
    if (key == null || !String(key).trim()) return fallback;
    const ls = storage || defaultStorage();
    if (!ls) return fallback;
    try {
      const raw = ls.getItem(jsonKey(key)) || ls.getItem(String(key));
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (_e) {
      return fallback;
    }
  }

  function saveJson(key, value, storage) {
    if (key == null || !String(key).trim()) return false;
    const ls = storage || defaultStorage();
    if (!ls) return false;
    try {
      ls.setItem(jsonKey(key), JSON.stringify(value));
      return true;
    } catch (_e) {
      return false;
    }
  }

  function saveWho(who, storage) {
    const ls = storage || defaultStorage();
    if (!ls) return;
    try {
      ls.setItem(WHO_KEY, JSON.stringify({
        classCode: normalizeCode(who?.classCode),
        name: studentLabel(who?.name),
      }));
    } catch (_e) { /* quota */ }
  }

  // --- Anonymous classroom 8-min flow & AG11 end screen (MM-AUTO-754) ---
  const CLASS_SESSION_MS = 8 * 60 * 1000;
  const CLASS_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const CLASS_CODE_RE = /^[A-HJ-NP-Z2-9]{5}$/;
  const AG11_TITLE = 'עבדת יפה היום.';
  const AG11_SUBTITLE = 'אפשר לסיים, ואפשר עוד סבב.';
  const AG11_DONE_LABEL = 'סיימתי להיום';
  const AG11_AGAIN_LABEL = 'עוד סבב';
  const AG11_FORBIDDEN = Object.freeze(['נכשלת', 'טעית', 'שגית', 'פספסת', 'ציון']);

  const ANONYMOUS_SYSTEM_WORDS = new Set([
    'ילד', 'ילדה', 'ילד/ה', 'תלמיד', 'תלמידה', 'תלמיד/ה',
    'מורה', 'לדוגמה', 'דמו', 'demo',
    'כוכב', 'נמר', 'שמש', 'ירח', 'דולפין', 'אייל', 'פרפר', 'צבי',
  ]);

  function cleanClassCode(input) {
    if (input == null) return '';
    return String(input)
      .toUpperCase()
      .replace(/[^A-HJ-NP-Z2-9]/g, '');
  }

  function formatClassCode(input) {
    return cleanClassCode(input).slice(0, 5);
  }

  function isValidClassCode(code) {
    if (code == null) return false;
    const raw = String(code).trim();
    if (raw.length !== 5) return false;
    return CLASS_CODE_RE.test(cleanClassCode(raw)) || /^[\p{L}\p{N}]{5}$/u.test(raw);
  }

  function sanitizeNickname(input) {
    if (input == null) return '';
    return String(input)
      .replace(/[<>&"'`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function isAnonymousName(name) {
    if (name == null) return false;
    if (typeof name !== 'string' && typeof name !== 'number') return false;
    const raw = sanitizeNickname(name);
    if (!raw) return false;
    if (raw.length < 2 && !/^#?\d+$/.test(raw)) return false;
    if (raw.length > 24) return false;

    // Block email, phone/id
    if (raw.includes('@')) return false;
    if (/\d{5,}/.test(raw)) return false;
    if (/(?:^|[^\d])05\d[\s-]*\d/.test(raw)) return false;

    // Student number 1-40 or #1-#40
    const numMatch = /^#?(\d+)$/.exec(raw);
    if (numMatch) {
      const n = Number(numMatch[1]);
      return n >= 1 && n <= 40;
    }

    const words = raw.split(' ').filter(Boolean);
    if (words.length >= 2) {
      // Must not be two personal name words (e.g. 'יוסי כהן')
      const cleanWord = (w) => w.replace(/^[#«"']+|[»"',.!?:;]+$/g, '').toLowerCase();
      const nonAllowed = words.filter((w) => !ANONYMOUS_SYSTEM_WORDS.has(cleanWord(w)) && !/^\d+$/.test(w));
      if (nonAllowed.length >= 2) return false;
    }

    if (words.length === 1) {
      const cleanWord = raw.replace(/^[#«"']+|[»"',.!?:;]+$/g, '').toLowerCase();
      if (ANONYMOUS_SYSTEM_WORDS.has(cleanWord)) return true;
      if (/^[\p{L}\p{M}/]+(?:-?#?\d+)?$/u.test(raw)) return true;
      return false;
    }

    // Multi-word case: all must be system words or numbers
    return words.every((w) => {
      const cw = w.replace(/^[#«"']+|[»"',.!?:;]+$/g, '').toLowerCase();
      return ANONYMOUS_SYSTEM_WORDS.has(cw) || /^#?\d+$/.test(w);
    });
  }

  function validateAnonymousLogin(classCode, studentName) {
    const codeOk = isValidClassCode(classCode);
    const nameOk = isAnonymousName(studentName);
    if (!codeOk && !nameOk) {
      return { ok: false, reason: 'code_and_name_invalid', message: 'יש להזין קוד כיתה בן 5 תווים ומספר או כינוי תלמיד/ה ללא שמות אמיתיים.' };
    }
    if (!codeOk) {
      return { ok: false, reason: 'code_invalid', message: 'קוד הכיתה צריך להכיל בדיוק 5 תווים.' };
    }
    if (!nameOk) {
      return { ok: false, reason: 'name_invalid', message: 'יש להזין כינוי או מספר תלמיד/ה (למשל כוכב3 או #5), ללא שמות אמיתיים.' };
    }
    return {
      ok: true,
      classCode: formatClassCode(classCode) || String(classCode).trim(),
      name: sanitizeNickname(studentName),
    };
  }

  function startCalmSession(classCode, name, opts, storage) {
    const session = startSession(classCode, name, 'class', storage);
    if (!session) return null;
    session.calm = true;
    session.targetDuration = CLASS_SESSION_MS;
    session.clockVisible = Boolean(opts?.clockVisible);
    return session;
  }

  function checkCalmSession(session, now) {
    const current = typeof now === 'number' ? now : Date.now();
    const started = session?.started || current;
    const duration = session?.targetDuration || CLASS_SESSION_MS;
    const elapsed = Math.max(0, current - started);
    const remaining = Math.max(0, duration - elapsed);
    return {
      complete: elapsed >= duration,
      elapsedMs: elapsed,
      remainingMs: remaining,
      itemsCount: Array.isArray(session?.items) ? session.items.length : 0,
      calm: true,
    };
  }

  function buildAG11Summary(session, opts) {
    const o = opts || {};
    const topic = o.topicName ? `היום תרגלנו: ${String(o.topicName).trim()} ♫` : 'היום תרגלנו: שיעור כיתתי ♫';
    const items = Array.isArray(session?.items) ? session.items : [];
    return {
      screen: 'AG11',
      title: AG11_TITLE,
      subtitle: AG11_SUBTITLE,
      doneLabel: AG11_DONE_LABEL,
      againLabel: AG11_AGAIN_LABEL,
      topicText: topic,
      itemsCount: items.length,
      calm: true,
    };
  }

  function renderAG11SessionEnd(opts) {
    const o = opts || {};
    const topic = o.topicName ? `היום תרגלנו: ${escapeHtml(o.topicName)} ♫` : 'היום תרגלנו: שיעור כיתתי ♫';
    const html = '<section class="mm-view" data-testid="view-session-end" data-screen="AG11">'
      + '<div class="mm-card" style="align-items:center;text-align:center">'
      + `<h2 data-testid="session-end-title">${escapeHtml(AG11_TITLE)}</h2>`
      + `<p class="mm-sub" data-testid="session-end-subtitle">${escapeHtml(AG11_SUBTITLE)}</p>`
      + '</div>'
      + `<div class="mm-card" data-testid="session-end-topic" style="text-align:center">${escapeHtml(topic)}</div>`
      + '<div class="mm-row-actions" style="display:flex;gap:12px;justify-content:center;margin-top:16px">'
      + `<button type="button" class="mm-btn secondary" id="classSessionDone" data-act="session-done" data-testid="session-done" style="min-height:48px;flex:1">${escapeHtml(AG11_DONE_LABEL)}</button>`
      + `<button type="button" class="mm-btn mm-btn--mint primary" id="classAgain" data-act="session-again" data-testid="session-again" style="min-height:48px;flex:1">${escapeHtml(AG11_AGAIN_LABEL)}</button>`
      + '</div>'
      + '</section>';
    for (const bad of AG11_FORBIDDEN) {
      if (html.includes(bad)) throw new Error(`forbidden copy: ${bad}`);
    }
    if (/\d+\s*%/.test(html)) throw new Error('forbidden score copy in AG11');
    return html;
  }

  return {
    PREFIX, WHO_KEY,
    normalizeCode, studentLabel, gradeLabel, studentGrade, setStudentGrade, storageKey, emptyRoster,
    loadRoster, saveRoster, listStudents, listClassStudents, upsertStudent, getStudent,
    assignTask, listAssignments, listStudentProgress, listClassStudentsProgress,
    startSession, addItem, endSession, buildReport, allItems,
    addNote, listNotes, itemsSince, buildClassOverview, getDashboardData,
    buildParentNote, renderParentNoteHtml, buildCertificate, renderCertificateHtml, escapeHtml,
    loadWho, saveWho, makeChoices, exportRoster, importRoster, summarizeImport,
    loadJson, saveJson, jsonKey,
    CLASS_SESSION_MS, CLASS_CODE_ALPHABET, CLASS_CODE_RE,
    cleanClassCode, formatClassCode, isValidClassCode, isAnonymousClassCode: isValidClassCode,
    sanitizeNickname, isAnonymousName, isValidAnonymousNickname: isAnonymousName,
    validateAnonymousLogin, isAnonymousLogin: (c, n) => validateAnonymousLogin(c, n).ok,
    startCalmSession, checkCalmSession,
    buildAG11Summary, renderAG11SessionEnd,
    AG11_TITLE, AG11_SUBTITLE, AG11_DONE_LABEL, AG11_AGAIN_LABEL, AG11_FORBIDDEN,
  };
});
