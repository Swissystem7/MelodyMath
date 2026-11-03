// MM-600 pilot demo — the page: demo sign-in, the student unit and the teacher view.
//
// Sound comes from the existing app, loaded read-only by index.html:
//   ../src/lib/musicEngine.js  (the one shared AudioContext, playSequence, unlock)
//   ../src/lib/numberLine.js   (the number line as a scale)
//   ../src/lib/grade1Music.js  (scaleJumpNarration, scaleJumpEvents)
// If they are missing (or the browser has no Web Audio), the demo still works
// and says so: every sound also has a written line, so sound is never the only channel.
(function () {
  'use strict';

  const G = globalThis;
  const SEED = G.MM_PILOT_SEED || { accounts: [] };
  const U = G.MMPilotUnit;
  const UNIT = U.UNIT;
  const store = G.MMPilotStore.create(safeStorage());
  const root = document.getElementById('mm-app');

  function safeStorage() {
    try {
      const s = G.localStorage;
      const k = 'mmPilot.v1.probe';
      s.setItem(k, '1'); s.removeItem(k);
      return s;
    } catch (e) { return null; } // private mode: an in-memory store, said on screen
  }
  const PERSISTENT = !!safeStorage();

  // ---------------------------------------------------------------- audio
  const engine = G.musicEngine || null;
  if (engine && typeof engine.installAudioUnlock === 'function') engine.installAudioUnlock(document);

  function tone(at, dur, hz, gain, type) { return { at: at, dur: dur, hz: hz, gain: gain, type: type || 'sine' }; }

  function stepHz(from, to) {
    if (typeof G.scaleJumpSound === 'function') {
      const s = G.scaleJumpSound(from, to, 220);
      if (s && Number.isFinite(s.frequency)) return s.frequency;
    }
    return 220 * Math.pow(2, (to - from) / 10);
  }

  // One tone per step from `from` to `to`; a jump of 10 is the grade-1 octave (two tones).
  function jumpEvents(from, to) {
    if (Math.abs(to - from) === 10 && typeof G.scaleJumpEvents === 'function') {
      const ev = G.scaleJumpEvents(from, to, 220, 110);
      if (ev && ev.length) return ev;
    }
    const dir = to >= from ? 1 : -1;
    const out = [];
    let at = 0;
    for (let t = from; dir > 0 ? t <= to : t >= to; t += dir) {
      out.push(tone(at, 0.16, stepHz(from, t), 0.18, 'triangle'));
      at += 0.17;
    }
    return out;
  }

  function jumpNarration(from, to) {
    if (typeof G.scaleJumpNarration === 'function') {
      const n = G.scaleJumpNarration(from, to, 220);
      if (n) return n;
    }
    const size = Math.abs(to - from);
    return 'קפיצה של ' + size + (to >= from ? ' קדימה — הצליל עולה.' : ' אחורה — הצליל יורד.');
  }

  function tryAgainEvents() {
    return [tone(0, 0.18, 246.94, 0.12, 'sine'), tone(0.22, 0.26, 220, 0.12, 'sine')];
  }

  // Returns 'played' when the shared engine scheduled the notes, 'silent' otherwise.
  function play(events) {
    if (!engine || typeof engine.playSequence !== 'function') return 'silent';
    try {
      if (typeof engine.unlockAudio === 'function') engine.unlockAudio();
      return engine.playSequence(events) ? 'played' : 'silent';
    } catch (e) { return 'silent'; }
  }

  function stopSound() {
    try { if (engine && typeof engine.stopAll === 'function') engine.stopAll(); } catch (e) { /* nothing playing */ }
  }

  // ---------------------------------------------------------------- helpers
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function accountById(id) { return SEED.accounts.filter(function (a) { return a.id === id; })[0] || null; }
  function students() { return SEED.accounts.filter(function (a) { return a.role === 'student'; }); }
  function fmtDate(ms) {
    try { return new Date(ms).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' }); } catch (e) { return ''; }
  }
  function starsText(n) { return '★'.repeat(n) + '☆'.repeat(3 - n); }
  function mathHtml(q) { return '<span class="ltr">' + esc(U.questionText(q)) + '</span>'; }

  function unitStatus(p) {
    if (p.completedAt) return { key: 'done', text: 'הושלמה' };
    const answered = Object.keys(p.results).filter(function (k) { return p.results[k].correct || p.results[k].revealed; }).length;
    if (p.lessonDone || answered) return { key: 'progress', text: 'בתהליך · ' + answered + ' מתוך ' + UNIT.questions.length };
    return { key: 'new', text: 'טרם התחילו' };
  }

  // ---------------------------------------------------------------- state
  const state = { view: 'login', account: null, typed: '', qState: 'idle', audio: null, lessonStatus: '', flash: '' };

  function go(view) {
    stopSound();
    state.view = view;
    state.typed = '';
    state.qState = 'idle';
    state.audio = null;
    render();
    const h = root.querySelector('h1, h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: false }); }
    G.scrollTo(0, 0);
  }

  function signedInView(acc) { return acc.role === 'teacher' ? 'teacher' : 'student-home'; }

  // ---------------------------------------------------------------- views
  function topbar(title, sub, end) {
    return '<div class="mm-topbar">'
      + '<button type="button" class="mm-icon-btn" data-act="signout" data-testid="signout">יציאה</button>'
      + '<div class="mm-topbar__title"><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + esc(sub) + '</p>' : '') + '</div>'
      + (end || '<span class="mm-badge mm-badge--quiet" aria-hidden="true">הדגמה</span>')
      + '</div>';
  }

  function viewLogin() {
    return '<section class="mm-view" data-testid="view-login" aria-labelledby="login-title">'
      + '<div class="mm-hero"><h1 id="login-title">MelodyMath</h1><p>הדגמת פיילוט · כיתות א׳–ג׳</p></div>'
      + '<form class="mm-card" data-testid="login-form" novalidate>'
      + '<h2>כניסה לחשבון הדגמה</h2>'
      + '<label class="mm-field">שם משתמש<input name="username" data-testid="login-username" autocomplete="off" autocapitalize="none" spellcheck="false" dir="ltr" required></label>'
      + '<label class="mm-field">סיסמה<input name="password" type="password" data-testid="login-password" autocomplete="off" dir="ltr" required></label>'
      + (state.flash ? '<div class="mm-error" role="alert" data-testid="login-error">' + esc(state.flash) + '</div>' : '')
      + '<button type="submit" class="mm-btn" data-testid="login-submit">כניסה</button>'
      + '</form>'
      + '<p class="mm-note">כניסת הדגמה בצד הלקוח בלבד — זו לא אבטחה אמיתית. הנתונים נשמרים רק בדפדפן של המכשיר הזה.</p>'
      + (PERSISTENT ? '' : '<p class="mm-error" role="status">הדפדפן חוסם שמירה מקומית, ולכן ההתקדמות לא תישמר אחרי רענון.</p>')
      + '</section>';
  }

  function viewStudentHome() {
    const acc = state.account;
    const p = store.progress(acc.id, UNIT.id);
    const st = unitStatus(p);
    const tasks = store.assignmentsFor(acc.id).filter(function (a) { return a.unitId === UNIT.id; });
    const startLabel = p.completedAt ? 'לצפייה בסיכום' : (st.key === 'new' ? 'מתחילים ←' : 'ממשיכים מהמקום שעצרנו ←');
    let html = '<section class="mm-view" data-testid="view-student-home">'
      + topbar('שלום, ' + acc.displayName, 'כיתה ' + (acc.grade || 'א׳–ג׳'))
      + '<h2 class="sr-only">המשימות שלי</h2>';
    if (tasks.length) {
      html += '<div class="mm-card mm-task" data-testid="assignment-card">'
        + '<span class="mm-chip mm-chip--yellow">משימה מהמורה</span>'
        + '<h3 data-testid="assignment-title">' + esc(UNIT.title) + '</h3>'
        + tasks.map(function (t) {
          return '<p class="mm-sub">הוקצתה ב־' + esc(fmtDate(t.createdAt)) + '</p>'
            + (t.note ? '<p class="mm-teacher-note" data-testid="assignment-note">' + esc(t.note) + '</p>' : '');
        }).join('')
        + '</div>';
    } else {
      html += '<div class="mm-card" data-testid="no-assignment"><p>אין עדיין משימה מהמורה. אפשר לתרגל את היחידה בינתיים.</p></div>';
    }
    html += '<div class="mm-card mm-card--ink mm-task" data-testid="unit-card">'
      + '<div class="mm-task__row"><h3>' + esc(UNIT.title) + '</h3><span class="mm-chip" data-testid="unit-status" data-status="' + st.key + '">' + esc(st.text) + '</span></div>'
      + '<p class="mm-sub">' + esc(UNIT.subtitle) + ' · כיתות ' + esc(UNIT.grades) + ' · שיעור קצר ו־' + UNIT.questions.length + ' תרגילים</p>'
      + (p.completedAt ? '<p data-testid="unit-stars" aria-label="' + U.stars(p.results) + ' כוכבים">' + starsText(U.stars(p.results)) + '</p>' : '')
      + '<button type="button" class="mm-btn" data-act="open-unit" data-testid="open-unit">' + startLabel + '</button>'
      + '</div>'
      + '<p class="mm-note">ההתקדמות נשמרת אוטומטית במכשיר הזה.</p>'
      + '</section>';
    return html;
  }

  function lineHtml(from, to) {
    const lo = 0, hi = 20;
    let out = '<div class="mm-line" aria-hidden="true">';
    for (let t = lo; t <= hi; t++) {
      const inPath = (t > Math.min(from, to) && t < Math.max(from, to));
      const cls = t === from ? ' is-from' : t === to ? ' is-to' : inPath ? ' is-path' : '';
      out += '<div class="mm-line__tick' + cls + '"><span class="mm-line__bar" style="height:' + (16 + t * 3) + 'px"></span>' + t + '</div>';
    }
    return out + '</div>';
  }

  function viewLesson() {
    const L = UNIT.lesson;
    return '<section class="mm-view mm-view--lesson" data-testid="view-lesson">'
      + topbar('שיעור', UNIT.title)
      + '<div class="mm-card"><h2>' + esc(L.title) + '</h2><ul class="mm-lesson-lines">'
      + L.lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul></div>'
      + '<p class="mm-sub" style="text-align:center;color:inherit;font-weight:700">מ־' + L.demo.from + ' קופצים 3 צעדים קדימה ומגיעים ל־' + L.demo.to + '. הקשיבו:</p>'
      + lineHtml(L.demo.from, L.demo.to)
      + '<button type="button" class="mm-play" data-act="lesson-play" data-testid="lesson-play" aria-label="השמעת הקפיצה מ־2 ל־5"><span aria-hidden="true">▶</span>להשמיע</button>'
      + '<div class="mm-status" aria-live="polite" data-testid="lesson-status" data-audio="' + esc(state.audio || '') + '">' + esc(state.lessonStatus) + '</div>'
      + '<div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">'
      + '<div class="mm-small-print">המנגינה תמיד נעצרת לפני שהתרגילים מתחילים</div>'
      + '<button type="button" class="mm-btn mm-btn--white" data-act="lesson-done" data-testid="lesson-continue">לתרגילים ←</button>'
      + '</div></section>';
  }

  function currentProgress() { return store.progress(state.account.id, UNIT.id); }

  function viewExercise() {
    const p = currentProgress();
    const i = Math.min(p.index, UNIT.questions.length - 1);
    const q = UNIT.questions[state.qState === 'right' || state.qState === 'revealed' ? state.shownIndex : i];
    const qi = UNIT.questions.indexOf(q);
    const topic = U.TOPICS[q.topic];
    const right = state.qState === 'right', wrong = state.qState === 'wrong', retry = state.qState === 'retry', revealed = state.qState === 'revealed';
    const locked = right || revealed;
    const empty = state.typed === '';
    const ansCls = 'mm-answer' + (empty && !locked ? ' is-empty' : '') + (right ? ' is-right' : '') + (wrong || revealed ? ' is-wrong' : '');
    const shownAnswer = revealed ? String(U.answerOf(q)) : (empty ? '?' : state.typed);
    const soundLine = state.audio === 'played'
      ? '🔊 ' + (right ? jumpNarration(q.a, U.answerOf(q)) : 'צליל עדין: ננסה שוב.')
      : '🔈 הצליל לא זמין במכשיר הזה — המשוב כתוב כאן.';

    let fb = '';
    if (right) {
      fb = '<div class="mm-fb mm-fb--right" role="status" data-testid="feedback" data-result="right" data-audio="' + esc(state.audio) + '">'
        + '<div>כל הכבוד! ' + mathHtml(q).replace('?', String(U.answerOf(q))) + '</div>'
        + '<div class="mm-fb__sound" data-testid="feedback-sound">' + esc(soundLine) + '</div></div>';
    } else if (wrong || retry) {
      fb = '<div class="mm-fb mm-fb--wrong" role="status" data-testid="feedback" data-result="' + (wrong ? 'wrong' : 'retry') + '" data-audio="' + esc(state.audio || '') + '">'
        + (wrong ? '<div>עוד לא. נסו שוב — יש לכם עוד ניסיון.</div><div class="mm-fb__sound" data-testid="feedback-sound">' + esc(soundLine) + '</div>' : '')
        + '<div class="mm-hint"><div class="mm-hint__text" data-testid="hint">רמז: ' + esc(U.hintText(q)) + '</div>'
        + '<div class="mm-hint__groups" aria-hidden="true">' + U.hintGroups(q).map(function (n) {
          return '<div class="mm-hint__group">' + '<span class="mm-hint__dot"></span>'.repeat(n) + '</div>';
        }).join('') + '</div></div></div>';
    } else if (revealed) {
      fb = '<div class="mm-fb mm-fb--wrong" role="status" data-testid="feedback" data-result="revealed" data-audio="' + esc(state.audio || '') + '">'
        + '<div>התשובה היא <span class="ltr">' + U.answerOf(q) + '</span>. נתרגל את זה שוב בפעם הבאה.</div>'
        + '<div class="mm-fb__sound" data-testid="feedback-sound">' + esc(soundLine) + '</div></div>';
    } else {
      fb = '<div class="mm-idle">כתבו תשובה ולחצו ״בדיקה״.</div>';
    }

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clr', '0', 'del'];
    const keypad = '<div class="mm-keypad" role="group" aria-label="מקלדת מספרים">' + keys.map(function (k) {
      const label = k === 'del' ? '⌫' : k === 'clr' ? 'נקה' : k;
      const aria = k === 'del' ? 'מחיקה' : k === 'clr' ? 'ניקוי' : k;
      return '<button type="button" class="mm-key' + (k === 'del' || k === 'clr' ? ' mm-key--tool' : '') + '" data-act="key" data-key="' + k + '" data-testid="key-' + k + '" aria-label="' + aria + '"' + (locked ? ' disabled' : '') + '>' + label + '</button>';
    }).join('') + '</div>';

    const isLast = qi === UNIT.questions.length - 1;
    const submit = locked
      ? '<button type="button" class="mm-btn mm-btn--mint" data-act="next" data-testid="next">' + (isLast ? 'לסיכום ←' : 'לתרגיל הבא ←') + '</button>'
      : '<button type="button" class="mm-btn" data-act="check" data-testid="check"' + (empty ? ' disabled' : '') + '>בדיקה</button>';

    const dots = UNIT.questions.map(function (_, k) {
      return '<span class="mm-dot' + (k < qi ? ' is-done' : k === qi ? ' is-now' : '') + '"></span>';
    }).join('');

    return '<section class="mm-view mm-view--exercise" data-testid="view-exercise" data-qid="' + q.id + '">'
      + topbar('תרגול', UNIT.title, '<span class="mm-badge" data-testid="star-count" aria-label="כוכבים">★ ' + firstTryCount(p) + '</span>')
      + '<div class="mm-progress"><span class="mm-sub" data-testid="q-progress">תרגיל ' + (qi + 1) + ' מתוך ' + UNIT.questions.length + '</span><div class="mm-dots" aria-hidden="true">' + dots + '</div></div>'
      + '<div class="mm-card"><span class="mm-chip" data-testid="q-topic">' + esc(topic.name) + '</span>'
      + '<h2 class="mm-question" data-testid="q-text">' + mathHtml(q) + '</h2></div>'
      + '<div class="' + ansCls + '" aria-live="polite" data-testid="answer" aria-label="התשובה שלכם">' + esc(shownAnswer) + '</div>'
      + fb + keypad + submit
      + '</section>';
  }

  function firstTryCount(p) {
    return Object.keys(p.results).filter(function (k) { return p.results[k].firstTry; }).length;
  }

  function viewSummary() {
    const p = currentProgress();
    const rep = U.topicReport(p.results);
    return '<section class="mm-view" data-testid="view-summary">'
      + topbar('סיימתם!', UNIT.title)
      + '<div class="mm-card" style="align-items:center;text-align:center"><div class="mm-stars" data-testid="summary-stars" aria-label="' + U.stars(p.results) + ' מתוך 3 כוכבים">' + starsText(U.stars(p.results)) + '</div>'
      + '<h2>כל הכבוד על היחידה!</h2><p class="mm-sub">' + firstTryCount(p) + ' מתוך ' + UNIT.questions.length + ' תרגילים נפתרו בניסיון הראשון</p></div>'
      + '<div class="mm-card"><h3>לפי נושא</h3><ul class="mm-gap-list">'
      + rep.map(function (t) {
        return '<li data-testid="summary-topic" data-topic="' + t.topic + '">' + esc(t.name) + ': ' + t.firstTry + ' מתוך ' + t.total + ' בניסיון ראשון'
          + (t.status === 'gap' ? ' — נתרגל עוד' : ' — מצוין') + '</li>';
      }).join('') + '</ul></div>'
      + '<div class="mm-saved" data-testid="saved">✓ ההתקדמות נשמרה במכשיר הזה. המורה יראה אותה בדוח.</div>'
      + '<button type="button" class="mm-btn" data-act="home" data-testid="home">חזרה למסך הבית</button>'
      + '</section>';
  }

  function teacherAssignments() {
    const rows = store.assignments().filter(function (a) { return a.unitId === UNIT.id; });
    if (!rows.length) return '<p data-testid="no-assignments">עדיין לא הוקצו משימות.</p>';
    return '<div class="mm-table-wrap"><table class="mm-table" data-testid="assignments-table"><thead><tr><th scope="col">תלמיד/ה</th><th scope="col">משימה</th><th scope="col">הוקצתה</th><th scope="col">מצב</th></tr></thead><tbody>'
      + rows.map(function (a) {
        const s = accountById(a.studentId);
        const st = unitStatus(store.progress(a.studentId, a.unitId));
        return '<tr data-testid="assignment-row"><td>' + esc(s ? s.displayName : a.studentId) + '</td><td>' + esc(UNIT.title) + '</td><td>' + esc(fmtDate(a.createdAt)) + '</td>'
          + '<td><span class="mm-chip' + (st.key === 'done' ? ' mm-chip--mint' : '') + '" data-testid="assignment-status" data-status="' + st.key + '">' + esc(st.text) + '</span></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  const ADVICE = {
    add: 'לתרגל קפיצות קדימה על ישר המספרים ולשמוע את הצליל עולה צעד אחר צעד.',
    sub: 'לתרגל קפיצות אחורה: לספור את הצעדים בקול בזמן שהצליל יורד.',
    tens: 'לחזור על "קפיצה של 10 היא אוקטבה" עם לוח המאה — אותה ספרת אחדות, עשרת אחרת.'
  };

  function teacherReport() {
    return students().map(function (s) {
      const p = store.progress(s.id, UNIT.id);
      const rep = U.topicReport(p.results);
      const any = rep.some(function (t) { return t.done; });
      const gapRows = rep.filter(function (t) { return t.status === 'gap'; });
      let html = '<div class="mm-card" data-testid="report-student" data-student="' + esc(s.id) + '">'
        + '<div class="mm-task__row"><h3>' + esc(s.displayName) + '</h3><span class="mm-chip" data-testid="report-unit-status">' + esc(unitStatus(p).text) + '</span></div>';
      if (!any) return html + '<p data-testid="report-empty">אין עדיין תוצאות. הן יופיעו כאן אחרי שהתלמיד/ה יתרגל/תתרגל במכשיר הזה.</p></div>';
      html += '<div class="mm-table-wrap"><table class="mm-table" data-testid="report-table"><thead><tr><th scope="col">נושא</th><th scope="col">נענו</th><th scope="col">נכון בניסיון ראשון</th><th scope="col">מצב</th></tr></thead><tbody>'
        + rep.map(function (t) {
          const pct = t.rate == null ? 0 : Math.round(t.rate * 100);
          const label = t.status === 'gap' ? 'פער' : t.status === 'ok' ? 'שולט/ת' : 'טרם';
          return '<tr data-testid="report-row" data-topic="' + t.topic + '" data-status="' + t.status + '">'
            + '<th scope="row">' + esc(t.name) + '</th><td><span class="ltr">' + t.done + '/' + t.total + '</span></td>'
            + '<td><div style="display:flex;align-items:center;gap:6px"><div class="mm-meter' + (t.status === 'gap' ? ' is-gap' : '') + '" role="img" aria-label="' + pct + ' אחוז"><span style="width:' + pct + '%"></span></div><span class="ltr" data-testid="report-pct">' + pct + '%</span></div></td>'
            + '<td><span class="mm-chip' + (t.status === 'gap' ? ' mm-chip--rust' : t.status === 'ok' ? ' mm-chip--mint' : '') + '" data-testid="report-status">' + label + '</span></td></tr>';
        }).join('') + '</tbody></table></div>';
      html += '<h4 style="margin:6px 0 0">פערים</h4>';
      html += gapRows.length
        ? '<ul class="mm-gap-list" data-testid="gaps">' + gapRows.map(function (t) {
          return '<li data-testid="gap" data-topic="' + t.topic + '"><strong>' + esc(t.name) + '</strong> — ' + t.firstTry + ' מתוך ' + t.done + ' בניסיון ראשון. הצעה: ' + esc(ADVICE[t.topic]) + '</li>';
        }).join('') + '</ul>'
        : '<p data-testid="no-gaps">לא נמצאו פערים ביחידה הזו.</p>';
      return html + '</div>';
    }).join('');
  }

  function viewTeacher() {
    const acc = state.account;
    return '<section class="mm-view" data-testid="view-teacher">'
      + topbar('שלום, ' + acc.displayName, 'לוח המורה · הדגמה')
      + '<div class="mm-grid">'
      + '<form class="mm-card" data-testid="assign-form" novalidate><h2>הקצאת משימה</h2>'
      + '<label class="mm-field">תלמיד/ה<select name="student" data-testid="assign-student">'
      + students().map(function (s) { return '<option value="' + esc(s.id) + '">' + esc(s.displayName) + '</option>'; }).join('')
      + '</select></label>'
      + '<label class="mm-field">יחידה<select name="unit" data-testid="assign-unit"><option value="' + esc(UNIT.id) + '">' + esc(UNIT.title) + '</option></select></label>'
      + '<label class="mm-field">הערה לתלמיד/ה (לא חובה)<textarea name="note" maxlength="140" data-testid="assign-note"></textarea></label>'
      + '<button type="submit" class="mm-btn" data-testid="assign-submit">הקצאה</button>'
      + '<div class="mm-status" aria-live="polite" data-testid="assign-status">' + esc(state.flash) + '</div>'
      + '</form>'
      + '<div class="mm-card"><h2>משימות שהוקצו</h2>' + teacherAssignments() + '</div>'
      + '</div>'
      + '<section class="mm-view" aria-labelledby="report-title" data-testid="report"><h2 id="report-title" style="margin:6px 0 0">דוח לפי נושא ופערים</h2>'
      + '<p class="mm-sub">פער = פחות מ־' + Math.round(U.GAP_THRESHOLD * 100) + '% מהתרגילים בנושא נפתרו בניסיון הראשון. הנתונים מהמכשיר הזה בלבד.</p>'
      + teacherReport() + '</section>'
      + '<div class="mm-card"><h3>נתוני ההדגמה</h3><p class="mm-sub">מוחק את המשימות, ההתקדמות והכניסה מהדפדפן הזה בלבד.</p>'
      + '<div class="mm-row-actions"><button type="button" class="mm-btn mm-btn--white mm-btn--small" data-act="reset" data-testid="reset">'
      + (state.confirmReset ? 'לחצו שוב לאישור המחיקה' : 'איפוס נתוני ההדגמה') + '</button></div></div>'
      + '</section>';
  }

  // ---------------------------------------------------------------- render + events
  function render() {
    const wide = state.view === 'teacher';
    root.className = 'mm-shell' + (wide ? ' mm-shell--wide' : '');
    const v = state.view;
    root.innerHTML = v === 'login' ? viewLogin()
      : v === 'student-home' ? viewStudentHome()
      : v === 'lesson' ? viewLesson()
      : v === 'exercise' ? viewExercise()
      : v === 'summary' ? viewSummary()
      : viewTeacher();
    root.setAttribute('data-view', v);
  }

  function saveResult(qid, row, advance) {
    const p = currentProgress();
    p.results[qid] = row;
    if (advance) p.index = Math.max(p.index, UNIT.questions.findIndex(function (q) { return q.id === qid; }) + 1);
    if (!p.startedAt) p.startedAt = Date.now();
    store.saveProgress(state.account.id, UNIT.id, p);
  }

  function onKey(k) {
    if (state.qState === 'right' || state.qState === 'revealed') return;
    let t = state.qState === 'wrong' ? '' : state.typed;
    if (k === 'del') t = t.slice(0, -1);
    else if (k === 'clr') t = '';
    else if (t.length < 2) t = (t === '0' ? '' : t) + k;
    state.typed = t;
    if (state.qState === 'wrong') state.qState = 'retry';
    render();
  }

  function onCheck() {
    if (state.typed === '') return;
    const p = currentProgress();
    const q = UNIT.questions[Math.min(p.index, UNIT.questions.length - 1)];
    const prev = p.results[q.id] || { tries: 0 };
    const tries = (prev.tries || 0) + 1;
    if (U.isCorrect(q, state.typed)) {
      saveResult(q.id, { tries: tries, correct: true, firstTry: tries === 1, revealed: false, at: Date.now() }, true);
      state.qState = 'right';
      state.shownIndex = UNIT.questions.indexOf(q);
      state.audio = play(jumpEvents(q.a, U.answerOf(q)));
    } else if (tries >= U.MAX_TRIES) {
      saveResult(q.id, { tries: tries, correct: false, firstTry: false, revealed: true, at: Date.now() }, true);
      state.qState = 'revealed';
      state.shownIndex = UNIT.questions.indexOf(q);
      state.audio = play(tryAgainEvents());
    } else {
      saveResult(q.id, { tries: tries, correct: false, firstTry: false, revealed: false }, false);
      state.qState = 'wrong';
      state.audio = play(tryAgainEvents());
    }
    render();
    const fb = root.querySelector('[data-testid="next"], [data-testid="key-1"]');
    if (fb && state.qState !== 'wrong') fb.focus();
  }

  function onNext() {
    stopSound();
    const p = currentProgress();
    if (p.index >= UNIT.questions.length) {
      if (!p.completedAt) { p.completedAt = Date.now(); store.saveProgress(state.account.id, UNIT.id, p); }
      go('summary');
      return;
    }
    go('exercise');
  }

  root.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    const act = btn.getAttribute('data-act');
    if (act === 'signout') { store.signOut(); state.account = null; state.flash = ''; go('login'); return; }
    if (act === 'open-unit') {
      const p = currentProgress();
      state.lessonStatus = '';
      if (p.completedAt) go('summary');
      else if (!p.lessonDone) go('lesson');
      else go('exercise');
      return;
    }
    if (act === 'lesson-play') {
      const d = UNIT.lesson.demo;
      state.audio = play(jumpEvents(d.from, d.to));
      state.lessonStatus = (state.audio === 'played' ? '🔊 ' : '🔈 (בלי צליל במכשיר הזה) ') + jumpNarration(d.from, d.to);
      render();
      return;
    }
    if (act === 'lesson-done') {
      stopSound();
      const p = currentProgress();
      p.lessonDone = true;
      if (!p.startedAt) p.startedAt = Date.now();
      store.saveProgress(state.account.id, UNIT.id, p);
      go('exercise');
      return;
    }
    if (act === 'key') { onKey(btn.getAttribute('data-key')); return; }
    if (act === 'check') { onCheck(); return; }
    if (act === 'next') { onNext(); return; }
    if (act === 'home') { go('student-home'); return; }
    if (act === 'reset') {
      if (!state.confirmReset) { state.confirmReset = true; render(); return; }
      state.confirmReset = false;
      store.resetAll();
      state.account = null; state.flash = '';
      go('login');
    }
  });

  root.addEventListener('submit', function (e) {
    e.preventDefault();
    const form = e.target;
    if (form.getAttribute('data-testid') === 'login-form') {
      const user = String(form.username.value || '').trim().toLowerCase();
      const pass = String(form.password.value || '');
      const acc = SEED.accounts.filter(function (a) { return a.username === user && a.password === pass; })[0];
      if (!acc) { state.flash = 'שם המשתמש או הסיסמה לא נכונים. נסו שוב.'; render(); return; }
      store.signIn(acc.id);
      state.account = acc; state.flash = '';
      go(signedInView(acc));
      return;
    }
    if (form.getAttribute('data-testid') === 'assign-form') {
      const sid = form.student.value;
      const s = accountById(sid);
      if (!s) return;
      store.assign({ unitId: form.unit.value, studentId: sid, by: state.account.id, note: form.note.value });
      state.flash = 'המשימה הוקצתה ל' + s.displayName + '. היא תופיע אצלו/ה בכניסה הבאה במכשיר הזה.';
      render();
    }
  });

  // Physical keyboard on the exercise screen: digits, Backspace, Enter.
  document.addEventListener('keydown', function (e) {
    if (state.view !== 'exercise' || e.target.closest && e.target.closest('input, textarea, select')) return;
    if (/^[0-9]$/.test(e.key)) { onKey(e.key); e.preventDefault(); }
    else if (e.key === 'Backspace') { onKey('del'); e.preventDefault(); }
  });

  // ---------------------------------------------------------------- boot
  const sess = store.session();
  const acc = sess && accountById(sess.accountId);
  if (acc) { state.account = acc; state.view = signedInView(acc); }
  render();
  document.documentElement.setAttribute('data-ready', '1');
})();
