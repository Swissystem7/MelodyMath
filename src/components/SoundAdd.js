// MelodyMath — SoundAdd: the #665 example exercise (addition, grades א׳–ב׳).
//
// The music is how the child solves it: 3 + 2 is heard as 3 low drums, a
// pause, 2 high drums, and every sound lights its own circle. The child taps
// the total on one big pad, one tap = one dot.
// Rules from the #665 comment 1:
// - The exercise is first on the screen; the child card has at most 15 words,
//   the teacher text sits folded under "למורה ▸".
// - The sound comes from the numbers: numbersToBeats(a, b) has a + b notes.
// - Feedback explains (Hattie & Timperley 2007). A right answer plays a
//   rising scale, one note per dot. A wrong one replays the exercise with
//   the count shown on every circle, marks what is missing or extra and gives
//   a second try; after two tries the solution is played and shown.
// - CRA fading (Fyfe et al. 2014): a worked example, then sound + circles,
//   circles only, the symbol, and the symbol with no sound at all. Two right
//   first tries move one stage on, two wrong tries move one stage back
//   (Kalyuga 2003). Mastery needs the silent stage.
// The state functions and renderHtml are pure and tested in Node; mount()
// wires them to the page.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_SOUND_ADD = api;
  if (typeof document !== 'undefined' && document.getElementById('saCard')) api.mount(document.getElementById('saCard'));
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const JAM = root.MM_JAM || require('./jamKit.js');
  const GAME = 'soundAdd';
  const BEAT = 0.42; // seconds between two sounds of one group
  const GAP = 0.5; // the extra pause between the two groups
  const MAX_TRIES = 2;
  const STREAK_TO_ADVANCE = 2;
  const MASTERED_AT = 2; // right first tries in the silent stage

  // Sums up to 10: every total fits on two hands and one row of dots.
  const ITEMS = [[3, 2], [2, 2], [4, 1], [3, 3], [5, 2], [2, 4], [4, 3], [6, 2], [5, 4], [3, 5], [6, 3], [4, 4]];
  const STAGES = ['example', 'sound', 'picture', 'symbol', 'silent'];
  // Child-card text per stage, at most 15 words each (checked in the tests).
  const PROMPTS = {
    example: 'צפו בדוגמה. אחר כך הקישו את ההקשה האחרונה.',
    sound: 'הקשיבו. כמה צלילים שמעתם? הקישו את המספר.',
    picture: 'כמה עיגולים יש? הקישו את המספר.',
    symbol: 'כמה זה? הקישו את התשובה.',
    silent: 'כמה זה? הקישו את התשובה, בלי צלילים.',
  };
  // Rising C major, one note per answer dot (up to 10).
  const SCALE = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25, 587.33, 659.25];

  function sum(item) { return item[0] + item[1]; }

  // The exercise as sound: a low drum per unit of the first number, a pause,
  // a high drum per unit of the second. dot = index of the circle it lights.
  function numbersToBeats(a, b, beat, gap) {
    const step = beat || BEAT;
    const pause = gap == null ? GAP : gap;
    const notes = [];
    for (let i = 0; i < a; i++) notes.push({ at: i * step, voice: 'drumLow', group: 0, dot: i });
    for (let j = 0; j < b; j++) notes.push({ at: a * step + pause + j * step, voice: 'drumHigh', group: 1, dot: a + j });
    return notes;
  }

  // The hint replay: the same sounds, each followed on screen by its count.
  function countPlan(item) {
    return numbersToBeats(item[0], item[1]).map(function (n, i) { return Object.assign({}, n, { count: i + 1 }); });
  }

  function scalePlan(n) {
    const notes = [];
    for (let i = 0; i < n; i++) notes.push({ at: i * 0.16, voice: 'woodBar', hz: SCALE[i % SCALE.length], dot: i, kind: 'scale' });
    return notes;
  }

  function createState(opts) {
    const o = opts || {};
    const stage = STAGES.indexOf(o.stage) >= 0 ? o.stage : 'example';
    const index = ((Number(o.index) || 0) % ITEMS.length + ITEMS.length) % ITEMS.length;
    const item = o.item || ITEMS[index];
    // The worked example taps all but the last one; the child adds it.
    const taps = stage === 'example' ? sum(item) - 1 : 0;
    return {
      index: index, item: item, stage: stage, taps: taps, tries: 0, status: 'ready',
      streak: o.streak || 0, silentRight: o.silentRight || 0, message: '', hint: null, sound: null,
    };
  }

  function sounding(state) { return state.stage === 'example' || state.stage === 'sound'; }
  function tapSounds(state) { return state.stage !== 'silent'; }

  function tap(state) {
    if (state.status === 'right' || state.status === 'shown') return Object.assign({}, state, { sound: null });
    return Object.assign({}, state, { taps: state.taps + 1, sound: null });
  }

  function untap(state) {
    if (state.status === 'right' || state.status === 'shown' || state.taps === 0) return Object.assign({}, state, { sound: null });
    const floor = state.stage === 'example' ? sum(state.item) - 1 : 0;
    return Object.assign({}, state, { taps: Math.max(floor, state.taps - 1), sound: null });
  }

  function nextStage(stage, dir) {
    const i = STAGES.indexOf(stage) + dir;
    return STAGES[Math.max(1, Math.min(STAGES.length - 1, i))];
  }

  // "סיימתי": right, a hinted second try, or (after two tries) the solution.
  function check(state) {
    if (state.status === 'right' || state.status === 'shown') return Object.assign({}, state, { sound: null });
    const total = sum(state.item);
    const tries = state.tries + 1;
    const eq = state.item[0] + ' + ' + state.item[1] + ' = ' + total;
    if (state.taps === total) {
      const first = tries === 1 && state.stage !== 'example';
      return Object.assign({}, state, {
        tries: tries, status: 'right', hint: null, sound: 'scale',
        streak: first ? state.streak + 1 : 0,
        silentRight: state.silentRight + (first && state.stage === 'silent' ? 1 : 0),
        message: 'כל הכבוד! ' + eq,
      });
    }
    const diff = total - state.taps;
    const hint = diff > 0 ? { missing: diff } : { extra: -diff };
    if (tries < MAX_TRIES) {
      const says = diff === 1 ? 'חסרה הקשה אחת.' : diff > 1 ? 'חסרות ' + diff + ' הקשות.' : diff === -1 ? 'יש הקשה אחת יותר מדי.' : 'יש ' + (-diff) + ' הקשות יותר מדי.';
      return Object.assign({}, state, { tries: tries, status: 'retry', hint: hint, sound: 'hint', streak: 0, message: says + ' הקשיבו וספרו שוב.' });
    }
    return Object.assign({}, state, { tries: tries, status: 'shown', hint: hint, sound: 'solution', streak: 0, message: 'התשובה היא ' + eq });
  }

  // "הבא": the stage moves on after STREAK_TO_ADVANCE right first tries and
  // back after a shown solution; the example always hands over to 'sound'.
  function next(state) {
    let stage = state.stage;
    let streak = state.streak;
    if (stage === 'example') { stage = 'sound'; streak = 0; }
    else if (state.status === 'shown') { stage = nextStage(stage, -1); streak = 0; }
    else if (streak >= STREAK_TO_ADVANCE) { stage = nextStage(stage, +1); streak = 0; }
    return createState({ stage: stage, index: state.index + 1, streak: streak, silentRight: state.silentRight });
  }

  function mastered(state) { return state.silentRight >= MASTERED_AT; }

  function wordCount(text) { return String(text).trim().split(/\s+/).filter(Boolean).length; }

  // Left to right like the written exercise: the first group, +, the second.
  function dotsHtml(state, show, groups) {
    const a = state.item[0];
    const b = state.item[1];
    function group(from, n, cls) {
      let dots = '';
      for (let i = from; i < from + n; i++) dots += '<span class="sa-dot ' + cls + (show ? '' : ' sa-dim') + '" data-dot="' + i + '"><b class="sa-count"></b></span>';
      return '<span class="sa-group"><span class="sa-row">' + dots + '</span>' + (groups ? '<span class="sa-num" aria-hidden="true">' + n + '</span>' : '') + '</span>';
    }
    return '<div class="sa-dots" dir="ltr" role="img" aria-label="' + a + ' עיגולים ועוד ' + b + ' עיגולים">' +
      group(0, a, 'sa-low') + '<span class="sa-plus" aria-hidden="true">+</span>' + group(a, b, 'sa-high') + '</div>';
  }

  function answerHtml(state) {
    const total = sum(state.item);
    const n = Math.max(state.taps, state.hint && state.hint.missing ? total : 0);
    let html = '';
    for (let i = 0; i < n; i++) {
      let c = 'sa-ans';
      if (i >= state.taps) c += ' sa-missing';
      else if (state.hint && state.hint.extra && i >= total) c += ' sa-extra';
      html += '<span class="' + c + '" data-ans="' + i + '"></span>';
    }
    return '<div class="sa-answer" dir="ltr" aria-live="polite" aria-label="הקשתם ' + state.taps + '">' + html + '</div>';
  }

  function renderHtml(state) {
    const e = JAM.esc;
    const done = state.status === 'right' || state.status === 'shown';
    const showDots = state.stage !== 'symbol' && state.stage !== 'silent';
    const showEq = state.stage === 'symbol' || state.stage === 'silent' || state.stage === 'example' || done;
    const tapAttr = tapSounds(state) ? ' data-tap="drumLow"' : '';
    const listen = sounding(state) || state.status === 'retry' || state.status === 'shown';
    const eq = '<bdi dir="ltr">' + state.item[0] + ' + ' + state.item[1] + ' = ' + (done ? sum(state.item) : '?') + '</bdi>';
    // One line of text: the prompt, replaced by the feedback once there is one,
    // so the card never passes 15 words.
    const tone = state.status === 'right' ? ' good' : state.status === 'ready' ? '' : ' soft';
    return '<p class="sa-prompt sa-msg' + tone + '" role="status" aria-live="polite">' + e(state.message || PROMPTS[state.stage]) + '</p>' +
      (showDots ? dotsHtml(state, state.stage === 'picture' || state.status !== 'ready' || state.stage === 'example', state.stage !== 'sound' || done) : '') +
      (showEq ? '<p class="sa-eq">' + eq + '</p>' : '') +
      answerHtml(state) +
      '<button type="button" class="sa-pad" data-act="tap"' + tapAttr + (done ? ' disabled' : '') + ' aria-label="הקשה. הקשתם ' + state.taps + '">🥁 <span>' + state.taps + '</span></button>' +
      '<div class="jam-row">' +
      (listen && state.stage !== 'silent' ? '<button type="button" class="secondary" data-act="listen">▶ שמעו</button>' : '') +
      '<button type="button" class="secondary" data-act="untap"' + (done ? ' disabled' : '') + '>↩</button>' +
      (done ? '<button type="button" class="primary" data-act="next">הבא ←</button>' : '<button type="button" class="primary" data-act="check">סיימתי</button>') +
      '</div>' +
      (mastered(state) ? '<p class="sa-mastered">⭐ שולטים בחיבור עד 10</p>' : '');
  }

  // Count aloud in Hebrew when the device has a Hebrew voice; the numbers on
  // the circles carry the count either way.
  const COUNT_HE = ['אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר'];
  function say(n) {
    const s = root.speechSynthesis;
    if (!s || typeof root.SpeechSynthesisUtterance !== 'function' || !s.getVoices) return;
    const he = s.getVoices().filter(function (v) { return /^he/i.test(v.lang); })[0];
    if (!he) return;
    const u = new root.SpeechSynthesisUtterance(COUNT_HE[n - 1] || String(n));
    u.voice = he; u.lang = he.lang; u.rate = 1.2;
    s.speak(u);
  }

  function mount(el) {
    JAM.registerTapVoices();
    let state = createState({ stage: 'example' });
    let playing = null;
    function stop() { if (playing) playing.stop(); playing = null; }
    function draw(focusSel) {
      el.innerHTML = renderHtml(state);
      const f = focusSel && el.querySelector(focusSel);
      if (f && f.focus && !f.disabled) f.focus();
    }
    function light(sel, count) {
      const d = el.querySelector(sel);
      if (!d) return;
      d.classList.remove('sa-dim', 'lit'); void d.offsetWidth; d.classList.add('lit');
      if (count) { const c = d.querySelector('.sa-count'); if (c) c.textContent = count; }
    }
    function play(plan, withCount) {
      stop();
      playing = JAM.playNotes(plan, function (n) {
        if (n.kind === 'scale') { light('[data-ans="' + n.dot + '"]'); return; }
        light('[data-dot="' + n.dot + '"]', withCount ? n.count : 0);
        if (withCount) say(n.count);
      });
    }
    function sound() {
      if (state.stage === 'silent') return;
      if (state.sound === 'scale') { el.querySelector('.sa-answer').classList.add('sa-win'); play(scalePlan(sum(state.item))); }
      if (state.sound === 'hint' || state.sound === 'solution') { JAM.feedback(false); setTimeout(function () { play(countPlan(state.item), true); }, 300); }
    }
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b || b.disabled) return;
      const act = b.getAttribute('data-act');
      let focus = '[data-act="' + act + '"]';
      if (act === 'listen') {
        if (state.stage === 'example' || state.status === 'retry' || state.status === 'shown') play(countPlan(state.item), true);
        else play(numbersToBeats(state.item[0], state.item[1]));
        return;
      }
      if (act === 'tap') state = tap(state);
      else if (act === 'untap') state = untap(state);
      else if (act === 'check') { state = check(state); focus = state.status === 'retry' ? '[data-act="tap"]' : '[data-act="next"]'; }
      else if (act === 'next') { stop(); state = next(state); focus = sounding(state) ? '[data-act="listen"]' : '[data-act="tap"]'; }
      draw(focus);
      if (act === 'tap') light('[data-ans="' + (state.taps - 1) + '"]');
      sound();
    });
    draw();
    return { get state() { return state; } };
  }

  return {
    GAME: GAME, ITEMS: ITEMS, STAGES: STAGES, PROMPTS: PROMPTS, MAX_TRIES: MAX_TRIES,
    numbersToBeats: numbersToBeats, countPlan: countPlan, scalePlan: scalePlan,
    createState: createState, tap: tap, untap: untap, check: check, next: next, mastered: mastered,
    wordCount: wordCount, renderHtml: renderHtml, mount: mount,
  };
});
