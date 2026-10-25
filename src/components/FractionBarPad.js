// MelodyMath — FractionBarPad screen (#591, owner proposal 1/5).
//
// The child fills a 4/4 bar with note-length tiles (whole, half, quarter,
// eighth). Each tile sounds on pointerdown through data-tap (darbuka timbre,
// timbre only), the bar fills on screen and the answer is read off it:
// 1/2 + 1/4 + 1/4 = one whole bar, 0.25 = a quarter of the bar. One method
// only: M3, note lengths in a bar (grades ג׳-ו׳).
// An exact fill plays a short cadence. A tile that overflows is refused with
// a soft low sound and the excess is shown ("עברת ב־1/8"); "בדיקה" on a short
// fill says what is missing. "נגן תיבה" plays the fill at 90 BPM with a
// metronome. The showMusic switch turns the same exercise into a plain
// fraction strip with no sound.
// The state functions and renderHtml are pure and tested in Node; mount()
// wires them to the page.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_FRACTION_BAR_PAD = api;
  if (typeof document !== 'undefined' && document.getElementById('fbpCard')) api.mount(document.getElementById('fbpCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const FB = root.MM_FRACTION_BAR || require('../lib/music/fractionBar.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const GAME = 'fractionBarPad';
  const BPM = 90;
  const BEATS_PER_BAR = 4;

  // Grades ג׳-ו׳: whole bars, parts of a bar, then the same parts as decimals.
  const EXERCISES = [
    { target: '1', allowed: ['half', 'quarter'], he: 'מלאו תיבה שלמה (4/4)' },
    { target: '1/2', allowed: ['quarter', 'eighth'], he: 'מלאו חצי תיבה ברבעים ובשמיניות' },
    { target: '3/4', allowed: ['half', 'quarter', 'eighth'], he: 'מלאו 3/4 תיבה' },
    { target: '1', allowed: ['half', 'quarter', 'eighth'], he: 'מלאו תיבה שלמה בשלושה סוגי אריחים לפחות' , minKinds: 3 },
    { target: '0.75', allowed: ['half', 'quarter', 'eighth'], he: 'מלאו 0.75 של תיבה' },
    { target: '1.5', allowed: ['whole', 'half', 'quarter'], he: 'מלאו 1.5 תיבות (תיבה וחצי: 3/2 או 1 ו־1/2)' },
    { target: '5/8', allowed: ['half', 'quarter', 'eighth'], he: 'מלאו 5/8 תיבה' },
    { target: '0.5', allowed: ['quarter', 'eighth', 'sixteenth'], he: 'מלאו 0.5 של תיבה' },
    { target: '1', allowed: ['whole', 'half', 'quarter', 'eighth'], he: 'מלאו תיבה שלמה בדרך אחרת מהפעם הקודמת' },
    { target: '1', allowed: ['whole', 'half', 'quarter'], he: 'מלאו תיבה שלמה בתווי שלמה, חצי ורבע בלבד' },
  ];
  const DEFAULT_PROPS = { instrument: 'darbuka' };

  function duration(id) {
    return FB.DURATIONS.filter(function (d) { return d.id === id; })[0] || null;
  }

  function createState(index, showMusic, props) {
    const i = ((Number(index) || 0) % EXERCISES.length + EXERCISES.length) % EXERCISES.length;
    const ex = Object.assign({}, EXERCISES[i], props || {});
    return { index: i, ex: ex, fill: [], status: 'empty', message: '', over: null, showMusic: showMusic !== false, sound: null };
  }

  function kindsUsed(fill) {
    const seen = {};
    fill.forEach(function (f) { seen[f] = true; });
    return Object.keys(seen).length;
  }

  // One tile. An exact fill is checked at once; an overflow is refused.
  function tapTile(state, id) {
    const d = duration(id);
    if (!d || state.ex.allowed.indexOf(id) === -1 || state.status === 'exact') return Object.assign({}, state, { sound: null });
    const r = FB.addTile(state.fill, d.n + '/' + d.d, state.ex.target);
    if (!r.accepted) {
      return Object.assign({}, state, { status: 'over', over: r.over, message: 'עברת ב־' + r.over + '. נסו אריח קצר יותר.', sound: 'wrong' });
    }
    const next = Object.assign({}, state, { fill: r.fill, over: null, status: 'filling', message: '', sound: null });
    if (r.check.status === 'exact') {
      if (state.ex.minKinds && kindsUsed(r.fill) < state.ex.minKinds) {
        return Object.assign(next, { status: 'filling', message: 'התיבה מלאה, אבל השתמשו ב־' + state.ex.minKinds + ' סוגי אריחים. הסירו אריח ונסו שוב.', sound: 'wrong' });
      }
      return Object.assign(next, { status: 'exact', message: summary(r.fill) + ' — התיבה מלאה בדיוק!', sound: 'cadence' });
    }
    return next;
  }

  // "1/2 + 1/4 + 1/4 = 1"
  function summary(fill) {
    const sum = FB.sumFraction(fill);
    return fill.join(' + ') + ' = ' + FB.formatFraction(sum);
  }

  function check(state) {
    const c = FB.checkFill(state.fill, state.ex.target);
    if (c.status === 'exact') return Object.assign({}, state, { status: 'exact', message: summary(state.fill) + ' — התיבה מלאה בדיוק!', sound: 'cadence' });
    if (c.status === 'under') return Object.assign({}, state, { status: 'under', message: 'חסר ' + c.diff + '. הוסיפו אריח.', sound: 'wrong' });
    return Object.assign({}, state, { sound: null });
  }

  function undo(state) {
    return Object.assign({}, state, { fill: state.fill.slice(0, -1), status: 'filling', over: null, message: '', sound: null });
  }

  // Notes for "נגן תיבה": one darbuka stroke per tile, one click per beat.
  function barPlan(fill, bpm, voice) {
    const beat = 60 / (bpm || BPM);
    const notes = [];
    let pos = 0;
    fill.forEach(function (f, i) {
      notes.push({ at: pos * BEATS_PER_BAR * beat, voice: voice || 'drumLow', kind: 'tile', tile: i });
      pos += FB.sumDurations([f]);
    });
    for (let b = 0; b < Math.ceil(pos * BEATS_PER_BAR - 1e-9); b++) notes.push({ at: b * beat, voice: 'woodClick', hz: 1800, kind: 'click' });
    return notes.sort(function (a, b) { return a.at - b.at || (a.kind === 'click' ? 1 : -1); });
  }

  function beatsHe(d) {
    const beats = (d.n / d.d) * BEATS_PER_BAR;
    if (beats === 1) return 'פעמה';
    if (beats > 1) return beats + ' פעמות';
    return beats === 0.5 ? 'חצי פעמה' : 'רבע פעמה';
  }

  function renderHtml(state, voice) {
    const e = JAM.esc;
    const on = state.showMusic;
    const target = FB.toFraction(state.ex.target);
    const targetText = FB.formatFraction(target);
    const isDecimal = /[.]/.test(String(state.ex.target));
    const mixedText = target && (target.n / target.d > 1) && typeof FB.toMixed === 'function' ? FB.toMixed(target, { hebrew: true }) : null;
    const segs = state.fill.map(function (f, i) {
      return '<span class="fbp-seg" data-seg="' + i + '" style="width:' + (FB.sumDurations([f]) * 100) + '%"><bdi dir="ltr">' + e(f) + '</bdi></span>';
    }).join('');
    const rest = target.n / target.d < 1 ? '<span class="fbp-out" style="width:' + ((1 - target.n / target.d) * 100) + '%">מחוץ ליעד</span>' : '';
    const tiles = state.ex.allowed.map(function (id) {
      const d = duration(id);
      const tap = on ? ' data-tap="' + e(voice) + '"' : '';
      return '<button type="button" class="fbp-tile" data-act="tile" data-tile="' + id + '"' + tap + ' aria-label="אריח ' + d.he + ' ' + d.n + '/' + d.d + '">' +
        '<b><bdi dir="ltr">' + d.n + '/' + d.d + '</bdi></b><span>' + d.he + (on ? ' · ' + beatsHe(d) : '') + '</span></button>';
    }).join('');
    const sum = FB.sumFraction(state.fill);
    const sumDec = FB.barFractionToDecimal(FB.formatFraction(sum));
    const over = state.over ? '<div class="fbp-over" role="note">עודף: <span class="fbp-overbar" style="width:' + (FB.sumDurations([state.over]) * 100) + '%"></span> <bdi dir="ltr">' + e(state.over) + '</bdi></div>' : '';
    const free = on ? '<div class="jam-free" role="group" aria-label="נגינה חופשית על דרבוקה"><span>🪘 נגנו חופשי:</span>' +
      '<button type="button" class="jam-pad" data-tap="drumLow">דום</button><button type="button" class="jam-pad" data-tap="drumHigh">טק</button></div>' : '';
    return '<div class="jam-head"><span class="tag">M3 · משכי תווים · כיתות ג׳–ו׳</span>' + JAM.musicToggleHtml(on) + '</div>' +
      '<h3>' + (on ? '🥁 ממלאים תיבה במשכי תווים' : 'ממלאים רצועת שבר') + '</h3>' +
      '<p class="jam-prompt">' + e(state.ex.he) + (isDecimal ? ' (<bdi dir="ltr">' + e(state.ex.target) + ' = ' + targetText + (mixedText ? ' / ' + mixedText : '') + '</bdi>)' : '') + '</p>' +
      '<div class="fbp-bar' + (state.status === 'exact' ? ' done' : '') + '" role="img" aria-label="' + (on ? 'תיבה' : 'רצועה') + ' מלאה ' + FB.formatFraction(sum) + ' מתוך ' + targetText + '">' + segs + rest + '</div>' + over +
      '<p class="fbp-sum">מילאתם: <bdi dir="ltr">' + FB.formatFraction(sum) + (sumDec != null ? ' = ' + sumDec : '') + '</bdi> מתוך <bdi dir="ltr">' + targetText + '</bdi></p>' +
      '<div class="jam-row" role="group" aria-label="אריחים">' + tiles + '</div>' + free +
      '<div class="jam-row">' + (on ? '<button type="button" class="secondary" data-act="play">▶ נגן תיבה</button>' : '') +
      '<button type="button" class="secondary" data-act="undo">↩ הסרת אריח</button><button type="button" class="primary" data-act="check">בדיקה</button>' +
      '<button type="button" class="secondary" data-act="next">תרגיל הבא ←</button></div>' +
      '<p class="jam-msg ' + (state.status === 'exact' ? 'good' : state.sound === 'wrong' ? 'soft' : '') + '" role="status" aria-live="polite">' + e(state.message) + '</p>';
  }

  function mount(el, props) {
    const inst = JAM.instrument((props && props.instrument) || DEFAULT_PROPS.instrument, 'drumLow');
    JAM.registerTapVoices();
    let state = createState(0, JAM.loadShowMusic(GAME), props);
    let playing = null;
    function stop() { if (playing) playing.stop(); playing = null; }
    function draw(focusSel) {
      el.innerHTML = renderHtml(state, inst.voice);
      const f = focusSel && el.querySelector(focusSel);
      if (f && f.focus) f.focus();
    }
    function sound() {
      if (!state.showMusic) return;
      if (state.sound === 'wrong') JAM.feedback(false);
      if (state.sound === 'cadence') { JAM.feedback(true); setTimeout(function () { JAM.cadence('drumLow'); }, 250); }
    }
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      let focus = '[data-act="' + act + '"]';
      if (act === 'tile') { state = tapTile(state, b.getAttribute('data-tile')); focus = '[data-tile="' + b.getAttribute('data-tile') + '"]'; }
      else if (act === 'undo') state = undo(state);
      else if (act === 'check') state = check(state);
      else if (act === 'next') { stop(); state = createState(state.index + 1, state.showMusic, props); }
      else if (act === 'music') { stop(); state = Object.assign({}, state, { showMusic: !state.showMusic, sound: null }); JAM.saveShowMusic(GAME, state.showMusic); }
      else if (act === 'play') {
        stop();
        playing = JAM.playNotes(barPlan(state.fill, BPM, inst.voice), function (n) {
          if (n.kind !== 'tile') return;
          const s = el.querySelector('[data-seg="' + n.tile + '"]');
          if (s) { s.classList.remove('lit'); void s.offsetWidth; s.classList.add('lit'); }
        });
        return;
      }
      draw(focus);
      sound();
    });
    JAM.stopWhenHidden(el, stop);
    draw();
    return { get state() { return state; } };
  }

  return { GAME: GAME, BPM: BPM, EXERCISES: EXERCISES, createState: createState, tapTile: tapTile, check: check, undo: undo, barPlan: barPlan, renderHtml: renderHtml, mount: mount };
});
