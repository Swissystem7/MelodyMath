// MM-600 pilot — the one demo unit for grades 1–3 (א׳–ג׳).
//
// "Jumps on the number line": the number line is a musical scale (the same
// idea as src/lib/numberLine.js and src/lib/grade1Music.js, which this demo
// loads read-only for the sound). Every step is one scale step, so adding goes
// up, taking away goes down and a jump of 10 is a whole octave.
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
    tens: { id: 'tens', name: 'קפיצות של 10', short: 'עשרות' }
  });

  // op: '+' or '-'. Answers are whole numbers 0–20, typed on the keypad.
  const QUESTIONS = Object.freeze([
    { id: 'q1', topic: 'add', a: 4, op: '+', b: 3 },
    { id: 'q2', topic: 'add', a: 8, op: '+', b: 5 },
    { id: 'q3', topic: 'sub', a: 9, op: '-', b: 4 },
    { id: 'q4', topic: 'sub', a: 15, op: '-', b: 6 },
    { id: 'q5', topic: 'tens', a: 6, op: '+', b: 10 },
    { id: 'q6', topic: 'tens', a: 20, op: '-', b: 10 }
  ].map(Object.freeze));

  const UNIT = Object.freeze({
    id: 'jumps-1',
    title: 'קפיצות על ישר המספרים',
    subtitle: 'הצלילים עולים ויורדים',
    grades: 'א׳–ג׳',
    lesson: {
      title: 'ישר המספרים הוא סולם',
      lines: [
        'כל צעד ימינה על ישר המספרים הוא צליל אחד גבוה יותר.',
        'כשמחברים — קופצים קדימה, והצליל עולה.',
        'כשמחסרים — קופצים אחורה, והצליל יורד.',
        'קפיצה של 10 היא אוקטבה: אותו צליל, רק גבוה (או נמוך) יותר.'
      ],
      demo: { from: 2, to: 5 }
    },
    questions: QUESTIONS
  });

  const MAX_TRIES = 2;
  const GAP_THRESHOLD = 0.7; // under 70% correct on the first try = a gap

  function answerOf(q) {
    return q.op === '+' ? q.a + q.b : q.a - q.b;
  }

  function questionText(q) {
    // The math itself is shown left-to-right inside an LTR span by app.js.
    return q.a + ' ' + (q.op === '+' ? '+' : '−') + ' ' + q.b + ' = ?';
  }

  function isCorrect(q, typed) {
    if (typed == null || String(typed).trim() === '') return false;
    const n = Number(String(typed).trim());
    return Number.isInteger(n) && n === answerOf(q);
  }

  // A hint never names the answer: it says which way to jump and how far.
  function hintText(q) {
    const dir = q.op === '+' ? 'קדימה (הצליל עולה)' : 'אחורה (הצליל יורד)';
    return 'התחילו ב־' + q.a + ' וקפצו ' + q.b + ' צעדים ' + dir + '.';
  }

  // Dot groups for the hint (design 2b): one group of `a`, one of `b`, at most 10 each.
  function hintGroups(q) {
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
    TOPICS: TOPICS, UNIT: UNIT, QUESTIONS: QUESTIONS, MAX_TRIES: MAX_TRIES,
    GAP_THRESHOLD: GAP_THRESHOLD, answerOf: answerOf, questionText: questionText,
    isCorrect: isCorrect, hintText: hintText, hintGroups: hintGroups,
    topicReport: topicReport, gaps: gaps, stars: stars
  };
});
