// MelodyMath — short pre/post checks per music unit.
//
// A unit has two parallel forms: "pre" taken before the unit and "post" after.
// Parallel means the same item count and the same spread of levels with
// different items, so the two scores compare without the pre form having
// taught the post form. Nothing here claims the difference proves anything:
// it is 7 items on one device, not an experiment. The forms and the scoring
// carry no storage and no DOM, so `validateUnitParallelForms` can check the
// bank in a test; keeping a result per student is teacherStore's job (#209).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const PARALLEL_TAG = 'grade-d-frac-bar44-v1';
  const UNIT_ID = 'grade-d-fractions-bar44';

  function item(phase, formId, level, prompt, answer, hint, bar) {
    return {
      unitId: UNIT_ID, parallelForm: PARALLEL_TAG, formPhase: phase, formId: formId,
      level: level, widget: 'bar44', bar: bar || null,
      prompt: prompt, answer: answer, hint: hint, skill: 'שברים — תיבה 4/4',
    };
  }

  // A bar is attached only where the drawing is the question. Counting items
  // ("how many eighths?") get no bar: a pre-filled bar would be the answer.
  const PRE_FORM = {
    id: 'pre-a',
    phase: 'pre',
    parallelForm: PARALLEL_TAG,
    items: [
      item('pre', 'pre-a', 1, 'תיבה 4/4 מלאה. איזה שבר מייצג את כל התיבה?', '1', 'שמיניות מלאות = שלם', { filled: 8 }),
      item('pre', 'pre-a', 1, 'חצי תיבה 4/4 מלא. איזה שבר?', '1/2', '4 שמיניות מתוך 8', { filled: 4 }),
      item('pre', 'pre-a', 1, 'רבע תיבה מלא. איזה שבר?', '1/4', '2 שמיניות מתוך 8', { filled: 2 }),
      item('pre', 'pre-a', 1, 'שמינית אחת מלאה. איזה שבר?', '1/8', 'תא אחד מתוך שמונה', { filled: 1 }),
      item('pre', 'pre-a', 2, 'ארבע שמיניות בתיבה 4/4 — איזה שבר?', '1/2', '4/8 = 1/2', { filled: 4 }),
      item('pre', 'pre-a', 2, 'שני רבעים בתיבה — איזה שבר?', '1/2', '1/4 + 1/4', { filled: 4 }),
      item('pre', 'pre-a', 3, 'שלושה רבעים בתיבה — כמה שמיניות זה?', 6, 'כל רבע = 2 שמיניות', null),
    ],
  };

  const POST_FORM = {
    id: 'post-b',
    phase: 'post',
    parallelForm: PARALLEL_TAG,
    items: [
      item('post', 'post-b', 1, 'תיבה 4/4 ריקה. איזה שבר מלא?', '0', 'אין שמינית מלאה', { filled: 0 }),
      item('post', 'post-b', 1, 'חצי תיבה (4 שמיניות). איזה שבר?', '1/2', 'חצי מ-8 שמיניות', { filled: 4 }),
      item('post', 'post-b', 1, 'שתי שמיניות מלאות. איזה שבר?', '1/4', '2/8 = 1/4', { filled: 2 }),
      item('post', 'post-b', 1, 'כמה רבעים ממלאים תיבה 4/4 שלמה?', 4, 'כל רבע = 2 שמיניות', { filled: 8 }),
      item('post', 'post-b', 2, 'שש שמיניות בתיבה — איזה שבר?', '3/4', '6/8 = 3/4', { filled: 6 }),
      item('post', 'post-b', 2, 'שלוש שמיניות בתיבה — איזה שבר?', '3/8', '3 תאים מתוך 8', { filled: 3 }),
      item('post', 'post-b', 3, 'חצי תיבה ועוד רבע — כמה שמיניות בסך הכל?', 6, '4 + 2 שמיניות', null),
    ],
  };

  const UNITS = Object.create(null);
  UNITS[UNIT_ID] = {
    id: UNIT_ID,
    titleHe: 'כיתה ד׳ · שברים מול תיבה 4/4',
    grade: 'ד',
    skill: 'basic_fractions',
    lessonId: 'fractions-intro',
    pre: PRE_FORM,
    post: POST_FORM,
  };

  const DISCLAIMER =
    'השוואת לפני־אחרי נשמרת רק במכשיר הזה. זה לא ניסוי מבוקר, לא אבחון, ולא הוכחה שהמוזיקה או התרגול «עובדים».';

  function getUnit(unitId) {
    return UNITS[unitId] || null;
  }

  function getUnitForm(unitId, phase) {
    const u = getUnit(unitId);
    if (!u) return null;
    if (phase === 'pre') return u.pre;
    if (phase === 'post') return u.post;
    return null;
  }

  function levelHistogram(items) {
    const hist = Object.create(null);
    (items || []).forEach(function (it) {
      const lv = Number(it.level);
      const key = Number.isFinite(lv) ? String(lv) : '?';
      hist[key] = (hist[key] || 0) + 1;
    });
    return hist;
  }

  function parallelDifficultyMatch(preItems, postItems) {
    const a = levelHistogram(preItems);
    const b = levelHistogram(postItems);
    const keys = Object.keys(a).concat(Object.keys(b)).filter(function (k, i, arr) {
      return arr.indexOf(k) === i;
    });
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if ((a[k] || 0) !== (b[k] || 0)) return false;
    }
    return true;
  }

  // Why the 6–8 band: fewer items and one lucky guess moves the score by a
  // sixth; more and the check stops being the "short" thing a lesson can hold.
  function validateUnitParallelForms(unitId) {
    const u = getUnit(unitId);
    if (!u) return { ok: false, error: 'unknown-unit' };
    const pre = u.pre && u.pre.items;
    const post = u.post && u.post.items;
    if (!pre || !post) return { ok: false, error: 'missing-form' };
    if (pre.length < 6 || pre.length > 8 || post.length < 6 || post.length > 8) {
      return { ok: false, error: 'item-count', pre: pre.length, post: post.length };
    }
    if (pre.length !== post.length) return { ok: false, error: 'length-mismatch' };
    if (!parallelDifficultyMatch(pre, post)) {
      return { ok: false, error: 'level-mismatch', pre: levelHistogram(pre), post: levelHistogram(post) };
    }
    const tagged = pre.concat(post).every(function (it) {
      return it.parallelForm === u.pre.parallelForm && it.formPhase && it.formId && it.level;
    });
    if (!tagged) return { ok: false, error: 'tags' };
    // Parallel forms with a shared item would let the pre form teach the post
    // form, which is the one thing a pre/post pair must not do.
    const prePrompts = pre.map(function (it) { return it.prompt; });
    const shared = post.some(function (it) { return prePrompts.indexOf(it.prompt) !== -1; });
    if (shared) return { ok: false, error: 'shared-item' };
    return { ok: true, n: pre.length, parallelForm: u.pre.parallelForm };
  }

  // Deliberately not exported as `normalizeAnswer`: in the browser this module
  // is spread onto globalThis, and adaptive.js already owns that name.
  function normalizeCheckAnswer(v) {
    const s = String(v == null ? '' : v).trim().replace(/\s+/g, ' ');
    if (s === '½') return '1/2';
    if (s === '¼') return '1/4';
    if (s === '⅛') return '1/8';
    // Reduced, so 4/8 scores the same as 1/2 — the way adaptive.js's isCorrect
    // already graded the tap that produced it.
    const frac = /^(\d+)\/(\d+)$/.exec(s);
    if (frac && Number(frac[2])) {
      let a = Number(frac[1]); let b = Number(frac[2]);
      if (!a) return '0';
      while (b) { const t = a % b; a = b; b = t; }
      return (Number(frac[1]) / a) + '/' + (Number(frac[2]) / a);
    }
    const n = Number(s);
    if (s !== '' && Number.isFinite(n) && String(n) === s.replace(/^0+(\d)/, '$1')) return String(n);
    return s;
  }

  // Unanswered items count against the total: a form stopped halfway is not a
  // better score than a form finished with mistakes.
  function scoreForm(form, answers) {
    const items = (form && form.items) || [];
    let correct = 0;
    items.forEach(function (it, idx) {
      const given = answers && answers[idx] != null ? answers[idx] : '';
      if (given === '') return;
      if (normalizeCheckAnswer(given) === normalizeCheckAnswer(it.answer)) correct += 1;
    });
    return { correct: correct, total: items.length };
  }

  // Prefixed names only: a page gets these spread onto globalThis next to
  // adaptive.js and teacherStore.js, which already own the short ones.
  return {
    UNIT_CHECK_UNIT_ID: UNIT_ID, UNIT_CHECK_PARALLEL_TAG: PARALLEL_TAG, UNIT_CHECK_DISCLAIMER: DISCLAIMER,
    getUnit, getUnitForm, levelHistogram, parallelDifficultyMatch,
    validateUnitParallelForms, normalizeCheckAnswer, scoreForm,
  };
});
