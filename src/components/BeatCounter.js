// MelodyMath — BeatCounter screen (#591, owner proposal 3/5, grades א׳-ב׳).
//
// A steady beat plays on handbells and each beat lights an empty slot; the
// child puts one object on each slot (one tap = one object, a second tap on
// a full slot gets the gentle hint "כל צליל = חפץ אחד"), then answers "כמה
// בסך הכול?". A second round plays a number of beats in another tempo on
// kalimba and asks more, less or equal: the number does not change when the
// sound changes. One primary method: M1 steady-beat counting (builds to M2).
// The pitch-to-number-line extra (M5, weak evidence) appears only after the
// exercise is solved, under its own "weak evidence" heading. With the music
// switch off it is plain object counting with no sound.
// State functions and renderHtml are pure and tested in Node.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_BEAT_COUNTER_SCREEN = api;
  if (typeof document !== 'undefined' && document.getElementById('bcCard')) api.mount(document.getElementById('bcCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const BC = root.MM_BEAT_COUNTER || require('../lib/music/beatCounter.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const GAME = 'beatCounter';
  // count of the first round, change of count in the second (0 = equal).
  const EXERCISES = [
    { count: 5, delta: 0 }, { count: 7, delta: 0 }, { count: 4, delta: 1 }, { count: 9, delta: -1 },
    { count: 6, delta: 0 }, { count: 8, delta: 2 }, { count: 10, delta: -2 }, { count: 12, delta: 0 },
  ];
  const C_MAJOR = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25, 587.33, 659.25];

  function createState(index, showMusic) {
    const i = ((Number(index) || 0) % EXERCISES.length + EXERCISES.length) % EXERCISES.length;
    const ex = EXERCISES[i];
    return { index: i, first: BC.createRound({ count: ex.count, bpm: 80, instrument: 'handbells' }), second: null, phase: 'place', showMusic: showMusic !== false, message: '', tone: '' };
  }

  function place(state, i) {
    if (state.phase !== 'place') return state;
    const r = BC.placeObject(state.first, i);
    if (!r.accepted) return Object.assign({}, state, { message: r.hint || '', tone: r.hint ? 'soft' : '' });
    const next = Object.assign({}, state, { first: r.round, message: '', tone: '' });
    if (BC.isMatched(r.round)) return Object.assign(next, { phase: 'total', message: 'כל צליל קיבל חפץ אחד. כמה בסך הכול?' });
    return next;
  }

  function totalChoices(state) {
    const c = state.first.count;
    return [c - 1, c, c + 1, c + 2].filter(function (x) { return x > 0; });
  }

  function answerTotal(state, value) {
    if (state.phase !== 'total') return state;
    if (!BC.checkTotal(state.first, value)) return Object.assign({}, state, { message: 'עוד לא. ספרו את החפצים אחד־אחד, כמו את הצלילים.', tone: 'soft' });
    const ex = EXERCISES[state.index];
    const second = BC.secondRound(state.first, { count: state.first.count + ex.delta, bpm: 120, instrument: 'kalimba' });
    return Object.assign({}, state, { phase: 'compare', second: second, message: state.first.count + ' בסך הכול. עכשיו סבב שני, מהיר יותר ובכלי אחר: יש בו יותר, פחות או אותו מספר צלילים?', tone: 'good' });
  }

  function answerCompare(state, he) {
    if (state.phase !== 'compare') return state;
    if (!BC.checkCompare(state.first, state.second, he)) return Object.assign({}, state, { message: 'הקשיבו שוב וספרו כל צליל. הטמפו והכלי לא משנים את המספר.', tone: 'soft' });
    const want = BC.COMPARE_HE[BC.compareRounds(state.first, state.second)];
    return Object.assign({}, state, { phase: 'done', message: want + '! בסבב השני ' + state.second.count + ' צלילים, בראשון ' + state.first.count + '.', tone: 'good' });
  }

  // Bells, one per beat; onNote lights slot i.
  function beatPlan(round, voice) {
    const beat = 60 / round.bpm;
    const out = [];
    for (let i = 0; i < round.count; i++) out.push({ at: i * beat, voice: voice, hz: C_MAJOR[i % 8], slot: i });
    return out;
  }

  function renderHtml(state) {
    const e = JAM.esc;
    const on = state.showMusic;
    const bell = JAM.instrument('handbells', 'metalBell');
    const kal = JAM.instrument('kalimba', 'tine');
    const slots = state.first.slots.map(function (full, i) {
      return '<button type="button" class="bc-slot' + (full ? ' full' : '') + '" data-act="slot" data-slot="' + i + '"' + (on ? ' data-tap="' + e(bell.voice) + '" data-hz="' + C_MAJOR[i % 8] + '"' : '') + ' aria-label="פעמה ' + (i + 1) + (full ? ', יש חפץ' : ', ריק') + '">' + (full ? '🍎' : '') + '</button>';
    }).join('');
    let ask = '';
    if (state.phase === 'total') {
      ask = '<div class="jam-row" role="group" aria-label="כמה בסך הכול">' + totalChoices(state).map(function (c) {
        return '<button type="button" class="jam-pad" data-act="total" data-value="' + c + '">' + c + '</button>';
      }).join('') + '</div>';
    }
    if (state.second) {
      const dots = state.second.slots.map(function () { return '<span class="bc-dot">🔔</span>'; }).join('');
      ask += '<p class="jam-prompt">סבב שני' + (on ? ' (קלימבה, טמפו ' + state.second.bpm + ')' : '') + '</p><div class="bc-row2" role="img" aria-label="' + (on ? 'הסבב השני' : state.second.count + ' פעמונים') + '">' + dots + '</div>';
      if (on) ask += '<div class="jam-row"><button type="button" class="secondary" data-act="play2">▶ נגנו את הסבב השני</button></div>';
      if (state.phase === 'compare') {
        ask += '<div class="jam-row" role="group" aria-label="יותר, פחות או שווה">' + ['יותר', 'פחות', 'שווה'].map(function (w) {
          return '<button type="button" class="jam-pad" data-act="compare" data-value="' + w + '">' + w + '</button>';
        }).join('') + '</div>';
      }
    }
    // The weak-evidence extra: only once solved, never the way to solve.
    const addon = BC.addonFor(state.phase === 'done');
    const extra = addon && on ? '<div class="jam-extra" data-evidence="' + addon.evidence + '" data-mechanism="' + addon.mechanism + '"><h4>' + e(addon.he) + '</h4><p>רשות בלבד: צליל גבוה יותר = מספר גדול יותר.</p><div class="jam-row">' +
      [1, 2, 3, 4, 5, 6, 7, 8].map(function (n) { return '<button type="button" class="jam-pad" data-tap="' + e(bell.voice) + '" data-hz="' + C_MAJOR[n - 1] + '">' + n + '</button>'; }).join('') + '</div></div>' : '';
    const free = on ? '<div class="jam-free" role="group" aria-label="נגינה חופשית"><span>נגנו חופשי וספרו לחבר:</span>' +
      '<button type="button" class="jam-pad" data-tap="' + e(bell.voice) + '" data-hz="523.25">🔔 ' + e(bell.he) + '</button>' +
      '<button type="button" class="jam-pad" data-tap="' + e(kal.voice) + '" data-hz="392">' + e(kal.he) + '</button></div>' : '';
    return '<div class="jam-head"><span class="tag">ספירה לפי פעמה · כיתות א׳–ב׳</span>' + JAM.musicToggleHtml(on) + '</div>' +
      '<h3>' + (on ? '🔔 חפץ אחד על כל צליל' : 'סופרים חפצים') + '</h3>' +
      '<p class="jam-prompt">' + (on ? 'הקשיבו לפעמונים ושימו חפץ אחד על כל פעמה.' : 'שימו חפץ אחד בכל משבצת.') + '</p>' +
      (on ? '<div class="jam-row"><button type="button" class="secondary" data-act="play">▶ נגנו את הפעמה</button></div>' : '') +
      '<div class="bc-slots" role="group" aria-label="פעמות">' + slots + '</div>' +
      '<p class="fbp-sum">שמתם <bdi dir="ltr">' + BC.placedCount(state.first) + '</bdi> חפצים</p>' + ask + free + extra +
      '<div class="jam-row"><button type="button" class="secondary" data-act="next">תרגיל הבא ←</button></div>' +
      '<p class="jam-msg ' + e(state.tone) + '" role="status" aria-live="polite">' + e(state.message) + '</p>' +
      (on ? '<details class="teacher-info" role="region" aria-label="מידע למורה" style="margin-top:8px"><summary style="cursor:pointer;color:var(--muted);font-size:0.85rem">למורה ▸</summary><div class="teacher-body" style="font-size:0.85rem;color:var(--muted);padding:4px 0">שיטה: M1 (פעימה קבועה ומנייה) · כיתות א׳–ב׳ · McDonel 2015 · הרחבה: M5 (ראיות חלשות)</div></details>' : '');
  }

  function mount(el) {
    let state = createState(0, JAM.loadShowMusic(GAME));
    let playing = null;
    JAM.registerTapVoices();
    function stop() { if (playing) playing.stop(); playing = null; }
    function light(n) {
      const s = el.querySelector('[data-slot="' + n.slot + '"]');
      if (s) { s.classList.remove('jam-lit'); void s.offsetWidth; s.classList.add('jam-lit'); }
    }
    function draw(focusSel) {
      el.innerHTML = renderHtml(state);
      const f = focusSel && el.querySelector(focusSel);
      if (f && f.focus) f.focus();
    }
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      if (act === 'play' || act === 'play2') {
        stop();
        const r = act === 'play' ? state.first : state.second;
        const v = JAM.instrument(r.instrument, act === 'play' ? 'metalBell' : 'tine').voice;
        playing = JAM.playNotes(beatPlan(r, v), act === 'play' ? light : null);
        return;
      }
      stop();
      let focus = '[data-act="' + act + '"]';
      const before = state.phase;
      if (act === 'slot') { state = place(state, Number(b.getAttribute('data-slot'))); focus = '[data-slot="' + b.getAttribute('data-slot') + '"]'; }
      else if (act === 'total') state = answerTotal(state, b.getAttribute('data-value'));
      else if (act === 'compare') state = answerCompare(state, b.getAttribute('data-value'));
      else if (act === 'next') state = createState(state.index + 1, state.showMusic);
      else if (act === 'music') { state = Object.assign({}, state, { showMusic: !state.showMusic }); JAM.saveShowMusic(GAME, state.showMusic); }
      draw(state.phase !== before && act !== 'next' ? '.jam-msg' : focus);
      if (state.showMusic && (act === 'total' || act === 'compare')) JAM.feedback(state.tone === 'good');
    });
    JAM.stopWhenHidden(el, stop);
    draw();
    return { get state() { return state; } };
  }

  return { GAME: GAME, EXERCISES: EXERCISES, createState: createState, place: place, totalChoices: totalChoices, answerTotal: answerTotal, answerCompare: answerCompare, beatPlan: beatPlan, renderHtml: renderHtml, mount: mount };
});
