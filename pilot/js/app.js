// MM-600 pilot demo — the page: demo sign-in, the student unit and the teacher view.
//
// MM-601: real music in every exercise, the curriculum each topic covers,
// a "למה זה עובד" panel for adults and a fraction rhythm exercise.
//
// Existing MelodyMath code, loaded read-only by index.html:
//   ../src/lib/musicEngine.js      (the one shared AudioContext, exact note fractions, unlock)
//   ../src/lib/instrumentVoices.js (piano, xylophone, organ and wood-click voices)
//   ../src/lib/curriculum.js       (official topics: ids, names, quotes, PDF pages)
// The music of each exercise is planned in js/music.js and the research claims
// live in js/research.js. If the sound code is missing (or the browser has no
// Web Audio), the demo still works and says so: every sound also has a picture
// and a written line, so sound is never the only channel.
(function () {
  'use strict';

  const G = globalThis;
  const SEED = G.MM_PILOT_SEED || { accounts: [] };
  const U = G.MMPilotUnit;
  const M = music();
  const R = research();
  const CURRICULUM = U.CURRICULUM || {};      // older unit.js (MM-600) had no curriculum ids
  const CURRICULUM_NOTE = U.CURRICULUM_NOTE || {};
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

  // ---------------------------------------------------------------- fail-safe globals (MM-602)
  // The pilot is several files. A browser that cached an older copy of one of
  // them (e.g. MM-600's page without js/music.js) can run it next to this
  // newer app.js. Every call into js/music.js therefore goes through music():
  // if MMPilotMusic is missing, lacks a function, or a function throws, the
  // demo warns once in the console, plays no sound, and keeps working: the
  // pictures, captions and the rhythm bar fall back to the plain versions below.
  function music() {
    const NEEDED = ['chips', 'plan', 'barFill', 'caption', 'hint', 'describe', 'play', 'stop', 'setMuted', 'isMuted'];
    const live = G.MMPilotMusic;
    let warned = false;
    function warn(why) {
      if (warned) return;
      warned = true;
      try { G.console.warn('[MelodyMath pilot] music is unavailable (' + why + '): the demo continues without sound.'); } catch (e) { /* no console */ }
    }
    const CHOICE_BEATS = { quarter: 1, half: 2, whole: 4 };
    let muted = false;
    const fallback = {
      CHOICES: [
        { id: 'quarter', symbol: '♩', fraction: '1/4', he: 'רבע תיבה' },
        { id: 'half', symbol: '𝅗𝅥', fraction: '1/2', he: 'חצי תיבה' },
        { id: 'whole', symbol: '𝅝', fraction: '1', he: 'תיבה שלמה' }
      ],
      GIVEN: [{ note: 'E4', fraction: '1/4' }, { note: 'D4', fraction: '1/4' }],
      chips: function () { return []; },
      plan: function () { return []; },
      barFill: function (id) {
        const c = CHOICE_BEATS[id] || 0;
        const beats = 2 + c;
        return { status: beats === 4 ? 'full' : beats < 4 ? 'short' : 'over', beats: beats, choiceBeats: c };
      },
      caption: function () { return ''; },
      hint: function (q) { return U.hintText(q); },
      describe: function () { return ''; },
      play: function () { return 'silent'; },
      stop: function () {},
      setMuted: function (v) { muted = !!v; },
      isMuted: function () { return muted; }
    };
    const missing = !live ? ['MMPilotMusic'] : NEEDED.filter(function (k) { return typeof live[k] !== 'function'; });
    const ok = missing.length === 0 && Array.isArray(live.CHOICES) && Array.isArray(live.GIVEN);
    if (!ok) warn(missing.length ? 'missing ' + missing.join(', ') : 'missing CHOICES/GIVEN');
    const safe = { CHOICES: ok ? live.CHOICES : fallback.CHOICES, GIVEN: ok ? live.GIVEN : fallback.GIVEN };
    NEEDED.forEach(function (k) {
      safe[k] = function () {
        if (ok) {
          try { return live[k].apply(live, arguments); } catch (e) { warn(k + ' threw: ' + (e && e.message)); }
        }
        return fallback[k].apply(null, arguments);
      };
    });
    return safe;
  }

  function research() {
    const r = G.MMPilotResearch;
    if (r && Array.isArray(r.CLAIMS)) return r;
    try { G.console.warn('[MelodyMath pilot] research claims are unavailable: the panel shows none.'); } catch (e) { /* no console */ }
    return { CLAIMS: [], HONESTY: '', FROM: '' };
  }

  // ---------------------------------------------------------------- audio
  const engine = G.musicEngine || null;
  if (engine && typeof engine.installAudioUnlock === 'function') engine.installAudioUnlock(document);

  // Plays a stage of the current exercise and lights each note on screen as it sounds.
  function playStage(q, stage, choice) {
    const notes = M.plan(q, stage, choice);
    const audio = M.play(q.id + ':' + stage, notes, highlight);
    state.audio = audio;
    return audio;
  }

  function highlight(n) {
    root.querySelectorAll('.is-on').forEach(function (el) { el.classList.remove('is-on'); });
    if (!n) return;
    if (n.chip != null) {
      const el = root.querySelector('[data-chip="' + n.chip + '"]');
      if (el) el.classList.add('is-on');
    }
    if (n.beat != null) {
      const cell = root.querySelector('[data-beat="' + n.beat + '"]');
      if (cell) cell.classList.add('is-on');
    }
  }

  function stopSound() { M.stop(); }

  function soundLine(text) {
    if (state.audio === 'played') return '🔊 ' + text;
    return (M.isMuted() ? '🔇 הצליל כבוי' : '🔈 הצליל לא זמין במכשיר הזה') + ' — אותה מנגינה מוצגת בתמונה ובכתב. ' + text;
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
  const state = { view: 'login', account: null, typed: '', choice: null, qState: 'idle', audio: null, lessonStatus: '', flash: '', whyOpen: false };

  function go(view) {
    stopSound();
    state.view = view;
    state.typed = '';
    state.choice = null;
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

  // ---------------------------------------------------------------- curriculum (read from src/lib/curriculum.js)
  function curriculumRow(id) {
    const row = typeof G.topicById === 'function' ? G.topicById(id) : null;
    if (!row) return null;
    const order = (G.OFFICIAL_ORDER && G.OFFICIAL_ORDER[row.grade]) || [];
    const placed = order.filter(function (o) { return o[0] === row.topic; })[0];
    const page = placed ? placed[1] : null;
    const file = String(row.sourceUrl || '').split('/').pop();
    return {
      id: row.topicId, grade: row.grade, topic: row.topic,
      strand: typeof G.strandHe === 'function' ? G.strandHe(row.strand) : row.strand,
      quote: row.quote, page: page, file: file,
      url: page ? row.sourceUrl + '#page=' + page : row.sourceUrl
    };
  }

  function curriculumBadge(topicId) {
    const ids = CURRICULUM[topicId] || [];
    const rows = ids.map(curriculumRow).filter(Boolean);
    if (!rows.length) return '';
    const text = rows.map(function (r) { return r.id + ' · ' + r.grade + '׳'; }).join(' | ');
    const title = rows.map(function (r) { return r.id + ': ' + r.topic + ' (כיתה ' + r.grade + '׳)'; }).join('; ');
    return '<span class="mm-chip mm-chip--curr" data-testid="q-curriculum" title="' + esc(title) + '"><span class="sr-only">נושא בתוכנית הלימודים: </span>תוכנית: <span class="ltr">' + esc(text) + '</span></span>';
  }

  // ---------------------------------------------------------------- music on screen
  function chipsHtml(q, stage) {
    const cs = M.chips(q, stage);
    const ROLE_HE = { a: 'פסנתר', b: 'קסילופון', removed: 'מורידים', ten: 'עשרת', 'removed-ten': 'מורידים', one: 'יחידה', home: 'הביתה' };
    return '<div class="mm-notes" aria-hidden="true" data-testid="music-notes" data-count="' + cs.filter(function (c) { return c.role !== 'home'; }).length + '">'
      + cs.map(function (c) {
        const glyph = c.role === 'home' ? '⌂' : (c.role === 'ten' || c.role === 'removed-ten') ? '10' : '♪';
        return '<span class="mm-note mm-note--' + c.role + '" data-chip="' + c.index + '" data-role="' + c.role + '" style="--step:' + c.step + '" title="' + ROLE_HE[c.role] + '">' + glyph + '</span>';
      }).join('') + '</div>';
  }

  function legendHtml(q) {
    if (q.music === 'join') return '<span class="mm-key-dot mm-note--a"></span>פסנתר <span class="mm-key-dot mm-note--b"></span>קסילופון';
    if (q.music === 'remove') return '<span class="mm-key-dot mm-note--a"></span>נשארים <span class="mm-key-dot mm-note--removed"></span>מורידים (✕)';
    return '<span class="mm-key-dot mm-note--ten"></span>עשרת (עוגב נמוך) <span class="mm-key-dot mm-note--one"></span>יחידה (קסילופון)';
  }

  // The 4/4 bar of q7: 4 beat cells, two quarter notes given, the rest open
  // until the child has answered (then the chosen rhythm is drawn, with the
  // silence it leaves or the part that spills over the bar line).
  function barHtml(q, shown) {
    const fill = shown ? M.barFill(shown) : null;
    const choice = shown ? M.CHOICES.filter(function (c) { return c.id === shown; })[0] : null;
    let cells = '';
    for (let b = 0; b < 6; b++) cells += '<span class="mm-bar__beat' + (b >= 4 ? ' is-out' : '') + '" data-beat="' + b + '" style="grid-column:' + (b + 1) + '">' + (b < 4 ? (b + 1) : '') + '</span>';
    let notes = M.GIVEN.map(function (g, i) {
      return '<span class="mm-bar__note mm-note--a" data-chip="' + i + '" style="grid-column:' + (i + 1) + ' / span 1">♩ <span class="ltr">1/4</span></span>';
    }).join('');
    if (choice) {
      const span = fill.choiceBeats;
      notes += '<span class="mm-bar__note mm-note--b' + (fill.status === 'over' ? ' is-over' : '') + '" data-chip="2" style="grid-column:3 / span ' + span + '">' + choice.symbol + ' <span class="ltr">' + choice.fraction + '</span></span>';
      if (fill.status === 'short') notes += '<span class="mm-bar__gap" style="grid-column:' + (3 + span) + ' / 5">שקט</span>';
    } else {
      notes += '<span class="mm-bar__slot" style="grid-column:3 / span 2">?</span>';
    }
    const label = !fill ? '' : fill.status === 'full' ? 'התיבה מלאה' : fill.status === 'short' ? 'התיבה עוד לא מלאה' : 'הקצב עובר את סוף התיבה';
    return '<div class="mm-bar" dir="ltr" data-testid="rhythm-bar" data-fill="' + (fill ? fill.status : 'open') + '" aria-hidden="true">'
      + '<div class="mm-bar__grid">' + cells + notes + '</div>'
      + (label ? '<div class="mm-bar__label" dir="rtl">' + label + '</div>' : '')
      + '</div>';
  }

  function musicCard(q, stage) {
    const solved = stage === 'right' || stage === 'reveal';
    const rhythm = q.kind === 'rhythm';
    const shown = rhythm ? (solved ? q.answer : (state.qState === 'wrong' || state.qState === 'retry') ? state.lastChoice : null) : null;
    return '<div class="mm-card mm-music" data-testid="music-card">'
      + '<div class="mm-music__head"><span class="mm-chip mm-chip--yellow">' + (rhythm ? 'שומעים ורואים: קצב בתיבה' : 'שומעים ורואים: המנגינה היא התרגיל') + '</span>'
      + (rhythm ? '' : '<span class="mm-legend">' + legendHtml(q) + '</span>') + '</div>'
      + (rhythm ? barHtml(q, shown) : chipsHtml(q, stage))
      + '<p class="mm-caption" data-testid="music-caption" data-stage="' + (solved ? 'solved' : 'open') + '">' + esc(M.caption(q, stage)) + '</p>'
      + '<p class="sr-only" data-testid="music-describe">' + esc(M.describe(q, stage)) + '</p>'
      + '<div class="mm-row-actions">'
      + '<button type="button" class="mm-btn mm-btn--white mm-btn--small" data-act="replay" data-testid="replay">▶ ' + (solved ? 'להשמיע שוב את המנגינה השלמה' : rhythm ? 'להשמיע את התיבה' : 'להשמיע את המנגינה') + '</button>'
      + soundToggle()
      + '</div></div>';
  }

  function soundToggle() {
    const off = M.isMuted();
    return '<button type="button" class="mm-btn mm-btn--white mm-btn--small" data-act="sound" data-testid="sound-toggle" aria-pressed="' + (off ? 'true' : 'false') + '">' + (off ? '🔇 בלי צליל' : '🔊 עם צליל') + '</button>';
  }

  // ---------------------------------------------------------------- lesson
  function viewLesson() {
    const L = UNIT.lesson;
    const demo = { id: 'lesson', music: 'join', a: L.demo.a, op: '+', b: L.demo.b };
    return '<section class="mm-view mm-view--lesson" data-testid="view-lesson">'
      + topbar('שיעור', UNIT.title)
      + '<div class="mm-card"><h2>' + esc(L.title) + '</h2><ul class="mm-lesson-lines">'
      + L.lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul></div>'
      + '<div class="mm-card mm-music" data-testid="lesson-music">'
      + '<div class="mm-music__head"><span class="mm-chip mm-chip--yellow">דוגמה</span><span class="mm-legend">' + legendHtml(demo) + '</span></div>'
      + chipsHtml(demo, 'right')
      + '<p class="mm-caption" data-testid="lesson-caption">שומעים <span class="ltr">3</span> צלילים ועוד <span class="ltr">2</span> = <span class="ltr">5</span> — שתי מנגינות קצרות מתחברות למנגינה אחת.</p>'
      + '</div>'
      + '<button type="button" class="mm-play" data-act="lesson-play" data-testid="lesson-play" aria-label="השמעת הדוגמה: 3 צלילים ועוד 2"><span aria-hidden="true">▶</span>להשמיע</button>'
      + '<div class="mm-status" aria-live="polite" data-testid="lesson-status" data-audio="' + esc(state.audio || '') + '">' + esc(state.lessonStatus) + '</div>'
      + '<div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">'
      + '<div class="mm-small-print">המנגינה תמיד נעצרת לפני שהתרגילים מתחילים</div>'
      + '<button type="button" class="mm-btn mm-btn--white" data-act="lesson-done" data-testid="lesson-continue">לתרגילים ←</button>'
      + '</div></section>';
  }

  function currentProgress() { return store.progress(state.account.id, UNIT.id); }

  function currentQuestion() {
    const p = currentProgress();
    const i = Math.min(p.index, UNIT.questions.length - 1);
    return UNIT.questions[state.qState === 'right' || state.qState === 'revealed' ? state.shownIndex : i];
  }

  // ---------------------------------------------------------------- exercise
  function viewExercise() {
    const p = currentProgress();
    const q = currentQuestion();
    const qi = UNIT.questions.indexOf(q);
    const topic = U.TOPICS[q.topic];
    const rhythm = q.kind === 'rhythm';
    const right = state.qState === 'right', wrong = state.qState === 'wrong', retry = state.qState === 'retry', revealed = state.qState === 'revealed';
    const locked = right || revealed;
    const pending = rhythm ? state.choice : state.typed;
    const empty = pending == null || pending === '';
    const stage = right ? 'right' : revealed ? 'reveal' : 'question';
    const ansCls = 'mm-answer' + (empty && !locked ? ' is-empty' : '') + (right ? ' is-right' : '') + (wrong || revealed ? ' is-wrong' : '');
    const choiceText = function (id) { const c = M.CHOICES.filter(function (x) { return x.id === id; })[0]; return c ? c.fraction : ''; };
    const shownAnswer = revealed ? String(U.answerOf(q)) : (empty ? '?' : rhythm ? choiceText(pending) : pending);

    let fb = '';
    if (right) {
      fb = '<div class="mm-fb mm-fb--right" role="status" data-testid="feedback" data-result="right" data-audio="' + esc(state.audio) + '">'
        + '<div>כל הכבוד! ' + mathHtml(q).replace('?', String(U.answerOf(q))) + '</div>'
        + '<div class="mm-fb__sound" data-testid="feedback-sound">' + esc(soundLine('המנגינה התחברה וחזרה הביתה.')) + '</div></div>';
    } else if (wrong || retry) {
      fb = '<div class="mm-fb mm-fb--wrong" role="status" data-testid="feedback" data-result="' + (wrong ? 'wrong' : 'retry') + '" data-audio="' + esc(state.audio || '') + '">'
        + (wrong ? '<div>עוד לא. נסו שוב — יש לכם עוד ניסיון.</div><div class="mm-fb__sound" data-testid="feedback-sound">' + esc(soundLine('רמז במוזיקה: מקשיבים שוב, לאט, והמנגינה עוד לא חוזרת הביתה.')) + '</div>' : '')
        + '<div class="mm-hint"><div class="mm-hint__text" data-testid="hint">רמז: ' + esc(M.hint(q, state.lastChoice)) + '</div>'
        + (U.hintGroups(q).length ? '<div class="mm-hint__groups" aria-hidden="true">' + U.hintGroups(q).map(function (n) {
          return '<div class="mm-hint__group">' + '<span class="mm-hint__dot"></span>'.repeat(n) + '</div>';
        }).join('') + '</div>' : '') + '</div></div>';
    } else if (revealed) {
      fb = '<div class="mm-fb mm-fb--wrong" role="status" data-testid="feedback" data-result="revealed" data-audio="' + esc(state.audio || '') + '">'
        + '<div>התשובה היא <span class="ltr">' + U.answerOf(q) + '</span>. נתרגל את זה שוב בפעם הבאה.</div>'
        + '<div class="mm-fb__sound" data-testid="feedback-sound">' + esc(soundLine('כך נשמעת המנגינה עם התשובה.')) + '</div></div>';
    } else {
      fb = '<div class="mm-idle">' + (rhythm ? 'בחרו קצב ולחצו ״בדיקה״.' : 'כתבו תשובה ולחצו ״בדיקה״.') + '</div>';
    }

    let input;
    if (rhythm) {
      input = '<div class="mm-choices" role="group" aria-label="בחרו את הקצב שממלא את סוף התיבה" data-testid="choices">'
        + M.CHOICES.map(function (c, k) {
          const on = state.choice === c.id;
          return '<button type="button" class="mm-choice' + (on ? ' is-on' : '') + '" data-act="choose" data-choice="' + c.id + '" data-testid="choice-' + c.id + '" aria-pressed="' + on + '"' + (locked ? ' disabled' : '') + '>'
            + '<span class="mm-choice__sym" aria-hidden="true">' + c.symbol + '</span><span>' + esc(c.he) + '</span><span class="ltr mm-choice__frac">' + c.fraction + '</span><span class="sr-only"> (מקש ' + (k + 1) + ')</span></button>';
        }).join('') + '</div>';
    } else {
      const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clr', '0', 'del'];
      input = '<div class="mm-keypad" role="group" aria-label="מקלדת מספרים">' + keys.map(function (k) {
        const label = k === 'del' ? '⌫' : k === 'clr' ? 'נקה' : k;
        const aria = k === 'del' ? 'מחיקה' : k === 'clr' ? 'ניקוי' : k;
        return '<button type="button" class="mm-key' + (k === 'del' || k === 'clr' ? ' mm-key--tool' : '') + '" data-act="key" data-key="' + k + '" data-testid="key-' + k + '" aria-label="' + aria + '"' + (locked ? ' disabled' : '') + '>' + label + '</button>';
      }).join('') + '</div>';
    }

    const isLast = qi === UNIT.questions.length - 1;
    const submit = locked
      ? '<button type="button" class="mm-btn mm-btn--mint" data-act="next" data-testid="next">' + (isLast ? 'לסיכום ←' : 'לתרגיל הבא ←') + '</button>'
      : '<button type="button" class="mm-btn" data-act="check" data-testid="check"' + (empty ? ' disabled' : '') + '>בדיקה</button>';

    const dots = UNIT.questions.map(function (_, k) {
      return '<span class="mm-dot' + (k < qi ? ' is-done' : k === qi ? ' is-now' : '') + '"></span>';
    }).join('');

    return '<section class="mm-view mm-view--exercise" data-testid="view-exercise" data-qid="' + q.id + '" data-kind="' + (rhythm ? 'rhythm' : 'keypad') + '">'
      + topbar('תרגול', UNIT.title, '<span class="mm-badge" data-testid="star-count" aria-label="כוכבים">★ ' + firstTryCount(p) + '</span>')
      + '<div class="mm-progress"><span class="mm-sub" data-testid="q-progress">תרגיל ' + (qi + 1) + ' מתוך ' + UNIT.questions.length + '</span><div class="mm-dots" aria-hidden="true">' + dots + '</div></div>'
      + '<div class="mm-card"><div class="mm-task__row"><span class="mm-chip" data-testid="q-topic">' + esc(topic.name) + '</span>' + curriculumBadge(q.topic) + '</div>'
      + '<h2 class="mm-question" data-testid="q-text">' + mathHtml(q) + '</h2></div>'
      + musicCard(q, stage)
      + '<div class="' + ansCls + '" aria-live="polite" data-testid="answer" aria-label="התשובה שלכם">' + esc(shownAnswer) + '</div>'
      + fb + input + submit
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
    add: 'לנגן או למחוא שתי מנגינות קצרות אחת אחרי השנייה ולספור בקול את כל הצלילים — קודם את החלק הראשון, ואז להמשיך לספור קדימה.',
    sub: 'לנגן מנגינה, לכסות את הצלילים האחרונים ביד (✕) ולספור אחורה צליל אחד לכל צליל שהורדנו.',
    tens: 'לחזור על "צליל נמוך אחד = עשרת" עם לוח המאה: קודם הצליל הנמוך, ואז היחידות אחת־אחת.',
    frac: 'למחוא תיבה של 4 פעמות, ואז להחזיק תו אחד לאורך 2 פעמות ולשאול: איזה חלק מהתיבה הוא מילא?'
  };

  function curriculumIdsHtml(topicId) {
    return (CURRICULUM[topicId] || []).map(function (id) {
      return '<span class="mm-chip mm-chip--curr ltr" data-testid="report-curriculum">' + esc(id) + '</span>';
    }).join(' ');
  }

  function teacherReport() {
    return students().map(function (s) {
      const p = store.progress(s.id, UNIT.id);
      const rep = U.topicReport(p.results);
      const any = rep.some(function (t) { return t.done; });
      const gapRows = rep.filter(function (t) { return t.status === 'gap'; });
      let html = '<div class="mm-card" data-testid="report-student" data-student="' + esc(s.id) + '">'
        + '<div class="mm-task__row"><h3>' + esc(s.displayName) + '</h3><span class="mm-chip" data-testid="report-unit-status">' + esc(unitStatus(p).text) + '</span></div>';
      if (!any) return html + '<p data-testid="report-empty">אין עדיין תוצאות. הן יופיעו כאן אחרי שהתלמיד/ה יתרגל/תתרגל במכשיר הזה.</p></div>';
      html += '<div class="mm-table-wrap"><table class="mm-table" data-testid="report-table"><thead><tr><th scope="col">נושא</th><th scope="col">בתוכנית</th><th scope="col">נענו</th><th scope="col">נכון בניסיון ראשון</th><th scope="col">מצב</th></tr></thead><tbody>'
        + rep.map(function (t) {
          const pct = t.rate == null ? 0 : Math.round(t.rate * 100);
          const label = t.status === 'gap' ? 'פער' : t.status === 'ok' ? 'שולט/ת' : 'טרם';
          return '<tr data-testid="report-row" data-topic="' + t.topic + '" data-status="' + t.status + '">'
            + '<th scope="row">' + esc(t.name) + '</th><td>' + curriculumIdsHtml(t.topic) + '</td><td><span class="ltr">' + t.done + '/' + t.total + '</span></td>'
            + '<td><div style="display:flex;align-items:center;gap:6px"><div class="mm-meter' + (t.status === 'gap' ? ' is-gap' : '') + '" role="img" aria-label="' + pct + ' אחוז"><span style="width:' + pct + '%"></span></div><span class="ltr" data-testid="report-pct">' + pct + '%</span></div></td>'
            + '<td><span class="mm-chip' + (t.status === 'gap' ? ' mm-chip--rust' : t.status === 'ok' ? ' mm-chip--mint' : '') + '" data-testid="report-status">' + label + '</span></td></tr>';
        }).join('') + '</tbody></table></div>';
      html += '<h4 style="margin:6px 0 0">פערים</h4>';
      html += gapRows.length
        ? '<ul class="mm-gap-list" data-testid="gaps">' + gapRows.map(function (t) {
          return '<li data-testid="gap" data-topic="' + t.topic + '"><strong>' + esc(t.name) + '</strong> (<span class="ltr">' + esc((CURRICULUM[t.topic] || []).join(', ')) + '</span>) — ' + t.firstTry + ' מתוך ' + t.done + ' בניסיון ראשון. הצעה: ' + esc(ADVICE[t.topic]) + '</li>';
        }).join('') + '</ul>'
        : '<p data-testid="no-gaps">לא נמצאו פערים ביחידה הזו.</p>';
      return html + '</div>';
    }).join('');
  }

  // Which official topics the unit practises: the rows come from src/lib/curriculum.js
  // (topic id, grade, name, the verbatim quote and its page in the Ministry PDF).
  function coverageCard() {
    const read = G.SOURCE_READ ? ' (נקרא ב־' + G.SOURCE_READ + ')' : '';
    const rows = Object.keys(U.TOPICS).map(function (tid) {
      const qs = UNIT.questions.filter(function (q) { return q.topic === tid; });
      const curr = (CURRICULUM[tid] || []).map(curriculumRow).filter(Boolean);
      return '<tr data-testid="coverage-row" data-topic="' + tid + '">'
        + '<th scope="row">' + esc(U.TOPICS[tid].name) + '<div class="mm-sub">' + qs.length + ' ' + (qs.length === 1 ? 'תרגיל' : 'תרגילים') + ' · ' + esc(qs.map(function (q) { return U.questionText(q).replace(' = ?', '').replace(' + ? = 1', ' + ?'); }).join(' · ')) + '</div></th>'
        + '<td>' + (curr.length ? curr.map(function (r) {
          return '<div class="mm-curr" data-testid="coverage-topic" data-topic-id="' + esc(r.id) + '">'
            + '<span class="mm-chip mm-chip--curr ltr">' + esc(r.id) + '</span> <strong>כיתה ' + esc(r.grade) + '׳ · ' + esc(r.strand) + ':</strong> ' + esc(r.topic)
            + (r.quote ? '<div class="mm-quote">ציטוט מהתוכנית: «' + esc(r.quote) + '»</div>' : '')
            + '<a class="mm-link" href="' + esc(r.url) + '" target="_blank" rel="noopener noreferrer" data-testid="coverage-source">' + esc(r.file) + (r.page ? ', עמ׳ ' + r.page : '') + '</a>'
            + '</div>';
        }).join('') : '<span class="mm-sub">—</span>')
        + (CURRICULUM_NOTE[tid] ? '<div class="mm-sub" data-testid="coverage-note">' + esc(CURRICULUM_NOTE[tid]) + '</div>' : '')
        + '</td></tr>';
    }).join('');
    return '<div class="mm-card" data-testid="coverage"><h2>כיסוי תוכנית הלימודים</h2>'
      + '<p class="mm-sub">הנושאים הרשמיים (תוכנית משרד החינוך במתמטיקה ליסודי) שהיחידה מתרגלת. המזהים, השמות, הציטוטים והעמודים כפי שהם ב־<span class="ltr">src/lib/curriculum.js</span>' + esc(read) + '. תרגול בהדגמה לא אומר שהנושא כולו נלמד.</p>'
      + '<div class="mm-table-wrap"><table class="mm-table mm-table--cov"><thead><tr><th scope="col">ביחידה</th><th scope="col">בתוכנית הרשמית</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function whyCard() {
    const open = !!state.whyOpen;
    return '<div class="mm-card mm-why" data-testid="why">'
      + '<div class="mm-task__row"><h2>למה זה עובד?</h2>'
      + '<button type="button" class="mm-btn mm-btn--ink mm-btn--small" data-act="why" data-testid="why-open" aria-expanded="' + open + '" aria-controls="why-panel">' + (open ? 'סגירה' : 'מה המחקר אומר ומה לא') + '</button></div>'
      + '<p class="mm-sub">' + R.CLAIMS.length + ' טענות קצרות, כל אחת עם המקור שלה — למורים ולמבוגרים.</p>'
      + '<div id="why-panel" class="mm-why__panel" data-testid="why-panel"' + (open ? '' : ' hidden') + '>'
      + '<ol class="mm-why__list">' + R.CLAIMS.map(function (c) {
        return '<li data-testid="why-claim" data-claim="' + esc(c.id) + '"><h3>' + esc(c.title) + '</h3>'
          + '<p><strong>מה נמצא:</strong> ' + esc(c.shows) + '</p>'
          + '<p><strong>מה זה לא מראה:</strong> ' + esc(c.limits) + '</p>'
          + '<p class="mm-source" data-testid="why-source">מקור: ' + (c.url
            ? '<a class="mm-link" href="' + esc(c.url) + '" target="_blank" rel="noopener noreferrer"><span class="ltr">' + esc(c.source) + '</span></a>'
            : '<span class="ltr">' + esc(c.source) + '</span>') + '</p></li>';
      }).join('') + '</ol>'
      + '<p class="mm-honest" data-testid="why-honest">' + esc(R.HONESTY) + '</p>'
      + '<p class="mm-sub">' + esc(R.FROM) + '</p>'
      + '</div></div>';
  }

  function viewTeacher() {
    const acc = state.account;
    return '<section class="mm-view" data-testid="view-teacher">'
      + topbar('שלום, ' + acc.displayName, 'לוח המורה · הדגמה')
      + whyCard()
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
      + coverageCard()
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
    if (currentQuestion().kind === 'rhythm') {
      const c = M.CHOICES[Number(k) - 1];
      if (c) onChoose(c.id);
      return;
    }
    let t = state.qState === 'wrong' ? '' : state.typed;
    if (k === 'del') t = t.slice(0, -1);
    else if (k === 'clr') t = '';
    else if (t.length < 2) t = (t === '0' ? '' : t) + k;
    state.typed = t;
    if (state.qState === 'wrong') state.qState = 'retry';
    render();
  }

  function onChoose(id) {
    if (state.qState === 'right' || state.qState === 'revealed') return;
    state.choice = id;
    if (state.qState === 'wrong') state.qState = 'retry';
    render();
    const b = root.querySelector('[data-choice="' + id + '"]');
    if (b) b.focus();
  }

  function onCheck() {
    const p = currentProgress();
    const q = UNIT.questions[Math.min(p.index, UNIT.questions.length - 1)];
    const given = q.kind === 'rhythm' ? state.choice : state.typed;
    if (given == null || given === '') return;
    const prev = p.results[q.id] || { tries: 0 };
    const tries = (prev.tries || 0) + 1;
    state.lastChoice = q.kind === 'rhythm' ? given : null;
    if (U.isCorrect(q, given)) {
      saveResult(q.id, { tries: tries, correct: true, firstTry: tries === 1, revealed: false, at: Date.now() }, true);
      state.qState = 'right';
      state.shownIndex = UNIT.questions.indexOf(q);
    } else if (tries >= U.MAX_TRIES) {
      saveResult(q.id, { tries: tries, correct: false, firstTry: false, revealed: true, at: Date.now() }, true);
      state.qState = 'revealed';
      state.shownIndex = UNIT.questions.indexOf(q);
    } else {
      saveResult(q.id, { tries: tries, correct: false, firstTry: false, revealed: false }, false);
      state.qState = 'wrong';
    }
    // Render first (the notes on screen), then play: each note lights up as it sounds.
    render();
    playStage(q, state.qState === 'right' ? 'right' : state.qState === 'revealed' ? 'reveal' : 'hint', state.lastChoice);
    render();
    // Right/revealed: focus "next". Wrong: focus stays on the page so the child can try again.
    const fb = root.querySelector('[data-testid="next"]');
    if (fb && state.qState !== 'wrong') fb.focus();
  }

  function enterExercise() {
    go('exercise');
    const q = currentQuestion();
    if (q) playStage(q, 'question');
  }

  function onNext() {
    stopSound();
    const p = currentProgress();
    if (p.index >= UNIT.questions.length) {
      if (!p.completedAt) { p.completedAt = Date.now(); store.saveProgress(state.account.id, UNIT.id, p); }
      go('summary');
      return;
    }
    enterExercise();
  }

  root.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    const act = btn.getAttribute('data-act');
    if (act === 'signout') { store.signOut(); state.account = null; state.flash = ''; state.whyOpen = false; go('login'); return; }
    if (act === 'open-unit') {
      const p = currentProgress();
      state.lessonStatus = '';
      if (p.completedAt) go('summary');
      else if (!p.lessonDone) go('lesson');
      else enterExercise();
      return;
    }
    if (act === 'lesson-play') {
      const d = UNIT.lesson.demo;
      const demo = { id: 'lesson', music: 'join', a: d.a, op: '+', b: d.b };
      state.audio = M.play('lesson', M.plan(demo, 'right'), highlight);
      state.lessonStatus = (state.audio === 'played' ? '🔊 ' : '🔈 (בלי צליל במכשיר הזה) ') + 'שומעים 3 צלילים בפסנתר ועוד 2 בקסילופון = 5 צלילים, והמנגינה חוזרת הביתה.';
      const status = root.querySelector('[data-testid="lesson-status"]');
      if (status) { status.textContent = state.lessonStatus; status.setAttribute('data-audio', state.audio); }
      return;
    }
    if (act === 'lesson-done') {
      stopSound();
      const p = currentProgress();
      p.lessonDone = true;
      if (!p.startedAt) p.startedAt = Date.now();
      store.saveProgress(state.account.id, UNIT.id, p);
      enterExercise();
      return;
    }
    if (act === 'replay') {
      const q = currentQuestion();
      const stage = state.qState === 'right' ? 'right' : state.qState === 'revealed' ? 'reveal' : 'question';
      playStage(q, stage);
      return;
    }
    if (act === 'sound') {
      M.setMuted(!M.isMuted());
      render();
      const t = root.querySelector('[data-testid="sound-toggle"]');
      if (t) t.focus();
      return;
    }
    if (act === 'why') {
      state.whyOpen = !state.whyOpen;
      render();
      const t = root.querySelector('[data-testid="why-open"]');
      if (t) t.focus();
      return;
    }
    if (act === 'key') { onKey(btn.getAttribute('data-key')); return; }
    if (act === 'choose') { onChoose(btn.getAttribute('data-choice')); return; }
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

  // Physical keyboard on the exercise screen: digits, Backspace (on the
  // fraction exercise 1/2/3 pick a rhythm); Enter on a focused button clicks it.
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

  // Offline after the first visit: register the site's own service worker
  // (../sw.js, scope = site root, the same one every main page registers).
  // It precaches the pilot files, so a teacher who opened the demo once can
  // open it again without wifi. Needs https or localhost; a file:// page or a
  // browser without service workers just keeps working online.
  try {
    if (G.navigator && G.navigator.serviceWorker && G.isSecureContext) {
      G.navigator.serviceWorker.register('../sw.js').catch(function () {});
    }
  } catch (e) { /* no offline copy; the demo itself is unaffected */ }
})();
