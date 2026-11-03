// MelodyMath — moving one student's progress from the student's device to the
// teacher's device, with no server, no account and no key (MM-7xx stream D).
//
// The student's device packs its own row of the local roster (teacherStore,
// key mm-roster-v1:<class code>) into a short text code, a QR code or a file.
// The teacher's device unpacks it and merges it into its own roster.
//
// What leaves the student's device (data minimisation, MM-502 F3):
//   class code, first name or nickname, grade letter, practice sessions
//   (topic, question, answer, what was typed, right/wrong, time) and the
//   status of tasks the teacher gave. Nothing else: no teacher notes, no
//   device id, no full name, no contact details.
//
// Merge rules on the teacher's device (repeat imports are safe):
//   - a session is identified by its id; a new id is added;
//   - inside a session an answer is identified by time + question + topic;
//     a new answer is added, the same answer from a newer code replaces the
//     older copy (newest wins per item), so importing the same code twice
//     changes nothing;
//   - a task keeps its id; "done" on the student's device marks it done here
//     (a later completion time wins); tasks are never removed by an import;
//   - a grade the teacher set here wins; an empty grade is filled in;
//   - the student row remembers the newest code time ("last sync").
(function (root, factory) {
  const store = (typeof module === 'object' && module.exports)
    ? require('../teacherStore')
    : root;
  const api = factory(store);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MMClassSync = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (store) {
  const KIND_PROGRESS = 'mm-progress';
  const KIND_TASKS = 'mm-tasks';
  const VERSION = 2;
  const CODE_PLAIN = 'MM2.';
  const CODE_ZIP = 'MM2z.';
  const MAX_SESSIONS = 120;
  const MAX_ITEMS = 80;

  function str(v, max) {
    return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function num(v) {
    const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
    return typeof n === 'number' && Number.isFinite(n) ? n : null;
  }

  function label(name) {
    return store.studentLabel ? store.studentLabel(name) : str(name, 24);
  }

  function code(value) {
    return store.normalizeCode ? store.normalizeCode(value) : str(value, 24);
  }

  function grade(value) {
    return store.gradeLabel ? store.gradeLabel(value) : '';
  }

  // First name or nickname only. A name that looks like contact details or
  // an ID number, or a full name of three words, is not sent.
  function checkName(name) {
    const n = label(name);
    if (!n) return { ok: false, name: '', reason: 'empty' };
    if (/@/.test(n)) return { ok: false, name: n, reason: 'email' };
    if ((n.match(/\d/g) || []).length >= 5) return { ok: false, name: n, reason: 'digits' };
    if (n.split(' ').length > 2) return { ok: false, name: n, reason: 'full-name' };
    return { ok: true, name: n, reason: '' };
  }

  const NAME_REASONS = {
    empty: 'צריך שם פרטי או כינוי.',
    email: 'זה נראה כמו כתובת מייל. כתבו רק שם פרטי או כינוי.',
    digits: 'יש כאן הרבה ספרות, כמו מספר זהות או טלפון. כתבו רק שם פרטי או כינוי.',
    'full-name': 'רק שם פרטי או כינוי, בלי שם משפחה (עד שתי מילים, למשל «נועה ב»).',
  };

  function nameProblem(name) {
    const c = checkName(name);
    return c.ok ? '' : NAME_REASONS[c.reason];
  }

  // ---------- one student row <-> compact package ----------

  function itemKey(it) {
    return String(it.at) + '|' + String(it.prompt) + '|' + String(it.skill);
  }

  function cleanItem(it) {
    if (!it || typeof it !== 'object') return null;
    const at = num(it.at);
    if (at == null) return null;
    return {
      skill: str(it.skill, 48),
      prompt: str(it.prompt, 120),
      answer: str(it.answer, 32),
      given: str(it.given, 16),
      correct: !!it.correct,
      at: at,
    };
  }

  function cleanSession(s) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) return null;
    const id = str(s.id, 40);
    if (!id) return null;
    const items = (Array.isArray(s.items) ? s.items : []).map(cleanItem).filter(Boolean).slice(-MAX_ITEMS);
    const started = num(s.started);
    const ended = num(s.ended);
    return {
      id: id,
      kind: str(s.kind, 32) || 'practice',
      started: started == null ? (items.length ? items[0].at : 0) : started,
      ended: ended == null || ended === 0 ? null : ended,
      items: items,
    };
  }

  function cleanTask(a) {
    if (!a || typeof a !== 'object') return null;
    const id = str(a.id, 40);
    const title = str(a.title, 120);
    if (!id || !title) return null;
    const completed = !!a.completed;
    const assignedAt = num(a.assignedAt);
    const completedAt = num(a.completedAt);
    return {
      id: id,
      title: title,
      skill: str(a.skill, 48),
      pack: str(a.pack, 24),
      assignedAt: assignedAt == null ? 0 : assignedAt,
      completed: completed,
      completedAt: completed && completedAt ? completedAt : null,
    };
  }

  // Builds the package from a student row (the shape teacherStore writes).
  function buildPackage(student, opts) {
    const o = opts || {};
    const name = checkName(student && student.name);
    if (!name.ok) return { ok: false, error: 'name', reason: name.reason, message: NAME_REASONS[name.reason] };
    const sessions = (Array.isArray(student.sessions) ? student.sessions : [])
      .map(cleanSession).filter(Boolean)
      .sort(function (a, b) { return a.started - b.started; })
      .slice(-MAX_SESSIONS);
    // Topic names repeat on every answer: list each once and point at it.
    const topics = [];
    const topicIx = Object.create(null);
    function topic(t) {
      if (!(t in topicIx)) { topicIx[t] = topics.length; topics.push(t); }
      return topicIx[t];
    }
    const s = sessions.map(function (x) {
      return [x.id, x.kind, x.started, x.ended || 0, x.items.map(function (it) {
        return [topic(it.skill), it.prompt, it.answer, it.given, it.correct ? 1 : 0, it.at - x.started];
      })];
    });
    const a = (Array.isArray(student.assignments) ? student.assignments : []).map(cleanTask).filter(Boolean)
      .map(function (t) {
        return [t.id, t.title, t.skill, t.pack, t.assignedAt, t.completed ? 1 : 0, t.completedAt || 0];
      });
    const pkg = {
      t: KIND_PROGRESS,
      v: VERSION,
      c: code(o.classCode || ''),
      n: name.name,
      g: grade(student.grade),
      x: num(o.now) || Date.now(),
      k: topics,
      s: s,
      a: a,
    };
    return { ok: true, pkg: pkg };
  }

  function packageFromStorage(classCode, name, storage, now) {
    const student = store.getStudent ? store.getStudent(classCode, name, storage) : null;
    const row = student || { name: name, sessions: [], assignments: [] };
    return buildPackage(row, { classCode: classCode, now: now });
  }

  // Package -> student row (same shape teacherStore writes), validated.
  function expandPackage(pkg) {
    if (!pkg || typeof pkg !== 'object' || pkg.t !== KIND_PROGRESS) return null;
    const name = checkName(pkg.n);
    if (!name.ok) return null;
    const topics = Array.isArray(pkg.k) ? pkg.k.map(function (t) { return str(t, 48); }) : [];
    const sessions = (Array.isArray(pkg.s) ? pkg.s : []).map(function (row) {
      if (!Array.isArray(row)) return null;
      const started = num(row[2]) || 0;
      return cleanSession({
        id: row[0],
        kind: row[1],
        started: started,
        ended: row[3],
        items: (Array.isArray(row[4]) ? row[4] : []).map(function (it) {
          if (!Array.isArray(it)) return null;
          const dt = num(it[5]);
          return {
            skill: topics[it[0]] != null ? topics[it[0]] : '',
            prompt: it[1],
            answer: it[2],
            given: it[3],
            correct: it[4] === 1 || it[4] === true,
            at: dt == null ? null : started + dt,
          };
        }),
      });
    }).filter(Boolean);
    return {
      name: name.name,
      grade: grade(pkg.g),
      sessions: sessions,
      assignments: expandTasks(pkg.a),
    };
  }

  function expandTasks(list) {
    return (Array.isArray(list) ? list : []).map(function (row) {
      if (!Array.isArray(row)) return cleanTask(row);
      return cleanTask({
        id: row[0], title: row[1], skill: row[2], pack: row[3],
        assignedAt: row[4], completed: row[5] === 1 || row[5] === true, completedAt: row[6],
      });
    }).filter(Boolean);
  }

  // Teacher -> student: only that student's tasks, nothing about classmates.
  function buildTasksPackage(classCode, name, tasks, now) {
    const n = checkName(name);
    if (!n.ok) return { ok: false, error: 'name', reason: n.reason, message: NAME_REASONS[n.reason] };
    const a = (Array.isArray(tasks) ? tasks : []).map(cleanTask).filter(Boolean).map(function (t) {
      return [t.id, t.title, t.skill, t.pack, t.assignedAt, t.completed ? 1 : 0, t.completedAt || 0];
    });
    return { ok: true, pkg: { t: KIND_TASKS, v: VERSION, c: code(classCode), n: n.name, x: num(now) || Date.now(), a: a } };
  }

  // ---------- text codes ----------

  function bytesToB64url(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function b64urlToBytes(text) {
    const clean = String(text).replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
    if (!/^[A-Za-z0-9+/]*$/.test(clean)) throw new Error('not-base64');
    const bin = atob(clean + '==='.slice((clean.length + 3) % 4));
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function canZip() {
    return typeof CompressionStream === 'function' && typeof DecompressionStream === 'function'
      && typeof Response === 'function' && typeof Blob === 'function';
  }

  async function pipe(bytes, stream) {
    const out = new Blob([bytes]).stream().pipeThrough(stream);
    return new Uint8Array(await new Response(out).arrayBuffer());
  }

  function encodePlain(pkg) {
    return CODE_PLAIN + bytesToB64url(new TextEncoder().encode(JSON.stringify(pkg)));
  }

  // The short code: deflate when the browser can, plain otherwise.
  async function encode(pkg) {
    const plain = encodePlain(pkg);
    if (!canZip()) return plain;
    try {
      const zipped = await pipe(new TextEncoder().encode(JSON.stringify(pkg)), new CompressionStream('deflate-raw'));
      const z = CODE_ZIP + bytesToB64url(zipped);
      return z.length < plain.length ? z : plain;
    } catch (e) {
      return plain;
    }
  }

  // Pulls the code out of whatever was pasted: the code itself, a link with
  // #mm=<code>, or a message that has the code somewhere in it.
  function findCode(raw) {
    const text = String(raw == null ? '' : raw);
    const m = text.match(/MM2z?\.[A-Za-z0-9_-]+/);
    return m ? m[0] : '';
  }

  function parseJson(text) {
    try {
      const data = JSON.parse(text);
      return data && typeof data === 'object' ? data : null;
    } catch (e) {
      return null;
    }
  }

  // Legacy shapes the app already writes: the roster file (exportRoster) and
  // the old QR/#import= student payload (qrSync.packStudent).
  function classify(data) {
    if (!data || typeof data !== 'object') return { ok: false, error: 'shape' };
    if (data.t === KIND_PROGRESS) {
      const row = expandPackage(data);
      return row ? { ok: true, kind: 'progress', pkg: data, rows: [row], classCode: code(data.c), at: num(data.x) }
        : { ok: false, error: 'shape' };
    }
    if (data.t === KIND_TASKS) {
      const n = checkName(data.n);
      return n.ok ? { ok: true, kind: 'tasks', pkg: data, classCode: code(data.c), name: n.name, tasks: expandTasks(data.a), at: num(data.x) }
        : { ok: false, error: 'shape' };
    }
    if (data.type === 'student' && data.student && typeof data.student === 'object') {
      return fromLegacyRows(data.classCode, [data.student], num(data.exported));
    }
    if (data.students && typeof data.students === 'object' && !Array.isArray(data.students)) {
      const rows = Object.keys(data.students).map(function (k) {
        const r = data.students[k];
        return r && typeof r === 'object' && !Array.isArray(r) ? Object.assign({}, r, { name: r.name || k }) : null;
      }).filter(Boolean);
      return fromLegacyRows(data.classCode, rows, num(data.exported));
    }
    return { ok: false, error: 'shape' };
  }

  function fromLegacyRows(classCode, rows, at) {
    const clean = rows.map(function (r) {
      const n = label(r.name);
      if (!n) return null;
      return {
        name: n,
        grade: grade(r.grade),
        sessions: (Array.isArray(r.sessions) ? r.sessions : []).map(cleanSession).filter(Boolean),
        assignments: (Array.isArray(r.assignments) ? r.assignments : []).map(cleanTask).filter(Boolean),
      };
    }).filter(Boolean);
    if (!clean.length) return { ok: false, error: 'empty' };
    return { ok: true, kind: 'legacy', rows: clean, classCode: code(classCode === 'default' ? '' : classCode), at: at };
  }

  // Synchronous decode for everything except deflated codes.
  function decodeSync(raw) {
    const text = String(raw == null ? '' : raw).trim();
    if (!text) return { ok: false, error: 'empty' };
    const c = findCode(text);
    if (c && c.indexOf(CODE_PLAIN) === 0) {
      try {
        return classify(parseJson(new TextDecoder().decode(b64urlToBytes(c.slice(CODE_PLAIN.length)))));
      } catch (e) {
        return { ok: false, error: 'invalid' };
      }
    }
    if (c && c.indexOf(CODE_ZIP) === 0) return { ok: false, error: 'zipped' };
    if (text.charAt(0) === '{') {
      const data = parseJson(text);
      return data ? classify(data) : { ok: false, error: 'invalid' };
    }
    const legacy = text.indexOf('#import=') >= 0 ? text.split('#import=')[1] : '';
    if (legacy) {
      try {
        return classify(parseJson(new TextDecoder().decode(b64urlToBytes(legacy.split('&')[0]))));
      } catch (e) {
        return { ok: false, error: 'invalid' };
      }
    }
    return { ok: false, error: 'invalid' };
  }

  async function decode(raw) {
    const c = findCode(raw);
    if (c && c.indexOf(CODE_ZIP) === 0) {
      if (!canZip()) return { ok: false, error: 'zipped' };
      try {
        const bytes = await pipe(b64urlToBytes(c.slice(CODE_ZIP.length)), new DecompressionStream('deflate-raw'));
        return classify(parseJson(new TextDecoder().decode(bytes)));
      } catch (e) {
        return { ok: false, error: 'invalid' };
      }
    }
    return decodeSync(raw);
  }

  // ---------- merge ----------

  function sameItem(a, b) {
    return a.given === b.given && a.correct === b.correct && a.answer === b.answer;
  }

  // Merges `incoming` (a clean student row) into `target` (a roster row) in
  // place. `at` is the time the incoming data was exported.
  function mergeStudent(target, incoming, at) {
    const res = { sessions: 0, items: 0, updated: 0, tasks: 0, tasksDone: 0 };
    if (!Array.isArray(target.sessions)) target.sessions = [];
    if (!Array.isArray(target.assignments)) target.assignments = [];
    const lastAt = target.sync && num(target.sync.exportedAt) || 0;
    const newer = at == null || at >= lastAt;
    if (!grade(target.grade) && grade(incoming.grade)) target.grade = grade(incoming.grade);

    const byId = Object.create(null);
    target.sessions.forEach(function (s) { if (s && s.id != null) byId[String(s.id)] = s; });
    (incoming.sessions || []).forEach(function (s) {
      const have = byId[s.id];
      if (!have) {
        const copy = { id: s.id, kind: s.kind, started: s.started, ended: s.ended, items: s.items.map(function (it) { return Object.assign({}, it); }) };
        target.sessions.push(copy);
        byId[s.id] = copy;
        res.sessions += 1;
        res.items += copy.items.length;
        return;
      }
      if (!Array.isArray(have.items)) have.items = [];
      const keys = Object.create(null);
      have.items.forEach(function (it, i) { if (it && typeof it === 'object') keys[itemKey(it)] = i; });
      let added = false;
      s.items.forEach(function (it) {
        const k = itemKey(it);
        if (!(k in keys)) {
          keys[k] = have.items.length;
          have.items.push(Object.assign({}, it));
          res.items += 1;
          added = true;
          return;
        }
        const old = have.items[keys[k]];
        if (newer && !sameItem(old, it)) {
          have.items[keys[k]] = Object.assign({}, old, it);
          res.updated += 1;
        }
      });
      if (added) have.items.sort(function (x, y) { return (num(x && x.at) || 0) - (num(y && y.at) || 0); });
      if (s.ended && (!have.ended || s.ended > have.ended)) {
        have.ended = s.ended;
        res.updated += 1;
      }
    });

    const tasks = Object.create(null);
    target.assignments.forEach(function (a) { if (a && a.id != null) tasks[String(a.id)] = a; });
    (incoming.assignments || []).forEach(function (a) {
      const have = tasks[a.id];
      if (!have) {
        const copy = Object.assign({}, a);
        target.assignments.push(copy);
        tasks[a.id] = copy;
        res.tasks += 1;
        return;
      }
      const doneLater = a.completed && (!have.completed || (num(a.completedAt) || 0) > (num(have.completedAt) || 0));
      if (doneLater) {
        have.completed = true;
        have.completedAt = a.completedAt || null;
        res.tasksDone += 1;
      }
    });
    return res;
  }

  function changed(r) {
    return r.sessions + r.items + r.updated + r.tasks + r.tasksDone > 0;
  }

  // Applies a decoded result (from decode/decodeSync) to the roster on this
  // device. `classCode` is the class open on the board; a code from a student
  // carries its own class code, which wins (the student belongs to it).
  function applyDecoded(decoded, storage, opts) {
    const o = opts || {};
    if (!decoded || !decoded.ok) return { ok: false, error: decoded ? decoded.error : 'empty' };
    if (decoded.kind === 'tasks') return applyTasks(decoded, storage, o);
    const classCode = decoded.classCode || code(o.classCode) || '';
    const now = num(o.now) || Date.now();
    const roster = store.loadRoster(classCode, storage);
    const total = { ok: true, kind: decoded.kind, classCode: classCode, names: [], added: 0, sessions: 0, items: 0, updated: 0, tasks: 0, tasksDone: 0, stale: false, unchanged: true };
    decoded.rows.forEach(function (row) {
      const name = label(row.name);
      if (!name) return;
      let target = Object.prototype.hasOwnProperty.call(roster.students, name) ? roster.students[name] : null;
      if (!target) {
        target = { name: name, created: now, sessions: [], assignments: [] };
        roster.students[name] = target;
        total.added += 1;
      }
      const r = mergeStudent(target, row, decoded.at);
      const prev = target.sync && num(target.sync.exportedAt) || 0;
      if (decoded.at != null && decoded.at < prev) total.stale = true;
      const advance = decoded.at != null && decoded.at > prev;
      if (changed(r) || advance || !target.sync) {
        target.sync = {
          exportedAt: Math.max(prev, decoded.at || 0) || null,
          importedAt: now,
          via: str(o.via, 8) || 'code',
        };
      }
      ['sessions', 'items', 'updated', 'tasks', 'tasksDone'].forEach(function (k) { total[k] += r[k]; });
      if (changed(r)) total.unchanged = false;
      total.names.push(name);
    });
    if (total.added) total.unchanged = false;
    if (!store.saveRoster(classCode, roster, storage)) return { ok: false, error: 'storage' };
    return total;
  }

  // Student device: tasks from the teacher land on the student's own row.
  function applyTasks(decoded, storage, opts) {
    const o = opts || {};
    const classCode = decoded.classCode || code(o.classCode);
    const roster = store.loadRoster(classCode, storage);
    let target = Object.prototype.hasOwnProperty.call(roster.students, decoded.name) ? roster.students[decoded.name] : null;
    let added = 0;
    if (!target) {
      target = { name: decoded.name, created: num(o.now) || Date.now(), sessions: [], assignments: [] };
      roster.students[decoded.name] = target;
      added = 1;
    }
    const r = mergeStudent(target, { sessions: [], assignments: decoded.tasks }, null);
    if (!store.saveRoster(classCode, roster, storage)) return { ok: false, error: 'storage' };
    return { ok: true, kind: 'tasks', classCode: classCode, names: [decoded.name], added: added, tasks: r.tasks, tasksDone: r.tasksDone, unchanged: !r.tasks && !r.tasksDone && !added };
  }

  // Teacher device: a new task on one student's row. Ids are unique per
  // device and time so the same task can travel both ways without doubling.
  function addTask(classCode, name, spec, storage, now) {
    const n = label(name);
    const s = spec || {};
    const at = num(now) || Date.now();
    const task = cleanTask({
      id: 't' + at.toString(36) + Math.floor(Math.random() * 1296).toString(36),
      title: s.title,
      skill: s.skill,
      assignedAt: at,
      completed: false,
    });
    if (!n || !task) return null;
    const roster = store.loadRoster(classCode, storage);
    const target = Object.prototype.hasOwnProperty.call(roster.students, n) ? roster.students[n] : null;
    if (!target) return null;
    if (!Array.isArray(target.assignments)) target.assignments = [];
    target.assignments.push(task);
    return store.saveRoster(classCode, roster, storage) ? task : null;
  }

  // Student device: "I did it".
  function completeTask(classCode, name, id, storage, now) {
    const roster = store.loadRoster(classCode, storage);
    const n = label(name);
    const target = Object.prototype.hasOwnProperty.call(roster.students, n) ? roster.students[n] : null;
    const task = target && Array.isArray(target.assignments)
      ? target.assignments.find(function (a) { return a && String(a.id) === String(id); }) : null;
    if (!task) return null;
    if (!task.completed) {
      task.completed = true;
      task.completedAt = num(now) || Date.now();
      store.saveRoster(classCode, roster, storage);
    }
    return task;
  }

  const ERRORS = {
    empty: 'לא הודבק קוד. הדביקו את הקוד שקיבלתם מהתלמיד/ה, או בחרו קובץ.',
    invalid: 'הקוד לא תקין. בדקו שהעתקתם את כולו (הוא מתחיל ב־MM2).',
    shape: 'זה לא קוד התקדמות של MelodyMath.',
    zipped: 'הדפדפן הזה לא יכול לפתוח קוד מכווץ. פתחו את דף הכיתה בדפדפן עדכני.',
    storage: 'לא הצלחנו לשמור במכשיר הזה (אולי הזיכרון מלא או גלישה פרטית).',
    name: 'בקוד אין שם פרטי או כינוי תקין.',
  };

  function plural(n, one, many) {
    return n === 1 ? one : n + ' ' + many;
  }

  // One Hebrew line for the teacher after an import.
  function summarize(res) {
    if (!res || !res.ok) return ERRORS[res && res.error] || ERRORS.invalid;
    const who = res.names && res.names.length === 1 ? res.names[0] : plural((res.names || []).length, 'תלמיד/ה אחד/ת', 'תלמידים');
    if (res.kind === 'tasks') {
      if (res.unchanged) return 'המשימות של ' + who + ' כבר היו במכשיר. לא השתנה דבר.';
      return 'התקבלו ' + plural(res.tasks, 'משימה חדשה אחת', 'משימות חדשות') + ' עבור ' + who + '.';
    }
    if (res.unchanged && res.stale) return 'הקוד של ' + who + ' ישן יותר מקוד שכבר נקלט. לא השתנה דבר.';
    if (res.unchanged) return 'הקוד של ' + who + ' כבר נקלט קודם. לא השתנה דבר.';
    const parts = [];
    if (res.added) parts.push(plural(res.added, 'תלמיד/ה חדש/ה', 'תלמידים חדשים'));
    if (res.items) parts.push(plural(res.items, 'תשובה חדשה אחת', 'תשובות חדשות'));
    if (res.updated) parts.push(plural(res.updated, 'עדכון אחד', 'עדכונים'));
    if (res.tasksDone) parts.push(plural(res.tasksDone, 'משימה שהושלמה', 'משימות שהושלמו'));
    if (res.tasks) parts.push(plural(res.tasks, 'משימה אחת', 'משימות'));
    let text = 'נקלט: ' + who + (res.classCode ? ' (כיתה ' + res.classCode + ')' : '') + (parts.length ? '. ' + parts.join(', ') + '.' : '.');
    if (res.stale) text += ' הקוד הזה ישן יותר מקוד שכבר נקלט, לכן נוסף רק מה שלא היה.';
    return text;
  }

  return {
    KIND_PROGRESS: KIND_PROGRESS,
    KIND_TASKS: KIND_TASKS,
    VERSION: VERSION,
    checkName: checkName,
    nameProblem: nameProblem,
    buildPackage: buildPackage,
    packageFromStorage: packageFromStorage,
    expandPackage: expandPackage,
    buildTasksPackage: buildTasksPackage,
    encodePlain: encodePlain,
    encode: encode,
    findCode: findCode,
    decodeSync: decodeSync,
    decode: decode,
    classify: classify,
    mergeStudent: mergeStudent,
    applyDecoded: applyDecoded,
    addTask: addTask,
    completeTask: completeTask,
    summarize: summarize,
    canZip: canZip,
  };
});
