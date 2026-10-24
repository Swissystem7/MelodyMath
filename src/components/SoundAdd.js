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
// The same sound, stages and feedback carry four answer types (#671):
// 'tap' (the pad above), 'choice' (three numbers, a wrong one is crossed out
// for the second try), 'drag' (drag one circle per sound into the basket; a
// plain tap or Enter on the pile adds one too, so it works without dragging)
// and 'line' (every sound is one hop on a 0-10 number line, the child taps
// where it lands). exercise.html?mode=choice|drag|line picks one.
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
  const MODES = ['tap', 'choice', 'drag', 'line'];
  const MODE_PROMPTS = {
    choice: {
      example: 'צפו בדוגמה: התשובה כבר מסומנת. לחצו סיימתי.',
      sound: 'הקשיבו. כמה צלילים שמעתם? בחרו את המספר.',
      picture: 'כמה עיגולים יש? בחרו את המספר.',
      symbol: 'כמה זה? בחרו את התשובה.',
      silent: 'כמה זה? בחרו את התשובה, בלי צלילים.',
    },
    drag: {
      example: 'צפו בדוגמה. אחר כך גררו את העיגול האחרון לסל.',
      sound: 'הקשיבו. גררו לסל עיגול אחד לכל צליל.',
      picture: 'כמה עיגולים יש? גררו לסל אותו מספר.',
      symbol: 'כמה זה? גררו לסל עיגולים כמספר התשובה.',
      silent: 'כמה זה? גררו לסל את התשובה, בלי צלילים.',
    },
    line: {
      example: 'צפו בדוגמה: הקפיצות נוחתות על התשובה. לחצו סיימתי.',
      sound: 'הקשיבו. כל צליל הוא קפיצה. איפה נחתתם?',
      picture: 'כמה עיגולים יש? הקישו על המספר בישר.',
      symbol: 'כמה זה? הקישו על התשובה בישר.',
      silent: 'כמה זה? הקישו על התשובה בישר, בלי צלילים.',
    },
  };
  const LINE_MAX = 10;
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
    const mode = MODES.indexOf(o.mode) >= 0 ? o.mode : 'tap';
    // The worked example taps all but the last one; the child adds it. In
    // 'choice' and 'line' it shows the answer picked; there taps is the picked
    // number, null until the child picks one.
    const picks = mode === 'choice' || mode === 'line';
    const taps = stage === 'example' ? sum(item) - (picks ? 0 : 1) : picks ? null : 0;
    return {
      index: index, item: item, stage: stage, mode: mode, taps: taps, wrong: [], tries: 0, status: 'ready',
      streak: o.streak || 0, silentRight: o.silentRight || 0, message: '', hint: null, sound: null,
    };
  }

  function picking(state) { return state.mode === 'choice' || state.mode === 'line'; }
  function promptFor(state) { return (MODE_PROMPTS[state.mode] || PROMPTS)[state.stage]; }

  // Three numbers: the sum and the two off-by-one counts; the right one moves
  // between the three places from item to item.
  function choices(item, index) {
    const t = sum(item);
    const opts = [t - 1, t, t + 1];
    const r = (index || 0) % 3;
    return opts.slice(r).concat(opts.slice(0, r));
  }

  // 'choice' / 'line': picking a number; a number already marked wrong stays out.
  function pick(state, n) {
    if (state.status === 'right' || state.status === 'shown' || state.wrong.indexOf(n) >= 0) return Object.assign({}, state, { sound: null });
    return Object.assign({}, state, { taps: n, sound: null });
  }

  function sounding(state) { return state.stage === 'example' || state.stage === 'sound'; }
  function tapSounds(state) { return state.stage !== 'silent'; }

  function tap(state) {
    if (state.status === 'right' || state.status === 'shown') return Object.assign({}, state, { sound: null });
    return Object.assign({}, state, { taps: state.taps + 1, sound: null });
  }

  function untap(state) {
    if (state.status === 'right' || state.status === 'shown' || state.taps === 0 || picking(state)) return Object.assign({}, state, { sound: null });
    const floor = state.stage === 'example' ? sum(state.item) - 1 : 0;
    return Object.assign({}, state, { taps: Math.max(floor, state.taps - 1), sound: null });
  }

  function nextStage(stage, dir) {
    const i = STAGES.indexOf(stage) + dir;
    return STAGES[Math.max(1, Math.min(STAGES.length - 1, i))];
  }

  // What is missing or extra, in the words of the answer type.
  function diffText(mode, diff) {
    const n = Math.abs(diff);
    if (mode === 'drag') return diff === 1 ? 'חסר עיגול אחד בסל.' : diff > 1 ? 'חסרים ' + n + ' עיגולים בסל.' : diff === -1 ? 'יש בסל עיגול אחד יותר מדי.' : 'יש בסל ' + n + ' עיגולים יותר מדי.';
    if (mode === 'choice' || mode === 'line') return diff > 0 ? 'קטן מדי, חסר ' + n + '.' : 'גדול מדי, יש ' + n + ' יותר.';
    return diff === 1 ? 'חסרה הקשה אחת.' : diff > 1 ? 'חסרות ' + n + ' הקשות.' : diff === -1 ? 'יש הקשה אחת יותר מדי.' : 'יש ' + n + ' הקשות יותר מדי.';
  }

  // "סיימתי": right, a hinted second try, or (after two tries) the solution.
  function check(state) {
    if (state.status === 'right' || state.status === 'shown' || state.taps == null) return Object.assign({}, state, { sound: null });
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
      const wrong = picking(state) ? state.wrong.concat([state.taps]) : state.wrong;
      return Object.assign({}, state, { tries: tries, status: 'retry', hint: hint, sound: 'hint', streak: 0, wrong: wrong, message: diffText(state.mode, diff) + ' הקשיבו וספרו שוב.' });
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
    return createState({ stage: stage, mode: state.mode, index: state.index + 1, streak: streak, silentRight: state.silentRight });
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
    const taps = state.taps || 0;
    const n = Math.max(taps, state.hint && state.hint.missing ? total : 0);
    let html = '';
    for (let i = 0; i < n; i++) {
      let c = 'sa-ans';
      if (i >= taps) c += ' sa-missing';
      else if (state.hint && state.hint.extra && i >= total) c += ' sa-extra';
      html += '<span class="' + c + '" data-ans="' + i + '"></span>';
    }
    const basket = state.mode === 'drag' ? ' sa-basket' : '';
    return '<div class="sa-answer' + basket + '" dir="ltr" aria-live="polite" aria-label="' + (basket ? 'בסל ' : 'הקשתם ') + taps + '">' + html + '</div>';
  }

  // The answer control of each type: number buttons, the 0-10 line, the
  // circle pile to drag from, or the drum pad.
  function controlHtml(state, done, tapAttr) {
    const total = sum(state.item);
    if (picking(state)) {
      const line = state.mode === 'line';
      const nums = line ? Array.from({ length: LINE_MAX + 1 }, function (_, i) { return i; }) : choices(state.item, state.index);
      const btns = nums.map(function (n) {
        const off = done || state.wrong.indexOf(n) >= 0;
        const c = (line ? 'sa-tick' : 'sa-opt') + (state.wrong.indexOf(n) >= 0 ? ' sa-wrong' : '') + (done && n === total ? ' sa-right' : '');
        return '<button type="button" class="' + c + '" data-act="pick" data-n="' + n + '"' + (line ? ' data-tick="' + n + '"' : '') + tapAttr +
          ' aria-pressed="' + (state.taps === n) + '"' + (off ? ' disabled' : '') + '>' + n + '</button>';
      }).join('');
      return '<div class="' + (line ? 'sa-line' : 'sa-opts') + '" dir="ltr" role="group" aria-label="' + (line ? 'ישר המספרים 0 עד 10' : 'בחרו מספר') + '">' + btns + '</div>';
    }
    if (state.mode === 'drag') {
      return '<button type="button" class="sa-pad sa-source" data-act="tap"' + tapAttr + (done ? ' disabled' : '') + ' aria-label="גררו עיגול לסל. בסל ' + state.taps + '">🔵 <span>' + state.taps + '</span></button>';
    }
    return '<button type="button" class="sa-pad" data-act="tap"' + tapAttr + (done ? ' disabled' : '') + ' aria-label="הקשה. הקשתם ' + state.taps + '">🥁 <span>' + state.taps + '</span></button>';
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
    return '<p class="sa-prompt sa-msg' + tone + '" role="status" aria-live="polite">' + e(state.message || promptFor(state)) + '</p>' +
      (showDots ? dotsHtml(state, state.stage === 'picture' || state.status !== 'ready' || state.stage === 'example', state.stage !== 'sound' || done) : '') +
      (showEq ? '<p class="sa-eq">' + eq + '</p>' : '') +
      answerHtml(state) +
      controlHtml(state, done, tapAttr) +
      '<div class="jam-row">' +
      (listen && state.stage !== 'silent' ? '<button type="button" class="secondary" data-act="listen">▶ שמעו</button>' : '') +
      (picking(state) ? '' : '<button type="button" class="secondary" data-act="untap"' + (done ? ' disabled' : '') + '>↩</button>') +
      (done ? '<button type="button" class="primary" data-act="next">הבא ←</button>' : '<button type="button" class="primary" data-act="check"' + (state.taps == null ? ' disabled' : '') + '>סיימתי</button>') +
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
    const q = root.location && /[?&]mode=(\w+)/.exec(root.location.search || '');
    let state = createState({ stage: 'example', mode: q && q[1] });
    let playing = null;
    const answerSel = picking(state) ? '[data-act="pick"]:not([disabled])' : '[data-act="tap"]';
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
        if (state.mode === 'line') light('[data-tick="' + (n.dot + 1) + '"]'); // one hop per sound
        if (withCount) say(n.count);
      });
    }
    function sound() {
      if (state.stage === 'silent') return;
      if (state.sound === 'scale') { el.querySelector('.sa-answer').classList.add('sa-win'); play(scalePlan(sum(state.item))); }
      if (state.sound === 'hint' || state.sound === 'solution') { JAM.feedback(false); setTimeout(function () { play(countPlan(state.item), true); }, 300); }
    }
    // 'drag': a circle follows the finger from the pile; dropped on the
    // basket it counts, dropped elsewhere it does not. The click after a drag
    // is swallowed so a drop never counts twice.
    let drag = null;
    let swallow = false;
    el.addEventListener('pointerdown', function (ev) {
      swallow = false;
      const s = state.mode === 'drag' && ev.target.closest ? ev.target.closest('.sa-source') : null;
      if (!s || s.disabled) return;
      drag = { x: ev.clientX, y: ev.clientY, ghost: null };
      if (s.setPointerCapture) s.setPointerCapture(ev.pointerId);
    });
    el.addEventListener('pointermove', function (ev) {
      if (!drag) return;
      if (!drag.ghost) {
        if (Math.abs(ev.clientX - drag.x) + Math.abs(ev.clientY - drag.y) < 10) return;
        drag.ghost = document.createElement('span');
        drag.ghost.className = 'sa-ans sa-ghost';
        document.body.appendChild(drag.ghost);
      }
      drag.ghost.style.left = ev.clientX + 'px';
      drag.ghost.style.top = ev.clientY + 'px';
    });
    function drop(ev) {
      if (!drag) return;
      const moved = drag.ghost;
      drag = null;
      if (!moved) return;
      moved.remove();
      swallow = true;
      const over = ev.type === 'pointerup' && document.elementFromPoint(ev.clientX, ev.clientY);
      if (over && over.closest('.sa-basket')) run('tap');
    }
    el.addEventListener('pointerup', drop);
    el.addEventListener('pointercancel', drop);
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (swallow) { swallow = false; if (b && b.classList.contains('sa-source')) return; }
      if (!b || b.disabled) return;
      run(b.getAttribute('data-act'), b.getAttribute('data-n'));
    });
    function run(act, n) {
      let focus = act === 'pick' ? '[data-n="' + n + '"]' : '[data-act="' + act + '"]';
      if (act === 'listen') {
        if (state.stage === 'example' || state.status === 'retry' || state.status === 'shown') play(countPlan(state.item), true);
        else play(numbersToBeats(state.item[0], state.item[1]));
        return;
      }
      if (act === 'tap') state = tap(state);
      else if (act === 'untap') state = untap(state);
      else if (act === 'pick') state = pick(state, Number(n));
      else if (act === 'check') { state = check(state); focus = state.status === 'retry' ? answerSel : '[data-act="next"]'; }
      else if (act === 'next') { stop(); state = next(state); focus = sounding(state) ? '[data-act="listen"]' : answerSel; }
      draw(focus);
      if (act === 'tap') light('[data-ans="' + (state.taps - 1) + '"]');
      sound();
    }
    draw();
    return { get state() { return state; } };
  }

  return {
    GAME: GAME, ITEMS: ITEMS, STAGES: STAGES, PROMPTS: PROMPTS, MAX_TRIES: MAX_TRIES,
    MODES: MODES, MODE_PROMPTS: MODE_PROMPTS, LINE_MAX: LINE_MAX,
    numbersToBeats: numbersToBeats, countPlan: countPlan, scalePlan: scalePlan, choices: choices,
    createState: createState, tap: tap, untap: untap, pick: pick, check: check, next: next, mastered: mastered,
    wordCount: wordCount, renderHtml: renderHtml, mount: mount,
  };
});
