// MM-600 pilot — the one demo unit for grades 1–3 (א׳–ג׳).
//
// MM-601: "Counting notes". Every exercise is heard and seen as music
// (pilot/js/music.js): addition joins two melodic phrases, subtraction takes
// notes off a melody, a ten is one low organ note, and q7 learns fractions
// through rhythm — which rhythm fills the rest of a 4/4 bar?
//
// Pure data and pure functions; the DOM lives in app.js.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MMPilotUnit = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const TOPICS = Object.freeze({
    add: { id: 'add', name: 'חיבור עד 20', short: 'חיבור' },
    sub: { id: 'sub', name: 'חיסור עד 20', short: 'חיסור' },
    tens: { id: 'tens', name: 'עשרות ויחידות', short: 'עשרות' },
    frac: { id: 'frac', name: 'שבר כחלק משלם — קצב בתיבה', short: 'שברים' }
  });

  // MM-601: the official curriculum rows each topic practises, by the ids of
  // src/lib/curriculum.js (MATRIX topicId; mapping as in MM-501, PR #949).
  // The page reads the row itself (name, grade, official quote, PDF page) from
  // curriculum.js, so nothing here restates the curriculum.
  const CURRICULUM = Object.freeze({
    add: Object.freeze(['mm-cur-3']),
    sub: Object.freeze(['mm-cur-3']),
    tens: Object.freeze(['mm-cur-5', 'mm-cur-4']),
    frac: Object.freeze(['mm-cur-32'])
  });
  // Said next to the fraction row: in the official programme (curriculum.js)
  // "שבר כחלק משלם" is a grade ד׳ topic; in this demo it is a preview for ג׳.
  const CURRICULUM_NOTE = Object.freeze({
    frac: 'בתוכנית הרשמית הנושא מופיע בכיתה ד׳. בהדגמה הוא היכרות מקדימה לכיתה ג׳.'
  });

  // op: '+' or '-'. Answers are whole numbers 0–20, typed on the keypad.
  // music: how the exercise sounds (pilot/js/music.js): join = two phrases
  // joined, remove = notes taken away, tens = a low note for each ten.
  // q7 is the fraction rhythm exercise: pick the rhythm that fills the bar.
  const QUESTIONS = Object.freeze([
    // MM-610: every exercise has a thinking step (think) and "why" feedback
    // after a correct (right) and a wrong (wrong) answer. `wrong` never names the answer.
    { id: 'q1', topic: 'add', a: 4, op: '+', b: 3, music: 'join',
      think: 'כמה צלילים בחלק הראשון? ממשיכים לספור את החלק השני — לא מתחילים מחדש.',
      right: 'נכון! 4 צלילים בפסנתר ועוד 3 בקסילופון = 7: שתי מנגינות התחברו למנגינה אחת של 7 צלילים.',
      wrong: 'שתי המנגינות מתחברות: התחילו מהמספר של הפסנתר והמשיכו לספור צליל אחד לכל צליל קסילופון.' },
    { id: 'q2', topic: 'add', a: 8, op: '+', b: 5, music: 'join',
      think: 'קודם משלימים לעשר: כמה צלילי קסילופון חסרים ל־8 כדי להגיע ל־10?',
      right: 'נכון! 8 ועוד 2 צלילים ממלאים תיבה של 10, ועוד 3 הצלילים שנשארו: 10 + 3 = 13.',
      wrong: 'השלימו לעשר: 2 צלילי קסילופון משלימים את ה־8 ל־10. כמה צלילי קסילופון נשארו אחרי זה? הוסיפו אותם ל־10.' },
    { id: 'q3', topic: 'sub', a: 9, op: '-', b: 4, music: 'remove',
      think: 'מורידים צלילים מסוף המנגינה. כמה צלילים נשארים מנוגנים?',
      right: 'נכון! מנגינה של 9 צלילים, 4 הורדו (✕) — נשארו 5 צלילים שמתנגנים.',
      wrong: 'ספרו אחורה צליל אחד לכל ✕, או ספרו רק את הצלילים שאינם מסומנים ב־✕.' },
    { id: 'q4', topic: 'sub', a: 15, op: '-', b: 6, music: 'remove',
      think: 'יורדים לעשר: כמה צלילים מורידים מ־15 כדי להגיע ל־10, וכמה עוד נשאר להוריד?',
      right: 'נכון! מ־15 מורידים 5 ומגיעים ל־10, ועוד צליל אחד: 15 − 6 = 9.',
      wrong: 'קודם יורדים לעשר — 5 צלילים מ־15. מתוך ה־6 נשאר להוריד עוד צליל אחד: ספרו אחורה מ־10.' },
    { id: 'q5', topic: 'tens', a: 6, op: '+', b: 10, music: 'tens',
      think: 'צליל נמוך אחד הוא עשרת שלמה. עשרת אחת ועוד כמה יחידות?',
      right: 'נכון! צליל עוגב נמוך אחד (עשרת) ועוד 6 צלילי קסילופון (יחידות) = 16: עשרת אחת ו־6 יחידות.',
      wrong: 'הצליל הנמוך הוא 10 שלם, לא 1. התחילו ב־10 והמשיכו לספור את צלילי הקסילופון.' },
    { id: 'q6', topic: 'tens', a: 20, op: '-', b: 10, music: 'tens',
      think: 'כל צליל נמוך הוא עשרת. כמה צלילים נמוכים נשארים כשמורידים אחד?',
      right: 'נכון! 2 עשרות פחות עשרת אחת = עשרת אחת: 20 − 10 = 10.',
      wrong: 'כל צליל עוגב נמוך הוא עשרת. שמעתם שניים, ואחד הורד (✕). כמה עשרות נשארו?' },
    { id: 'q7', topic: 'frac', kind: 'rhythm', answer: 'half', grades: 'ג׳',
      think: 'תיבה = 4 פעמות = שלם. 2 פעמות כבר מנוגנות. כמה פעמות חסרות, ואיזה חלק מהתיבה הן?',
      right: 'נכון! 1/4 + 1/4 הם 2 פעמות, וחסרות עוד 2 מתוך 4 — חצי תיבה: 1/4 + 1/4 + 1/2 = 1.',
      wrong: 'ספרו את הפעמות: בתיבה 4. שני תווי הרבע לקחו 2. התו שבוחרים צריך למלא בדיוק את מה שנשאר — לא פחות ולא יותר.' }
  ].map(Object.freeze));

  const UNIT = Object.freeze({
    id: 'music-1',
    title: 'סופרים צלילים',
    subtitle: 'חיבור, חיסור ועשרות במנגינה, ושבר בקצב',
    grades: 'א׳–ג׳',
    lesson: {
      title: 'כל צליל הוא 1',
      lines: [
        'סופרים צלילים כמו שסופרים קוביות: כל צליל שאתם שומעים ורואים הוא 1.',
        'חיבור: שתי מנגינות קצרות מתחברות למנגינה אחת ארוכה.',
        'חיסור: מורידים צלילים מסוף המנגינה, ומה שנשאר מתנגן.',
        'עשרת היא צליל נמוך אחד בעוגב; היחידות הן צלילי קסילופון.',
        'ובסוף קצב: תיבה אחת היא שלם, ותו ארוך יכול למלא חלק ממנה.'
      ],
      demo: { a: 3, b: 2 }
    },
    questions: QUESTIONS,
    // MM-610: which musical skill builds which math skill (research: MM-503 §2).
    skill: {
      music: 'לספור צלילים במנגינה, לשמוע משפט שמתארך או מתקצר, לשמוע צליל נמוך כעשרת ותו ארוך כחלק מתיבה',
      math: 'חיבור וחיסור עד 20 והשלמה לעשר, עשרות ויחידות, ושבר כחלק משלם',
      why: 'כל צליל הוא 1, וכל פעולה נשמעת: חיבור מאריך את המנגינה, חיסור מקצר אותה. מטא־אנליזה מצאה אפקט גדול יותר לשיעורים שמשלבים מוזיקה ומתמטיקה, בעיקר אצל צעירים ובחשבון בסיסי (E2). לשברים כמשכי תווים יש את הראיה הספציפית החזקה ביותר, כולל מחקר ישראלי עם מעקב של 6 חודשים (E4, E5).',
      sources: ['E2', 'E4', 'E5'],
      level: 'ישיר לשברים, עקיף לחשבון',
      limits: 'אימון מוזיקלי כללי לא משפר הישגים במחקרים איכותיים (E1); כאן המנגינה היא התרגיל עצמו.'
    }
  });

  const MAX_TRIES = 2;
  const GAP_THRESHOLD = 0.7; // under 70% correct on the first try = a gap

  const RHYTHM_ANSWER_TEXT = { quarter: '1/4', half: '1/2', whole: '1' };

  // MM-610: the new units (js/units.js) use kind 'num' (keypad, optional
  // tolerance for estimates) and kind 'choice' (buttons); the legacy exercises
  // of this unit keep op/a/b and the rhythm exercise.
  function choiceOf(q, id) { return (q.choices || []).filter(function (c) { return c.id === id; })[0] || null; }

  function answerOf(q) {
    if (q.kind === 'num') return q.answer;
    if (q.kind === 'choice') { const c = choiceOf(q, q.answer); return c ? c.label : ''; }
    if (q.kind === 'rhythm') return RHYTHM_ANSWER_TEXT[q.answer];
    return q.op === '+' ? q.a + q.b : q.a - q.b;
  }

  function questionText(q) {
    // The math itself is shown left-to-right inside an LTR span by app.js.
    if (q.kind === 'rhythm') return '1/4 + 1/4 + ? = 1';
    if (q.kind === 'num' || q.kind === 'choice') return q.expr || '?';
    return q.a + ' ' + (q.op === '+' ? '+' : '−') + ' ' + q.b + ' = ?';
  }

  function isCorrect(q, typed) {
    if (typed == null || String(typed).trim() === '') return false;
    if (q.kind === 'rhythm' || q.kind === 'choice') return String(typed) === q.answer;
    if (q.kind === 'num') {
      const v = Number(String(typed).replace(/[,\s]/g, ''));
      return Number.isFinite(v) && Math.abs(v - q.answer) <= (q.tolerance || 0);
    }
    const n = Number(String(typed).trim());
    return Number.isInteger(n) && n === answerOf(q);
  }

  // A hint never names the answer: it says which way to jump and how far.
  function hintText(q) {
    if (q.kind === 'rhythm') return 'ספרו 4 פעמות בתיבה: כמה פעמות כבר מנוגנות, וכמה עוד חסרות?';
    return 'התחילו מ־' + q.a + ' וספרו ' + (q.op === '+' ? 'קדימה' : 'אחורה') + ' ' + q.b + ' צלילים.';
  }

  // Dot groups for the hint (design 2b): one group of `a`, one of `b`, at most 10 each.
  function hintGroups(q) {
    if (q.kind) return [];
    if (q.b === 10) return [10];
    return [Math.min(q.a, 10), Math.min(q.b, 10)];
  }

  // A unit's topics as a list: { id, name, curr, advice }. The legacy unit
  // keeps TOPICS/CURRICULUM; the new units list `topics` themselves.
  const ADVICE = {
    add: 'לנגן או למחוא שתי מנגינות קצרות אחת אחרי השנייה ולספור בקול את כל הצלילים — קודם את החלק הראשון, ואז להמשיך לספור קדימה.',
    sub: 'לנגן מנגינה, לכסות את הצלילים האחרונים ביד (✕) ולספור אחורה צליל אחד לכל צליל שהורדנו.',
    tens: 'לחזור על "צליל נמוך אחד = עשרת" עם לוח המאה: קודם הצליל הנמוך, ואז היחידות אחת־אחת.',
    frac: 'למחוא תיבה של 4 פעמות, ואז להחזיק תו אחד לאורך 2 פעמות ולשאול: איזה חלק מהתיבה הוא מילא?'
  };
  function topicsOf(unit) {
    if (unit && Array.isArray(unit.topics)) return unit.topics;
    return Object.keys(TOPICS).map(function (t) { return { id: t, name: TOPICS[t].name, curr: CURRICULUM[t], advice: ADVICE[t], note: CURRICULUM_NOTE[t] || null }; });
  }

  // results: { [qid]: { tries, correct, firstTry, revealed } }
  function topicReport(results, unit) {
    const r = results || {};
    const qsAll = (unit || UNIT).questions;
    return topicsOf(unit).map(function (t) {
      const tid = t.id;
      const qs = qsAll.filter(function (q) { return q.topic === tid; });
      const done = qs.filter(function (q) { return r[q.id] && (r[q.id].correct || r[q.id].revealed); });
      const first = done.filter(function (q) { return r[q.id].firstTry; }).length;
      const solved = done.filter(function (q) { return r[q.id].correct; }).length;
      const rate = done.length ? first / done.length : null;
      let status = 'none';
      if (done.length) status = rate < GAP_THRESHOLD ? 'gap' : 'ok';
      return {
        topic: tid, name: t.name, total: qs.length, done: done.length,
        firstTry: first, solved: solved, rate: rate, status: status
      };
    });
  }

  function gaps(results, unit) {
    return topicReport(results, unit).filter(function (t) { return t.status === 'gap'; });
  }

  function stars(results, unit) {
    const r = results || {};
    const qs = (unit || UNIT).questions;
    const first = qs.filter(function (q) { return r[q.id] && r[q.id].firstTry; }).length;
    if (first === qs.length) return 3;
    if (first >= qs.length - 2) return 2;
    return 1;
  }

  return {
    TOPICS: TOPICS, CURRICULUM: CURRICULUM, CURRICULUM_NOTE: CURRICULUM_NOTE, UNIT: UNIT, QUESTIONS: QUESTIONS, MAX_TRIES: MAX_TRIES,
    GAP_THRESHOLD: GAP_THRESHOLD, answerOf: answerOf, questionText: questionText,
    isCorrect: isCorrect, hintText: hintText, hintGroups: hintGroups,
    topicReport: topicReport, gaps: gaps, stars: stars,
    topicsOf: topicsOf, choiceOf: choiceOf, ADVICE: ADVICE
  };
});
