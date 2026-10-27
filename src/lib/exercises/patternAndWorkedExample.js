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
        return { at: idx * 0.4, note: item, voice: missing ? 'breathy' : (idx % 2 ? 'xylo' : 'drum'), hz: NOTE_HZ[item] || 330, isMissing: missing };
      }),
      check: function (given) {
        const isOk = String(given).trim() === String(expected).trim();
        return { correct: isOk, status: isOk ? 'right' : 'retry', hint: isOk ? '' : hint, feedback: isOk ? 'כל הכבוד! הצליל משלים את התבנית.' : hint };
      }
    };
  }
  function plainAdd(ex) {
    const ca = ex.checkA != null ? Number(ex.checkA) : (Number(ex.a) === 4 ? 2 : 4);
    const cb = ex.checkB != null ? Number(ex.checkB) : (Number(ex.b) === 3 ? 1 : 3);
    return { a: ca, b: cb, total: ca + cb };
  }
  function plainHint(pair) { return 'התחילו מ-' + pair.a + ' וספרו עוד ' + pair.b; }
  function playNote(env, voice, hz) {
    const e = env || {};
    const sing = e.playVoice || (root && root.playVoice);
    const ac = e.audioContext || (root && typeof root.getSharedAudioContext === 'function' ? root.getSharedAudioContext() : null);
    if (voice !== 'drum' && voice !== 'bell' && voice !== 'xylo' && typeof sing === 'function' && ac) {
      sing(ac, voice, hz, ac.currentTime || 0, null, null);
      return;
    }
    const play = e.playTap || (root && root.playTap);
    if (typeof play === 'function') play(voice, { hz: hz, step: 0 });
  }
  function stageHeading(ex, stage) {
    const a = ex.a, b = ex.b, total = ex.total;
    if (stage === 'demo') return 'ראו: ' + a + ' תופים ועוד ' + b + ' פעמונים הם ' + total + ' צלילים.';
    if (stage === 'completion') return 'השלימו את הפעימה החסרה';
    if (stage === 'plain') { const p = plainAdd(ex); return 'בלי מוזיקה: כמה הם ' + p.a + ' ועוד ' + p.b + '?'; }
    return 'עכשיו לבד: כמה צלילים הם ' + a + ' תופים ועוד ' + b + ' פעמונים?';
  }
  function createWorkedExampleExercise(opts) {
    const o = opts || {};
    const a = o.a != null ? o.a : 3, b = o.b != null ? o.b : 2, total = a + b;
    const stage = o.stage || 'demo';
    const prompt = stageHeading({ a: a, b: b, total: total }, stage);
    const pair = plainAdd({ a: a, b: b });
    const hint = stage === 'plain' ? plainHint(pair) : (a + ' ועוד ' + b + ' שווים בדיוק ' + total + ' פעימות.');
    return {
      id: o.id || 'worked-example-' + a + '+' + b + '-' + stage,
      grade: o.grade || 'א', skill: 'addition', kind: EXERCISE_KINDS.WORKED_EXAMPLE,
      standard: o.standard || 'חיבור וחיסור בתחום 10 ואז 20; פירוקי 10; = משמאל; יותר משני מחוברים',
      a: a, b: b, total: total, stage: stage, prompt: prompt,
      answer: stage === 'completion' ? 1 : (stage === 'plain' ? plainAdd({ a: a, b: b }).total : total), hint: hint, wordCount: countWords(prompt),
      hasMusic: stage !== 'plain', noMusic: stage === 'plain', plain: stage === 'plain',
      musicStage: stage === 'plain' ? 'no_music_check' : stage,
      demoEvents: demoPlan({ a: a, b: b, total: total }),
      nextStage: function (wasCorrect) {
        if (!wasCorrect) return 'demo';
        if (stage === 'demo') return 'completion';
        if (stage === 'completion') return 'independent';
        if (stage === 'independent') return 'plain';
        return 'mastered';
      },
      check: function (given) {
        const expectedVal = stage === 'completion' ? 1 : (stage === 'plain' ? plainAdd({ a: a, b: b }).total : total);
        const isOk = Number(given) === expectedVal;
        return { correct: isOk, next: this.nextStage(isOk), hint: isOk ? '' : hint, feedback: isOk ? 'מצוין! הבנתם את המהלך.' : hint };
      }
    };
  }
  function demoPlan(ex) {
    if (ex && ex.pattern) {
      return shownTokens(ex.pattern).filter(function (n) { return n !== '?'; }).map(function (n, i) {
        return { at: i * 0.4, voice: i % 2 ? 'xylo' : 'drum', hz: NOTE_HZ[n] || 330, label: n };
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
  function renderPatternWidget(container, ex, options) {
    if (!container || !ex) return;
    const opts = options || {};
    const d = docOf(container, opts);
    if (!d || typeof d.createElement !== 'function') return;
    container.innerHTML = '';
    if (Array.isArray(container.children)) container.children.length = 0;
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
        playNote(opts, 'breathy', NOTE_HZ[c] || 330);
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
    writeWay(container, ex.hint || '');
  }
  function writeHeading(container, text) {
    container._heading = text;
    const card = container.parentNode;
    if (!card || typeof card.querySelector !== 'function') return;
    const h = card.querySelector('h2.prompt');
    if (h) h.textContent = text;
  }
  function setHidden(el, on) {
    if (el.classList && typeof el.classList.toggle === 'function') {
      el.classList.toggle('hidden', !!on);
      return;
    }
    const parts = String(el.className || '').split(/\s+/).filter(function (c) { return c && c !== 'hidden'; });
    if (on) parts.push('hidden');
    el.className = parts.join(' ');
  }
  function writeWay(container, text) {
    const card = container.parentNode;
    if (!card || typeof card.querySelector !== 'function') return;
    const way = card.querySelector('p.music-way');
    if (!way) return;
    way.textContent = text ? ('🎵 דרך מוזיקלית: ' + text) : '';
    setHidden(way, !text);
  }
  function pageAnswerRow(container, opts) {
    const d = docOf(container, opts);
    const id = opts && opts.answerId;
    if (!d || !id || typeof d.getElementById !== 'function') return null;
    const input = d.getElementById(id);
    return input ? input.parentNode : null;
  }
  function renderWorkedExampleWidget(container, ex, options) {
    if (!container || !ex) return;
    const opts = options || {};
    const d = docOf(container, opts);
    if (!d || typeof d.createElement !== 'function') return;
    let stage = ex.stage || 'demo';
    let filled = false;
    function paint() {
      container.innerHTML = '';
      if (Array.isArray(container.children)) container.children.length = 0;
      container._stage = stage;
      container._filled = filled;
      const plain = stage === 'plain';
      ex.noMusic = plain;
      ex.plain = plain;
      ex.musicStage = plain ? 'no_music_check' : stage;
      container._noMusic = plain;
      const heading = stageHeading(ex, stage);
      writeHeading(container, heading);
      writeWay(container, plain ? '' : (ex.a + ' תופים ועוד ' + ex.b + ' פעמונים הם ' + ex.total + ' צלילים.'));
      if (plain) { const p = plainAdd(ex); ex.answer = p.total; ex.hint = plainHint(p); }
      const row = pageAnswerRow(container, opts);
      if (row) row.hidden = !plain;
      const wrap = d.createElement('div');
      wrap.className = 'worked-example-box';
      const line = d.createElement('p');
      line.textContent = stage === 'demo' ? ('🥁 ' + ex.a + ' + 🔔 ' + ex.b + ' = 🌟 ' + ex.total) : heading;
      wrap.appendChild(line);
      if (stage === 'demo') {
        wrap.appendChild(btn(d, 'secondary demo-listen-btn', 'הקשיבו להדגמה', function () { container._heard = playDemo(ex, opts); }));
        wrap.appendChild(btn(d, 'primary demo-proceed-btn', 'הבנתי', function () { stage = 'completion'; paint(); }));
      } else if (stage === 'completion') {
        const hint = hintNode(d);
        function choose(n, cls, text) {
          wrap.appendChild(btn(d, cls, text, function () {
            if (n !== 1) { hint.hidden = false; hint.textContent = 'חסרה פעימה אחת.'; container._hint = hint.textContent; return; }
            container._heard = playDemo({ a: 1, b: 1, total: 0 }, opts);
            stage = 'independent'; paint();
          }));
        }
        choose(2, 'secondary completion-wrong-btn', 'שתי פעימות');
        choose(1, 'primary completion-tap-btn', 'פעימה אחת');
        wrap.appendChild(hint);
      } else if (stage === 'independent') {
        wrap.appendChild(btn(d, 'secondary demo-listen-btn', 'הקשיבו להדגמה', function () { container._heard = playDemo(ex, opts); }));
        const label = d.createElement('label');
        label.className = 'worked-answer-label';
        label.textContent = 'התשובה';
        const input = d.createElement('input');
        input.className = 'worked-answer';
        input.dir = 'ltr';
        if (typeof input.setAttribute === 'function') input.setAttribute('dir', 'ltr');
        label.appendChild(input);
        const hint = hintNode(d);
        wrap.appendChild(label);
        wrap.appendChild(hint);
        wrap.appendChild(btn(d, 'primary worked-check-btn', 'עניתי', function () {
          const res = typeof ex.check === 'function' ? ex.check(input.value) : { correct: Number(input.value) === Number(ex.total), hint: ex.hint || '' };
          filled = false;
          container._filled = false;
          hint.hidden = !!res.correct;
          hint.textContent = res.correct ? '' : (res.hint || ex.hint || '');
          if (!res.correct) return;
          stage = 'plain';
          paint();
        }));
      }
      container.appendChild(wrap);
    }
    paint();
  }

  return {
    EXERCISE_KINDS: EXERCISE_KINDS, countWords: countWords, validateExerciseCard: validateExerciseCard,
    shownText: shownText, answerForShown: answerForShown, stageHeading: stageHeading, demoPlan: demoPlan, playDemo: playDemo,
    createPatternCompletionExercise: createPatternCompletionExercise,
    createWorkedExampleExercise: createWorkedExampleExercise,
    renderPatternWidget: renderPatternWidget, renderWorkedExampleWidget: renderWorkedExampleWidget
  };
});
