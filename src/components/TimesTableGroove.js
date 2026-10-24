// MelodyMath — TimesTableGroove screen (#591, owner proposal 2/5).
//
// A times-table column is a rhythmic groove: steady beats with every
// factor-th beat accented and carrying the running product (4, 8, 12, ...).
// The groove stops before the k-th accent and the child completes factor × k
// by touch. Every third question is the same groove read as division by
// grouping (חילוק להכלה, grade ב׳, topic mm-cur-16): how many accented groups
// fill the beats. One method only: M2.
// Tabla is the default timbre; a completed column unlocks another
// instrument (timbre only). Every 3 right answers in a row add a layer to
// the groove (bass, melody, harmony); a wrong answer restarts the count,
// keeps the layers and plays no punishment sound. With the music switch off
// the same question is a plain skip-counting row with no sound.
// State functions and renderHtml are pure and tested in Node.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TIMES_TABLE_GROOVE = api;
  if (typeof document !== 'undefined' && document.getElementById('ttgCard')) api.mount(document.getElementById('ttgCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const G = root.MM_GROOVE || require('../lib/music/groove.js');
  const STREAK = root.MM_STREAK || require('../lib/music/streak.js');
  const UNLOCKS = root.MM_UNLOCKS || require('../lib/music/unlocks.js');
  const JAM = root.MM_JAM || require('./jamKit.js');
  const GAME = 'timesTableGroove';
  const FACTORS = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  const BPM = 100;
  // Timbres the columns unlock, in order; tabla is there from the start.
  const START_INSTRUMENT = 'tabla';
  // Only instruments whose primary way for multiplication is M2 (dosage rule 4).
  const INST = typeof root.forTopic === 'function' ? root : require('../lib/instruments.js');
  const UNLOCK_LIST = INST.forTopic('multiplication').map(function (x) { return x.id; }).filter(function (id) { return id !== START_INSTRUMENT; });
  const LAYER_HE = { bass: 'בס', melody: 'מנגינה', harmony: 'הרמוניה' };
  // Curriculum topics (curriculum.js / progression.js): multiplication is
  // mm-cur-15 (ב׳), division by grouping is mm-cur-16 (ב׳), which builds on it.
  const TOPIC = { multiplication: 'mm-cur-15', division: 'mm-cur-16' };
  const PENTA = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880];

  // Question n of a column: k cycles 1..10 in a fixed spread order; every
  // third question asks the division form of the same groove.
  const K_ORDER = [7, 3, 9, 5, 1, 8, 4, 10, 6, 2];
  function question(factor, n) {
    const k = K_ORDER[n % K_ORDER.length];
    const groove = G.buildGroove(factor, BPM, k);
    const stop = G.stopAt(groove, k);
    const division = n % 3 === 2;
    return {
      factor: factor, k: k, n: n, division: division, topicId: division ? TOPIC.division : TOPIC.multiplication, groove: groove, played: stop.played,
      answer: division ? k : stop.answer,
      he: division ? 'כמה קבוצות של ' + factor + ' יש ב־' + stop.answer + '?' : stop.question + ' = ?',
    };
  }

  // Four answer buttons: the answer and its nearest wrong neighbours.
  function choices(q) {
    const a = q.answer;
    const step = q.division ? 1 : q.factor;
    const set = [a, a + step, a - step, a + (q.division ? 2 : 1)].filter(function (x, i, arr) { return x > 0 && arr.indexOf(x) === i; });
    if (set.length < 4) set.push(a + 2 * step);
    return set.slice(0, 4).sort(function (x, y) { return x - y; });
  }

  function createState(opts) {
    const o = opts || {};
    const factor = FACTORS.indexOf(o.factor) >= 0 ? o.factor : 4;
    return {
      factor: factor, n: o.n || 0, q: question(factor, o.n || 0), showMusic: o.showMusic !== false,
      streak: o.streak || STREAK.initialStreak(), unlocks: o.unlocks || UNLOCKS.initialUnlocks(),
      instrument: o.instrument || START_INSTRUMENT, status: 'asking', message: '', sound: null,
    };
  }

  function answer(state, value) {
    if (state.status === 'right') return Object.assign({}, state, { sound: null });
    const q = state.q;
    const right = Number(value) === q.answer;
    const r = STREAK.recordAnswer(state.streak, right);
    if (!right) {
      const hint = q.division ? 'ספרו את הפעמות המודגשות: כל אחת סוגרת קבוצה של ' + q.factor + '.' : 'ספרו בדילוגים של ' + q.factor + ' עד הפעמה המודגשת ה־' + q.k + '.';
      return Object.assign({}, state, { streak: r.state, status: 'retry', message: 'עוד לא. ' + hint, sound: null });
    }
    let unlocks = state.unlocks;
    let message = (q.division ? q.answer + ' קבוצות. ' : q.factor + ' × ' + q.k + ' = ' + q.answer + '. ') + 'נכון!';
    if (!q.division) {
      const u = UNLOCKS.recordCorrect(unlocks, q.factor, q.k, UNLOCK_LIST.map(function (id) { return { instrument: id, source: JAM.instrument(id).source || 'TODO' }; }));
      unlocks = u.state;
      if (u.unlocked) message += ' השלמתם את עמודת ×' + u.columnCompleted + ': נפתח כלי חדש, ' + JAM.instrument(u.unlocked).he + '.';
    }
    if (r.layerAdded) message += ' נוספה שכבה לשיר: ' + LAYER_HE[r.layerAdded] + '.';
    return Object.assign({}, state, { streak: r.state, unlocks: unlocks, status: 'right', message: message, sound: r.layerAdded ? 'layer' : 'right' });
  }

  function next(state, factor) {
    const f = factor || state.factor;
    const n = factor ? 0 : state.n + 1;
    return Object.assign({}, state, { factor: f, n: n, q: question(f, n), status: 'asking', message: '', sound: null });
  }

  // The groove as notes: a soft click on every beat, the instrument on each
  // accent, then one more voice per earned layer. withAnswer adds the
  // completing accent (played after a right answer).
  function groovePlan(q, voice, layers, withAnswer) {
    const beat = 60 / BPM;
    const beats = q.groove.beats.filter(function (b) { return withAnswer ? b.index <= q.factor * q.k : b.index < q.factor * q.k; });
    const notes = [];
    const has = function (l) { return (layers || []).indexOf(l) >= 0; };
    beats.forEach(function (b, i) {
      const at = i * beat;
      notes.push({ at: at, voice: 'woodClick', hz: 1800, beat: b.index });
      if (!b.accent) return;
      const g = b.index / q.factor;
      notes.push({ at: at, voice: voice, hz: 330, beat: b.index, accent: true });
      if (has('bass')) notes.push({ at: at, voice: 'drumLow' });
      if (has('melody')) notes.push({ at: at, voice: 'woodBar', hz: PENTA[(g - 1) % PENTA.length] });
      if (has('harmony')) notes.push({ at: at, voice: 'keys', hz: PENTA[(g + 1) % PENTA.length] });
    });
    return notes;
  }

  function renderHtml(state) {
    const e = JAM.esc;
    const on = state.showMusic;
    const q = state.q;
    const inst = JAM.instrument(state.instrument, 'drumHigh');
    const factors = FACTORS.map(function (f) {
      return '<button type="button" class="secondary ttg-f" data-act="factor" data-factor="' + f + '" aria-pressed="' + (f === state.factor) + '"><bdi dir="ltr">×' + f + '</bdi></button>';
    }).join('');
    // The beats before the stop, in groups of `factor`; accents show their product.
    const cells = q.played.map(function (b) {
      return '<span class="ttg-beat' + (b.accent ? ' acc' : '') + '" data-beat="' + b.index + '">' + (b.accent ? b.product : '·') + '</span>';
    }).join('') + '<span class="ttg-beat acc ask" data-beat="' + q.factor * q.k + '">' + (state.status === 'right' ? q.factor * q.k : '?') + '</span>';
    const row = on ? '<div class="ttg-beats" role="img" aria-label="' + q.played.length + ' פעמות, כל ' + q.factor + ' מודגשת">' + cells + '</div>'
      : '<p class="ttg-plain"><bdi dir="ltr">' + q.played.filter(function (b) { return b.accent; }).map(function (b) { return b.product; }).concat(['?']).join(', ') + '</bdi></p>';
    const opts = choices(q).map(function (c) {
      return '<button type="button" class="jam-pad" data-act="answer" data-value="' + c + '"' + (on ? ' data-tap="' + e(inst.voice) + '"' : '') + '>' + c + '</button>';
    }).join('');
    const owned = [START_INSTRUMENT].concat(state.unlocks.unlocked);
    const instRow = on ? '<div class="jam-free" role="group" aria-label="כלים">' + owned.map(function (id) {
      const x = JAM.instrument(id);
      return '<button type="button" class="jam-pad" data-act="instrument" data-inst="' + e(id) + '" data-tap="' + e(x.voice) + '" aria-pressed="' + (id === state.instrument) + '">' + e(x.he) + '</button>';
    }).join('') + '</div>' : '';
    const layers = state.streak.layers.map(function (l) { return LAYER_HE[l]; }).join(' · ');
    return '<div class="jam-head"><span class="tag">M2 · פעמות מודגשות · כיתות ב׳–ג׳</span>' + JAM.musicToggleHtml(on) + '</div>' +
      '<h3>' + (on ? '🪘 לוח הכפל כשיר קצבי' : 'ספירה בדילוגים') + '</h3>' +
      '<div class="jam-row" role="group" aria-label="עמודה בלוח הכפל">' + factors + '</div>' +
      row + '<p class="jam-prompt"><bdi dir="ltr">' + e(q.he) + '</bdi></p>' +
      '<div class="jam-row" role="group" aria-label="תשובות">' + opts + '</div>' +
      (on ? '<div class="jam-row"><button type="button" class="secondary" data-act="play">▶ נגן את ה־groove</button>' +
        '<button type="button" class="jam-pad" data-tap="' + e(inst.voice) + '" aria-label="הקשה חופשית">🥁 הקישו</button></div>' : '') +
      instRow + (on && layers ? '<p class="jam-free">שכבות בשיר: ' + e(layers) + '</p>' : '') +
      '<div class="jam-row"><button type="button" class="secondary" data-act="next">שאלה הבאה ←</button></div>' +
      '<p class="jam-msg ' + (state.status === 'right' ? 'good' : state.status === 'retry' ? 'soft' : '') + '" role="status" aria-live="polite">' + e(state.message) + '</p>';
  }

  function mount(el) {
    const store = root.localStorage;
    let state = createState({ showMusic: JAM.loadShowMusic(GAME), streak: STREAK.loadStreak(store), unlocks: UNLOCKS.loadUnlocks(store) });
    let playing = null;
    JAM.registerTapVoices();
    function stop() { if (playing) playing.stop(); playing = null; }
    function light(n) {
      const s = el.querySelector('[data-beat="' + n.beat + '"]');
      if (s && n.voice === 'woodClick') { s.classList.remove('jam-lit'); void s.offsetWidth; s.classList.add('jam-lit'); }
    }
    function play(withAnswer) {
      stop();
      if (state.showMusic) playing = JAM.playNotes(groovePlan(state.q, JAM.instrument(state.instrument, 'drumHigh').voice, state.streak.layers, withAnswer), light);
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
      if (act === 'play') { play(false); return; }
      stop();
      if (act === 'answer') {
        state = answer(state, b.getAttribute('data-value'));
        STREAK.saveStreak(store, state.streak);
        UNLOCKS.saveUnlocks(store, state.unlocks);
      } else if (act === 'factor') state = next(state, Number(b.getAttribute('data-factor')));
      else if (act === 'next') state = next(state);
      else if (act === 'instrument') state = Object.assign({}, state, { instrument: b.getAttribute('data-inst') });
      else if (act === 'music') { state = Object.assign({}, state, { showMusic: !state.showMusic }); JAM.saveShowMusic(GAME, state.showMusic); }
      draw('[data-act="' + act + '"]');
      if (state.sound && state.showMusic) play(true);
      state = Object.assign({}, state, { sound: null });
    });
    JAM.stopWhenHidden(el, stop);
    draw();
    return { get state() { return state; } };
  }

  return { GAME: GAME, TOPIC: TOPIC, FACTORS: FACTORS, UNLOCK_LIST: UNLOCK_LIST, question: question, choices: choices, createState: createState, answer: answer, next: next, groovePlan: groovePlan, renderHtml: renderHtml, mount: mount };
});
