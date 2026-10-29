// MelodyMath — Pattern Completion & Worked Example (Issue #670, Refs #665, Refs #591).
// דו➔מי➔דו➔? expects מי. הבנתי never writes the answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_PATTERN_WORKED = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const EXERCISE_KINDS = { PATTERN_COMPLETION: 'pattern_completion', WORKED_EXAMPLE: 'worked_example' };
  const NOTE_HZ = { 'דו': 261.63, 'רה': 293.66, 'מי': 329.63, 'פה': 349.23, 'סול': 392, 'לה': 440, 'סי': 493.88 };
  const PATTERN = ['דו', 'מי', 'דו', 'מי'];

  function countWords(str) {
    return str ? String(str).trim().split(/\s+/).filter(Boolean).length : 0;
  }

  function validateExerciseCard(ex) {
    if (!ex) return { valid: false, reason: 'missing exercise' };
    const words = countWords(ex.prompt);
    if (words > 15) return { valid: false, reason: 'prompt exceeds 15 words: ' + words };
    if (!ex.standard) return { valid: false, reason: 'missing curriculum standard' };
    if (!ex.kind || !Object.values(EXERCISE_KINDS).includes(ex.kind)) return { valid: false, reason: 'unrecognized exercise kind: ' + ex.kind };
    return { valid: true, wordCount: words };
  }
  function shownTokens(pattern) {
    const p = pattern && pattern.length ? pattern : PATTERN;
    return p.slice(0, -1).concat('?');
  }
  function shownText(pattern) { return shownTokens(pattern).join('➔'); }
  function answerForShown(pattern) {
    const p = pattern && pattern.length ? pattern : PATTERN;
    return p[p.length - 1];
  }
  function createPatternCompletionExercise(opts) {
    const o = opts || {};
    const pattern = o.pattern || PATTERN.slice();
    const expected = answerForShown(pattern);
    const prompt = o.prompt || 'דו, מי, דו — איזה צליל משלים את התבנית?';
    const hint = o.hint || 'אחרי דו בא מי, ושוב דו, ואז מי.';
    return {
      id: o.id || 'pattern-' + pattern.join('-'),
      grade: o.grade || 'א', skill: 'counting', kind: EXERCISE_KINDS.PATTERN_COMPLETION,
      standard: o.standard || 'סדרות דגמים צורניים + יצירת סדרה',
      pattern: pattern, expected: expected, choices: o.choices || ['דו', 'מי', 'סול'],
      prompt: prompt, answer: expected, hint: hint, wordCount: countWords(prompt), hasMusic: true,
      soundEvents: pattern.map(function (item, idx) {
        const missing = idx === pattern.length - 1;
        return { at: idx * 0.4, note: item, voice: missing ? 'bell' : 'xylo', hz: NOTE_HZ[item] || 330, isMissing: missing };
      }),
      check: function (given) {
        const isOk = String(given).trim() === String(expected).trim();
        return { correct: isOk, status: isOk ? 'right' : 'retry', hint: isOk ? '' : hint, feedback: isOk ? 'כל הכבוד! הצליל משלים את התבנית.' : hint };
      }
    };
  }
  // Only the demo and completion stages name the total; «עכשיו לבד» and the
  // closing check ask the question without it.
  function stagePrompt(a, b, stage) {
    const total = a + b;
    return stage === 'demo' ? ('ראו: ' + a + ' תופים ועוד ' + b + ' פעמונים הם ' + total + ' צלילים.')
      : stage === 'completion' ? ('השלימו: יש כבר ' + (total - 1) + ' פעימות. הקישו פעם אחת להשלמת ' + total + '.')
      : stage === 'check' ? ('כמה הם ' + a + ' ועוד ' + b + '?')
      : ('עכשיו לבד: כמה צלילים הם ' + a + ' ועוד ' + b + '?');
  }
  function createWorkedExampleExercise(opts) {
    const o = opts || {};
    const a = o.a != null ? o.a : 3, b = o.b != null ? o.b : 2, total = a + b;
    const stage = o.stage || 'demo';
    const prompt = stagePrompt(a, b, stage);
    const hint = a + ' ועוד ' + b + ' שווים בדיוק ' + total + ' פעימות.';
    const ex = {
      id: o.id || 'worked-example-' + a + '+' + b + '-' + stage,
      grade: o.grade || 'א', skill: 'addition', kind: EXERCISE_KINDS.WORKED_EXAMPLE,
      standard: o.standard || 'חיבור וחיסור בתחום 10 ואז 20; פירוקי 10; = משמאל; יותר משני מחוברים',
      a: a, b: b, total: total, stage: stage, prompt: prompt,
      answer: stage === 'completion' ? 1 : total, hint: hint, wordCount: countWords(prompt), hasMusic: stage !== 'check',
      demoEvents: demoPlan({ a: a, b: b, total: total }),
      nextStage: function (wasCorrect) {
        if (!wasCorrect) return 'demo';
        if (stage === 'demo') return 'completion';
        if (stage === 'completion') return 'independent';
        if (stage === 'independent') return 'check';
        return 'mastered';
      },
      check: function (given) {
        const expectedVal = stage === 'completion' ? 1 : total;
        const isOk = Number(given) === expectedVal;
        return { correct: isOk, next: this.nextStage(isOk), hint: isOk ? '' : hint, feedback: isOk ? 'מצוין! הבנתם את המהלך.' : hint };
      }
    };
    if (stage === 'check') { ex.noMusic = true; ex.musicStage = 'no_music_check'; }
    return ex;
  }
  function demoPlan(ex) {
    if (ex && ex.pattern) {
      return shownTokens(ex.pattern).filter(function (n) { return n !== '?'; }).map(function (n, i) {
        return { at: i * 0.4, voice: 'xylo', hz: NOTE_HZ[n] || 330, label: n };
      });
    }
    const a = ex.a, b = ex.b, total = ex.total;
    const ev = [];
    for (let i = 0; i < a; i++) ev.push({ at: i * 0.28, voice: 'drum', label: 'תוף' });
    for (let i = 0; i < b; i++) ev.push({ at: a * 0.28 + 0.25 + i * 0.28, voice: 'bell', label: 'פעמון' });
    for (let i = 0; i < total; i++) ev.push({ at: (a + b) * 0.28 + 0.7 + i * 0.22, voice: 'xylo', label: 'סך' });
    return ev;
  }

  function playDemo(ex, env) {
    const e = env || {};
    const events = (ex && ex.demoEvents) || demoPlan(ex);
    const play = e.playTap || (root && root.playTap);
    const later = e.later || function (fn, ms) { setTimeout(fn, ms); };
    if (typeof play === 'function') events.forEach(function (ev) {
      later(function () { play(ev.voice, { hz: ev.hz, step: 0 }); }, Math.round((ev.at || 0) * 1000));
    });
    return events;
  }
  function docOf(container, opts) {
    return (opts && opts.document) || (container && container.ownerDocument) || (typeof document !== 'undefined' ? document : null);
  }
  function btn(d, cls, text, fn) {
    const b = d.createElement('button');
    b.type = 'button'; b.className = cls; b.textContent = text; b.style.minHeight = '44px'; b.onclick = fn;
    return b;
  }
  function hintNode(d) {
    const p = d.createElement('p');
    p.className = 'mm-ex-hint'; p.hidden = true; p.textContent = '';
    return p;
  }
  // A real element's children is a read-only HTMLCollection: assigning its
  // length throws in strict mode, so only a test double's array is emptied.
  function clear(container) {
    container.innerHTML = '';
    if (Array.isArray(container.children)) container.children.length = 0;
  }
  function renderPatternWidget(container, ex, options) {
    if (!container || !ex) return;
    const opts = options || {};
    const d = docOf(container, opts);
    if (!d || typeof d.createElement !== 'function') return;
    clear(container);
    const wrap = d.createElement('div');
    wrap.className = 'pattern-widget-box';
    const seq = d.createElement('div');
    seq.className = 'pattern-sequence';
    seq.textContent = shownText(ex.pattern);
    const hint = hintNode(d);
    const row = d.createElement('div');
    row.className = 'pattern-choices';
    const answer = answerForShown(ex.pattern);
    (ex.choices || ['דו', 'מי', 'סול']).forEach(function (c) {
      row.appendChild(btn(d, 'secondary pattern-choice-btn', c, function () {
        const play = opts.playTap || (root && root.playTap);
        if (typeof play === 'function') play('bell', { hz: NOTE_HZ[c] || 330, step: 0 });
        const res = (typeof ex.check === 'function' ? ex.check(c) : { correct: String(c) === String(answer), hint: ex.hint });
        hint.hidden = !!res.correct;
        hint.textContent = res.correct ? '' : (res.hint || ex.hint || '');
        container._hint = hint.textContent;
        if (res.correct && typeof opts.onAnswer === 'function') opts.onAnswer(c);
      }));
    });
    wrap.appendChild(seq);
    wrap.appendChild(btn(d, 'secondary demo-listen-btn', 'הקשיבו להדגמה', function () { container._heard = playDemo(ex, opts); }));
    wrap.appendChild(row);
    wrap.appendChild(hint);
    container.appendChild(wrap);
  }
  function renderWorkedExampleWidget(container, ex, options) {
    if (!container || !ex) return;
    const opts = options || {};
    const d = docOf(container, opts);
    if (!d || typeof d.createElement !== 'function') return;
    let stage = ex.stage || 'demo';
    let filled = false;
    function paint() {
      clear(container);
      container._stage = stage;
      container._filled = filled;
      if (opts.heading) opts.heading.textContent = stagePrompt(ex.a, ex.b, stage);
      container._noMusic = stage === 'check';
      container._musicStage = stage === 'check' ? 'no_music_check' : null;
      const wrap = d.createElement('div');
      wrap.className = 'worked-example-box';
      if (stage === 'demo') {
        const line = d.createElement('p');
        line.textContent = '🥁 ' + ex.a + ' + 🔔 ' + ex.b + ' = 🌟 ' + ex.total;
        wrap.appendChild(line);
        wrap.appendChild(btn(d, 'secondary demo-listen-btn', 'הקשיבו להדגמה', function () { container._heard = playDemo(ex, opts); }));
        wrap.appendChild(btn(d, 'primary demo-proceed-btn', 'הבנתי', function () { stage = 'completion'; paint(); }));
      } else if (stage === 'completion') {
        const line = d.createElement('p');
        line.textContent = 'השלימו את הפעימה החסרה';
        wrap.appendChild(line);
        wrap.appendChild(btn(d, 'primary completion-tap-btn', '🥁 הקישו להשלמה', function () {
          container._heard = playDemo({ a: 1, b: 0, total: 0, pattern: null }, opts);
          stage = 'independent'; paint();
        }));
      } else if (stage === 'independent') {
        const line = d.createElement('p');
        line.textContent = stagePrompt(ex.a, ex.b, stage);
        wrap.appendChild(line);
        const label = d.createElement('label');
        label.className = 'worked-answer-label';
        label.textContent = 'התשובה';
        const input = d.createElement('input');
        input.className = 'worked-answer';
        input.type = 'text'; input.dir = 'ltr'; input.inputMode = 'numeric'; input.autocomplete = 'off';
        input.onchange = function () {
          if (!String(input.value || '').trim()) return;
          if (typeof opts.onAnswer === 'function') opts.onAnswer(input.value);
          stage = 'check'; paint();
        };
        label.appendChild(input);
        wrap.appendChild(label);
      } else {
        const line = d.createElement('p');
        line.textContent = stagePrompt(ex.a, ex.b, stage);
        wrap.appendChild(line);
      }
      container.appendChild(wrap);
    }
    paint();
  }

  return {
    EXERCISE_KINDS: EXERCISE_KINDS, countWords: countWords, validateExerciseCard: validateExerciseCard,
    stagePrompt: stagePrompt, shownText: shownText, answerForShown: answerForShown, demoPlan: demoPlan, playDemo: playDemo,
    createPatternCompletionExercise: createPatternCompletionExercise,
    createWorkedExampleExercise: createWorkedExampleExercise,
    renderPatternWidget: renderPatternWidget, renderWorkedExampleWidget: renderWorkedExampleWidget
  };
});
