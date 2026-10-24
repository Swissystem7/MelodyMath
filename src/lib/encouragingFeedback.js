// MelodyMath — Encouraging feedback & retry state machine (Issue #680, Refs #665).
//
// Acceptance criteria:
// 1. A wrong answer triggers gentle spoken encouragement, then replay with counting/visual cue, then second try (rule 6).
// 2. No red X, buzzer or score loss on the first mistake.
// 3. A correct answer shows math visually (groups merge, bar splits), not just text (rule 2).
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_FEEDBACK = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const GENTLE_ENCOURAGEMENTS = [
    'כמעט! בואו נקשיב ונספור יחד שוב.',
    'עוד רגע זה יושב. נסו שוב יחד עם הצלילים.',
    'יופי של ניסיון! בואו נבדוק שוב עם הרמז.',
    'לא נורא, מקשיבים שוב ומנסים פעם נוספת.'
  ];

  const ANIMATION_SPECS = {
    addition: { kind: 'merge', className: 'anim-math-merge', label: 'איחוד קבוצות', description: 'שתי הקבוצות מתחברות לקבוצה אחת גדולה' },
    subtraction: { kind: 'takeaway', className: 'anim-math-takeaway', label: 'הפחתת כמויות', description: 'החלק שנמחק מודגש ונפרד' },
    multiplication: { kind: 'repeat_group', className: 'anim-math-repeat', label: 'קבוצות שוות', description: 'הקבוצות מצטרפות בשורות קצביות' },
    fractions: { kind: 'bar_split', className: 'anim-math-split', label: 'פיצול שברים', description: 'השלם מתחלק לחלקים שווים' },
    default: { kind: 'glow_total', className: 'anim-math-glow', label: 'הדגשת הכמות', description: 'כל הצלילים נדלקים יחד' }
  };

  function getVisualMathAnimation(item) {
    if (!item) return ANIMATION_SPECS.default;
    const skill = String(item.skill || '').toLowerCase();
    const p = String(item.prompt || '');

    if (skill.includes('fraction')) return ANIMATION_SPECS.fractions;
    if (skill === 'addition') return ANIMATION_SPECS.addition;
    if (skill === 'subtraction') return ANIMATION_SPECS.subtraction;
    if (skill === 'multiplication') return ANIMATION_SPECS.multiplication;
    if (p.includes('/')) return ANIMATION_SPECS.fractions;
    if (p.includes('+')) return ANIMATION_SPECS.addition;
    if (p.includes('-') || p.includes('−')) return ANIMATION_SPECS.subtraction;
    if (p.includes('×') || p.includes('*')) return ANIMATION_SPECS.multiplication;
    return ANIMATION_SPECS.default;
  }

  function createFeedbackState(item, options) {
    const opts = options || {};
    return {
      phase: 'ask', // 'ask' -> 'hint_replay' -> 'retry' -> ('correct' | 'revealed')
      attempts: 0,
      maxRetries: Number(opts.maxRetries) || 1,
      item: item || {},
      tone: 'neutral',
      message: '',
      spokenText: '',
      hasBuzzer: false,
      hasRedX: false,
      scoreLoss: false,
      canRetry: false,
      replayActive: false,
      visualAnimation: null
    };
  }

  function submitAnswer(state, givenAnswer, isCorrect) {
    if (!state) return state;
    const ok = typeof isCorrect === 'function' ? isCorrect(givenAnswer, state.item) : Boolean(isCorrect);

    if (ok) {
      const anim = getVisualMathAnimation(state.item);
      return Object.assign({}, state, {
        phase: 'correct',
        attempts: state.attempts + 1,
        tone: 'good',
        message: 'בדיוק! 🎵',
        spokenText: 'בדיוק! כל הכבוד.',
        canRetry: false,
        replayActive: false,
        hasBuzzer: false,
        hasRedX: false,
        scoreLoss: false,
        visualAnimation: anim
      });
    }

    if (state.attempts < state.maxRetries) {
      const encour = GENTLE_ENCOURAGEMENTS[state.attempts % GENTLE_ENCOURAGEMENTS.length];
      return Object.assign({}, state, {
        phase: 'hint_replay',
        attempts: state.attempts + 1,
        tone: 'soft',
        message: encour,
        spokenText: encour,
        canRetry: true,
        replayActive: true,
        hasBuzzer: false,
        hasRedX: false,
        scoreLoss: false,
        visualAnimation: { kind: 'hint_cue', label: 'השמעה מודרכת עם ספירה' }
      });
    }

    const ans = state.item && state.item.answer != null ? state.item.answer : '';
    return Object.assign({}, state, {
      phase: 'revealed',
      attempts: state.attempts + 1,
      tone: 'neutral',
      message: 'לא נורא, נמשיך לתרגיל הבא. התשובה היא ' + ans + '.',
      spokenText: 'נמשיך הלאה, התשובה היא ' + ans + '.',
      canRetry: false,
      replayActive: false,
      hasBuzzer: false,
      hasRedX: false,
      scoreLoss: false,
      visualAnimation: null
    });
  }

  function startRetry(state) {
    if (!state || state.phase !== 'hint_replay') return state;
    return Object.assign({}, state, {
      phase: 'retry',
      replayActive: false,
      message: 'נסו שוב עכשיו 🙂',
      canRetry: false
    });
  }

  function runExerciseFeedbackFlow(item, answerSequence, isCorrectFn) {
    let state = createFeedbackState(item);
    const history = [state];
    for (const ans of answerSequence) {
      if (state.phase === 'hint_replay') {
        state = startRetry(state);
        history.push(state);
      }
      const ok = typeof isCorrectFn === 'function' ? isCorrectFn(ans, item) : Boolean(ans);
      state = submitAnswer(state, ans, ok);
      history.push(state);
      if (state.phase === 'correct' || state.phase === 'revealed') break;
    }
    return { finalState: state, history: history };
  }

  return {
    createFeedbackState: createFeedbackState,
    submitAnswer: submitAnswer,
    startRetry: startRetry,
    getVisualMathAnimation: getVisualMathAnimation,
    runExerciseFeedbackFlow: runExerciseFeedbackFlow,
    ANIMATION_SPECS: ANIMATION_SPECS,
    GENTLE_ENCOURAGEMENTS: GENTLE_ENCOURAGEMENTS
  };
});
