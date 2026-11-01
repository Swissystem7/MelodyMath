// TODO-source: polyrhythm challenge track and adaptive difficulty
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_RHYTHM_MASTER = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const T = (root && (root.MM_RHYTHM_TRACK || root.MM_RHYTHM_MASTER)) || (typeof require === 'function' ? require('./rhythmTrack.js') : {});
  const MAX_VOICE = T.MAX_VOICE;
  const MIN_VOICES = T.MIN_VOICES;
  const MAX_VOICES = T.MAX_VOICES;
  const KINDS = T.KINDS;
  const KIND_HE = T.KIND_HE;
  const VOICE_HE = T.VOICE_HE;
  const LEVELS = T.LEVELS;
  const BAND = T.BAND;
  const WINDOW = T.WINDOW;
  const MIN_ANSWERS = T.MIN_ANSWERS;
  const parseVoice = T.parseVoice;
  const voiceValue = T.voiceValue;
  const voiceText = T.voiceText;
  const lcmOfVoices = T.lcmOfVoices;
  const strokesPerCycle = T.strokesPerCycle;
  const reduceRatio = T.reduceRatio;
  const fracText = T.fracText;
  const sameAnswer = T.sameAnswer;


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

  return Object.assign({}, T, {
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
    initialAdapt: T.initialAdapt,
    successRate: T.successRate,
    adaptStep: T.adaptStep,
    voicesForLevel: voicesForLevel,
    makeTask: makeTask,
    kindForStep: kindForStep,
    taskForStep: taskForStep,
    practiceBlock: practiceBlock,
    checkAnswer: checkAnswer,
    checkReason: checkReason,
    validatePosedProblem: validatePosedProblem,
    cyclePlan: cyclePlan,
  });
});
