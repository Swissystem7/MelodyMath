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
      pre: [I('m1-pre1', '9 + 4 = ?', 13), I('m1-pre2', '14 − 8 = ?', 6), I('m1-pre3', '7 + 10 = ?', 17)],
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
    },
    // MM-610 part 2 (js/units-extra.js)
    'order-1': {
      pre: [I('or-pre1', 'איזה מספר בא אחרי 29?', 30), I('or-pre2', 'סופרים בקפיצות של 2: 12, 14, 16, ?', 18), I('or-pre3', 'מה המספר הבא אחרי 99?', 100)],
      post: [I('or-post1', 'איזה מספר נמצא בין 71 ל־73?', 72), I('or-post2', 'סופרים אחורה בקפיצות של 5: 40, 35, 30, ?', 25), I('or-post3', '6 − 6 = ?', 0)]
    },
    'attr-1': {
      pre: [I('at-pre1', 'מקל של 9 קוביות ומקל של 4 קוביות. בכמה קוביות הראשון ארוך יותר?', 5), I('at-pre2', 'מנגינה של 5 צלילים עולה, ואז חוזרת כמו במראה עם אותם 5. כמה צלילים בסך הכול?', 10), I('at-pre3', 'הולכים 3 צעדים ימינה ו־3 שמאלה. כמה צעדים מהמקום שיצאנו ממנו?', 0)],
      post: [I('at-post1', 'סרט של 10 ס״מ וסרט של 6 ס״מ. בכמה ס״מ הראשון ארוך יותר?', 4), I('at-post2', 'מנגינה של 7 צלילים עולה, ואז חוזרת כמו במראה עם אותם 7. כמה צלילים בסך הכול?', 14), I('at-post3', 'הולכים 5 צעדים ימינה ו־2 שמאלה. כמה צעדים ימינה מהמקום שיצאנו ממנו?', 3)]
    },
    'laws-1': {
      pre: [I('lw-pre1', '8 + 3 ו־3 + 8 נותנים אותו סכום. מהו?', 11), I('lw-pre2', 'סופרים בקפיצות של 20: 20, 40, 60, ?', 80), I('lw-pre3', 'כמה פעמות נשמעות ב־4 תיבות של שקט?', 0)],
      post: [I('lw-post1', '2 × 7 ו־7 × 2 נותנים אותה מכפלה. מהי?', 14), I('lw-post2', 'סופרים בקפיצות של 100: 100, 200, 300, ?', 400), I('lw-post3', 'מכפילים 6 ב־1 ואז מוסיפים 2. כמה?', 8)]
    },
    'solids-1': {
      pre: [I('sd-pre1', 'כמה פאות יש לקובייה?', 6), I('sd-pre2', 'משולש שכל צלעותיו 5 ס״מ. מה ההיקף?', 15), I('sd-pre3', 'קו שבור מקטעים של 4, 4 ו־3 ס״מ. מה אורכו?', 11)],
      post: [I('sd-post1', 'כמה קודקודים יש לקובייה?', 8), I('sd-post2', 'משולש שכל צלעותיו 6 ס״מ. מה ההיקף?', 18), I('sd-post3', 'תיבה א: 5 כוסות חול, תיבה ב: 9. בכמה כוסות ב גדולה יותר?', 4)]
    },
    'rules-1': {
      pre: [I('rl-pre1', 'איזה מספר בין 21 ל־29 מתחלק ב־5?', 25), I('rl-pre2', 'עגלו את 63 לעשרות הקרובות.', 60), I('rl-pre3', 'כפולות של 3: 3, 6, 9, 12, ?', 15)],
      post: [I('rl-post1', 'איזה מספר בין 51 ל־59 מתחלק ב־5?', 55), I('rl-post2', 'עגלו את 86 לעשרות הקרובות.', 90), I('rl-post3', 'כפולות של 6: 6, 12, 18, 24, ?', 30)]
    },
    'ops-1': {
      pre: [I('op-pre1', '5 + 2 × 3 = ?', 11), I('op-pre2', '(5 + 2) × 3 = ?', 21), I('op-pre3', '? + 12 = 30', 18)],
      post: [I('op-post1', '4 + 5 × 2 = ?', 14), I('op-post2', '(4 + 5) × 2 = ?', 18), I('op-post3', '3 שורות של 7 כיסאות ועוד 2 בצד. כמה כיסאות?', 23)]
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
