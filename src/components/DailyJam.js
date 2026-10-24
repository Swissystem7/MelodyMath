// MelodyMath — DailyJam screen (#591, owner proposal 5/5).
//
// A short daily review that mixes items from topics already learned
// (Leitner schedule, scheduler.js). No new method: each item keeps the one
// primary way of its topic (M1 counting, M2 times tables, M3 fractions, M6
// patterns, from instruments.TOPICS; dosage rule 4). Each completed jam adds
// one bar to the child's song of the week (weeklySong.js); on day 7 the
// whole song plays. A missed day deletes nothing, and there are no points,
// alerts or streak penalties. The polyrhythm bonus (M4, weak evidence) shows
// only after the jam is done, in grades ה׳-ו׳. The music switch shows every
// item without sound. State functions and renderHtml are pure and tested.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_DAILY_JAM = api;
  if (typeof document !== 'undefined' && document.getElementById('djCard')) api.mount(document.getElementById('djCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const S = root.MM_REVIEW_SCHEDULER || require('../lib/review/scheduler.js');
  const W = root.MM_WEEKLY_SONG || require('../lib/review/weeklySong.js');
  const INST = typeof root.forTopic === 'function' ? root : require('../lib/instruments.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const GAME = 'dailyJam';
  const HISTORY_KEY = 'mm.review.history';
  const GRADE_KEY = 'mm.jam.grade';
  const TOPICS = ['counting', 'multiplication', 'fractions', 'patterns'];
  const VOICE = { M1: 'metalBell', M2: 'drumHigh', M3: 'drumLow', M6: 'woodBar' };
  const WAY_HE = { M1: 'ספירה לפי פעמה', M2: 'פעמות מודגשות', M3: 'משכי תווים', M6: 'תבניות' };
  const C = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25];
  const TOPIC_PRIMARY = {};
  TOPICS.forEach(function (t) { TOPIC_PRIMARY[t] = INST.TOPICS[t].mechanism; });

  // Items: { he, answer, choices, beats } — beats is what "▶ שמעו" plays.
  const BANK = {
    counting: [5, 7, 4, 9, 6].map(function (n) { return { he: 'כמה צלילים?', dots: n, answer: n, choices: [n - 1, n, n + 1], beats: n }; }),
    multiplication: [[3, 4], [4, 6], [5, 3], [2, 8], [6, 3]].map(function (p) { return { he: p[0] + ' × ' + p[1] + ' = ?', answer: p[0] * p[1], choices: [p[0] * p[1] - p[0], p[0] * p[1], p[0] * p[1] + p[0]], beats: p[1] }; }),
    fractions: [['1/2 + 1/4 + ? = 1', '1/4'], ['1/4 + 1/4 + ? = 1', '1/2'], ['1/2 + ? = 1', '1/2'], ['3/4 + ? = 1', '1/4'], ['1/8 + 1/8 + ? = 1/2', '1/4']].map(function (p) { return { he: p[0] + ' (תיבה)', answer: p[1], choices: ['1/8', '1/4', '1/2'], beats: 4 }; }),
    patterns: [[[2, 4, 6], 8], [[1, 1, 2, 1, 1], 2], [[5, 10, 15], 20], [[3, 6, 9], 12], [[1, 2, 1, 2], 1]].map(function (p) {
      return { he: p[0].join(', ') + ', ?', seq: p[0], answer: p[1], choices: [p[1] - 1, p[1], p[1] + 1].filter(function (x) { return x > 0; }), beats: p[0].length };
    }),
  };

  function today(clock) { return new Date(clock ? clock() : Date.now()).toISOString().slice(0, 10); }

  function itemsFor(date) {
    const shift = Math.abs(S.daysBetween('2026-01-01', date)) % 5;
    const out = {};
    TOPICS.forEach(function (t) { out[t] = BANK[t].slice(shift).concat(BANK[t].slice(0, shift)); });
    return out;
  }

  function createState(o) {
    const date = o.date;
    const history = o.history || [];
    const jam = S.buildDailyJam(date, history, { topicPrimary: TOPIC_PRIMARY, itemsByTopic: itemsFor(date), count: 6 });
    const song = o.song || W.createSong(date);
    const done = song.bars.some(function (b) { return b.date === date; });
    return { date: date, history: history, jam: jam, song: song, grade: o.grade || 3, showMusic: o.showMusic !== false, pos: 0, phase: !jam.ok ? 'setup' : done ? 'done' : 'jam', picked: null, message: '' };
  }

  // First use: the child (or parent) marks the topics already learned.
  function seed(state, topics) {
    const h = state.history.concat(topics.map(function (t) { return { topic: t, date: S.addDays(state.date, -1), correct: true }; }));
    return createState({ date: state.date, history: h, song: state.song, grade: state.grade, showMusic: state.showMusic });
  }

  function answer(state, value) {
    if (state.phase !== 'jam' || state.picked != null) return state;
    const it = state.jam.items[state.pos];
    const right = String(value) === String(it.item.answer);
    return Object.assign({}, state, {
      picked: String(value), history: state.history.concat([{ topic: it.topic, date: state.date, correct: right }]),
      message: right ? 'נכון!' : 'התשובה: ' + it.item.answer + '. נחזור לזה בקרוב.',
    });
  }

  function next(state) {
    if (state.picked == null) return state;
    if (state.pos + 1 < state.jam.items.length) return Object.assign({}, state, { pos: state.pos + 1, picked: null, message: '' });
    const r = W.completeDay(state.song, state.date, { topics: state.jam.topics });
    return Object.assign({}, state, { song: r.song, phase: 'done', picked: null, message: r.added ? 'הג׳אם של היום הושלם: נוספה תיבה לשיר השבוע.' : '' });
  }

  function itemPlan(it, voice) {
    const n = it.item.beats || 4;
    const out = [];
    for (let i = 0; i < n; i++) out.push({ at: i * 0.4, voice: voice, hz: C[(it.item.seq ? it.item.seq[i] - 1 : i) % 8] || C[0] });
    return out;
  }

  // One bar per completed day: one note per topic of that day, in its voice.
  function songPlan(song) {
    const notes = [];
    song.bars.forEach(function (bar, b) {
      (bar.topics || []).slice(0, 4).forEach(function (t, i) { notes.push({ at: (b * 4 + i) * 0.35, voice: VOICE[TOPIC_PRIMARY[t]] || 'woodBar', hz: C[(b + i * 2) % 8] }); });
    });
    return notes;
  }

  function renderHtml(state) {
    const e = JAM.esc;
    const on = state.showMusic;
    const head = '<div class="jam-head"><span class="tag">ג׳אם יומי · חזרה מרווחת ומעורבת</span>' + JAM.musicToggleHtml(on) + '</div><h3>' + (on ? '🎧 ג׳אם יומי' : 'חזרה יומית') + '</h3>';
    const week = '<div class="dj-week" role="img" aria-label="שיר השבוע: ' + state.song.bars.length + ' תיבות מתוך 7">' + [1, 2, 3, 4, 5, 6, 7].map(function (d) {
      return '<span class="dj-day' + (state.song.bars.some(function (b) { return b.day === d; }) ? ' full' : '') + '">' + d + '</span>';
    }).join('') + '</div>';
    let body = '';
    if (state.phase === 'setup') {
      body = '<p class="jam-prompt">אילו נושאים כבר למדתם? (לפחות 3)</p><div class="jam-row">' + TOPICS.map(function (t) {
        return '<label class="dj-topic"><input type="checkbox" data-topic="' + t + '" checked> ' + e(INST.TOPICS[t].he) + '</label>';
      }).join('') + '</div><div class="jam-row"><button type="button" class="primary" data-act="seed">מתחילים</button></div>';
    } else if (state.phase === 'jam') {
      const it = state.jam.items[state.pos];
      const m = it.primary.mechanism;
      const dots = it.item.dots ? '<p class="dj-dots" aria-hidden="' + on + '">' + new Array(it.item.dots + 1).join('● ') + '</p>' : '';
      body = '<p><span class="tag">' + m + ' · ' + e(WAY_HE[m]) + ' · ' + e(INST.TOPICS[it.topic].he) + '</span> <small>פריט ' + (state.pos + 1) + ' מתוך ' + state.jam.items.length + '</small></p>' +
        '<p class="jam-prompt"><bdi dir="ltr">' + e(it.item.he) + '</bdi></p>' + (on ? '' : dots) +
        (on ? '<div class="jam-row"><button type="button" class="secondary" data-act="hear">▶ שמעו</button></div>' : '') +
        '<div class="jam-row" role="group" aria-label="תשובות">' + it.item.choices.map(function (c) {
          return '<button type="button" class="jam-pad" data-act="answer" data-value="' + e(c) + '"' + (on ? ' data-tap="' + VOICE[m] + '"' : '') + (state.picked != null ? ' disabled' : '') + '><bdi dir="ltr">' + e(c) + '</bdi></button>';
        }).join('') + '</div>' + (state.picked != null ? '<div class="jam-row"><button type="button" class="secondary" data-act="next">הבא ←</button></div>' : '');
    } else {
      const play = W.songToPlay(state.song, state.date);
      body = '<p class="jam-prompt">סיימתם את הג׳אם של היום. אפשר לחזור מחר, ויום שמפספסים לא מוחק כלום.</p>' +
        (play && on ? '<div class="jam-row"><button type="button" class="primary" data-act="song">▶ שיר השבוע שלכם</button></div>' : '<p>ביום השביעי תשמעו את כל השיר.</p>');
      const bonus = S.bonusFor(state.jam, true, state.grade);
      body += '<div class="jam-row" role="group" aria-label="כיתה">' + [1, 2, 3, 4, 5, 6].map(function (g) {
        return '<button type="button" class="jam-pad" data-act="grade" data-grade="' + g + '" aria-pressed="' + (g === state.grade) + '">' + 'אבגדהו'[g - 1] + '׳</button>';
      }).join('') + '</div>';
      if (bonus) {
        body += '<div class="jam-extra" data-evidence="' + bonus.evidence + '" data-mechanism="' + bonus.mechanism + '"><h4>' + e(bonus.he) + '</h4><p>2 נגד 3: אחרי כמה פעמות הם נפגשים שוב?</p>' +
          (on ? '<div class="jam-row"><button type="button" class="secondary" data-act="poly">▶ 2 נגד 3</button></div>' : '') +
          '<div class="jam-row">' + [5, 6, 8].map(function (n) { return '<button type="button" class="jam-pad" data-act="bonus" data-value="' + n + '">' + n + '</button>'; }).join('') + '</div></div>';
      }
    }
    return head + week + body + '<p class="jam-msg" role="status" aria-live="polite">' + e(state.message) + '</p>';
  }

  function mount(el, opts) {
    const store = root.localStorage;
    const clock = opts && opts.clock;
    function load(k, d) { try { const v = JSON.parse(store.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
    const date = today(clock);
    let state = createState({ date: date, history: load(HISTORY_KEY, []), song: W.loadSong(store, date), grade: load(GRADE_KEY, 3), showMusic: JAM.loadShowMusic(GAME) });
    let playing = null;
    JAM.registerTapVoices();
    function stop() { if (playing) playing.stop(); playing = null; }
    function save() {
      try { store.setItem(HISTORY_KEY, JSON.stringify(state.history)); store.setItem(GRADE_KEY, JSON.stringify(state.grade)); } catch (e) { /* private mode */ }
      W.saveSong(store, state.song);
    }
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      stop();
      if (act === 'hear') { const it = state.jam.items[state.pos]; playing = JAM.playNotes(itemPlan(it, VOICE[it.primary.mechanism])); return; }
      if (act === 'song') { playing = JAM.playNotes(songPlan(state.song)); return; }
      if (act === 'poly') { playing = JAM.playNotes([0, 1, 2, 3, 4, 5].map(function (i) { return { at: i * 0.3, voice: 'drumLow' }; }).concat([0, 1, 2, 3].map(function (i) { return { at: i * 0.45, voice: 'metalBell', hz: 660 }; })).sort(function (a, c) { return a.at - c.at; })); return; }
      if (act === 'seed') state = seed(state, Array.prototype.slice.call(el.querySelectorAll('[data-topic]')).filter(function (x) { return x.checked; }).map(function (x) { return x.getAttribute('data-topic'); }));
      else if (act === 'answer') { state = answer(state, b.getAttribute('data-value')); if (state.showMusic) JAM.feedback(state.message === 'נכון!'); }
      else if (act === 'next') state = next(state);
      else if (act === 'grade') state = Object.assign({}, state, { grade: Number(b.getAttribute('data-grade')) });
      else if (act === 'bonus') state = Object.assign({}, state, { message: b.getAttribute('data-value') === '6' ? 'נכון: 6 היא הכפולה המשותפת הקטנה של 2 ו־3.' : 'נסו שוב: ספרו עד ששתי הפעמות נופלות יחד.' });
      else if (act === 'music') { state = Object.assign({}, state, { showMusic: !state.showMusic }); JAM.saveShowMusic(GAME, state.showMusic); }
      if (state.phase === 'setup' && act === 'seed') state = Object.assign({}, state, { message: 'סמנו לפחות 3 נושאים.' });
      save();
      el.innerHTML = renderHtml(state);
      const f = el.querySelector('[data-act="' + act + '"]') || el.querySelector('.jam-msg');
      if (f && f.focus) f.focus();
    });
    JAM.stopWhenHidden(el, stop);
    el.innerHTML = renderHtml(state);
    return { get state() { return state; } };
  }

  return { GAME: GAME, TOPICS: TOPICS, TOPIC_PRIMARY: TOPIC_PRIMARY, BANK: BANK, itemsFor: itemsFor, createState: createState, seed: seed, answer: answer, next: next, itemPlan: itemPlan, songPlan: songPlan, renderHtml: renderHtml, mount: mount };
});
