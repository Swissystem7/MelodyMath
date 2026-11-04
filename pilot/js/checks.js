// MM-610 pilot — a short check before and after each unit, WITHOUT music.
//
// Flow of a unit: pre-check → lesson and exercises (with music) → post-check.
// The checks are plain math on the same skill as the unit, in parallel forms:
// the pre and post items differ from each other and from the unit's exercises
// (test/pilotUnits.test.js), so the teacher sees whether the math itself moved,
// not just that the unit was completed. No music, no hints, no feedback per item
// (it is a measurement): the child sees only the score at the end.
// This mirrors MM-503 §5 ("measure only in a check without music"). A 3-item
// check is a small signal, not a test score — the teacher guide says so.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MMPilotChecks = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const I = (id, q, answer) => Object.freeze({ id: id, q: q, answer: answer });

  const CHECKS = Object.freeze({
    'music-1': {
      pre: [I('m1-pre1', '6 + 5 = ?', 11), I('m1-pre2', '14 − 8 = ?', 6), I('m1-pre3', '7 + 10 = ?', 17)],
      post: [I('m1-post1', '7 + 6 = ?', 13), I('m1-post2', '12 − 5 = ?', 7), I('m1-post3', '30 − 10 = ?', 20)]
    },
    'line-1': {
      pre: [I('ln-pre1', 'מה המספר הבא? 58, 59, ?', 60), I('ln-pre2', 'מתחילים ב־40 וקופצים 2 קפיצות של 10. איפה נוחתים?', 60), I('ln-pre3', '3 עשרות ו־5 יחידות. איזה מספר?', 35)],
      post: [I('ln-post1', 'מה המספר הבא? 39, 38, 37, ?', 36), I('ln-post2', 'מתחילים ב־30 וקופצים 4 קפיצות של 10. איפה נוחתים?', 70), I('ln-post3', 'בכיתה 9 ילדים. נכנסו עוד 4. כמה ילדים בכיתה?', 13)]
    },
    'pattern-1': {
      pre: [I('pt-pre1', 'המשיכו את הסדרה: 2, 4, 6, 8, ?', 10), I('pt-pre2', 'כמה מספרים זוגיים יש בין 1 ל־9?', 4), I('pt-pre3', 'בדגם א, ב, ב, א, ב, ב — כמה אותיות ביחידה החוזרת?', 3)],
      post: [I('pt-post1', 'המשיכו את הסדרה: 10, 20, 30, ?', 40), I('pt-post2', 'כמה מספרים אי־זוגיים יש בין 1 ל־10?', 5), I('pt-post3', 'בדגם א, ב, ג, ד, א, ב, ג, ד — כמה אותיות ביחידה החוזרת?', 4)]
    },
    'place-1': {
      pre: [I('pv-pre1', '4 מאות, 2 עשרות ו־7 יחידות. איזה מספר?', 427), I('pv-pre2', '46 + 27 = ?', 73), I('pv-pre3', '15 × 10 = ?', 150)],
      post: [I('pv-post1', '5 מאות, 0 עשרות ו־3 יחידות. איזה מספר?', 503), I('pv-post2', '61 − 28 = ?', 33), I('pv-post3', '2300 + 1400 = ?', 3700)]
    },
    'times-1': {
      pre: [I('tm-pre1', '5 × 4 = ?', 20), I('tm-pre2', '6 × 3 = ?', 18), I('tm-pre3', 'בכל קופסה 5 עפרונות. יש 3 קופסאות ועוד 2 עפרונות. כמה עפרונות?', 17)],
      post: [I('tm-post1', '4 × 4 = ?', 16), I('tm-post2', '7 × 4 = ?', 28), I('tm-post3', 'לדני 3 גולות, ולרון פי 4 יותר. כמה גולות לרון?', 12)]
    },
    'divide-1': {
      pre: [I('dv-pre1', '20 : 4 = ?', 5), I('dv-pre2', '17 : 5 = 3, שארית ?', 2), I('dv-pre3', '400 : 10 = ?', 40)],
      post: [I('dv-post1', '18 : 3 = ?', 6), I('dv-post2', '23 : 4 = 5, שארית ?', 3), I('dv-post3', '600 : 10 = ?', 60)]
    },
    'shapes-1': {
      pre: [I('sh-pre1', 'כמה קודקודים יש למשושה?', 6), I('sh-pre2', 'כמה צלעות יש לשני ריבועים ביחד?', 8), I('sh-pre3', 'כמה זוויות ישרות יש במלבן?', 4)],
      post: [I('sh-post1', 'כמה צלעות יש למחומש?', 5), I('sh-post2', 'כמה קודקודים יש לשלושה משולשים ביחד?', 9), I('sh-post3', 'כמה מעלות יש בזווית שטוחה?', 180)]
    },
    'measure-1': {
      pre: [I('ms-pre1', 'קו של 8 ס״מ ועוד קו של 5 ס״מ. כמה ס״מ ביחד?', 13), I('ms-pre2', 'מה ההיקף של ריבוע שצלעו 3 ס״מ?', 12), I('ms-pre3', 'מלבן של 2 שורות ו־4 משבצות בכל שורה. מה השטח בסמ״ר?', 8)],
      post: [I('ms-post1', 'רצועה של 15 ס״מ. חתכו ממנה 6 ס״מ. כמה ס״מ נשארו?', 9), I('ms-post2', 'מה ההיקף של מלבן של 5 ס״מ על 3 ס״מ?', 16), I('ms-post3', 'תיבה של 3 שכבות, ובכל שכבה 4 קוביות. כמה קוביות?', 12)]
    },
    'clock-1': {
      pre: [I('ck-pre1', 'השעה 9. מה תהיה השעה בעוד 4 שעות?', 1), I('ck-pre2', 'כמה דקות יש ברבע שעה?', 15), I('ck-pre3', 'המחוג הארוך מצביע על 6. כמה דקות אחרי השעה העגולה?', 30)],
      post: [I('ck-post1', 'השעה 10. מה הייתה השעה לפני 3 שעות?', 7), I('ck-post2', 'כמה דקות יש בשעה וחצי?', 90), I('ck-post3', 'המחוג הארוך מצביע על 9. כמה דקות אחרי השעה העגולה?', 45)]
    },
    'money-1': {
      pre: [I('mn-pre1', 'מטבע של 5 ₪ ושני מטבעות של 2 ₪. כמה ₪ ביחד?', 9), I('mn-pre2', 'קנינו ב־7 ₪ ושילמנו 10 ₪. כמה ₪ עודף?', 3), I('mn-pre3', 'כמה אגורות יש ב־2 ₪?', 200)],
      post: [I('mn-post1', 'מטבע של 10 ₪ ושלושה מטבעות של 1 ₪. כמה ₪ ביחד?', 13), I('mn-post2', 'קנינו ב־16 ₪ ושילמנו 20 ₪. כמה ₪ עודף?', 4), I('mn-post3', 'כמה אגורות יש ב־5 ₪?', 500)]
    },
    'data-1': {
      pre: [I('dt-pre1', 'בטבלה: כדורגל — 6 ילדים, כדורסל — 9 ילדים. בכמה ילדים יותר בחרו בכדורסל?', 3), I('dt-pre2', 'בטבלה: כיתה א׳ — 5, כיתה ב׳ — 7. כמה ביחד?', 12), I('dt-pre3', 'בפיקטוגרם כל ⭐ שווה 2 ילדים: ⭐⭐⭐⭐. כמה ילדים?', 8)],
      post: [I('dt-post1', 'בטבלה: תפוח — 8 ילדים, בננה — 3 ילדים. בכמה ילדים יותר בחרו בתפוח?', 5), I('dt-post2', 'סימני ספירה: |||| |||| ||. כמה סימנים?', 12), I('dt-post3', 'בפיקטוגרם כל ⭐ שווה 2 ילדים: ⭐⭐⭐. כמה ילדים?', 6)]
    }
  });

  function checkFor(unitId, phase) {
    const c = CHECKS[unitId];
    return c && c[phase] ? c[phase] : [];
  }

  function isRight(item, typed) {
    if (typed == null || String(typed).trim() === '') return false;
    const n = Number(String(typed).replace(/[,\s]/g, ''));
    return Number.isFinite(n) && n === item.answer;
  }

  // answers: { [itemId]: typed } → { score, total, answers, at }
  function score(unitId, phase, answers) {
    const items = checkFor(unitId, phase);
    const a = answers || {};
    return {
      score: items.filter(function (it) { return isRight(it, a[it.id]); }).length,
      total: items.length,
      answers: items.reduce(function (o, it) { o[it.id] = String(a[it.id] == null ? '' : a[it.id]).slice(0, 8); return o; }, {}),
      at: Date.now()
    };
  }

  // "לפני 1/3 · אחרי 3/3" and the change, for the student and teacher views.
  function compare(pre, post) {
    const out = { pre: pre ? pre.score + '/' + pre.total : null, post: post ? post.score + '/' + post.total : null, change: null };
    if (pre && post) out.change = post.score - pre.score;
    return out;
  }

  return { CHECKS: CHECKS, checkFor: checkFor, isRight: isRight, score: score, compare: compare };
});
