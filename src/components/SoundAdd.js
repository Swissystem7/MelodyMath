// MelodyMath — SoundAdd: the #665 example exercise (addition, grades א׳–ב׳).
//
// The music is how the child solves it: 3 + 2 is heard as 3 low sounds, a
// pause, 2 high sounds, and every sound lights its own circle. The child taps
// the total on one big pad, one tap = one sound.
// Child-eye rules (#665, #666 review 24.10):
// - The exercise opens with its sound and a spoken instruction; the first
//   exercise is real solving, no worked example. Nothing for the teacher is
//   on the child screen (docs/exercises/SOUND-ADD.md has the notes).
// - Every instruction is spoken: Hebrew speech when the device has a Hebrew
//   voice, else a recorded clip from VOICE_CLIPS (tools/record-voice.html),
//   else the icons and the numbers on the circles carry it.
// - The same exercise plays on 4 instrument families (drums, keys, strings,
//   winds); the child may switch at any moment and hears the same events.
// - A right answer merges the two groups into one group of the total and
//   counts it up on a rising scale. A wrong one says "almost", replays the
//   exercise counting every circle, marks what is missing or extra and gives
//   a second try; after two tries the solution is shown and the next
//   exercise brings the support back, with a word of encouragement.
// - Fading: sound and circles, circles only, the symbol, then the plain
//   written exercise with no sound at all. Two right first tries move one
//   stage on. Mastery needs the plain stage; a miss there goes back to the
//   musical version. Plain-stage tries and right answers are counted.
// - The same sounds, stages and feedback carry several answer types (#671),
//   picked with exercise.html?mode=...: 'tap' (the pad, default),
//   'choice' (three numbers; a wrong one is crossed out for the second try;
//   the silent mastery check offers every number 1-10, not three),
//   'drag' (drag one circle per sound into the basket; a plain tap or Enter
//   on the pile adds one too, so it works without dragging) and 'line'
//   (every sound is one hop on a 0-10 number line; tap where it lands).
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
  // Where the exercise sits in the curriculum (#691 review item 2). The same
  // links are in src/lib/curriculum/progression.js; test/soundAdd.test.js
  // fails if the two disagree.
  const PROGRESSION = Object.freeze({
    topicId: 'mm-cur-3',
    prereq: ['mm-cur-1', 'mm-cur-2'],
    skill: 'joining and removing beats within 20',
    buildsTo: ['mm-cur-4', 'mm-cur-7', 'mm-cur-11'],
  });
  const BEAT = 0.42; // seconds between two sounds of one group
  const GAP = 0.5; // the extra pause between the two groups
  const MAX_TRIES = 2;
  const STREAK_TO_ADVANCE = 2;
  const MASTERED_AT = 2; // right first tries in the plain stage

  // Sums up to 10: every total fits on two hands and one row of dots.
  const ITEMS = [[3, 2], [2, 2], [4, 1], [3, 3], [5, 2], [2, 4], [4, 3], [6, 2], [5, 4], [3, 5], [6, 3], [4, 4]];
  // The two music ways of the later steps, restored as they were before
  // #635/#636 replaced them in the grade 3-4 curriculum (git show
  // c133190^:src/lib/curriculum/grade3.js, the same rows in cd0d152^ grade4.js).
  const WAYS = Object.freeze({
    takeAwayBeats: { he: 'עודף: נגנו את מה ששילמתם, השתיקו את המחיר — מה שנשאר נשמע הוא העודף.', source: 'mcdonel2015', from: 'c133190^ grade3.js MONEY' },
    tenExchange: { he: 'כל עשר נקישות — כלי גדול יותר: שייקר, תוף, מצילה, גונג (אלפים). ספרו את הכלי הגדול קודם.', also: 'פריטה בחיסור: תוף אחד (עשרת) נפרט לעשר נקישות כשחסרות יחידות — ורק אז מסירים.', source: 'kcConnections', from: 'c133190^ grade3.js NUM10K, ADD_SUB_10K' },
  });
  // The steps of mm-cur-3, in order. A step is mastered like the first one
  // (two right first tries in the silent stage); then the next step starts
  // again with sound. A fixed list until the #687 variation engine
  // generates the items. [a, b, '-'] is a subtraction.
  // tenExchange: the 10th sound is joined by a gong, the bigger instrument
  // of a full ten. takeAwayBeats: all of a, then the same phrase with the
  // last b beats silent; what is still heard is the answer.
  const STEPS = [
    { id: 'add10', way: null, items: ITEMS },
    { id: 'makeTen', way: 'tenExchange', items: [[7, 3], [6, 4], [8, 2], [5, 5], [9, 1], [4, 6]] },
    { id: 'crossTen', way: 'tenExchange', items: [[8, 5], [9, 4], [7, 6], [6, 6], [9, 3], [8, 7]] },
    { id: 'add20', way: 'tenExchange', items: [[12, 5], [11, 6], [13, 4], [10, 7], [14, 5], [9, 9]] },
    { id: 'sub10', way: 'takeAwayBeats', items: [[7, 3, '-'], [9, 4, '-'], [6, 2, '-'], [8, 5, '-'], [10, 6, '-'], [5, 3, '-']] },
    { id: 'sub20', way: 'takeAwayBeats', items: [[13, 3, '-'], [15, 5, '-'], [12, 4, '-'], [14, 6, '-'], [17, 8, '-'], [11, 2, '-']] },
  ];
  const STAGES = ['sound', 'picture', 'symbol', 'silent'];
  // One instrument per family; a = the first number, b = the second.
  const FAMILIES = [
    { id: 'drums', he: 'תופים', icon: '🥁', a: { voice: 'drumLow' }, b: { voice: 'drumHigh' }, tap: 'drumLow' },
    { id: 'keys', he: 'פסנתר', icon: '🎹', a: { voice: 'keys', hz: 196 }, b: { voice: 'keys', hz: 392 }, tap: 'keys' },
    { id: 'strings', he: 'גיטרה', icon: '🎸', a: { voice: 'pluck', hz: 147 }, b: { voice: 'pluck', hz: 294 }, tap: 'pluck' },
    { id: 'winds', he: 'חליל', icon: '🎷', a: { voice: 'breathy', hz: 392 }, b: { voice: 'breathy', hz: 784 }, tap: 'breathy' },
  ];
  // Child-card text per stage, at most 15 words each (checked in the tests).
  // {i} is the icon of the chosen instrument.
  const PROMPTS = {
    sound: 'הקשיבו 👂 והקישו {i} כמו ששמעתם',
    picture: 'כמה עיגולים? הקישו {i} על כל עיגול',
    symbol: 'כמה זה? הקישו {i}',
    silent: 'כמה זה? הקישו את התשובה',
  };
  // Answer types (#671). MODE_PROMPTS replace PROMPTS for a type that is not
  // the pad; what they say aloud is in SPEECH under 'mode.stage'.
  const MODES = ['tap', 'choice', 'drag', 'line'];
  const CHOICE_MAX = 10; // the silent check's grid: every number 1..10
  const LINE_MAX = 10; // the number line runs 0..10, or 0..20 past ten (lineMax)
  const MODE_PROMPTS = {
    choice: {
      sound: 'הקשיבו 👂 ובחרו מספר',
      picture: 'כמה עיגולים? בחרו מספר',
      symbol: 'כמה זה? בחרו מספר',
      silent: 'כמה זה? בחרו מספר',
    },
    drag: {
      sound: 'הקשיבו 👂 וגררו 🔵 לסל על כל צליל',
      picture: 'כמה עיגולים? גררו 🔵 לסל על כל עיגול',
      symbol: 'כמה זה? גררו 🔵 לסל',
      silent: 'כמה זה? גררו 🔵 לסל',
    },
    line: {
      sound: 'הקשיבו 👂 כל צליל קפיצה. איפה נחתנו?',
      picture: 'כמה עיגולים? הקישו על המספר בקו',
      symbol: 'כמה זה? הקישו על המספר בקו',
      silent: 'כמה זה? הקישו על המספר בקו',
    },
  };
  // A subtraction asks what is left, whatever the answer type.
  const SUB_PROMPTS = { sound: 'הקשיבו 👂 כמה צלילים נשארו בסוף?', picture: 'כמה עיגולים נשארו?' };
  const BACK_PROMPT = 'נתרגל עוד קצת עם צלילים 🎵';
  // Everything the exercise says aloud. The same keys name the recorded clips.
  const SPEECH = {
    sound: 'הקשיבו, ואז הקישו כמו ששמעתם',
    picture: 'כמה עיגולים יש? הקישו על כל עיגול',
    symbol: 'כמה זה? הקישו את התשובה',
    silent: 'כמה זה? הקישו את התשובה',
    back: 'נתרגל עוד קצת עם צלילים',
    right: 'כל הכבוד!',
    retry: 'כמעט! ננסה שוב עם צלילים',
    shown: 'לא נורא, הנה התשובה',
    count1: 'אחת', count2: 'שתיים', count3: 'שלוש', count4: 'ארבע', count5: 'חמש',
    count6: 'שש', count7: 'שבע', count8: 'שמונה', count9: 'תשע', count10: 'עשר',
    count11: 'אחת עשרה', count12: 'שתים עשרה', count13: 'שלוש עשרה', count14: 'ארבע עשרה', count15: 'חמש עשרה',
    count16: 'שש עשרה', count17: 'שבע עשרה', count18: 'שמונה עשרה', count19: 'תשע עשרה', count20: 'עשרים',
    'sub.sound': 'הקשיבו. כמה צלילים נשארו בסוף?',
    'sub.picture': 'כמה עיגולים נשארו?',
    'choice.sound': 'הקשיבו, ואז בחרו את המספר',
    'choice.picture': 'כמה עיגולים יש? בחרו את המספר',
    'choice.symbol': 'כמה זה? בחרו את המספר',
    'choice.silent': 'כמה זה? בחרו את המספר',
    'drag.sound': 'הקשיבו, ואז גררו לסל עיגול על כל צליל',
    'drag.picture': 'כמה עיגולים יש? גררו לסל עיגול על כל עיגול',
    'drag.symbol': 'כמה זה? גררו לסל את התשובה',
    'drag.silent': 'כמה זה? גררו לסל את התשובה',
    'line.sound': 'הקשיבו. כל צליל הוא קפיצה. איפה נחתנו?',
    'line.picture': 'כמה עיגולים יש? הקישו על המספר בקו',
    'line.symbol': 'כמה זה? הקישו על המספר בקו',
    'line.silent': 'כמה זה? הקישו על המספר בקו',
  };
  // Recorded clips present in sounds/voice/he/ (key -> file). Empty until the
  // owner records them with tools/record-voice.html; SOUNDS-LICENSES.md lists
  // every file that is added.
  const VOICE_CLIPS = {};
  // Rising C major, one note per answer dot (up to 10).
  const SCALE = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88, 523.25, 587.33, 659.25];

  // The answer of an item: a + b, or a - b for [a, b, '-'].
  function minus(item) { return item[2] === '-'; }
  function sum(item) { return minus(item) ? item[0] - item[1] : item[0] + item[1]; }
  function eqText(item, end) { return item[0] + (minus(item) ? ' − ' : ' + ') + item[1] + ' = ' + end; }
  // The number line of an item: 0..10, or 0..20 once a number passes ten.
  function lineMax(item) { return Math.max(item[0], sum(item)) > LINE_MAX ? 2 * LINE_MAX : LINE_MAX; }

  function family(id) { return FAMILIES.filter(function (f) { return f.id === id; })[0] || FAMILIES[0]; }

  // The exercise as sound: one sound per unit of the first number, a pause,
  // one higher sound per unit of the second. dot = the circle it lights.
  // Subtraction (takeAwayBeats): all of a, a pause, then a again with its
  // last b beats silent, so only a - b higher sounds are heard. The 10th
  // sound of a count gets a gong on top (tenExchange: a full ten).
  function numbersToBeats(a, b, beat, gap, familyId, sub) {
    const step = beat || BEAT;
    const pause = gap == null ? GAP : gap;
    const f = family(familyId);
    const notes = [];
    for (let i = 0; i < a; i++) notes.push({ at: i * step, voice: f.a.voice, hz: f.a.hz, group: 0, dot: i });
    if (sub) {
      for (let k = 0; k < a - b; k++) notes.push({ at: a * step + pause + k * step, voice: f.b.voice, hz: f.b.hz, group: 1, dot: k });
    } else {
      for (let j = 0; j < b; j++) notes.push({ at: a * step + pause + j * step, voice: f.b.voice, hz: f.b.hz, group: 1, dot: a + j });
    }
    const ten = notes.filter(function (x) { return x.dot === 9 && x.group === (sub ? 0 : x.group); })[0];
    if (ten) notes.splice(notes.indexOf(ten) + 1, 0, { at: ten.at, voice: 'gong', group: ten.group, dot: 9, kind: 'ten' });
    return notes;
  }

  // The hint replay: the same sounds, each followed on screen by its count.
  function countPlan(item, familyId) {
    // Counted are the sounds of the answer: all of them, or what is left.
    const notes = numbersToBeats(item[0], item[1], 0, null, familyId, minus(item)).filter(function (n) { return n.kind !== 'ten' && (!minus(item) || n.group === 1); });
    return notes.map(function (n, i) { return Object.assign({}, n, { count: i + 1 }); });
  }

  function scalePlan(n) {
    const notes = [];
    for (let i = 0; i < n; i++) notes.push({ at: i * 0.3, voice: 'woodBar', hz: SCALE[i % SCALE.length], dot: i, count: i + 1, kind: 'scale' });
    return notes;
  }

  function createState(opts) {
    const o = opts || {};
    const stage = STAGES.indexOf(o.stage) >= 0 ? o.stage : STAGES[0];
    const step = Math.max(0, Math.min(STEPS.length - 1, Number(o.step) || 0));
    const items = STEPS[step].items;
    const index = ((Number(o.index) || 0) % items.length + items.length) % items.length;
    const mode = MODES.indexOf(o.mode) >= 0 ? o.mode : MODES[0];
    // In a picking type taps is the picked number, null until there is one.
    return {
      step: step, index: index, item: o.item || items[index], stage: stage, family: family(o.family).id, mode: mode,
      taps: picks(mode) ? null : 0, wrong: [], tries: 0, status: 'ready', back: !!o.back,
      streak: o.streak || 0, silentRight: o.silentRight || 0,
      plainTried: o.plainTried || 0, plainRight: o.plainRight || 0,
      message: '', hint: null, sound: null,
    };
  }

  function sounding(state) { return state.stage === 'sound'; }
  function tapSounds(state) { return state.stage !== 'silent'; }
  function done(state) { return state.status === 'right' || state.status === 'shown'; }
  // Types where the child picks one number instead of tapping one per sound.
  function picks(mode) { return mode === 'choice' || mode === 'line'; }
  function picking(state) { return picks(state.mode); }
  // ✔ is live once there is an answer that was not already marked wrong.
  function answered(state) { return state.taps != null && state.wrong.indexOf(state.taps) < 0; }

  function tap(state) {
    if (done(state) || picking(state)) return Object.assign({}, state, { sound: null });
    return Object.assign({}, state, { taps: state.taps + 1, sound: null });
  }

  function untap(state) {
    if (done(state) || picking(state) || state.taps === 0) return Object.assign({}, state, { sound: null });
    return Object.assign({}, state, { taps: state.taps - 1, sound: null });
  }

  // Three numbers: the sum and its two neighbours; the right one moves
  // between the three places from exercise to exercise. The silent stage is
  // the no-music mastery check, so it cannot be a 1-in-3 guess: there the
  // child picks from every number 1..CHOICE_MAX (a grid of big buttons, a
  // guess is right 1 time in 10 and mastery needs two right first tries).
  function choices(item, index, stage) {
    const t = sum(item);
    if (stage === 'silent') return Array.from({ length: t > CHOICE_MAX ? 2 * CHOICE_MAX : CHOICE_MAX }, function (_, i) { return i + 1; });
    const opts = [t - 1, t, t + 1];
    const r = (index || 0) % 3;
    return opts.slice(r).concat(opts.slice(0, r));
  }

  // A picking type: choose a number; one already crossed out stays out.
  function pick(state, n) {
    // On the line the thumb may pass a crossed-out number; ✔ stays off there.
    const out = state.mode === 'line' ? !(n >= 0 && n <= lineMax(state.item)) : state.wrong.indexOf(n) >= 0;
    if (done(state) || !picking(state) || out) return Object.assign({}, state, { sound: null });
    return Object.assign({}, state, { taps: n, sound: null });
  }

  // Mid-exercise switch: the same exercise on another family, nothing lost.
  function setFamily(state, id) {
    return Object.assign({}, state, { family: family(id).id, sound: done(state) ? null : 'exercise' });
  }

  function nextStage(stage, dir) {
    const i = STAGES.indexOf(stage) + dir;
    return STAGES[Math.max(0, Math.min(STAGES.length - 1, i))];
  }

  // What is missing or extra, in the words of the answer type.
  function diffText(mode, diff) {
    const n = Math.abs(diff);
    if (picks(mode)) return diff > 0 ? 'קטן מדי.' : 'גדול מדי.';
    if (mode === 'drag') return diff === 1 ? 'חסר עיגול אחד בסל.' : diff > 1 ? 'חסרים ' + n + ' עיגולים בסל.' : diff === -1 ? 'יש בסל עיגול אחד יותר מדי.' : 'יש בסל ' + n + ' עיגולים יותר מדי.';
    return diff === 1 ? 'חסרה הקשה אחת.' : diff > 1 ? 'חסרות ' + n + ' הקשות.' : diff === -1 ? 'יש הקשה אחת יותר מדי.' : 'יש ' + n + ' הקשות יותר מדי.';
  }

  // ✔: right, a hinted second try, or (after two tries) the solution.
  function check(state) {
    if (done(state) || !answered(state)) return Object.assign({}, state, { sound: null });
    const total = sum(state.item);
    const tries = state.tries + 1;
    const eq = eqText(state.item, total);
    const plain = state.stage === 'silent' && tries === 1;
    const counted = {
      plainTried: state.plainTried + (plain ? 1 : 0),
      plainRight: state.plainRight + (plain && state.taps === total ? 1 : 0),
    };
    if (state.taps === total) {
      const first = tries === 1;
      return Object.assign({}, state, counted, {
        tries: tries, status: 'right', hint: null, sound: state.stage === 'silent' ? null : 'scale', speak: 'right',
        streak: first ? state.streak + 1 : 0,
        silentRight: state.silentRight + (first && state.stage === 'silent' ? 1 : 0),
        message: 'כל הכבוד! ' + eq,
      });
    }
    const diff = total - state.taps;
    const hint = diff > 0 ? { missing: diff } : { extra: -diff };
    if (tries < MAX_TRIES) {
      const again = state.stage === 'silent' ? 'נסו שוב.' : 'ננסה שוב עם צלילים 🎵';
      return Object.assign({}, state, counted, {
        tries: tries, status: 'retry', hint: hint, sound: state.stage === 'silent' ? null : 'hint', speak: 'retry', streak: 0,
        wrong: picking(state) ? state.wrong.concat([state.taps]) : state.wrong,
        message: 'כמעט! ' + diffText(state.mode, diff) + ' ' + again,
      });
    }
    return Object.assign({}, state, counted, {
      tries: tries, status: 'shown', hint: hint, sound: state.stage === 'silent' ? null : 'solution', speak: 'shown', streak: 0,
      message: 'לא נורא! התשובה: ' + eq,
    });
  }

  // →: the stage moves on after STREAK_TO_ADVANCE right first tries and back
  // after a shown solution; a miss in the plain stage goes back to the sound.
  // A mastered step opens the next step of STEPS, with sound again.
  function next(state) {
    if (state.status === 'right' && mastered(state) && state.step < STEPS.length - 1) {
      return createState({ step: state.step + 1, family: state.family, mode: state.mode, plainTried: state.plainTried, plainRight: state.plainRight });
    }
    let stage = state.stage;
    let streak = state.streak;
    let back = false;
    if (state.status === 'shown') { stage = stage === 'silent' ? STAGES[0] : nextStage(stage, -1); streak = 0; back = true; }
    else if (streak >= STREAK_TO_ADVANCE) { stage = nextStage(stage, +1); streak = 0; }
    return createState({
      step: state.step, stage: stage, index: state.index + 1, streak: streak, back: back, family: state.family, mode: state.mode,
      silentRight: state.silentRight, plainTried: state.plainTried, plainRight: state.plainRight,
    });
  }

  function mastered(state) { return state.silentRight >= MASTERED_AT; }

  // Plain-check success rate for the report (null before the first try).
  function plainRate(state) { return state.plainTried ? state.plainRight / state.plainTried : null; }

  function wordCount(text) { return String(text).trim().split(/\s+/).filter(Boolean).length; }

  function promptOf(state) {
    if (state.message) return state.message;
    if (state.back) return BACK_PROMPT;
    if (minus(state.item) && SUB_PROMPTS[state.stage]) return SUB_PROMPTS[state.stage];
    return (MODE_PROMPTS[state.mode] || PROMPTS)[state.stage].replace('{i}', family(state.family).icon);
  }

  // What is spoken when the card is drawn: the feedback, else the instruction.
  function speechKey(state) {
    if (state.speak) return state.speak;
    if (state.back) return 'back';
    if (minus(state.item) && SPEECH['sub.' + state.stage]) return 'sub.' + state.stage;
    return SPEECH[state.mode + '.' + state.stage] ? state.mode + '.' + state.stage : state.stage;
  }

  // Left to right like the written exercise: the first group, +, the second.
  // On a right answer the two groups become one group of the total.
  function dotsHtml(state, show, groups) {
    const a = state.item[0];
    const b = state.item[1];
    const merge = state.status === 'right';
    const sub = minus(state.item);
    function group(from, n, cls) {
      let dots = '';
      for (let i = from; i < from + n; i++) {
        const c = cls + (i === 9 ? ' sa-ten' : '') + (sub && i >= a - b ? ' sa-gone' : '');
        dots += '<span class="sa-dot ' + c + (show ? '' : ' sa-dim') + '" data-dot="' + i + '"><b class="sa-count"></b></span>';
      }
      return '<span class="sa-group"><span class="sa-row">' + dots + '</span>' + (groups ? '<span class="sa-num" aria-hidden="true">' + n + '</span>' : '') + '</span>';
    }
    const label = sub ? (merge ? 'נשארו ' + sum(state.item) + ' עיגולים' : a + ' עיגולים, ' + b + ' הולכים') :
      merge ? a + ' ועוד ' + b + ' הם ' + sum(state.item) + ' עיגולים' : a + ' עיגולים ועוד ' + b + ' עיגולים';
    const second = sub ? '<span class="sa-plus" aria-hidden="true">−</span>' + (groups ? '<span class="sa-num" aria-hidden="true">' + b + '</span>' : '') :
      '<span class="sa-plus" aria-hidden="true">+</span>' + group(a, b, 'sa-high');
    return '<div class="sa-dots' + (merge ? ' sa-merge' : '') + '" dir="ltr" role="img" aria-label="' + label + '">' +
      group(0, a, 'sa-low') + second +
      (merge ? '<span class="sa-total" aria-hidden="true">' + sum(state.item) + '</span>' : '') + '</div>';
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
    const basket = state.mode === 'drag';
    return '<div class="sa-answer' + (basket ? ' sa-basket' : '') + '" dir="ltr" aria-live="polite" aria-label="' + (basket ? 'בסל ' : picking(state) ? 'בחרתם ' : 'הקשתם ') + taps + '">' + html + '</div>';
  }

  // 'line' mirrors the #singingLine number line (index.html, kept in PR #656):
  // a range input with aria-value* on 0..LINE_MAX, the tick numbers under it,
  // and a group of 44px step buttons (◀ ▶) for a child who cannot place the
  // thumb. A crossed-out number can be reached again but not checked.
  function lineHtml(state, fin) {
    const total = sum(state.item);
    const v = state.taps == null ? 0 : state.taps;
    const max = lineMax(state.item);
    let ticks = '';
    for (let n = 0; n <= max; n++) {
      const c = 'sa-tick' + (state.wrong.indexOf(n) >= 0 ? ' sa-wrong' : '') + (fin && n === total ? ' sa-right' : '') + (state.taps === n ? ' sa-on' : '');
      ticks += '<span class="' + c + '" data-tick="' + n + '">' + n + '</span>';
    }
    const off = fin ? ' disabled' : '';
    return '<div class="sa-line nl-control' + (max > LINE_MAX ? ' sa-line20' : '') + '" dir="ltr"><input id="saLine" class="sa-range" type="range" data-act="slide" min="0" max="' + max + '" step="1" value="' + v + '"' +
      ' aria-valuemin="0" aria-valuemax="' + max + '" aria-valuenow="' + v + '" aria-valuetext="' + v + '" aria-label="מיקום על ישר המספרים"' + off + '>' +
      '<div class="sa-ticks" aria-hidden="true">' + ticks + '</div></div>' +
      '<div class="nl-keys sa-nudge" dir="ltr" role="group" aria-label="צעד על הישר">' +
      '<button type="button" data-act="nudge" data-d="-1" aria-label="צעד אחורה"' + off + '>◀</button>' +
      '<button type="button" data-act="nudge" data-d="1" aria-label="צעד קדימה"' + off + '>▶</button></div>';
  }

  // The answer control of each type: the pad, the number buttons or the line.
  function controlHtml(state, fin, tapAttr, icon) {
    const total = sum(state.item);
    if (state.mode === 'line') return lineHtml(state, fin);
    if (picking(state)) {
      const grid = state.stage === 'silent';
      const btns = choices(state.item, state.index, state.stage).map(function (n) {
        const out = state.wrong.indexOf(n) >= 0;
        const c = 'sa-opt' + (out ? ' sa-wrong' : '') + (fin && n === total ? ' sa-right' : '');
        return '<button type="button" class="' + c + '" data-act="pick" data-n="' + n + '"' + tapAttr +
          ' aria-pressed="' + (state.taps === n) + '"' + (fin || out ? ' disabled' : '') + '>' + n + '</button>';
      }).join('');
      return '<div class="sa-opts' + (grid ? ' sa-grid' : '') + '" dir="ltr" role="group" aria-label="בחרו מספר">' + btns + '</div>';
    }
    if (state.mode === 'drag') {
      return '<button type="button" class="sa-pad sa-source" data-act="tap"' + tapAttr + (fin ? ' disabled' : '') + ' aria-label="גררו עיגול לסל. בסל ' + state.taps + '">🔵 <span>' + state.taps + '</span></button>';
    }
    return '<button type="button" class="sa-pad" data-act="tap"' + tapAttr + (fin ? ' disabled' : '') + ' aria-label="הקשה. הקשתם ' + state.taps + '">' + icon + ' <span>' + state.taps + '</span></button>';
  }

  function familiesHtml(state) {
    if (!tapSounds(state)) return '';
    return '<div class="sa-families" role="group" aria-label="בחרו כלי">' + FAMILIES.map(function (f) {
      const on = f.id === state.family;
      return '<button type="button" class="sa-fam' + (on ? ' on' : '') + '" data-act="family" data-family="' + f.id + '" aria-pressed="' + on + '" aria-label="' + f.he + '">' + f.icon + '</button>';
    }).join('') + '</div>';
  }

  function renderHtml(state) {
    const e = JAM.esc;
    const fin = done(state);
    const f = family(state.family);
    const showDots = state.stage === 'sound' || state.stage === 'picture' || state.status === 'right' || (fin && state.stage !== 'silent');
    const showEq = state.stage === 'symbol' || state.stage === 'silent' || fin;
    const tapAttr = tapSounds(state) ? ' data-tap="' + f.tap + '"' : '';
    const eq = '<bdi dir="ltr">' + eqText(state.item, fin ? sum(state.item) : '?') + '</bdi>';
    // One line of text: the prompt, replaced by the feedback once there is one,
    // so the card never passes 15 words.
    const tone = state.status === 'right' ? ' good' : state.status === 'ready' && !state.back ? '' : ' soft';
    const lit = state.stage === 'picture' || state.status !== 'ready';
    return familiesHtml(state) +
      '<p class="sa-prompt sa-msg' + tone + '" role="status" aria-live="polite">' + e(promptOf(state)) + '</p>' +
      (showDots ? dotsHtml(state, lit, state.stage !== 'sound' || fin) : '') +
      (showEq ? '<p class="sa-eq">' + eq + '</p>' : '') +
      answerHtml(state) +
      controlHtml(state, fin, tapAttr, tapSounds(state) ? f.icon : '👆') +
      '<div class="jam-row sa-row-btns">' +
      (tapSounds(state) ? '<button type="button" class="secondary sa-big" data-act="listen" aria-label="שמעו שוב">👂</button>' : '') +
      (picking(state) ? '' : '<button type="button" class="secondary sa-big" data-act="untap"' + (fin ? ' disabled' : '') + ' aria-label="מחקו הקשה">↩</button>') +
      (fin ? '<button type="button" class="primary sa-big" data-act="next" aria-label="הבא">←</button>' : '<button type="button" class="primary sa-big sa-ok" data-act="check"' + (answered(state) ? '' : ' disabled') + ' aria-label="סיימתי">✔</button>') +
      '</div>' +
      (mastered(state) ? '<p class="sa-mastered">⭐</p>' : '');
  }

  // ---------- speech: Hebrew voice, else recorded clip, else silence ----------
  function hebrewVoice() {
    const s = root.speechSynthesis;
    if (!s || typeof root.SpeechSynthesisUtterance !== 'function' || !s.getVoices) return null;
    return s.getVoices().filter(function (v) { return /^he/i.test(v.lang); })[0] || null;
  }

  // How a key will be spoken on this device: 'tts', 'clip' or 'none'.
  function speechRoute(key, hasHebrewVoice, clips) {
    if (!SPEECH[key]) return 'none';
    if (hasHebrewVoice) return 'tts';
    return (clips || VOICE_CLIPS)[key] ? 'clip' : 'none';
  }

  let clipPlaying = null;
  function say(key) {
    const he = hebrewVoice();
    const route = speechRoute(key, !!he);
    if (route === 'tts') {
      const u = new root.SpeechSynthesisUtterance(SPEECH[key]);
      u.voice = he; u.lang = he.lang; u.rate = /^count/.test(key) ? 1.2 : 0.95;
      // Counts queue behind the sentence; a new sentence cuts the old one.
      if (!/^count/.test(key)) root.speechSynthesis.cancel();
      root.speechSynthesis.speak(u);
    } else if (route === 'clip' && typeof root.Audio === 'function') {
      if (clipPlaying) clipPlaying.pause();
      clipPlaying = new root.Audio('sounds/voice/he/' + VOICE_CLIPS[key]);
      const p = clipPlaying.play();
      if (p && p.catch) p.catch(function () { /* blocked or missing: the icons carry it */ });
    }
  }

  function audioRunning() {
    const me = root.musicEngine;
    const ac = me && me.getSharedAudioContext ? me.getSharedAudioContext() : null;
    return !!(ac && ac.state === 'running');
  }

  function mount(el) {
    JAM.registerTapVoices();
    const q = root.location && /[?&]mode=(\w+)/.exec(root.location.search || '');
    // ?step=crossTen opens a later step directly (teacher preview, SOUND-ADD.md).
    const sq = root.location && /[?&]step=(\w+)/.exec(root.location.search || '');
    let state = createState({ mode: q && q[1], step: sq ? Math.max(0, STEPS.map(function (s) { return s.id; }).indexOf(sq[1])) : 0 });
    let playing = null;
    const answerSel = state.mode === 'line' ? '#saLine' : picking(state) ? '[data-act="pick"]:not([disabled])' : '[data-act="tap"]';
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
        light('[data-dot="' + n.dot + '"]', withCount ? n.count : 0);
        if (state.mode === 'line' && n.kind !== 'scale') light('[data-tick="' + (n.dot + 1) + '"]'); // one hop per sound
        if (n.kind === 'scale') light('[data-ans="' + n.dot + '"]');
        if (withCount) say('count' + n.count);
      });
    }
    // The opening of every exercise: the spoken instruction, then its sound.
    function open() {
      say(speechKey(state));
      if (sounding(state)) setTimeout(function () { play(numbersToBeats(state.item[0], state.item[1], 0, null, state.family, minus(state.item))); }, 900);
    }
    function sound() {
      if (state.speak) say(state.speak);
      if (state.sound === 'scale') {
        const dots = el.querySelector('.sa-dots');
        if (dots) requestAnimationFrame(function () { dots.classList.add('sa-merged'); });
        el.querySelector('.sa-answer').classList.add('sa-win');
        setTimeout(function () { play(scalePlan(sum(state.item)), true); }, 1100);
      }
      if (state.sound === 'hint' || state.sound === 'solution') { JAM.feedback(false); setTimeout(function () { play(countPlan(state.item, state.family), true); }, 1800); }
      if (state.sound === 'exercise') play(numbersToBeats(state.item[0], state.item[1], 0, null, state.family, minus(state.item)));
      if (state.status === 'right' && state.stage === 'silent') { const dots = el.querySelector('.sa-dots'); if (dots) requestAnimationFrame(function () { dots.classList.add('sa-merged'); }); }
    }
    function save() {
      try { root.localStorage.setItem('mm.soundAdd.plain', JSON.stringify({ tried: state.plainTried, right: state.plainRight })); } catch (e) { /* private mode */ }
    }
    // 'drag': a circle follows the finger from the pile; dropped on the
    // basket it counts, dropped elsewhere it does not (JAM.dragToTarget, the
    // shared kit of the #591 screens). The click after a drag is ignored so
    // a drop never counts twice; a plain tap on the pile still adds one.
    const dragKit = JAM.dragToTarget(el, {
      source: '.sa-source', target: '.sa-basket', ghostClass: 'sa-ans sa-ghost',
      enabled: function () { return state.mode === 'drag'; },
      onDrop: function () { run('tap'); },
    });
    // 'line': like #singingLine, every number sings its own pitch
    // (numberLine.js soundForTick) while the thumb moves; the card is drawn
    // again only when the thumb is let go, so the drag is not cut.
    function sing(n) {
      if (!tapSounds(state) || typeof root.soundForTick !== 'function') return;
      JAM.playNotes([{ at: 0, voice: 'woodBar', hz: root.soundForTick(n, { min: 0, max: lineMax(state.item) }).frequency }]);
    }
    el.addEventListener('input', function (ev) {
      if (!ev.target.classList || !ev.target.classList.contains('sa-range')) return;
      const n = Number(ev.target.value);
      state = pick(state, n);
      ev.target.setAttribute('aria-valuenow', n);
      ev.target.setAttribute('aria-valuetext', n);
      el.querySelectorAll('.sa-tick').forEach(function (t) { t.classList.toggle('sa-on', Number(t.getAttribute('data-tick')) === n); });
      const ok = el.querySelector('[data-act="check"]');
      if (ok) ok.disabled = !answered(state);
      sing(n);
    });
    el.addEventListener('change', function (ev) {
      if (ev.target.classList && ev.target.classList.contains('sa-range')) draw('#saLine');
    });
    el.addEventListener('click', function (ev) {
      const b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (dragKit.dragged(b)) return;
      if (b && b.getAttribute('data-act') === 'slide') return;
      if (!b || b.disabled) return;
      run(b.getAttribute('data-act'), b);
    });
    function run(act, b) {
      let focus = act === 'pick' ? '[data-n="' + b.getAttribute('data-n') + '"]' : '[data-act="' + act + '"]';
      if (act === 'start') {
        const me = root.musicEngine;
        Promise.resolve(me && me.unlockAudio ? me.unlockAudio() : null).then(function () { draw(answerSel); open(); });
        return;
      }
      if (act === 'listen') {
        if (state.status === 'retry' || state.status === 'shown') play(countPlan(state.item, state.family), true);
        else play(numbersToBeats(state.item[0], state.item[1], 0, null, state.family, minus(state.item)));
        return;
      }
      if (act === 'family') { state = setFamily(state, b.getAttribute('data-family')); focus = '[data-family="' + state.family + '"]'; }
      else if (act === 'tap') state = tap(state);
      else if (act === 'untap') state = untap(state);
      else if (act === 'pick') state = pick(state, Number(b.getAttribute('data-n')));
      else if (act === 'nudge') {
        state = pick(state, Math.max(0, Math.min(lineMax(state.item), (state.taps == null ? 0 : state.taps) + Number(b.getAttribute('data-d')))));
        focus = '[data-act="nudge"][data-d="' + b.getAttribute('data-d') + '"]';
        sing(state.taps);
      }
      else if (act === 'check') { state = check(state); save(); focus = state.status === 'retry' ? answerSel : '[data-act="next"]'; }
      else if (act === 'next') { stop(); state = next(state); focus = answerSel; }
      draw(focus);
      if (act === 'tap') light('[data-ans="' + (state.taps - 1) + '"]');
      if (act === 'next') { open(); return; }
      sound();
      state = Object.assign({}, state, { speak: null });
    }
    draw();
    // Sound opens the exercise. A browser that blocks audio before the first
    // touch gets one big ▶ over the card; that touch starts the exercise.
    // resume() can stay pending until a touch, so decide after a short wait.
    const me = root.musicEngine;
    if (me && me.unlockAudio) me.unlockAudio();
    setTimeout(function () {
      if (audioRunning()) { open(); return; }
      el.insertAdjacentHTML('afterbegin', '<button type="button" class="sa-start" data-act="start" aria-label="התחילו">▶</button>');
    }, 250);
    return { get state() { return state; } };
  }

  return {
    GAME: GAME, PROGRESSION: PROGRESSION, ITEMS: ITEMS, STEPS: STEPS, WAYS: WAYS, STAGES: STAGES, FAMILIES: FAMILIES, PROMPTS: PROMPTS, SPEECH: SPEECH, VOICE_CLIPS: VOICE_CLIPS,
    MAX_TRIES: MAX_TRIES, MODES: MODES, MODE_PROMPTS: MODE_PROMPTS, CHOICE_MAX: CHOICE_MAX, LINE_MAX: LINE_MAX,
    sum: sum, lineMax: lineMax, numbersToBeats: numbersToBeats, countPlan: countPlan, scalePlan: scalePlan, choices: choices,
    createState: createState, tap: tap, untap: untap, pick: pick, setFamily: setFamily, check: check, next: next,
    mastered: mastered, plainRate: plainRate, promptOf: promptOf, speechKey: speechKey, speechRoute: speechRoute,
    wordCount: wordCount, renderHtml: renderHtml, mount: mount,
  };
});
