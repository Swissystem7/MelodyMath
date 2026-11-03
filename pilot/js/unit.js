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
    { id: 'q1', topic: 'add', a: 4, op: '+', b: 3, music: 'join' },
    { id: 'q2', topic: 'add', a: 8, op: '+', b: 5, music: 'join' },
    { id: 'q3', topic: 'sub', a: 9, op: '-', b: 4, music: 'remove' },
    { id: 'q4', topic: 'sub', a: 15, op: '-', b: 6, music: 'remove' },
    { id: 'q5', topic: 'tens', a: 6, op: '+', b: 10, music: 'tens' },
    { id: 'q6', topic: 'tens', a: 20, op: '-', b: 10, music: 'tens' },
    { id: 'q7', topic: 'frac', kind: 'rhythm', answer: 'half', grades: 'ג׳' }
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
    questions: QUESTIONS
  });

  const MAX_TRIES = 2;
  const GAP_THRESHOLD = 0.7; // under 70% correct on the first try = a gap

  const RHYTHM_ANSWER_TEXT = { quarter: '1/4', half: '1/2', whole: '1' };

  function answerOf(q) {
    if (q.kind === 'rhythm') return RHYTHM_ANSWER_TEXT[q.answer];
    return q.op === '+' ? q.a + q.b : q.a - q.b;
  }

  function questionText(q) {
    // The math itself is shown left-to-right inside an LTR span by app.js.
    if (q.kind === 'rhythm') return '1/4 + 1/4 + ? = 1';
    return q.a + ' ' + (q.op === '+' ? '+' : '−') + ' ' + q.b + ' = ?';
  }

  function isCorrect(q, typed) {
    if (typed == null || String(typed).trim() === '') return false;
    if (q.kind === 'rhythm') return String(typed) === q.answer;
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
    if (q.kind === 'rhythm') return [];
    if (q.b === 10) return [10];
    return [Math.min(q.a, 10), Math.min(q.b, 10)];
  }

  // results: { [qid]: { tries, correct, firstTry, revealed } }
  function topicReport(results) {
    const r = results || {};
    return Object.keys(TOPICS).map(function (tid) {
      const qs = QUESTIONS.filter(function (q) { return q.topic === tid; });
      const done = qs.filter(function (q) { return r[q.id] && (r[q.id].correct || r[q.id].revealed); });
      const first = done.filter(function (q) { return r[q.id].firstTry; }).length;
      const solved = done.filter(function (q) { return r[q.id].correct; }).length;
      const rate = done.length ? first / done.length : null;
      let status = 'none';
      if (done.length) status = rate < GAP_THRESHOLD ? 'gap' : 'ok';
      return {
        topic: tid, name: TOPICS[tid].name, total: qs.length, done: done.length,
        firstTry: first, solved: solved, rate: rate, status: status
      };
    });
  }

  function gaps(results) {
    return topicReport(results).filter(function (t) { return t.status === 'gap'; });
  }

  function stars(results) {
    const r = results || {};
    const first = QUESTIONS.filter(function (q) { return r[q.id] && r[q.id].firstTry; }).length;
    if (first === QUESTIONS.length) return 3;
    if (first >= QUESTIONS.length - 2) return 2;
    return 1;
  }

  return {
    TOPICS: TOPICS, CURRICULUM: CURRICULUM, CURRICULUM_NOTE: CURRICULUM_NOTE, UNIT: UNIT, QUESTIONS: QUESTIONS, MAX_TRIES: MAX_TRIES,
    GAP_THRESHOLD: GAP_THRESHOLD, answerOf: answerOf, questionText: questionText,
    isCorrect: isCorrect, hintText: hintText, hintGroups: hintGroups,
    topicReport: topicReport, gaps: gaps, stars: stars
  };
});
