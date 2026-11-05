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
  const BASE = G.MMPilotUnit;
  const M = music();
  const R = research();
  const CURRICULUM = BASE.CURRICULUM || {};      // older unit.js (MM-600) had no curriculum ids
  const CURRICULUM_NOTE = BASE.CURRICULUM_NOTE || {};
  // MM-610: many units. js/coverage.js lists them (the legacy "סופרים צלילים"
  // first, then js/units.js); js/score.js plans the music of the new ones and
  // js/checks.js holds the pre/post checks without music. Each is optional:
  // a missing file leaves the legacy unit working as before.
  const COV = coverage();
  const S = G.MMPilotScore || { plan: function () { return { rows: [], notes: [], svg: '' }; }, describe: function () { return ''; } };
  const K = G.MMPilotChecks || { checkFor: function () { return []; }, score: function () { return null; }, compare: function () { return {}; } };
  const SOURCES = (G.MMPilotUnits && G.MMPilotUnits.SOURCES) || {};
  const UNITS = COV.allUnits();
  let UNIT = UNITS[0];
  // The unit helpers of js/unit.js, bound to the open unit unless one is passed.
  const U = Object.assign({}, BASE, {
    topicReport: function (r, u) { return BASE.topicReport(r, u || UNIT); },
    gaps: function (r, u) { return BASE.gaps(r, u || UNIT); },
    stars: function (r, u) { return BASE.stars(r, u || UNIT); }
  });

  function coverage() {
    const c = G.MMPilotCoverage;
    if (c && typeof c.allUnits === 'function' && typeof c.map === 'function') return c;
    try { G.console.warn('[MelodyMath pilot] js/coverage.js is unavailable: only the first unit is shown.'); } catch (e) { /* no console */ }
    const legacy = Object.assign({}, BASE.UNIT, { legacy: true, topics: typeof BASE.topicsOf === 'function' ? BASE.topicsOf() : [] });
    return {
      allUnits: function () { return [legacy]; },
      map: function () { return { total: 0, covered: 0, rows: [] }; },
      currOf: function (u, q) { return CURRICULUM[q.topic] || []; }
    };
  }
  function unitById(id) { return UNITS.filter(function (u) { return u.id === id; })[0] || null; }
  function isLegacyQ(q) { return !q.kind || q.kind === 'rhythm'; }
  function hasChecks(u) { return K.checkFor((u || UNIT).id, 'pre').length > 0; }
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
    const notes = isLegacyQ(q) ? M.plan(q, stage, choice) : S.plan(q.music, stage).notes;
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

  function unitStatus(p, unit) {
    const u = unit || UNIT;
    if (p.completedAt && hasChecks(u) && !p.post) return { key: 'post', text: 'נשארה בדיקה קצרה אחרי' };
    if (p.completedAt) return { key: 'done', text: 'הושלמה' };
    const answered = Object.keys(p.results).filter(function (k) { return p.results[k].correct || p.results[k].revealed; }).length;
    if (p.lessonDone || answered || p.pre) return { key: 'progress', text: 'בתהליך · ' + answered + ' מתוך ' + u.questions.length };
    return { key: 'new', text: 'טרם התחילו' };
  }

  // "לפני 1/3 · אחרי 3/3" — the checks without music, before and after the unit.
  function prepostText(p) {
    const c = K.compare(p.pre, p.post);
    if (!c || !c.pre) return '';
    return 'לפני ' + c.pre + (c.post ? ' · אחרי ' + c.post : ' · אחרי: עוד לא');
  }
  function prepostHtml(p, testid) {
    const t = prepostText(p);
    if (!t) return '';
    const c = K.compare(p.pre, p.post);
    return '<span class="mm-chip mm-chip--prepost" data-testid="' + testid + '" data-pre="' + esc(c.pre) + '" data-post="' + esc(c.post || '') + '"'
      + (c.change != null ? ' data-change="' + c.change + '"' : '') + '><span class="ltr">' + esc(t) + '</span></span>';
  }
  function changeText(c) {
    if (!c || c.change == null) return '';
    return c.change > 0 ? 'שיפור של ' + c.change : c.change === 0 ? 'ללא שינוי' : 'ירידה של ' + (-c.change);
  }

  // Optional media slots (MM-614, content from later): a unit illustration,
  // a child-level sentence per exercise (whyKid), and a narration per exercise.
  // Each is hidden when its file is missing, so the demo never depends on them.
  function unitArt(u) {
    return '<img class="mm-unit-art" data-testid="unit-art" src="../assets/pilot/units/' + esc(u.id) + '.webp" alt="' + esc('איור ליחידה: ' + u.title) + '" width="96" height="96" loading="lazy" decoding="async">';
  }
  const narrationOk = {};
  function narrationUrl(q) { return '../sounds/pilot/' + encodeURIComponent(q.id) + '.mp3'; }
  function probeNarration(q) {
    const btn = root.querySelector('[data-testid="narration"]');
    if (!btn || !G.fetch) return;
    const show = function () { const b = root.querySelector('[data-testid="narration"][data-q="' + q.id + '"]'); if (b) b.hidden = false; };
    if (narrationOk[q.id] === true) { show(); return; }
    if (narrationOk[q.id] === false) return;
    G.fetch(narrationUrl(q), { method: 'HEAD' }).then(function (r) {
      narrationOk[q.id] = !!(r && r.ok && /audio/.test(r.headers.get('content-type') || 'audio'));
      if (narrationOk[q.id]) show();
    }).catch(function () { narrationOk[q.id] = false; });
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
  function signOutClean() { state.preview = null; UNIT = UNITS[0]; }

  // ---------------------------------------------------------------- views
  // Inside a unit a student can go back to the list of units without signing
  // out; progress is already saved per exercise, so the unit resumes where it
  // was. A teacher preview has its own "חזרה ללוח" bar, so it gets no second one.
  const IN_UNIT = ['lesson', 'exercise', 'check-pre', 'check-post'];
  function topbar(title, sub, end) {
    const back = state.account && state.account.role !== 'teacher' && !state.preview && IN_UNIT.indexOf(state.view) >= 0;
    return '<div class="mm-topbar">'
      + '<div class="mm-topbar__actions">'
      + '<button type="button" class="mm-icon-btn" data-act="signout" data-testid="signout">יציאה</button>'
      + (back ? '<button type="button" class="mm-icon-btn" data-act="home" data-testid="units-home" aria-label="חזרה לרשימת היחידות">היחידות</button>' : '')
      + '</div>'
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

  // The unit shown first on the student's home: the newest assignment, else
  // the unit last opened on this device, else the first unit.
  function featuredUnit(acc) {
    const tasks = store.assignmentsFor(acc.id).slice().sort(function (a, b) { return b.createdAt - a.createdAt; });
    const fromTask = tasks.length ? unitById(tasks[0].unitId) : null;
    return fromTask || unitById(typeof store.lastUnit === 'function' ? store.lastUnit() : null) || UNITS[0];
  }

  function viewStudentHome() {
    const acc = state.account;
    const unit = featuredUnit(acc);
    const p = store.progress(acc.id, unit.id);
    const st = unitStatus(p, unit);
    const tasks = store.assignmentsFor(acc.id);
    const startLabel = st.key === 'done' ? 'לצפייה בסיכום' : (st.key === 'new' ? 'מתחילים ←' : 'ממשיכים מהמקום שעצרנו ←');
    let html = '<section class="mm-view" data-testid="view-student-home">'
      + topbar('שלום, ' + acc.displayName, 'כיתה ' + (acc.grade || 'א׳–ג׳'))
      + '<h2 class="sr-only">המשימות שלי</h2>';
    if (tasks.length) {
      html += '<div class="mm-card mm-task" data-testid="assignment-card">'
        + '<span class="mm-chip mm-chip--yellow">משימה מהמורה</span>'
        + tasks.map(function (t) {
          const u = unitById(t.unitId);
          return '<h3 data-testid="assignment-title">' + esc(u ? u.title : t.unitId) + '</h3>'
            + '<p class="mm-sub">הוקצתה ב־' + esc(fmtDate(t.createdAt)) + '</p>'
            + (t.note ? '<p class="mm-teacher-note" data-testid="assignment-note">' + esc(t.note) + '</p>' : '');
        }).join('')
        + '</div>';
    } else {
      html += '<div class="mm-card" data-testid="no-assignment"><p>אין עדיין משימה מהמורה. אפשר לתרגל את היחידה בינתיים.</p></div>';
    }
    html += '<div class="mm-card mm-card--ink mm-task" data-testid="unit-card" data-unit="' + esc(unit.id) + '">'
      + '<div class="mm-task__row"><h3>' + esc(unit.title) + '</h3><span class="mm-chip" data-testid="unit-status" data-status="' + st.key + '">' + esc(st.text) + '</span></div>'
      + '<p class="mm-sub">' + esc(unit.subtitle) + ' · כיתות ' + esc(unit.grades) + ' · ' + (hasChecks(unit) ? 'בדיקה קצרה, ' : '') + 'שיעור קצר ו־' + unit.questions.length + ' תרגילים</p>'
      + (st.key === 'done' ? '<p data-testid="unit-stars" aria-label="' + U.stars(p.results, unit) + ' כוכבים">' + starsText(U.stars(p.results, unit)) + '</p>' : '')
      + prepostHtml(p, 'unit-prepost')
      + '<button type="button" class="mm-btn" data-act="open-unit" data-unit="' + esc(unit.id) + '" data-testid="open-unit">' + startLabel + '</button>'
      + '</div>';
    // MM-610: every other unit of the demo, so a class can practise all of grades 1–3.
    const others = UNITS.filter(function (u) { return u.id !== unit.id; });
    html += '<div class="mm-card" data-testid="unit-list"><h3>עוד יחידות</h3><ul class="mm-unit-list">'
      + others.map(function (u) {
        const up = store.progress(acc.id, u.id);
        const us = unitStatus(up, u);
        return '<li class="mm-unit-row" data-testid="unit-row" data-unit="' + esc(u.id) + '">'
          + '<div class="mm-unit-row__text"><strong>' + esc(u.title) + '</strong><span class="mm-sub">כיתות ' + esc(u.grades) + ' · ' + u.questions.length + ' תרגילים</span>'
          + '<span class="mm-chip" data-testid="unit-row-status" data-status="' + us.key + '">' + esc(us.text) + '</span>' + prepostHtml(up, 'unit-row-prepost') + '</div>'
          + '<button type="button" class="mm-btn mm-btn--white mm-btn--small" data-act="open-unit" data-unit="' + esc(u.id) + '" data-testid="open-unit-' + esc(u.id) + '" aria-label="פתיחת היחידה ' + esc(u.title) + '">פתיחה</button></li>';
      }).join('') + '</ul></div>'
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

  function curriculumBadge(q) {
    const ids = COV.currOf(UNIT, q) || [];
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

  // ---------------------------------------------------------------- MM-610: new units' music on screen
  const KIND_HE = {
    beats: 'תיבות ופעמות', steps: 'צעדים בסולם', place: 'כלי לכל מקום במספר', pattern: 'דגם שחוזר',
    pitch: 'עמודות שמתנגנות', durations: 'משכי תווים בתיבה', turn: 'סיבוב שלם = תיבה', shape: 'צורה = לולאה של פעמות', tempo: 'שני קצבים באותו זמן',
    contrast: 'גבוה או נמוך, ארוך או קצר', canon: 'אותם משפטים, סדר אחר', body: 'מחיאות ורקיעות', solid: 'קודקוד, מקצוע, פאה'
  };

  // The planned score (js/score.js) drawn as rows of groups of tokens; each
  // token has the data-chip its note lights up, so sound and picture match.
  function scoreHtml(plan) {
    let count = 0;
    const rows = plan.rows.map(function (r) {
      return '<div class="mm-sc__row ' + esc(r.cls) + '">' + (r.label ? '<div class="mm-sc__label">' + esc(r.label) + '</div>' : '')
        + '<div class="mm-sc__groups">' + r.groups.map(function (g) {
          return '<div class="mm-sc__group ' + esc(g.cls) + '"><div class="mm-sc__tokens">' + g.tokens.map(function (k) {
            if (k.role !== 'rest' && k.role !== 'silence') count++;
            return '<span class="mm-tok mm-tok--' + esc(k.role) + '" data-chip="' + k.chip + '" data-role="' + esc(k.role) + '" style="--step:' + k.step + ';--w:' + k.w + '">' + esc(k.t) + '</span>';
          }).join('') + '</div>' + (g.label ? '<span class="mm-sc__glabel">' + esc(g.label) + '</span>' : '') + '</div>';
        }).join('') + '</div></div>';
    }).join('');
    return (plan.svg ? '<div class="mm-sc__art" aria-hidden="true">' + plan.svg + '</div>' : '')
      + '<div class="mm-sc" dir="ltr" aria-hidden="true" data-testid="music-notes" data-count="' + count + '">' + rows + '</div>';
  }

  function scoreCard(q, stage) {
    const solved = stage === 'right' || stage === 'reveal';
    return '<div class="mm-card mm-music" data-testid="music-card" data-music-kind="' + esc(q.music.kind) + '">'
      + '<div class="mm-music__head"><span class="mm-chip mm-chip--yellow">שלב 2 · שומעים ורואים: ' + esc(KIND_HE[q.music.kind] || '') + '</span></div>'
      + scoreHtml(S.plan(q.music, stage))
      + '<p class="mm-caption" data-testid="music-caption" data-stage="' + (solved ? 'solved' : 'open') + '">' + esc(q.hear) + '</p>'
      + '<p class="sr-only" data-testid="music-describe">' + esc(S.describe(q.music, stage)) + '</p>'
      + '<div class="mm-row-actions">'
      + '<button type="button" class="mm-btn mm-btn--white mm-btn--small" data-act="replay" data-testid="replay">▶ ' + (solved ? 'להשמיע שוב, עם הסיום' : 'להשמיע') + '</button>'
      + soundToggle()
      + '</div></div>';
  }

  // The child's lesson screen: only which musical skill builds which math skill.
  // The research behind it (evidence level, sources, limits) is for adults and
  // stays in the teacher view (unitsCard) — MM-610 audit 5.11, section ג.
  function childSkillHtml(u) {
    const k = u.skill;
    if (!k) return '';
    return '<div class="mm-skill" data-testid="unit-skill" data-unit="' + esc(u.id) + '">'
      + '<p><strong>🎵 ' + esc(k.music) + '</strong> ← בונה → <strong>🔢 ' + esc(k.math) + '</strong></p></div>';
  }

  // Which musical skill builds which math skill, with the research it rests on.
  function skillHtml(u, testid) {
    const k = u.skill;
    if (!k) return '';
    const src = (k.sources || []).map(function (id) {
      const s = SOURCES[id];
      if (!s) return '<span class="ltr">' + esc(id) + '</span>';
      return s.url ? '<a class="mm-link" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer"><span class="ltr">' + esc(s.cite) + '</span></a>' : '<span class="ltr">' + esc(s.cite) + '</span>';
    }).join(' · ');
    return '<div class="mm-skill" data-testid="' + (testid || 'unit-skill') + '" data-unit="' + esc(u.id) + '">'
      + '<p><strong>🎵 ' + esc(k.music) + '</strong> ← בונה → <strong>🔢 ' + esc(k.math) + '</strong></p>'
      + '<p class="mm-sub">' + esc(k.why) + '</p>'
      + (k.limits ? '<p class="mm-sub">מה זה לא מראה: ' + esc(k.limits) + '</p>' : '')
      + '<p class="mm-sub">רמת ראיה: <strong>' + esc(k.level) + '</strong>. מקורות (MM-503 §2): ' + src + '</p></div>';
  }

  // ---------------------------------------------------------------- lesson
  function viewLesson() {
    const L = UNIT.lesson;
    if (!UNIT.legacy) {
      return '<section class="mm-view mm-view--lesson" data-testid="view-lesson" data-unit="' + esc(UNIT.id) + '">'
        + topbar('שיעור', UNIT.title)
        + '<div class="mm-card">' + unitArt(UNIT) + '<h2>' + esc(L.title) + '</h2><ul class="mm-lesson-lines">'
        + L.lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul></div>'
        + '<div class="mm-card mm-music" data-testid="lesson-music"><div class="mm-music__head"><span class="mm-chip mm-chip--yellow">דוגמה</span></div>'
        + scoreHtml(S.plan(L.demo, 'question'))
        + '<p class="mm-caption" data-testid="lesson-caption">' + esc(L.caption) + '</p></div>'
        + '<div class="mm-card"><h3>מה המוזיקה בונה כאן</h3>' + childSkillHtml(UNIT) + '</div>'
        + '<button type="button" class="mm-play" data-act="lesson-play" data-testid="lesson-play" aria-label="השמעת הדוגמה"><span aria-hidden="true">▶</span>להשמיע</button>'
        + '<div class="mm-status" aria-live="polite" data-testid="lesson-status" data-audio="' + esc(state.audio || '') + '">' + esc(state.lessonStatus) + '</div>'
        + '<div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">'
        + '<div class="mm-small-print">המנגינה תמיד נעצרת לפני שהתרגילים מתחילים</div>'
        + '<button type="button" class="mm-btn mm-btn--white" data-act="lesson-done" data-testid="lesson-continue">לתרגילים ←</button>'
        + '</div></section>';
    }
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
      + (UNIT.skill ? '<div class="mm-card"><h3>מה המוזיקה בונה כאן</h3>' + childSkillHtml(UNIT) + '</div>' : '')
      + '<button type="button" class="mm-play" data-act="lesson-play" data-testid="lesson-play" aria-label="השמעת הדוגמה: 3 צלילים ועוד 2"><span aria-hidden="true">▶</span>להשמיע</button>'
      + '<div class="mm-status" aria-live="polite" data-testid="lesson-status" data-audio="' + esc(state.audio || '') + '">' + esc(state.lessonStatus) + '</div>'
      + '<div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">'
      + '<div class="mm-small-print">המנגינה תמיד נעצרת לפני שהתרגילים מתחילים</div>'
      + '<button type="button" class="mm-btn mm-btn--white" data-act="lesson-done" data-testid="lesson-continue">לתרגילים ←</button>'
      + '</div></section>';
  }

  // ---------------------------------------------------------------- MM-610: checks before and after (no music)
  function viewCheck(phase) {
    const items = K.checkFor(UNIT.id, phase);
    const pre = phase === 'pre';
    return '<section class="mm-view" data-testid="view-check" data-phase="' + phase + '" data-unit="' + esc(UNIT.id) + '">'
      + topbar(pre ? 'בדיקה קצרה — לפני' : 'בדיקה קצרה — אחרי', UNIT.title)
      + '<div class="mm-card"><p>' + (pre
        ? 'לפני שמתחילים: ' + items.length + ' שאלות קצרות, בלי מוזיקה ובלי רמזים. זה לא מבחן — רק כדי לראות אחר כך כמה התקדמתם.'
        : 'סיימתם את התרגילים! עוד ' + items.length + ' שאלות קצרות בלי מוזיקה — לראות מה למדתם.') + '</p></div>'
      + '<form class="mm-card" data-testid="check-form" data-phase="' + phase + '" novalidate>'
      + items.map(function (it, i) {
        return '<label class="mm-field" data-testid="check-item">' + (i + 1) + '. ' + esc(it.q)
          + '<input name="' + esc(it.id) + '" data-testid="check-input-' + esc(it.id) + '" inputmode="numeric" autocomplete="off" dir="ltr" maxlength="6" aria-label="תשובה לשאלה ' + (i + 1) + '"></label>';
      }).join('')
      + '<button type="submit" class="mm-btn" data-testid="check-submit">' + (pre ? 'סיימתי, לשיעור ←' : 'סיימתי, לסיכום ←') + '</button>'
      + '</form></section>';
  }

  function currentProgress() { return state.preview ? state.preview.p : store.progress(state.account.id, UNIT.id); }
  function saveP(p) {
    if (state.preview) { state.preview.p = p; return; }
    store.saveProgress(state.account.id, UNIT.id, p);
  }

  function currentQuestion() {
    const p = currentProgress();
    const i = Math.min(p.index, UNIT.questions.length - 1);
    return UNIT.questions[state.qState === 'right' || state.qState === 'revealed' ? state.shownIndex : i];
  }

  function thinkHtml(q) {
    if (!q.think) return '';
    return '<div class="mm-card mm-think" data-testid="think"><span class="mm-chip">שלב 1 · חושבים</span><p>' + esc(q.think) + '</p></div>';
  }

  // Step 3: why — after a right answer, after a wrong one, and when the answer is shown.
  function whyHtml(q) {
    const s = state.qState;
    if (!(s === 'right' || s === 'wrong' || s === 'retry' || s === 'revealed') || !q.right) return '';
    const kind = s === 'right' ? 'right' : s === 'revealed' ? 'reveal' : 'wrong';
    const title = kind === 'right' ? 'שלב 3 · למה זה נכון?' : kind === 'reveal' ? 'שלב 3 · כך חושבים על זה:' : 'שלב 3 · בואו נבין:';
    // shown after two wrong tries: the same explanation, without the praise that opens it
    const text = kind === 'wrong' ? q.wrong : kind === 'reveal' ? q.right.replace(/^נכון(?:\s*[—–-]|[!.,:])?\s*/, '') : q.right;
    return '<div class="mm-why-fb mm-why-fb--' + kind + '" data-testid="why-feedback" data-kind="' + kind + '"><strong>' + esc(title) + '</strong>'
      + '<p data-testid="why-text">' + esc(text) + '</p>'
      + (q.whyKid && kind !== 'wrong' ? '<p class="mm-why-kid" data-testid="why-kid">' + esc(q.whyKid) + '</p>' : '') + '</div>';
  }

  // ---------------------------------------------------------------- exercise
  function viewExercise() {
    const p = currentProgress();
    const q = currentQuestion();
    const qi = UNIT.questions.indexOf(q);
    const topic = U.topicsOf(UNIT).filter(function (t) { return t.id === q.topic; })[0] || { name: '' };
    const rhythm = q.kind === 'rhythm';
    const picks = rhythm || q.kind === 'choice';
    const right = state.qState === 'right', wrong = state.qState === 'wrong', retry = state.qState === 'retry', revealed = state.qState === 'revealed';
    const locked = right || revealed;
    const pending = picks ? state.choice : state.typed;
    const empty = pending == null || pending === '';
    const stage = right ? 'right' : revealed ? 'reveal' : 'question';
    const ansCls = 'mm-answer' + (empty && !locked ? ' is-empty' : '') + (right ? ' is-right' : '') + (wrong || revealed ? ' is-wrong' : '');
    const choiceText = function (id) {
      if (q.kind === 'choice') { const o = U.choiceOf(q, id); return o ? o.label : ''; }
      const c = M.CHOICES.filter(function (x) { return x.id === id; })[0]; return c ? c.fraction : '';
    };
    const shownAnswer = revealed ? String(U.answerOf(q)) : (empty ? '?' : picks ? choiceText(pending) : pending);

    let fb = '';
    if (right) {
      fb = '<div class="mm-fb mm-fb--right" role="status" data-testid="feedback" data-result="right" data-audio="' + esc(state.audio) + '">'
        + '<div>כל הכבוד! ' + mathHtml(q).replace('?', String(U.answerOf(q))) + '</div>'
        + '<div class="mm-fb__sound" data-testid="feedback-sound">' + esc(soundLine('המנגינה התחברה וחזרה הביתה.')) + '</div></div>';
    } else if (wrong || retry) {
      fb = '<div class="mm-fb mm-fb--wrong" role="status" data-testid="feedback" data-result="' + (wrong ? 'wrong' : 'retry') + '" data-audio="' + esc(state.audio || '') + '">'
        + (wrong ? '<div>עוד לא. נסו שוב — יש לכם עוד ניסיון.</div><div class="mm-fb__sound" data-testid="feedback-sound">' + esc(soundLine('רמז במוזיקה: מקשיבים שוב, לאט, והמנגינה עוד לא חוזרת הביתה.')) + '</div>' : '')
        + (!isLegacyQ(q) ? '</div>' : '<div class="mm-hint"><div class="mm-hint__text" data-testid="hint">רמז: ' + esc(M.hint(q, state.lastChoice)) + '</div>'
        + (U.hintGroups(q).length ? '<div class="mm-hint__groups" aria-hidden="true">' + U.hintGroups(q).map(function (n) {
          return '<div class="mm-hint__group">' + '<span class="mm-hint__dot"></span>'.repeat(n) + '</div>';
        }).join('') + '</div>' : '') + '</div></div>');
    } else if (revealed) {
      fb = '<div class="mm-fb mm-fb--wrong" role="status" data-testid="feedback" data-result="revealed" data-audio="' + esc(state.audio || '') + '">'
        + '<div>התשובה היא <span class="ltr">' + U.answerOf(q) + '</span>. נתרגל את זה שוב בפעם הבאה.</div>'
        + '<div class="mm-fb__sound" data-testid="feedback-sound">' + esc(soundLine('כך נשמעת המנגינה עם התשובה.')) + '</div></div>';
    } else {
      fb = '<div class="mm-idle">' + (rhythm ? 'בחרו קצב ולחצו ״בדיקה״.' : picks ? 'בחרו תשובה ולחצו ״בדיקה״.' : 'כתבו תשובה ולחצו ״בדיקה״.') + '</div>';
    }

    let input;
    if (q.kind === 'choice') {
      input = '<div class="mm-choices' + (q.choices.length === 4 ? ' mm-choices--4' : q.choices.length === 2 ? ' mm-choices--2' : '') + '" role="group" aria-label="בחרו תשובה" data-testid="choices">'
        + q.choices.map(function (c, k) {
          const on = state.choice === c.id;
          return '<button type="button" class="mm-choice' + (on ? ' is-on' : '') + '" data-act="choose" data-choice="' + esc(c.id) + '" data-testid="choice-' + esc(c.id) + '" aria-pressed="' + on + '"' + (locked ? ' disabled' : '') + '>'
            + (c.sym ? '<span class="mm-choice__sym" aria-hidden="true">' + esc(c.sym) + '</span>' : '') + '<span class="mm-choice__frac">' + esc(c.label) + '</span><span class="sr-only"> (מקש ' + (k + 1) + ')</span></button>';
        }).join('') + '</div>';
    } else if (rhythm) {
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

    // "Play the answer": a drum pad for exercises whose answer is a number of
    // beats. A tap sounds a beat, fills a dot in a bar of `per` beats and is the
    // answer; the keypad below writes the same number.
    let tapPad = '';
    if (q.kind === 'num' && q.tap) {
      const per = q.tap.per || 4;
      const n = empty || wrong ? 0 : Math.min(TAP_MAX, Number(pending) || 0);
      let bars = '';
      for (let b = 0; b * per < Math.max(n, 1); b++) {
        let dots = '';
        for (let j = 0; j < per; j++) {
          const i = b * per + j;
          dots += '<span class="mm-tap__dot' + (i >= n ? ' is-empty' : j === 0 ? ' is-first' : '') + '"></span>';
        }
        bars += '<span class="mm-tap__bar">' + dots + '</span>';
      }
      tapPad = '<div class="mm-card mm-tap" data-testid="tap-pad" data-count="' + n + '">'
        + '<div class="mm-music__head"><span class="mm-chip mm-chip--yellow">מנגנים את התשובה</span></div>'
        + '<p class="mm-sub">הקישו על התוף פעם אחת לכל פעימה. אפשר גם לכתוב את המספר במקלדת.</p>'
        + '<div class="mm-tap__bars" dir="ltr" aria-hidden="true">' + bars + '</div>'
        + '<div class="mm-row-actions">'
        + '<button type="button" class="mm-btn mm-tap__drum" data-act="tap" data-testid="tap"' + (locked ? ' disabled' : '') + '>🥁 פעימה</button>'
        + '<button type="button" class="mm-btn mm-btn--white mm-btn--small" data-act="untap" data-testid="untap" aria-label="להוריד פעימה אחת"' + (locked || !n ? ' disabled' : '') + '>↶ פעימה אחורה</button>'
        + '</div></div>';
    }

    const isLast = qi === UNIT.questions.length - 1;
    const submit = locked
      ? '<button type="button" class="mm-btn mm-btn--mint" data-act="next" data-testid="next">' + (isLast ? (state.preview ? 'חזרה ללוח המורה ←' : hasChecks() ? 'לבדיקה הקצרה ←' : 'לסיכום ←') : 'לתרגיל הבא ←') + '</button>'
      : '<button type="button" class="mm-btn" data-act="check" data-testid="check"' + (empty ? ' disabled' : '') + '>בדיקה</button>';

    const dots = UNIT.questions.map(function (_, k) {
      return '<span class="mm-dot' + (k < qi ? ' is-done' : k === qi ? ' is-now' : '') + '"></span>';
    }).join('');

    const legacy = isLegacyQ(q);
    const qHead = legacy ? mathHtml(q)
      : esc(q.q) + (q.show ? '<span class="mm-show" aria-hidden="false">' + esc(q.show) + '</span>' : '') + (q.expr ? '<span class="ltr mm-expr">' + esc(q.expr) + '</span>' : '');
    return '<section class="mm-view mm-view--exercise" data-testid="view-exercise" data-unit="' + esc(UNIT.id) + '" data-qid="' + q.id + '" data-kind="' + (rhythm ? 'rhythm' : picks ? 'choice' : 'keypad') + '"' + (state.preview ? ' data-preview="1"' : '') + '>'
      + topbar('תרגול', UNIT.title, '<span class="mm-badge" data-testid="star-count" aria-label="כוכבים">★ ' + firstTryCount(p) + '</span>')
      + (state.preview ? '<div class="mm-preview-bar" data-testid="preview-bar"><span>תצוגה מקדימה למורה — לא נשמר בדוח</span><button type="button" class="mm-btn mm-btn--white mm-btn--small" data-act="preview-exit" data-testid="preview-exit">חזרה ללוח</button></div>' : '')
      + '<div class="mm-progress"><span class="mm-sub" data-testid="q-progress">תרגיל ' + (qi + 1) + ' מתוך ' + UNIT.questions.length + '</span><div class="mm-dots" aria-hidden="true">' + dots + '</div></div>'
      + '<div class="mm-card"><div class="mm-task__row"><span class="mm-chip" data-testid="q-topic">' + esc(topic.name) + '</span>' + curriculumBadge(q) + '</div>'
      + '<h2 class="mm-question' + (legacy ? '' : ' mm-question--text') + '" data-testid="q-text">' + qHead + '</h2>'
      + '<button type="button" class="mm-btn mm-btn--white mm-btn--small" data-act="narrate" data-q="' + esc(q.id) + '" data-testid="narration" hidden>🔊 הקראה</button></div>'
      + thinkHtml(q)
      + (legacy ? musicCard(q, stage) : scoreCard(q, stage))
      + '<div class="' + ansCls + '" aria-live="polite" data-testid="answer" aria-label="התשובה שלכם">' + esc(shownAnswer) + '</div>'
      + fb + whyHtml(q) + tapPad + input + submit
      + '</section>';
  }

  function firstTryCount(p) {
    return Object.keys(p.results).filter(function (k) { return p.results[k].firstTry; }).length;
  }

  function prepostCheer(p) {
    const c = K.compare(p.pre, p.post);
    if (!c || c.change == null) return '';
    if (c.change > 0) return 'עליתם ב־' + c.change + ' — רואים שהתרגול עזר!';
    if (p.post && p.post.score === p.post.total) return 'הכול נכון גם לפני וגם אחרי — כל הכבוד!';
    return 'ממשיכים לתרגל — כל פעם קצת יותר.';
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
      + (p.pre ? '<div class="mm-card mm-prepost" data-testid="summary-prepost"><h3>בדיקה בלי מוזיקה: לפני ואחרי</h3>' + prepostHtml(p, 'prepost')
        + '<p class="mm-sub">' + esc(prepostCheer(p)) + '</p></div>' : '')
      + '<div class="mm-saved" data-testid="saved">✓ ההתקדמות נשמרה במכשיר הזה. המורה יראה אותה בדוח.</div>'
      + '<button type="button" class="mm-btn" data-act="home" data-testid="home">חזרה למסך הבית</button>'
      + '</section>';
  }

  function teacherAssignments() {
    const rows = store.assignments();
    if (!rows.length) return '<p data-testid="no-assignments">עדיין לא הוקצו משימות.</p>';
    return '<div class="mm-table-wrap"><table class="mm-table" data-testid="assignments-table"><thead><tr><th scope="col">תלמיד/ה</th><th scope="col">משימה</th><th scope="col">הוקצתה</th><th scope="col">מצב</th></tr></thead><tbody>'
      + rows.map(function (a) {
        const s = accountById(a.studentId);
        const u = unitById(a.unitId) || UNITS[0];
        const st = unitStatus(store.progress(a.studentId, a.unitId), u);
        return '<tr data-testid="assignment-row" data-unit="' + esc(a.unitId) + '"><td>' + esc(s ? s.displayName : a.studentId) + '</td><td>' + esc(u.title) + '</td><td>' + esc(fmtDate(a.createdAt)) + '</td>'
          + '<td><span class="mm-chip' + (st.key === 'done' ? ' mm-chip--mint' : '') + '" data-testid="assignment-status" data-status="' + st.key + '">' + esc(st.text) + '</span></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function topicOf(unit, tid) { return U.topicsOf(unit).filter(function (t) { return t.id === tid; })[0] || {}; }

  function curriculumIdsHtml(unit, topicId) {
    return (topicOf(unit, topicId).curr || []).map(function (id) {
      return '<span class="mm-chip mm-chip--curr ltr" data-testid="report-curriculum">' + esc(id) + '</span>';
    }).join(' ');
  }

  // Every student × unit with a check before, for the class summary and the CSV.
  function checkRows() {
    const rows = [];
    students().forEach(function (s) {
      UNITS.forEach(function (unit) {
        const p = store.progress(s.id, unit.id);
        if (p.pre) rows.push({ student: s.displayName, unit: unit.id, pre: p.pre, post: p.post || null });
      });
    });
    return rows;
  }

  // How much the class improved on the checks without music, and what that does
  // and does not show. The numbers are percent of the check items answered right.
  function classGainCard() {
    if (typeof K.classSummary !== 'function') return '';
    const rows = checkRows();
    const sum = K.classSummary(rows);
    const title = function (id) { const u = unitById(id); return u ? u.title : id; };
    const sign = function (v) { return (v > 0 ? '+' : '') + v; };
    let body;
    if (!sum.all.n) {
      body = '<p class="mm-sub" data-testid="class-gain-empty">' + (sum.started ? 'יש בדיקות לפני, אבל עוד אין תלמיד/ה שעשה/תה גם את הבדיקה אחרי.' : 'אין עדיין בדיקות במכשיר הזה.') + '</p>';
    } else {
      const a = sum.all;
      body = '<p data-testid="class-gain-all" data-n="' + a.n + '" data-children="' + a.children + '" data-gain="' + a.gain + '">'
        + '<strong>' + a.children + '</strong> ' + (a.children === 1 ? 'ילד/ה' : 'ילדים') + ', <strong>' + a.n + '</strong> זוגות של לפני ואחרי: ממוצע <span class="ltr">' + a.pre + '%</span> לפני ו־<span class="ltr">' + a.post + '%</span> אחרי, '
        + 'שינוי של <strong class="ltr">' + sign(a.gain) + '</strong> נקודות אחוז. השתפרו ' + a.improved + ', ללא שינוי ' + a.same + ', ירדו ' + a.declined + '.'
        + (a.d != null ? ' גודל אפקט (לפני־אחרי) <span class="ltr">d = ' + a.d + '</span>.' : '') + '</p>'
        + '<div class="mm-table-wrap"><table class="mm-table" data-testid="class-gain-table"><thead><tr><th scope="col">יחידה</th><th scope="col">זוגות</th><th scope="col">לפני</th><th scope="col">אחרי</th><th scope="col">שינוי</th></tr></thead><tbody>'
        + sum.byUnit.map(function (u) {
          return '<tr data-testid="class-gain-row" data-unit="' + esc(u.unit) + '" data-gain="' + u.gain + '"><th scope="row">' + esc(title(u.unit)) + '</th><td>' + u.n + '</td>'
            + '<td><span class="ltr">' + u.pre + '%</span></td><td><span class="ltr">' + u.post + '%</span></td><td><strong class="ltr">' + sign(u.gain) + '</strong></td></tr>';
        }).join('') + '</tbody></table></div>'
        + (a.ceiling ? '<p class="mm-sub">' + a.ceiling + ' מהזוגות התחילו עם הכול נכון כבר לפני, ולכן לא יכלו להראות שיפור.</p>' : '');
    }
    return '<div class="mm-card" data-testid="class-gain"><h3>כמה הכיתה השתפרה? בדיקה בלי מוזיקה, לפני ואחרי</h3>' + body
      + '<p class="mm-sub" data-testid="class-gain-limits">מה זה לא מראה: אין כאן קבוצת השוואה, כל בדיקה היא 2–3 שאלות, והבדיקה אחרי נעשית מיד בסוף היחידה. '
      + 'שיפור כאן יכול לבוא גם מעצם התרגול. כדי לדעת כמה המוזיקה עצמה תורמת, משווים לכיתה דומה שמתרגלת את אותו חומר בלי מוזיקה, באותו זמן, עם אותן בדיקות.'
      + (sum.all.n && sum.all.children < 10 ? ' עם פחות מ־10 ילדים התוצאה עוד לא יציבה, גם כשיש הרבה יחידות.' : '') + '</p>'
      + (rows.length ? '<div class="mm-row-actions"><button type="button" class="mm-btn mm-btn--white mm-btn--small" data-act="export-checks" data-testid="export-checks">הורדת הנתונים לגיליון (CSV)</button></div>' : '')
      + '</div>';
  }

  // The check results as a CSV file on this device (nothing is sent anywhere).
  function exportChecks() {
    if (typeof K.toCsv !== 'function') return;
    const csv = K.toCsv(checkRows());
    try {
      const blob = new G.Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
      const a = G.document.createElement('a');
      a.href = G.URL.createObjectURL(blob);
      a.download = 'melodymath-checks-' + new Date().toISOString().slice(0, 10) + '.csv';
      a.setAttribute('data-testid', 'export-link');
      G.document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { G.URL.revokeObjectURL(a.href); }, 1000);
    } catch (e) { /* no download in this browser */ }
  }

  // Per student, per unit with any data on this device: the before/after check
  // (without music), the report by topic, and the gaps with a suggestion.
  function teacherReport() {
    return students().map(function (s) {
      let html = '<div class="mm-card" data-testid="report-student" data-student="' + esc(s.id) + '">'
        + '<div class="mm-task__row"><h3>' + esc(s.displayName) + '</h3></div>';
      const blocks = UNITS.map(function (unit) {
        const p = store.progress(s.id, unit.id);
        const rep = U.topicReport(p.results, unit);
        const any = rep.some(function (t) { return t.done; });
        if (!any && !p.pre) return '';
        const gapRows = rep.filter(function (t) { return t.status === 'gap'; });
        const c = K.compare(p.pre, p.post);
        let b = '<div class="mm-report-unit" data-testid="report-unit" data-unit="' + esc(unit.id) + '">'
          + '<div class="mm-task__row"><h4>' + esc(unit.title) + '</h4><span class="mm-chip" data-testid="report-unit-status">' + esc(unitStatus(p, unit).text) + '</span></div>';
        if (c && c.pre) {
          b += '<p class="mm-prepost-line" data-testid="report-prepost" data-pre="' + esc(c.pre) + '" data-post="' + esc(c.post || '') + '"' + (c.change != null ? ' data-change="' + c.change + '"' : '') + '>'
            + 'בדיקה בלי מוזיקה: לפני <span class="ltr">' + esc(c.pre) + '</span> · אחרי <span class="ltr">' + esc(c.post || '—') + '</span>'
            + (c.change != null ? ' · <strong data-testid="report-change">' + esc(changeText(c)) + '</strong>' : '') + '</p>';
        }
        if (!any) return b + '<p class="mm-sub">התרגילים עוד לא התחילו.</p></div>';
        b += '<div class="mm-table-wrap"><table class="mm-table" data-testid="report-table"><thead><tr><th scope="col">נושא</th><th scope="col">בתוכנית</th><th scope="col">נענו</th><th scope="col">נכון בניסיון ראשון</th><th scope="col">מצב</th></tr></thead><tbody>'
          + rep.map(function (t) {
            const pct = t.rate == null ? 0 : Math.round(t.rate * 100);
            const label = t.status === 'gap' ? 'פער' : t.status === 'ok' ? 'שולט/ת' : 'טרם';
            return '<tr data-testid="report-row" data-topic="' + t.topic + '" data-status="' + t.status + '">'
              + '<th scope="row">' + esc(t.name) + '</th><td>' + curriculumIdsHtml(unit, t.topic) + '</td><td><span class="ltr">' + t.done + '/' + t.total + '</span></td>'
              + '<td><div style="display:flex;align-items:center;gap:6px"><div class="mm-meter' + (t.status === 'gap' ? ' is-gap' : '') + '" role="img" aria-label="' + pct + ' אחוז"><span style="width:' + pct + '%"></span></div><span class="ltr" data-testid="report-pct">' + pct + '%</span></div></td>'
              + '<td><span class="mm-chip' + (t.status === 'gap' ? ' mm-chip--rust' : t.status === 'ok' ? ' mm-chip--mint' : '') + '" data-testid="report-status">' + label + '</span></td></tr>';
          }).join('') + '</tbody></table></div>';
        b += '<h5 style="margin:6px 0 0;font-size:15px">פערים</h5>';
        b += gapRows.length
          ? '<ul class="mm-gap-list" data-testid="gaps">' + gapRows.map(function (t) {
            const tp = topicOf(unit, t.topic);
            return '<li data-testid="gap" data-topic="' + t.topic + '"><strong>' + esc(t.name) + '</strong> (<span class="ltr">' + esc((tp.curr || []).join(', ')) + '</span>) — ' + t.firstTry + ' מתוך ' + t.done + ' בניסיון ראשון. הצעה: ' + esc(tp.advice || '') + '</li>';
          }).join('') + '</ul>'
          : '<p data-testid="no-gaps">לא נמצאו פערים ביחידה הזו.</p>';
        return b + '</div>';
      }).join('');
      if (!blocks) return html + '<p data-testid="report-empty">אין עדיין תוצאות. הן יופיעו כאן אחרי שהתלמיד/ה יתרגל/תתרגל במכשיר הזה.</p></div>';
      return html + blocks + '</div>';
    }).join('');
  }

  // MM-610: every grades 1–3 topic of the official programme (read from
  // src/lib/curriculum.js by js/coverage.js) → covered or not, with links that
  // open each exercise as a teacher preview (nothing is saved to the report).
  function coverageMapCard() {
    const m = COV.map();
    const byGrade = {};
    m.rows.forEach(function (r) { (byGrade[r.grade] = byGrade[r.grade] || []).push(r); });
    return '<div class="mm-card" data-testid="coverage-map"><h2>מפת כיסוי: כל נושאי כיתות א׳–ג׳</h2>'
      + '<p class="mm-sub" data-testid="coverage-summary" data-covered="' + m.covered + '" data-total="' + m.total + '"><strong>' + m.covered + ' מתוך ' + m.total + '</strong> הנושאים של כיתות א׳–ג׳ בתוכנית משרד החינוך מתורגלים בהדגמה, בכל תרגיל עם מוזיקה ועם הסבר «למה». הרשימה נקראת מ־<span class="ltr">src/lib/curriculum.js</span>. תרגול בהדגמה לא אומר שהנושא כולו נלמד. לחיצה על תרגיל פותחת אותו בתצוגה מקדימה.</p>'
      + Object.keys(byGrade).map(function (g) {
        return '<h3 class="mm-cov-grade">כיתה ' + esc(g) + '׳</h3><ul class="mm-cov-list">' + byGrade[g].map(function (r) {
          const ok = r.status === 'covered';
          return '<li class="mm-cov-row" data-testid="coverage-map-row" data-topic-id="' + esc(r.id) + '" data-status="' + r.status + '">'
            + '<div class="mm-cov-row__head"><span class="mm-chip mm-chip--curr ltr">' + esc(r.id) + '</span> <strong>' + esc(r.topic) + '</strong> '
            + '<span class="mm-chip ' + (ok ? 'mm-chip--mint' : 'mm-chip--rust') + '" data-testid="coverage-map-status">' + (ok ? 'מכוסה' : 'לא מכוסה') + '</span></div>'
            + (ok ? r.units.map(function (u) {
              const unit = unitById(u.id);
              return '<div class="mm-cov-unit"><span class="mm-sub">' + esc(u.title) + ':</span> ' + u.questions.map(function (qid) {
                const n = unit ? unit.questions.findIndex(function (q) { return q.id === qid; }) + 1 : 0;
                return '<a class="mm-ex-link" href="#preview/' + esc(u.id) + '/' + esc(qid) + '" data-act="preview" data-unit="' + esc(u.id) + '" data-q="' + esc(qid) + '" data-testid="coverage-ex-link" aria-label="תצוגה מקדימה: ' + esc(u.title) + ', תרגיל ' + n + '">תרגיל ' + n + '</a>';
              }).join('') + '</div>';
            }).join('') : '')
            + '</li>';
        }).join('') + '</ul>';
      }).join('')
      + '</div>';
  }

  // The demo's units: what each musical skill builds, and a preview link.
  function unitsCard() {
    return '<div class="mm-card" data-testid="units-card"><h2>יחידות ההדגמה: איזו מיומנות מוזיקלית בונה איזו מיומנות מתמטית</h2>'
      + '<p class="mm-sub">' + UNITS.length + ' יחידות, ' + UNITS.reduce(function (n, u) { return n + u.questions.length; }, 0) + ' תרגילים. בכל יחידה בדיקה קצרה בלי מוזיקה לפני ואחרי. המקורות מתוך <span class="ltr">docs/research/MM-503-music.md</span> ו־<span class="ltr">docs/RESEARCH.md</span>; MelodyMath עצמו עוד לא נבדק בניסוי.</p>'
      + '<ul class="mm-unit-list">' + UNITS.map(function (u) {
        return '<li class="mm-unit-skill" data-testid="unit-skill-row" data-unit="' + esc(u.id) + '"><div class="mm-task__row"><h3>' + esc(u.title) + ' <span class="mm-sub">· כיתות ' + esc(u.grades) + ' · ' + u.questions.length + ' תרגילים</span></h3>'
          + '<a class="mm-ex-link" href="#preview/' + esc(u.id) + '/' + esc(u.questions[0].id) + '" data-act="preview" data-unit="' + esc(u.id) + '" data-q="' + esc(u.questions[0].id) + '" data-testid="unit-preview-link">תצוגה מקדימה</a></div>'
          + skillHtml(u, 'unit-skill') + '</li>';
      }).join('') + '</ul></div>';
  }

  // Which official topics the unit practises: the rows come from src/lib/curriculum.js
  // (topic id, grade, name, the verbatim quote and its page in the Ministry PDF).
  // MM-610: kept for "סופרים צלילים" (with quotes and PDF pages), under the full map.
  function coverageCard() {
    const LU = UNITS[0];
    const read = G.SOURCE_READ ? ' (נקרא ב־' + G.SOURCE_READ + ')' : '';
    const rows = Object.keys(U.TOPICS).map(function (tid) {
      const qs = LU.questions.filter(function (q) { return q.topic === tid; });
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
    return '<details class="mm-card mm-details" data-testid="coverage"><summary><h2>פירוט: «' + esc(LU.title) + '» מול התוכנית — ציטוטים ועמודים</h2></summary>'
      + '<p class="mm-sub">הנושאים הרשמיים (תוכנית משרד החינוך במתמטיקה ליסודי) שהיחידה מתרגלת. המזהים, השמות, הציטוטים והעמודים כפי שהם ב־<span class="ltr">src/lib/curriculum.js</span>' + esc(read) + '. תרגול בהדגמה לא אומר שהנושא כולו נלמד.</p>'
      + '<div class="mm-table-wrap"><table class="mm-table mm-table--cov"><thead><tr><th scope="col">ביחידה</th><th scope="col">בתוכנית הרשמית</th></tr></thead><tbody>' + rows + '</tbody></table></div></details>';
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
      + '<label class="mm-field">יחידה<select name="unit" data-testid="assign-unit">' + UNITS.map(function (u) { return '<option value="' + esc(u.id) + '">' + esc(u.title + ' (' + u.grades + ')') + '</option>'; }).join('') + '</select></label>'
      + '<label class="mm-field">הערה לתלמיד/ה (לא חובה)<textarea name="note" maxlength="140" data-testid="assign-note"></textarea></label>'
      + '<button type="submit" class="mm-btn" data-testid="assign-submit">הקצאה</button>'
      + '<div class="mm-status" aria-live="polite" data-testid="assign-status">' + esc(state.flash) + '</div>'
      + '</form>'
      + '<div class="mm-card"><h2>משימות שהוקצו</h2>' + teacherAssignments() + '</div>'
      + '</div>'
      + coverageMapCard()
      + unitsCard()
      + coverageCard()
      + '<section class="mm-view" aria-labelledby="report-title" data-testid="report"><h2 id="report-title" style="margin:6px 0 0">דוח לפי נושא ופערים</h2>'
      + '<p class="mm-sub">פער = פחות מ־' + Math.round(U.GAP_THRESHOLD * 100) + '% מהתרגילים בנושא נפתרו בניסיון הראשון. «לפני/אחרי» = בדיקה קצרה בלי מוזיקה, לפני היחידה ואחריה (2–3 שאלות: סימן, לא ציון). הנתונים מהמכשיר הזה בלבד.</p>'
      + classGainCard() + teacherReport() + '</section>'
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
      : v === 'check-pre' ? viewCheck('pre')
      : v === 'check-post' ? viewCheck('post')
      : viewTeacher();
    root.setAttribute('data-view', v);
    if (v === 'exercise') probeNarration(currentQuestion());
  }

  // MM-610: opening a unit runs pre-check → lesson → exercises → post-check → summary.
  function openUnit(id) {
    UNIT = unitById(id) || UNITS[0];
    state.preview = null;
    if (typeof store.setLastUnit === 'function') store.setLastUnit(UNIT.id);
    const p = currentProgress();
    state.lessonStatus = '';
    if (hasChecks() && !p.pre) go('check-pre');
    else if (p.completedAt && hasChecks() && !p.post) go('check-post');
    else if (p.completedAt) go('summary');
    else if (!p.lessonDone) go('lesson');
    else enterExercise();
  }

  // Teacher preview of one exercise (from the coverage map): nothing is saved.
  function openPreview(unitId, qid) {
    const u = unitById(unitId);
    if (!u) return;
    UNIT = u;
    const i = Math.max(0, u.questions.findIndex(function (q) { return q.id === qid; }));
    state.preview = { p: { lessonDone: true, index: i, results: {}, completedAt: null, startedAt: null } };
    enterExercise();
  }

  function exitPreview() {
    stopSound();
    state.preview = null;
    UNIT = UNITS[0];
    go('teacher');
  }

  function saveResult(qid, row, advance) {
    const p = currentProgress();
    p.results[qid] = row;
    if (advance) p.index = Math.max(p.index, UNIT.questions.findIndex(function (q) { return q.id === qid; }) + 1);
    if (!p.startedAt) p.startedAt = Date.now();
    saveP(p);
  }

  function onKey(k) {
    if (state.qState === 'right' || state.qState === 'revealed') return;
    const cq = currentQuestion();
    if (cq.kind === 'choice') {
      const o = cq.choices[Number(k) - 1];
      if (o) onChoose(o.id);
      return;
    }
    if (cq.kind === 'rhythm') {
      const c = M.CHOICES[Number(k) - 1];
      if (c) onChoose(c.id);
      return;
    }
    let t = state.qState === 'wrong' ? '' : state.typed;
    if (k === 'del') t = t.slice(0, -1);
    else if (k === 'clr') t = '';
    else if (t.length < (cq.kind === 'num' ? 5 : 2)) t = (t === '0' ? '' : t) + k;
    state.typed = t;
    if (state.qState === 'wrong') state.qState = 'retry';
    render();
  }

  // One tap = one beat of the answer. The first beat of each bar is lower and
  // gets a drum, so the child hears the grouping while playing it.
  const TAP_MAX = 40;
  function onTap(d) {
    if (state.qState === 'right' || state.qState === 'revealed') return;
    const cq = currentQuestion();
    if (!cq || cq.kind !== 'num' || !cq.tap) return;
    let n = state.qState === 'wrong' ? 0 : (Number(state.typed) || 0);
    n = Math.max(0, Math.min(TAP_MAX, n + d));
    state.typed = n ? String(n) : '';
    if (state.qState === 'wrong') state.qState = 'retry';
    if (d > 0 && n > 0) {
      const first = (n - 1) % (cq.tap.per || 4) === 0;
      const notes = [{ note: '', hz: first ? 392 : 523.25, at: 0, dur: 0.18, voice: cq.tap.voice || 'woodBar', role: 'tap', chip: null, gain: first ? 0.26 : 0.2 }];
      if (first) notes.push({ note: '', hz: 110, at: 0, dur: 0.12, voice: 'frameDrum', role: 'drum', chip: null, gain: 0.2 });
      M.play(cq.id + ':tap', notes);
    }
    render();
    const b = root.querySelector('[data-act="tap"]');
    if (b) b.focus();
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
    const given = q.kind === 'rhythm' || q.kind === 'choice' ? state.choice : state.typed;
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
    if (state.preview && p.index >= UNIT.questions.length) { exitPreview(); return; }
    if (p.index >= UNIT.questions.length) {
      if (!p.completedAt) { p.completedAt = Date.now(); saveP(p); }
      go(hasChecks() && !p.post ? 'check-post' : 'summary');
      return;
    }
    enterExercise();
  }

  root.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    const act = btn.getAttribute('data-act');
    if (act === 'signout') { signOutClean(); store.signOut(); state.account = null; state.flash = ''; state.whyOpen = false; go('login'); return; }
    if (act === 'open-unit') { openUnit(btn.getAttribute('data-unit') || UNITS[0].id); return; }
    if (act === 'preview') { e.preventDefault(); openPreview(btn.getAttribute('data-unit'), btn.getAttribute('data-q')); return; }
    if (act === 'preview-exit') { exitPreview(); return; }
    if (act === 'narrate') {
      try { const a = new G.Audio(narrationUrl(currentQuestion())); a.play().catch(function () {}); } catch (err) { /* no audio element */ }
      return;
    }
    if (act === 'lesson-play' && !UNIT.legacy) {
      state.audio = M.play('lesson:' + UNIT.id, S.plan(UNIT.lesson.demo, 'question').notes, highlight);
      state.lessonStatus = (state.audio === 'played' ? '🔊 ' : '🔈 (בלי צליל במכשיר הזה) ') + UNIT.lesson.caption;
      const st = root.querySelector('[data-testid="lesson-status"]');
      if (st) { st.textContent = state.lessonStatus; st.setAttribute('data-audio', state.audio); }
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
      saveP(p);
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
    if (act === 'tap') { onTap(1); return; }
    if (act === 'untap') { onTap(-1); return; }
    if (act === 'choose') { onChoose(btn.getAttribute('data-choice')); return; }
    if (act === 'check') { onCheck(); return; }
    if (act === 'next') { onNext(); return; }
    if (act === 'home') { if (state.account && state.account.role === 'teacher') exitPreview(); else go('student-home'); return; }
    if (act === 'export-checks') { exportChecks(); return; }
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
    if (form.getAttribute('data-testid') === 'check-form') {
      const phase = form.getAttribute('data-phase');
      const answers = {};
      K.checkFor(UNIT.id, phase).forEach(function (it) { answers[it.id] = form[it.id] ? form[it.id].value : ''; });
      const p = currentProgress();
      p[phase] = K.score(UNIT.id, phase, answers);
      if (!p.startedAt) p.startedAt = Date.now();
      saveP(p);
      if (phase === 'post') { go('summary'); return; }
      if (!p.lessonDone) go('lesson'); else enterExercise();
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
  // MM-610: an optional unit illustration that is not there yet hides itself.
  root.addEventListener('error', function (e) {
    const t = e.target;
    if (t && t.classList && t.classList.contains('mm-unit-art')) t.hidden = true;
  }, true);
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
