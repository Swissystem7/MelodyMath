// MelodyMath — RhythmMaster, a polyrhythm challenge track (#591, owner
// comment 6376159285).
//
// Every voice strikes once every v pulses (v = 3 means "every 3 pulses";
// v = 3/2 is a non-whole ratio, "every pulse and a half"). The voices start
// together and meet again after lcmOfVoices(voices) pulses: lcm(3, 4) = 12,
// lcm(2, 3, 5) = 30, lcm(3/2, 2) = 6. In that cycle voice i plays L / v_i
// strokes, which gives the ratio tasks (3 and 4 -> 4:3 strokes) and the
// fraction tasks (2 strokes of a voice that plays 4 = 2/4 = 1/2 of the cycle).
//
// Practice is interleaved: the kinds lcm / ratio / fraction take turns, never
// the same kind twice in a row (Rohrer et al. 2014, Taylor & Rohrer 2009).
// Every task also asks the child to pick the reason for the answer from 3
// options. validatePosedProblem() checks a puzzle the child made up
// ("המציאו חידה", Rosli et al. 2014) and refuses one without a solution.
//
// Everything here is pure: no DOM, no clock, no Math.random. The voice sets
// come from a small seeded generator so the same step always gives the same
// task.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_RHYTHM_MASTER = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAX_VOICE = 12;
  const MIN_VOICES = 2;
  const MAX_VOICES = 4;
  const KINDS = ['lcm', 'ratio', 'fraction'];
  const KIND_HE = { lcm: 'מתי נפגשים', ratio: 'יחס', fraction: 'שבר' };
  const VOICE_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳'];

  // ---- numbers ----------------------------------------------------------

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x;
  }

  function lcm(a, b) {
    return a / gcd(a, b) * b;
  }

  // A voice as a reduced fraction {n, d}: 4, '4', 1.5, '3/2', {n:3, d:2}.
  // Only whole and half pulses (d = 1 or 2) between 0 and 12 are voices.
  function parseVoice(v) {
    let n;
    let d;
    if (v && typeof v === 'object') {
      n = Number(v.n);
      d = Number(v.d);
    } else if (typeof v === 'string' && v.indexOf('/') !== -1) {
      const parts = v.split('/');
      if (parts.length !== 2) return null;
      n = Number(parts[0].trim());
      d = Number(parts[1].trim());
    } else {
      const x = Number(v);
      if (typeof v === 'string' && v.trim() === '') return null;
      if (!Number.isFinite(x)) return null;
      if (Number.isInteger(x)) { n = x; d = 1; } else if (Number.isInteger(x * 2)) { n = x * 2; d = 2; } else return null;
    }
    if (!Number.isInteger(n) || !Number.isInteger(d) || n <= 0 || d <= 0) return null;
    const g = gcd(n, d);
    n /= g;
    d /= g;
    if (d > 2 || n / d > MAX_VOICE) return null;
    return { n: n, d: d };
  }

  function voiceValue(f) { return f.n / f.d; }

  function voiceText(v) {
    const f = parseVoice(v);
    if (!f) return String(v);
    return f.d === 1 ? String(f.n) : f.n + '/' + f.d;
  }

  // Pulses until every voice strikes together again. lcm(a/b, c/d) =
  // lcm(a, c) / gcd(b, d) for reduced fractions. null on a bad voice list.
  function lcmOfVoices(voices) {
    if (!Array.isArray(voices) || voices.length < 1) return null;
    let num = 0;
    let den = 0;
    for (let i = 0; i < voices.length; i++) {
      const f = parseVoice(voices[i]);
      if (!f) return null;
      if (i === 0) { num = f.n; den = f.d; } else { num = lcm(num, f.n); den = gcd(den, f.d); }
    }
    return num / den;
  }

  // Strokes each voice plays in one cycle (L / v), e.g. [3, 4] -> [4, 3].
  function strokesPerCycle(voices) {
    const L = lcmOfVoices(voices);
    if (L == null) return null;
    return voices.map(function (v) { return Math.round(L / voiceValue(parseVoice(v))); });
  }

  function reduceRatio(parts) {
    const g = parts.reduce(function (a, b) { return gcd(a, b); });
    return parts.map(function (p) { return p / g; });
  }

  function fracText(n, d) {
    const g = gcd(n, d);
    return (n / g) + '/' + (d / g);
  }

  function parseFraction(s) {
    const m = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(String(s));
    if (!m || Number(m[2]) === 0) return null;
    return Number(m[1]) / Number(m[2]);
  }

  function parseRatio(s) {
    const parts = String(s).split(':').map(function (p) { return p.trim(); });
    if (parts.length < 2 || parts.some(function (p) { return !/^\d+$/.test(p) || Number(p) === 0; })) return null;
    return reduceRatio(parts.map(Number)).join(':');
  }

  // Is `given` the same answer as `answer` for a task kind?
  function sameAnswer(kind, given, answer) {
    if (given == null || String(given).trim() === '') return false;
    if (kind === 'lcm') return Number(String(given).trim()) === Number(answer);
    if (kind === 'ratio') return parseRatio(given) != null && parseRatio(given) === parseRatio(answer);
    if (kind === 'fraction') {
      const a = parseFraction(given);
      return a != null && Math.abs(a - parseFraction(answer)) < 1e-9;
    }
    return false;
  }

  // ---- adaptive difficulty ----------------------------------------------

  // TODO-source: the owner marked adaptive difficulty as an addition with no
  // direct evidence in this field (comment 6376159285). The 70-85% band and
  // the ladder below are a design choice, not a sourced finding.
  // Every step up adds a voice or a non-whole (half-pulse) voice.
  const LEVELS = [
    { voices: 2, half: false, max: 8, he: 'שני קולות' },
    { voices: 2, half: true, max: 6, he: 'שני קולות, אחד בחצאי פעמה' },
    { voices: 3, half: false, max: 6, he: 'שלושה קולות' },
    { voices: 3, half: true, max: 6, he: 'שלושה קולות, אחד בחצאי פעמה' },
    { voices: 4, half: false, max: 6, he: 'ארבעה קולות' },
  ];
  const BAND = { low: 0.7, high: 0.85, target: 0.8 };
  const WINDOW = 10;
  const MIN_ANSWERS = 8;

  function initialAdapt(level) {
    const l = Math.max(0, Math.min(LEVELS.length - 1, Number(level) || 0));
    return { level: l, recent: [] };
  }

  function successRate(recent) {
    if (!recent || !recent.length) return null;
    return recent.filter(Boolean).length / recent.length;
  }

  // One answer in. Over the last WINDOW answers: above 85% -> one level up
  // (a voice or a non-whole ratio is added); below 70% (after at least
  // MIN_ANSWERS) -> one level down; inside the band -> stay. The window restarts on a move.
  // Returns { state, move: 'up'|'down'|null, added: 'voice'|'half'|null, rate }.
  function adaptStep(state, correct) {
    const s = state && Array.isArray(state.recent) ? state : initialAdapt(state && state.level);
    const recent = s.recent.concat([!!correct]).slice(-WINDOW);
    const rate = successRate(recent);
    let level = s.level;
    let move = null;
    // Up needs a full window (a lucky short run is not mastery); down only
    // MIN_ANSWERS, so a child who is stuck is not left there for long.
    if (recent.length >= WINDOW && rate > BAND.high && level < LEVELS.length - 1) { level += 1; move = 'up'; }
    else if (recent.length >= MIN_ANSWERS && rate < BAND.low && level > 0) { level -= 1; move = 'down'; }
    let added = null;
    if (move === 'up') {
      const a = LEVELS[s.level];
      const b = LEVELS[level];
      added = b.voices > a.voices ? 'voice' : (b.half && !a.half ? 'half' : null);
    }
    return { state: { level: level, recent: move ? [] : recent }, move: move, added: added, rate: rate };
  }

  // ---- tasks ------------------------------------------------------------

  // Small deterministic generator (mulberry32) so a step number always maps
  // to the same voices. Not used for anything the child unlocks.
  function seeded(seed) {
    let a = (Number(seed) || 0) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // A voice set for a level: distinct values 2..max, one half voice
  // (3/2, 5/2, 7/2) on half levels, cycle at most 60 pulses and longer than
  // the slowest voice (so no voice is a multiple of all the others).
  function voicesForLevel(level, seed) {
    const L = LEVELS[Math.max(0, Math.min(LEVELS.length - 1, Number(level) || 0))];
    const rnd = seeded(seed * 7919 + level * 104729 + 1);
    for (let tries = 0; tries < 500; tries++) {
      const pool = [];
      for (let v = 2; v <= L.max; v++) pool.push(v);
      const out = [];
      if (L.half) out.push(['3/2', '5/2', '7/2'][Math.floor(rnd() * 3)]);
      while (out.length < L.voices) {
        const i = Math.floor(rnd() * pool.length);
        out.push(pool.splice(i, 1)[0]);
      }
      const values = out.map(function (v) { return voiceValue(parseVoice(v)); });
      const distinct = values.every(function (x, i) { return values.indexOf(x) === i; });
      const cyc = lcmOfVoices(out);
      if (distinct && cyc <= 60 && cyc > Math.max.apply(null, values)) {
        return out.sort(function (a, b) { return voiceValue(parseVoice(a)) - voiceValue(parseVoice(b)); });
      }
    }
    return L.half ? ['3/2', '2'].slice(0, L.voices) : [2, 3, 5, 7].slice(0, L.voices);
  }

  // Word contexts. 'drums' is the practised one; the others carry the same
  // maths with no music, for the unpractised (transfer) items of the tests.
  const CONTEXTS = {
    drums: { who: 'תוף', unit: 'פעימות', verb: 'מכה', strokes: 'מכות', meet: 'יכו יחד שוב' },
    bus: { who: 'קו אוטובוס', unit: 'דקות', verb: 'יוצא', strokes: 'יציאות', meet: 'ייצאו יחד שוב' },
    lights: { who: 'פנס', unit: 'שניות', verb: 'מהבהב', strokes: 'הבהובים', meet: 'יהבהבו יחד שוב' },
    gears: { who: 'גלגל', unit: 'שניות', verb: 'משלים סיבוב', strokes: 'סיבובים', meet: 'יחזרו יחד לנקודת ההתחלה' },
  };

  function voicesSentence(voices, ctx) {
    return voices.map(function (v, i) {
      return ctx.who + ' ' + VOICE_HE[i] + ' ' + ctx.verb + ' כל ' + voiceText(v) + ' ' + ctx.unit;
    }).join(', ') + '.';
  }

  function uniqueChoices(answer, distractors, kind, max) {
    const out = [String(answer)];
    distractors.forEach(function (d) {
      if (d == null || out.length >= max) return;
      const s = String(d);
      if (out.some(function (o) { return o === s || sameAnswer(kind, s, o); })) return;
      out.push(s);
    });
    return out;
  }

  // Rotate a list by n so the right option is not always in one place.
  function rotate(list, n) {
    const k = ((n % list.length) + list.length) % list.length;
    return list.slice(k).concat(list.slice(0, k));
  }

  const REASONS = {
    lcm: [
      { id: 'common-multiple', he: 'זה המספר הקטן ביותר שכל המרווחים נכנסים בו מספר שלם של פעמים', ok: true },
      { id: 'product', he: 'תמיד כופלים את כל המרווחים זה בזה', ok: false },
      { id: 'biggest', he: 'לוקחים את המרווח הגדול ביותר ומכפילים ב־2', ok: false },
    ],
    ratio: [
      { id: 'strokes-in-cycle', he: 'סופרים כמה פעמים כל אחד חוזר עד שנפגשים: אורך המחזור חלקי המרווח', ok: true },
      { id: 'intervals', he: 'היחס הוא המרווחים עצמם, באותו סדר', ok: false },
      { id: 'sum', he: 'מחברים את המרווחים ומחלקים בשתיים', ok: false },
    ],
    fraction: [
      { id: 'part-of-strokes', he: 'במחזור אחד יש לו מספר קבוע של חזרות, וכל חזרה היא חלק אחד מהן', ok: true },
      { id: 'part-of-interval', he: 'מחלקים במרווח של הקול, לא במספר החזרות', ok: false },
      { id: 'other-voice', he: 'סופרים את החזרות של הקול השני', ok: false },
    ],
  };

  // One task: { kind, voices, context, prompt, answer, choices (2-4),
  // reasons (3), reasonId, cycle, strokes }.
  function makeTask(kind, voices, opts) {
    const o = opts || {};
    const ctx = CONTEXTS[o.context] || CONTEXTS.drums;
    const L = lcmOfVoices(voices);
    if (L == null || KINDS.indexOf(kind) === -1) return null;
    const st = strokesPerCycle(voices);
    const vals = voices.map(function (v) { return voiceValue(parseVoice(v)); });
    const turn = Number(o.turn) || 0;
    const head = voicesSentence(voices, ctx);
    let prompt;
    let answer;
    let distractors;
    if (kind === 'lcm') {
      prompt = head + ' הם מתחילים יחד. אחרי כמה ' + ctx.unit + ' הם ' + ctx.meet + '?';
      answer = String(L);
      const product = vals.reduce(function (a, b) { return a * b; }, 1);
      distractors = [product, Math.max.apply(null, vals) * 2, L * 2, L / 2];
      distractors = distractors.filter(function (x) { return Number.isInteger(x) && x > 0; });
    } else if (kind === 'ratio') {
      const names = voices.map(function (v, i) { return VOICE_HE[i]; }).join(' : ');
      prompt = head + ' עד שהם ' + ctx.meet + ', כמה ' + ctx.strokes + ' יש לכל אחד? מה היחס ' + names + '?';
      answer = reduceRatio(st).join(':');
      const asIntervals = Number.isInteger(vals.reduce(function (a, b) { return a + b; })) && vals.every(Number.isInteger) ? reduceRatio(vals).join(':') : null;
      // Common slips: the intervals themselves, the order turned round, and
      // counting the closing (shared) stroke too.
      distractors = [asIntervals, st.slice().reverse().join(':'), st.map(function (x) { return x + 1; }).join(':')];
    } else {
      const k = st[0] > 2 ? 2 : 1;
      prompt = head + ' ל' + ctx.who + ' ' + VOICE_HE[0] + ' עברו ' + k + ' ' + ctx.strokes + '. איזה חלק מהמחזור (עד ש' + ctx.meet + ') עבר?';
      answer = fracText(k, st[0]);
      // Slips: dividing by the other voice's count or by the interval, the
      // part that is still left, and strokes over pulses.
      distractors = [
        st.length > 1 && k < st[1] ? fracText(k, st[1]) : null,
        Number.isInteger(vals[0]) && k < vals[0] ? fracText(k, vals[0]) : null,
        fracText(st[0] - k, st[0]),
        fracText(k, L),
      ];
    }
    const choices = rotate(uniqueChoices(answer, distractors, kind, 4), turn + vals.length);
    const reasons = rotate(REASONS[kind].map(function (r) { return { id: r.id, he: r.he }; }), turn);
    return {
      kind: kind,
      voices: voices.slice(),
      context: o.context || 'drums',
      prompt: prompt,
      answer: answer,
      choices: choices,
      reasons: reasons,
      reasonId: REASONS[kind].filter(function (r) { return r.ok; })[0].id,
      cycle: L,
      strokes: st,
    };
  }

  // Kind of practice step n: lcm, ratio, fraction in turn, starting one
  // further along every 3 steps, never the same kind twice in a row.
  function kindForStep(n) {
    const i = Number(n) || 0;
    const round = Math.floor(i / 3);
    return KINDS[(i + round) % 3];
  }

  function taskForStep(level, step) {
    return makeTask(kindForStep(step), voicesForLevel(level, step), { turn: step });
  }

  // A practice block of `count` steps at one level (interleaved kinds).
  function practiceBlock(level, count, from) {
    const start = Number(from) || 0;
    const out = [];
    for (let i = 0; i < count; i++) out.push(taskForStep(level, start + i));
    return out;
  }

  function checkAnswer(task, given) {
    return !!task && sameAnswer(task.kind, given, task.answer);
  }

  function checkReason(task, id) {
    return !!task && task.reasonId === id;
  }

  // ---- "pose a puzzle" ---------------------------------------------------

  const POSE_ERRORS = {
    'too-few-voices': 'צריך לפחות שני קולות.',
    'too-many-voices': 'אפשר עד ארבעה קולות.',
    'bad-voice': 'כל קול צריך מרווח שלם או חצי, בין 1/2 ל־12.',
    'same-voices': 'כל הקולות זהים, אז אין כאן פולי־ריתמוס.',
    'bad-kind': 'בחרו סוג שאלה: מתי נפגשים, יחס או שבר.',
    'no-meet-in-span': 'בטווח שבחרתם הקולות לא נפגשים, אז לשאלה אין פתרון.',
    'bad-within': 'הטווח צריך להיות מספר שלם וחיובי.',
    'bad-voice-ref': 'השאלה מדברת על קול שלא קיים בחידה.',
    'strokes-too-many': 'במחזור אחד אין כל כך הרבה מכות לקול הזה, אז לשאלה אין פתרון.',
  };

  // problem = { voices: [...], question: { kind: 'lcm', within? } |
  // { kind: 'ratio' } | { kind: 'fraction', voice: i, strokes: k },
  // answer?: the child's own answer }. Returns { ok, errors, messages,
  // answer, answerMatches } where ok means the puzzle has a solution; answer
  // is the system's solution; answerMatches is null when no answer was given.
  function validatePosedProblem(problem) {
    const p = problem || {};
    const errors = [];
    const raw = Array.isArray(p.voices) ? p.voices.filter(function (v) { return v != null && String(v).trim() !== ''; }) : [];
    const q = p.question || {};
    if (raw.length < MIN_VOICES) errors.push('too-few-voices');
    if (raw.length > MAX_VOICES) errors.push('too-many-voices');
    const parsed = raw.map(parseVoice);
    if (parsed.some(function (f) { return !f; })) errors.push('bad-voice');
    const good = errors.length === 0;
    if (good && parsed.every(function (f) { return voiceValue(f) === voiceValue(parsed[0]); })) errors.push('same-voices');
    if (KINDS.indexOf(q.kind) === -1) errors.push('bad-kind');
    let answer = null;
    if (!errors.length) {
      const L = lcmOfVoices(raw);
      const st = strokesPerCycle(raw);
      if (q.kind === 'lcm') {
        if (q.within != null && q.within !== '') {
          const w = Number(q.within);
          if (!Number.isInteger(w) || w <= 0) errors.push('bad-within');
          else if (L > w) errors.push('no-meet-in-span');
        }
        answer = String(L);
      } else if (q.kind === 'ratio') {
        answer = reduceRatio(st).join(':');
      } else {
        const i = q.voice == null ? 0 : Number(q.voice);
        const k = q.strokes == null ? 1 : Number(q.strokes);
        if (!Number.isInteger(i) || i < 0 || i >= raw.length) errors.push('bad-voice-ref');
        else if (!Number.isInteger(k) || k < 1 || k > st[i]) errors.push('strokes-too-many');
        else answer = fracText(k, st[i]);
      }
    }
    const ok = errors.length === 0;
    if (!ok) answer = null;
    const given = p.answer;
    const answerMatches = ok && given != null && String(given).trim() !== '' ? sameAnswer(q.kind, given, answer) : null;
    return { ok: ok, errors: errors, messages: errors.map(function (e) { return POSE_ERRORS[e]; }), answer: answer, answerMatches: answerMatches };
  }

  // ---- sound plan --------------------------------------------------------

  // Notes for one cycle: every voice on its own timbre, all together again
  // on the closing stroke. The pulse shortens for long cycles (8 s at most).
  const VOICE_TIMBRES = ['drumLow', 'drumHigh', 'woodClick', 'frameDrum'];
  function cyclePlan(voices) {
    const L = lcmOfVoices(voices);
    if (L == null) return [];
    const pulse = Math.min(0.3, 8 / L);
    const notes = [];
    voices.forEach(function (v, i) {
      const step = voiceValue(parseVoice(v));
      for (let t = 0; t <= L + 1e-9; t += step) notes.push({ at: Math.round(t * pulse * 1000) / 1000, voice: VOICE_TIMBRES[i % VOICE_TIMBRES.length], v: i, meet: Math.abs(t - L) < 1e-9 || t === 0 });
    });
    return notes.sort(function (a, b) { return a.at - b.at || a.v - b.v; });
  }

  return {
    MAX_VOICE: MAX_VOICE,
    KINDS: KINDS,
    KIND_HE: KIND_HE,
    LEVELS: LEVELS,
    BAND: BAND,
    WINDOW: WINDOW,
    MIN_ANSWERS: MIN_ANSWERS,
    CONTEXTS: CONTEXTS,
    REASONS: REASONS,
    POSE_ERRORS: POSE_ERRORS,
    VOICE_TIMBRES: VOICE_TIMBRES,
    parseVoice: parseVoice,
    voiceText: voiceText,
    lcmOfVoices: lcmOfVoices,
    strokesPerCycle: strokesPerCycle,
    sameAnswer: sameAnswer,
    initialAdapt: initialAdapt,
    successRate: successRate,
    adaptStep: adaptStep,
    voicesForLevel: voicesForLevel,
    makeTask: makeTask,
    kindForStep: kindForStep,
    taskForStep: taskForStep,
    practiceBlock: practiceBlock,
    checkAnswer: checkAnswer,
    checkReason: checkReason,
    validatePosedProblem: validatePosedProblem,
    cyclePlan: cyclePlan,
  };
});
