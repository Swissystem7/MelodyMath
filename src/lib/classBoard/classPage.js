// MelodyMath — class.html controller (MM-7xx stream D). Browser only.
//
// Identity: stream A's window.MMAccount.current() -> { id, name, role,
// classCode } | null, with MMAccount.onChange(fn). Until that exists (or when
// it returns null) the page uses the class code and name the app already
// keeps (teacherStore.loadWho, key mm-who-v1). Neither is ever required.
(function () {
  'use strict';
  const doc = document;
  const $ = function (id) { return doc.getElementById(id); };
  const S = window.MMClassSync;
  const M = window.MMBoardModel;
  const GATE_KEY = 'mm-class-gate-v1';
  const ls = (function () { try { return window.localStorage; } catch (e) { return null; } })();
  const state = { classCode: '', view: 'students', gateQ: null, pending: '', taskFor: '', tasksCodeFor: '' };

  function esc(s) { return escapeHtml(s); }
  function gradeText(g) { return g ? 'כיתה ' + g + '׳' : 'כיתה לא ידועה'; }

  function setStatus(el, text, kind) {
    if (!el) return;
    el.textContent = text || '';
    el.className = 'status' + (kind ? ' ' + kind : '');
  }

  // ---------- identity ----------
  function account() {
    try {
      const A = window.MMAccount;
      if (A && typeof A.current === 'function') {
        const a = A.current();
        if (a && typeof a === 'object') return a;
      }
    } catch (e) { /* stream A not loaded, or it threw */ }
    return null;
  }

  function me() {
    const a = account();
    if (a && a.name) {
      return { name: studentLabel(a.name), classCode: normalizeCode(a.classCode), role: String(a.role || ''), fromAccount: true };
    }
    const w = loadWho(ls);
    return { name: w.name, classCode: w.classCode, role: '', fromAccount: false };
  }

  // ---------- tabs ----------
  function showPane(which) {
    const teacher = which === 'teacher';
    $('teacherPane').classList.toggle('hidden', !teacher);
    $('studentPane').classList.toggle('hidden', teacher);
    $('tabTeacher').setAttribute('aria-selected', teacher ? 'true' : 'false');
    $('tabStudent').setAttribute('aria-selected', teacher ? 'false' : 'true');
    if (teacher) renderTeacher(); else renderStudent();
  }

  function showView(view) {
    state.view = view;
    const st = view === 'students';
    $('viewStudents').classList.toggle('hidden', !st);
    $('viewTopics').classList.toggle('hidden', st);
    $('viewStudentsBtn').setAttribute('aria-selected', st ? 'true' : 'false');
    $('viewTopicsBtn').setAttribute('aria-selected', st ? 'false' : 'true');
  }

  // ---------- adult gate ----------
  function gateOpen() {
    try { return sessionStorage.getItem(GATE_KEY) === '1'; } catch (e) { return false; }
  }

  function askGate() {
    state.gateQ = adultQuestion();
    $('gateQ').textContent = state.gateQ.text;
    $('gateAnswer').value = '';
  }

  function unlock() {
    if (!adultAnswerOk(state.gateQ, $('gateAnswer').value)) {
      setStatus($('gateMsg'), 'זו לא התשובה. הנה שאלה חדשה.', 'err');
      askGate();
      return;
    }
    try { sessionStorage.setItem(GATE_KEY, '1'); } catch (e) { /* still open for this view */ }
    state.unlocked = true;
    setStatus($('gateMsg'), '');
    renderTeacher();
    if (state.pending) importText(state.pending, 'qr');
  }

  // ---------- teacher board ----------
  function pickInitialClass() {
    const a = account();
    const w = loadWho(ls);
    const listed = M.listClasses(ls);
    if (a && a.classCode) return normalizeCode(a.classCode);
    if (w.classCode && listed.indexOf(w.classCode) >= 0) return w.classCode;
    return listed[0] || w.classCode || '';
  }

  function renderClassPick() {
    const sel = $('classPick');
    const list = M.listClasses(ls);
    const cur = normalizeCode(state.classCode) || 'default';
    if (list.indexOf(cur) < 0) list.push(cur);
    sel.innerHTML = list.map(function (c) {
      return '<option value="' + esc(c) + '"' + (c === cur ? ' selected' : '') + '>' + esc(c === 'default' ? 'ללא קוד כיתה' : c) + '</option>';
    }).join('');
  }

  function studentCard(r, now) {
    const stale = M.syncStale(r, now);
    const gaps = r.tries
      ? (r.gaps.length
        ? '<ul class="gaps" data-gaps>' + r.gaps.map(function (t) {
          return '<li><span class="pill">' + esc(t.topic) + '</span> ' + esc(M.gapReason(t)) + '</li>';
        }).join('') + '</ul>'
        : '<p data-gaps><span class="pill good">אין פערים לפי הכלל</span></p>')
      : '<p class="note" data-gaps>עוד אין תרגולים. בקשו מהתלמיד/ה לתרגל ולשלוח קוד.</p>';
    const tasks = r.tasks.length
      ? '<ul class="gaps">' + r.tasks.map(function (t) {
        return '<li class="task' + (t.completed ? ' done' : '') + '"><span>' + esc(t.title) + '</span><b>' + (t.completed ? 'בוצע ✓' : 'פתוחה') + '</b></li>';
      }).join('') + '</ul>'
      : '';
    return '<article class="kid" data-student="' + esc(r.name) + '">'
      + '<div class="kid-head"><h3>' + esc(r.name) + '</h3><span class="kid-meta">' + esc(gradeText(r.grade))
      + (r.tries ? ' · ' + r.tries + ' תשובות · ' + M.pct(r.accuracy) + ' נכונות' : '') + '</span></div>'
      + '<div class="sync' + (stale ? ' stale' : '') + '" data-sync>סנכרון אחרון: ' + esc(M.syncText(r, now))
      + (stale ? ' · כדאי לבקש קוד חדש' : '') + '</div>'
      + '<div><b>פערים</b>' + gaps + '</div>'
      + '<div><b>משימות</b> ' + (r.tasks.length ? r.tasksDone + ' מתוך ' + r.tasks.length + ' בוצעו' : '<span class="note">אין עדיין</span>') + tasks + '</div>'
      + '<div class="row no-print"><button type="button" class="secondary" data-act="task" data-name="' + esc(r.name) + '">משימה חדשה</button>'
      + (r.tasks.length ? '<button type="button" class="ghost" data-act="tasks-code" data-name="' + esc(r.name) + '">קוד משימות לתלמיד/ה</button>' : '')
      + '</div></article>';
  }

  function renderTeacher() {
    const open = state.unlocked || gateOpen();
    $('gate').classList.toggle('hidden', open);
    $('board').classList.toggle('hidden', !open);
    if (!open) { if (!state.gateQ) askGate(); return; }
    renderClassPick();
    const roster = loadRoster(state.classCode, ls);
    const rows = M.studentRows(roster);
    const now = Date.now();
    const empty = !rows.length;
    $('empty').classList.toggle('hidden', !empty);
    $('emptyClass').textContent = normalizeCode(state.classCode) || '';
    $('students').innerHTML = rows.map(function (r) { return studentCard(r, now); }).join('');
    const topics = M.topicRows(rows);
    $('topics').querySelector('tbody').innerHTML = topics.length
      ? topics.map(function (t) {
        return '<tr data-topic="' + esc(t.topic) + '"><th scope="row">' + esc(t.topic) + '</th><td>' + t.students + '</td><td>'
          + M.pct(t.accuracy) + ' <span class="note">(' + t.right + '/' + t.tries + ')</span></td><td>'
          + (t.gapNames.length ? t.gapNames.map(function (n) { return '<span class="pill">' + esc(n) + '</span>'; }).join('') : '<span class="note">אין</span>')
          + '</td></tr>';
      }).join('')
      : '<tr><td colspan="4">עוד אין תרגולים בכיתה הזאת. קלטו קוד מתלמיד/ה בתיבה למעלה.</td></tr>';
    $('gapRule').textContent = M.GAP_RULE;
  }

  async function importText(text, via) {
    const msg = $('importMsg');
    setStatus(msg, 'קולט…');
    const decoded = await S.decode(text);
    if (decoded.ok && decoded.kind === 'tasks') {
      setStatus(msg, 'זה קוד משימות לתלמיד/ה, לא קוד התקדמות. פתחו אותו בלשונית «אני תלמיד/ה» במכשיר של התלמיד/ה.', 'err');
      return null;
    }
    const res = S.applyDecoded(decoded, ls, { classCode: state.classCode, via: via || 'code' });
    setStatus(msg, S.summarize(res), res.ok ? 'ok' : 'err');
    if (res.ok) {
      state.classCode = res.classCode || state.classCode;
      state.pending = '';
      $('importText').value = '';
      renderTeacher();
    }
    return res;
  }

  function openTaskDialog(name) {
    state.taskFor = name;
    $('taskFor').textContent = name;
    $('taskText').value = '';
    const roster = loadRoster(state.classCode, ls);
    const row = M.studentRow(name, roster.students[name]);
    const topics = M.topicRows(M.studentRows(roster)).map(function (t) { return t.topic; });
    const gapTopics = row.gaps.map(function (t) { return t.topic; });
    const all = gapTopics.concat(topics.filter(function (t) { return gapTopics.indexOf(t) < 0; }));
    $('taskTopic').innerHTML = '<option value="">בלי נושא</option>' + all.map(function (t) {
      return '<option value="' + esc(t) + '">' + esc(t) + (gapTopics.indexOf(t) >= 0 ? ' (פער)' : '') + '</option>';
    }).join('');
    if (gapTopics.length) $('taskTopic').value = gapTopics[0];
    $('taskShare').classList.add('hidden');
    $('taskSave').classList.remove('hidden');
    setStatus($('taskMsg'), '');
    $('taskDialog').classList.remove('hidden');
    $('taskDialog').scrollIntoView({ block: 'nearest' });
    $('taskText').focus();
  }

  function closeTaskDialog() {
    $('taskDialog').classList.add('hidden');
    state.taskFor = '';
  }

  async function showTasksCode(name) {
    const tasks = (loadRoster(state.classCode, ls).students[name] || {}).assignments || [];
    const out = S.buildTasksPackage(state.classCode, name, tasks);
    if (!state.taskFor) {
      state.taskFor = name;
      $('taskFor').textContent = name;
      $('taskDialog').classList.remove('hidden');
    }
    if (!out.ok) { setStatus($('taskMsg'), out.message, 'err'); return; }
    const code = await S.encode(out.pkg);
    $('taskCode').value = code;
    $('taskSave').classList.add('hidden');
    $('taskShare').classList.remove('hidden');
    drawQr($('taskQr'), code, null);
    $('taskDialog').scrollIntoView({ block: 'nearest' });
  }

  function saveTask() {
    const title = $('taskText').value.trim();
    if (!title) { setStatus($('taskMsg'), 'כתבו מה לתרגל.', 'err'); $('taskText').focus(); return; }
    const t = S.addTask(state.classCode, state.taskFor, { title: title, skill: $('taskTopic').value }, ls);
    if (!t) { setStatus($('taskMsg'), 'לא הצלחנו לשמור את המשימה במכשיר הזה.', 'err'); return; }
    setStatus($('taskMsg'), 'המשימה נשמרה.', 'ok');
    renderTeacher();
    showTasksCode(state.taskFor);
  }

  // ---------- QR ----------
  function pageUrl(code) {
    const base = String(location.href).split('#')[0].replace(/[^/]*$/, '');
    return base + 'class.html#mm=' + code;
  }

  function drawQr(box, code, noteEl) {
    if (!box) return;
    const url = pageUrl(code);
    const fits = typeof qrFits === 'function' ? qrFits(url) : url.length < 100;
    if (fits && typeof generateQrSvg === 'function') {
      box.innerHTML = generateQrSvg(url, { margin: 4 });
      if (noteEl) noteEl.textContent = 'אפשר גם לסרוק את הקוד במצלמה של מכשיר המורה. הוא פותח את לוח הכיתה עם הקוד.';
    } else {
      box.innerHTML = '';
      if (noteEl) noteEl.textContent = 'הקוד ארוך מדי ל־QR. שלחו אותו בהעתקה או כקובץ.';
    }
  }

  // ---------- student ----------
  function renderStudent() {
    const who = me();
    const known = !!who.name;
    $('meKnown').classList.toggle('hidden', !known);
    $('meForm').classList.toggle('hidden', known);
    $('meChange').classList.toggle('hidden', who.fromAccount);
    if (known) {
      $('meName').textContent = who.name;
      $('meClass').textContent = who.classCode || 'ללא קוד';
    } else {
      $('meClassInput').value = who.classCode || '';
    }
    const student = known ? getStudent(who.classCode, who.name, ls) : null;
    const items = M.itemsOf(student);
    const sessions = student && Array.isArray(student.sessions) ? student.sessions.length : 0;
    $('meSummary').textContent = !known
      ? 'כתבו קוד כיתה ושם פרטי או כינוי, כמו בתרגול.'
      : (items.length ? 'במכשיר הזה: ' + items.length + ' תשובות ב־' + sessions + ' מפגשים.' : 'במכשיר הזה עוד אין תרגולים בשם הזה. אפשר לשלוח בכל זאת, והמורה יראה/תראה שנרשמת.');
    $('makeCode').disabled = !known;
    const tasks = student && Array.isArray(student.assignments) ? student.assignments.filter(function (t) { return t && t.title; }) : [];
    $('myTasks').innerHTML = tasks.length ? tasks.map(function (t) {
      return '<li class="task' + (t.completed ? ' done' : '') + '"><span>' + esc(t.title) + (t.skill ? ' · ' + esc(t.skill) : '') + '</span>'
        + (t.completed ? '<b>בוצע ✓</b>' : '<button type="button" class="secondary" data-done="' + esc(t.id) + '">סיימתי</button>') + '</li>';
    }).join('') : '<li class="note">אין משימות כרגע. כשהמורה תשלח/ישלח קוד משימות, הדביקו אותו למטה.</li>';
  }

  function saveMe() {
    const classCode = normalizeCode($('meClassInput').value);
    const problem = S.nameProblem($('meNameInput').value);
    if (problem) { setStatus($('meMsg'), problem, 'err'); return; }
    const name = studentLabel($('meNameInput').value);
    saveWho({ classCode: classCode, name: name }, ls);
    upsertStudent(classCode, name, ls);
    setStatus($('meMsg'), 'נשמר במכשיר הזה.', 'ok');
    renderStudent();
  }

  async function makeCode() {
    const who = me();
    const problem = S.nameProblem(who.name);
    if (problem) { setStatus($('meMsg'), problem, 'err'); return; }
    const out = S.packageFromStorage(who.classCode, who.name, ls);
    if (!out.ok) { setStatus($('meMsg'), out.message, 'err'); return; }
    state.lastPkg = out.pkg;
    const code = await S.encode(out.pkg);
    $('codeOut').value = code;
    $('codeBox').classList.remove('hidden');
    drawQr($('codeQr'), code, $('codeQrNote'));
    setStatus($('meMsg'), 'הקוד מוכן. שלחו אותו למורה: העתקה, קובץ או QR.', 'ok');
  }

  function copy(text, el) {
    const done = function () { setStatus(el, 'הועתק.', 'ok'); };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () { setStatus(el, 'סמנו את הקוד והעתיקו ידנית.', 'err'); });
        return;
      }
    } catch (e) { /* fall through */ }
    setStatus(el, 'סמנו את הקוד והעתיקו ידנית.', 'err');
  }

  function downloadFile() {
    if (!state.lastPkg) return;
    const blob = new Blob([JSON.stringify(state.lastPkg)], { type: 'application/json' });
    const a = doc.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'melodymath-progress-' + (state.lastPkg.c || 'class').replace(/[^\w֐-׿-]+/g, '_') + '.json';
    doc.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    setStatus($('meMsg'), 'הקובץ נשמר. שלחו אותו למורה.', 'ok');
  }

  async function receiveTasks(text) {
    const decoded = await S.decode(text);
    if (decoded.ok && decoded.kind !== 'tasks') {
      setStatus($('tasksMsg'), 'זה קוד התקדמות, לא קוד משימות. המורה קולט/ת אותו בלשונית «אני מורה».', 'err');
      return;
    }
    const res = S.applyDecoded(decoded, ls, { classCode: me().classCode });
    setStatus($('tasksMsg'), S.summarize(res), res.ok ? 'ok' : 'err');
    if (res.ok) {
      const who = me();
      if (!who.name && !who.fromAccount) saveWho({ classCode: res.classCode, name: res.names[0] }, ls);
      $('tasksIn').value = '';
      renderStudent();
    }
  }

  // ---------- wiring ----------
  function wire() {
    $('tabTeacher').onclick = function () { showPane('teacher'); };
    $('tabStudent').onclick = function () { showPane('student'); };
    $('viewStudentsBtn').onclick = function () { showView('students'); };
    $('viewTopicsBtn').onclick = function () { showView('topics'); };
    $('gateOk').onclick = unlock;
    $('gateAnswer').onkeydown = function (e) { if (e.key === 'Enter') unlock(); };
    $('classPick').onchange = function () { state.classCode = this.value === 'default' ? '' : this.value; closeTaskDialog(); renderTeacher(); };
    $('newClassBtn').onclick = function () {
      const c = normalizeCode($('newClass').value);
      if (!c) { $('newClass').focus(); return; }
      state.classCode = c;
      if (!loadRoster(c, ls).students || !ls.getItem(storageKey(c))) saveRoster(c, emptyRoster(c), ls);
      $('newClass').value = '';
      renderTeacher();
    };
    $('importBtn').onclick = function () { importText($('importText').value, 'code'); };
    $('importFile').onchange = function () {
      const f = this.files && this.files[0];
      this.value = '';
      if (!f) return;
      const reader = new FileReader();
      reader.onload = function () { importText(String(reader.result || ''), 'file'); };
      reader.readAsText(f);
    };
    $('addBtn').onclick = function () {
      const problem = S.nameProblem($('addName').value);
      if (problem) { setStatus($('addMsg'), problem, 'err'); return; }
      upsertStudent(state.classCode, $('addName').value, ls);
      $('addName').value = '';
      renderTeacher();
    };
    $('students').onclick = function (e) {
      const b = e.target.closest('button[data-act]');
      if (!b) return;
      if (b.getAttribute('data-act') === 'task') openTaskDialog(b.getAttribute('data-name'));
      else { state.taskFor = ''; showTasksCode(b.getAttribute('data-name')); }
    };
    $('taskSave').onclick = saveTask;
    $('taskCancel').onclick = closeTaskDialog;
    $('taskDone').onclick = closeTaskDialog;
    $('taskCopy').onclick = function () { copy($('taskCode').value, $('taskMsg')); };
    $('meSave').onclick = saveMe;
    $('meChange').onclick = function () { $('meKnown').classList.add('hidden'); $('meForm').classList.remove('hidden'); $('meNameInput').value = ''; $('meNameInput').focus(); };
    $('makeCode').onclick = makeCode;
    $('codeCopy').onclick = function () { copy($('codeOut').value, $('meMsg')); };
    $('codeFile').onclick = downloadFile;
    $('tasksInBtn').onclick = function () { receiveTasks($('tasksIn').value); };
    $('myTasks').onclick = function (e) {
      const b = e.target.closest('button[data-done]');
      if (!b) return;
      const who = me();
      S.completeTask(who.classCode, who.name, b.getAttribute('data-done'), ls);
      setStatus($('tasksMsg'), 'כל הכבוד! כדי שהמורה יראה/תראה, צרו קוד חדש ושלחו.', 'ok');
      renderStudent();
    };
    if (window.MMAccount && typeof window.MMAccount.onChange === 'function') {
      try {
        window.MMAccount.onChange(function () {
          if (!$('studentPane').classList.contains('hidden')) renderStudent();
          else { state.classCode = pickInitialClass(); renderTeacher(); }
        });
      } catch (e) { /* optional */ }
    }
  }

  // A code that arrived in the address (#mm=...) from a QR scan.
  async function fromHash() {
    const h = String(location.hash || '');
    // A link from the app can open one side directly: class.html#student.
    if (h === '#student' || h === '#teacher') { showPane(h.slice(1)); return true; }
    const code = S.findCode(h);
    if (!code) return false;
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* keep */ }
    const decoded = await S.decode(code);
    if (decoded.ok && decoded.kind === 'tasks') {
      showPane('student');
      $('tasksIn').value = code;
      await receiveTasks(code);
      return true;
    }
    showPane('teacher');
    $('importText').value = code;
    if (state.unlocked || gateOpen()) await importText(code, 'qr');
    else {
      state.pending = code;
      setStatus($('gateMsg'), 'התקבל קוד מתלמיד/ה. ענו על השאלה והוא ייקלט.', '');
    }
    return true;
  }

  function start() {
    state.classCode = pickInitialClass();
    wire();
    showView('students');
    const role = (account() || {}).role;
    fromHash().then(function (handled) {
      if (!handled) showPane(role === 'student' ? 'student' : 'teacher');
    });
  }

  start();
})();
