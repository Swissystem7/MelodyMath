// MelodyMath — Pattern Completion & Worked Example Exercises (Issue #670, Refs #665).
// Implements missing Req 3 exercise types:
// 1. Pattern Completion (השלמת תבנית צלילית ומספרית, Azaryahu & Adi-Japha 2020)
// 2. Worked Example with Fading (דוגמה פתורה והשלמת צעד, Atkinson et al. 2000, Sweller 2006)
// Constraints: <= 15 words per card, sound-first solving, audio cues, second try on error.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_PATTERN_WORKED = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const EXERCISE_KINDS = {
    PATTERN_COMPLETION: 'pattern_completion',
    WORKED_EXAMPLE: 'worked_example'
  };

  function countWords(str) {
    if (!str) return 0;
    return String(str).trim().split(/\s+/).filter(Boolean).length;
  }

  function validateExerciseCard(ex) {
    if (!ex) return { valid: false, reason: 'missing exercise' };
    const words = countWords(ex.prompt);
    if (words > 15) return { valid: false, reason: 'prompt exceeds 15 words: ' + words };
    if (!ex.standard) return { valid: false, reason: 'missing curriculum standard' };
    if (!ex.kind || !Object.values(EXERCISE_KINDS).includes(ex.kind)) {
      return { valid: false, reason: 'unrecognized exercise kind: ' + ex.kind };
    }
    return { valid: true, wordCount: words };
  }

  // ---------- 1. Pattern Completion (השלמת תבנית) ----------
  function createPatternCompletionExercise(opts) {
    const o = opts || {};
    const pattern = o.pattern || ['דו', 'מי', 'דו', 'מי'];
    const expected = o.expected || 'דו';
    const choices = o.choices || ['דו', 'מי', 'סול'];
    const prompt = o.prompt || 'דו, מי, דו, מי — איזה צליל משלים את התבנית?';
    return {
      id: o.id || 'pattern-' + pattern.join('-'),
      grade: o.grade || 'א',
      skill: 'counting',
      kind: EXERCISE_KINDS.PATTERN_COMPLETION,
      standard: o.standard || 'סדרות דגמים צורניים + יצירת סדרה',
      pattern: pattern,
      expected: expected,
      choices: choices,
      prompt: prompt,
      answer: expected,
      hint: 'הקשיבו לחזרה של שני הצלילים: אחרי מי מגיע שוב דו.',
      wordCount: countWords(prompt),
      hasMusic: true,
      soundEvents: pattern.map(function (item, idx) {
        return { at: idx * 0.4, note: item, isMissing: idx === pattern.length - 1 };
      }),
      check: function (given) {
        const isOk = String(given).trim() === String(expected).trim();
        return {
          correct: isOk,
          status: isOk ? 'right' : 'retry',
          feedback: isOk ? 'כל הכבוד! הצליל משלים את התבנית.' : 'כמעט! הקשיבו שוב לקצב ונסו פעם נוספת.'
        };
      }
    };
  }

  // ---------- 2. Worked Example with Fading (דוגמה פתורה) ----------
  function createWorkedExampleExercise(opts) {
    const o = opts || {};
    const a = o.a != null ? o.a : 3;
    const b = o.b != null ? o.b : 2;
    const total = a + b;
    const stage = o.stage || 'demo'; // 'demo' | 'completion' | 'independent'

    let prompt = '';
    if (stage === 'demo') {
      prompt = 'ראו: ' + a + ' תופים ועוד ' + b + ' פעמונים הם ' + total + ' צלילים.';
    } else if (stage === 'completion') {
      prompt = 'השלימו: יש כבר ' + (total - 1) + ' פעימות. הקישו פעם אחת להשלמת ' + total + '.';
    } else {
      prompt = 'עכשיו לבד: כמה צלילים הם ' + a + ' ועוד ' + b + '?';
    }

    return {
      id: o.id || 'worked-example-' + a + '+' + b + '-' + stage,
      grade: o.grade || 'א',
      skill: 'addition',
      kind: EXERCISE_KINDS.WORKED_EXAMPLE,
      standard: o.standard || 'חיבור וחיסור בתחום 10 ואז 20; פירוקי 10; = משמאל; יותר משני מחוברים',
      a: a,
      b: b,
      total: total,
      stage: stage,
      prompt: prompt,
      answer: stage === 'completion' ? 1 : total,
      hint: a + ' ועוד ' + b + ' שווים בדיוק ' + total + ' פעימות.',
      wordCount: countWords(prompt),
      hasMusic: true,
      demoEvents: [
        { at: 0, count: a, timbre: 'drumLow', label: a + ' תופים' },
        { at: a * 0.4 + 0.3, count: b, timbre: 'metalBell', label: b + ' פעמונים' },
        { at: (a + b) * 0.4 + 0.8, count: total, timbre: 'scale', label: total + ' בסך הכל' }
      ],
      nextStage: function (wasCorrect) {
        if (!wasCorrect) return 'demo'; // restore scaffolding after mistake (Kalyuga 2003)
        if (stage === 'demo') return 'completion';
        if (stage === 'completion') return 'independent';
        return 'mastered';
      },
      check: function (given) {
        const expectedVal = stage === 'completion' ? 1 : total;
        const isOk = Number(given) === expectedVal;
        return {
          correct: isOk,
          next: this.nextStage(isOk),
          feedback: isOk ? 'מצוין! הבנתם את המהלך.' : 'לא נורא, נביט שוב בהדגמה המוזיקלית ביחד.'
        };
      }
    };
  }

  function renderPatternWidget(container, ex, options) {
    if (!container || !ex) return;
    const opts = options || {};
    const d = opts.document || container.ownerDocument || (typeof document !== 'undefined' ? document : null);
    if (!d || typeof d.createElement !== 'function') return;
    container.innerHTML = '';
    const wrapper = d.createElement('div');
    wrapper.className = 'pattern-widget-box';
    wrapper.style.margin = '10px 0';

    const visual = ex.pattern.map(function (p, i) {
      const isLast = i === ex.pattern.length - 1;
      return '<span class="pattern-item" style="display:inline-block;padding:8px 12px;margin:4px;border-radius:12px;background:' + (isLast ? '#fef2f2;border:2px dashed var(--pink);' : '#f5f3ff;border:2px solid var(--purple);') + ';font-weight:bold;font-size:1.15rem;">' + (isLast ? '❓' : p) + '</span>';
    }).join(' ➔ ');

    const choiceButtons = (ex.choices || []).map(function (c) {
      return '<button type="button" class="secondary pattern-choice-btn" data-tap="metalBell" data-choice="' + c + '" style="min-width:44px;min-height:44px;padding:6px 16px;margin:4px;font-size:1.1rem;">' + c + '</button>';
    }).join('');

    wrapper.innerHTML = '<div class="pattern-sequence" style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;margin-bottom:12px;">' + visual + '</div>' +
      '<div class="pattern-choices" role="group" aria-label="בחירת הצליל הבא בתבנית" style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;">' + choiceButtons + '</div>';

    wrapper.querySelectorAll('.pattern-choice-btn').forEach(function (btn) {
      btn.onclick = function () {
        if (typeof opts.onAnswer === 'function') opts.onAnswer(btn.dataset.choice);
      };
    });

    container.appendChild(wrapper);
  }

  function renderWorkedExampleWidget(container, ex, options) {
    if (!container || !ex) return;
    const opts = options || {};
    const d = opts.document || container.ownerDocument || (typeof document !== 'undefined' ? document : null);
    if (!d || typeof d.createElement !== 'function') return;
    container.innerHTML = '';
    const wrapper = d.createElement('div');
    wrapper.className = 'worked-example-box';
    wrapper.style.margin = '10px 0';

    let contentHtml = '';
    if (ex.stage === 'demo') {
      contentHtml = '<div class="demo-display" style="padding:12px;background:#f5f3ff;border:2px solid var(--purple);border-radius:14px;text-align:center;">' +
        '<span style="font-size:1.4rem;">🥁 ' + ex.a + ' + 🔔 ' + ex.b + ' = 🌟 ' + ex.total + '</span>' +
        '<p style="margin:8px 0 0;color:var(--muted);font-size:0.95rem;">הקשיבו להדגמה המוזיקלית הפתורה</p>' +
        '<button type="button" class="primary demo-proceed-btn" style="min-height:44px;margin-top:8px;">הבנתי, המשיכו לשלב הבא ←</button>' +
        '</div>';
    } else {
      contentHtml = '<div class="completion-display" style="padding:12px;background:#fdfaff;border:2px solid var(--pink);border-radius:14px;text-align:center;">' +
        '<div style="font-size:1.3rem;margin-bottom:8px;">השלימו את הפעימה החסרה</div>' +
        '<button type="button" class="primary completion-tap-btn" data-tap="drumLow" style="min-width:64px;min-height:50px;font-size:1.25rem;">🥁 הקישו להשלמה</button>' +
        '</div>';
    }

    wrapper.innerHTML = contentHtml;
    const proceed = wrapper.querySelector('.demo-proceed-btn');
    if (proceed) proceed.onclick = function () { if (typeof opts.onProceed === 'function') opts.onProceed(); };
    const tap = wrapper.querySelector('.completion-tap-btn');
    if (tap) tap.onclick = function () { if (typeof opts.onTap === 'function') opts.onTap(1); };

    container.appendChild(wrapper);
  }

  return {
    EXERCISE_KINDS: EXERCISE_KINDS,
    countWords: countWords,
    validateExerciseCard: validateExerciseCard,
    createPatternCompletionExercise: createPatternCompletionExercise,
    createWorkedExampleExercise: createWorkedExampleExercise,
    renderPatternWidget: renderPatternWidget,
    renderWorkedExampleWidget: renderWorkedExampleWidget
  };
});
