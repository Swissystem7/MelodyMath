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

  // skill: the unit's topic id this item measures. Item i of "pre" and item i of
  // "post" measure the same skill with different numbers (parallel forms), so a
  // change from before to after is a change in that skill and not in the question.
  const I = (id, q, answer, skill) => Object.freeze({ id: id, q: q, answer: answer, skill: skill });

  const CHECKS = Object.freeze({
    'music-1': {
      pre: [I('m1-pre1', '9 + 4 = ?', 13, 'add'), I('m1-pre2', '14 − 8 = ?', 6, 'sub'), I('m1-pre3', '7 + 10 = ?', 17, 'tens')],
      post: [I('m1-post1', '7 + 6 = ?', 13, 'add'), I('m1-post2', '12 − 5 = ?', 7, 'sub'), I('m1-post3', '30 − 10 = ?', 20, 'tens')]
    },
    'line-1': {
      pre: [I('ln-pre1', 'מה המספר הבא? 58, 59, ?', 60, 'count'), I('ln-pre2', 'מתחילים ב־40 וקופצים 2 קפיצות של 10. איפה נוחתים?', 60, 'line'), I('ln-pre3', '3 עשרות ו־5 יחידות. איזה מספר?', 35, 'group')],
      post: [I('ln-post1', 'מה המספר הבא? 39, 38, 37, ?', 36, 'count'), I('ln-post2', 'מתחילים ב־30 וקופצים 4 קפיצות של 10. איפה נוחתים?', 70, 'line'), I('ln-post3', '4 עשרות ו־2 יחידות. איזה מספר?', 42, 'group')]
    },
    'pattern-1': {
      pre: [I('pt-pre1', 'המשיכו את הסדרה: 2, 4, 6, 8, ?', 10, 'pat'), I('pt-pre2', 'כמה מספרים זוגיים יש בין 1 ל־9?', 4, 'parity'), I('pt-pre3', 'בדגם א, ב, ב, א, ב, ב — כמה אותיות ביחידה החוזרת?', 3, 'pat')],
      post: [I('pt-post1', 'המשיכו את הסדרה: 10, 20, 30, ?', 40, 'pat'), I('pt-post2', 'כמה מספרים אי־זוגיים יש בין 1 ל־10?', 5, 'parity'), I('pt-post3', 'בדגם א, ב, ג, ד, א, ב, ג, ד — כמה אותיות ביחידה החוזרת?', 4, 'pat')]
    },
    'place-1': {
      pre: [I('pv-pre1', '4 מאות, 2 עשרות ו־7 יחידות. איזה מספר?', 427, 'p1000'), I('pv-pre2', '46 + 27 = ?', 73, 'col100'), I('pv-pre3', '15 × 10 = ?', 150, 'x10')],
      post: [I('pv-post1', '5 מאות, 0 עשרות ו־3 יחידות. איזה מספר?', 503, 'p1000'), I('pv-post2', '58 + 34 = ?', 92, 'col100'), I('pv-post3', '27 × 10 = ?', 270, 'x10')]
    },
    'times-1': {
      pre: [I('tm-pre1', '5 × 4 = ?', 20, 'mult'), I('tm-pre2', '6 × 3 = ?', 18, 'table'), I('tm-pre3', 'בכל קופסה 5 עפרונות. יש 3 קופסאות ועוד 2 עפרונות. כמה עפרונות?', 17, 'compare')],
      post: [I('tm-post1', '4 × 4 = ?', 16, 'mult'), I('tm-post2', '7 × 4 = ?', 28, 'table'), I('tm-post3', 'בכל שקית 4 סוכריות. יש 4 שקיות ועוד 3 סוכריות. כמה סוכריות?', 19, 'compare')]
    },
    'divide-1': {
      pre: [I('dv-pre1', '20 : 4 = ?', 5, 'div'), I('dv-pre2', '17 : 5 = 3, שארית ?', 2, 'rem'), I('dv-pre3', '400 : 10 = ?', 40, 'rem')],
      post: [I('dv-post1', '18 : 3 = ?', 6, 'div'), I('dv-post2', '23 : 4 = 5, שארית ?', 3, 'rem'), I('dv-post3', '600 : 10 = ?', 60, 'rem')]
    },
    'shapes-1': {
      pre: [I('sh-pre1', 'כמה קודקודים יש למשושה?', 6, 'poly'), I('sh-pre2', 'כמה צלעות יש לשני ריבועים ביחד?', 8, 'decomp'), I('sh-pre3', 'כמה זוויות ישרות יש במלבן?', 4, 'angles')],
      post: [I('sh-post1', 'כמה צלעות יש למחומש?', 5, 'poly'), I('sh-post2', 'כמה קודקודים יש לשלושה משולשים ביחד?', 9, 'decomp'), I('sh-post3', 'כמה זוויות ישרות יש במשולש ישר־זווית?', 1, 'angles')]
    },
    'measure-1': {
      pre: [I('ms-pre1', 'קו של 8 ס״מ ועוד קו של 5 ס״מ. כמה ס״מ ביחד?', 13, 'len'), I('ms-pre2', 'מה ההיקף של ריבוע שצלעו 3 ס״מ?', 12, 'perim'), I('ms-pre3', 'מלבן של 2 שורות ו־4 משבצות בכל שורה. מה השטח בסמ״ר?', 8, 'area')],
      post: [I('ms-post1', 'רצועה של 15 ס״מ. חתכו ממנה 6 ס״מ. כמה ס״מ נשארו?', 9, 'len'), I('ms-post2', 'מה ההיקף של מלבן של 5 ס״מ על 3 ס״מ?', 16, 'perim'), I('ms-post3', 'מלבן של 3 שורות ו־5 משבצות בכל שורה. מה השטח בסמ״ר?', 15, 'area')]
    },
    'clock-1': {
      pre: [I('ck-pre1', 'השעה 9. מה תהיה השעה בעוד 4 שעות?', 1, 'hour'), I('ck-pre2', 'כמה דקות יש ברבע שעה?', 15, 'half'), I('ck-pre3', 'המחוג הארוך מצביע על 6. כמה דקות אחרי השעה העגולה?', 30, 'min')],
      post: [I('ck-post1', 'השעה 10. מה תהיה השעה בעוד 5 שעות?', 3, 'hour'), I('ck-post2', 'כמה דקות יש בשלושה רבעי שעה?', 45, 'half'), I('ck-post3', 'המחוג הארוך מצביע על 4. כמה דקות אחרי השעה העגולה?', 20, 'min')]
    },
    'money-1': {
      pre: [I('mn-pre1', 'מטבע של 5 ₪ ושני מטבעות של 2 ₪. כמה ₪ ביחד?', 9, 'coins'), I('mn-pre2', 'קנינו ב־7 ₪ ושילמנו 10 ₪. כמה ₪ עודף?', 3, 'change'), I('mn-pre3', 'כמה אגורות יש ב־2 ₪?', 200, 'agorot')],
      post: [I('mn-post1', 'מטבע של 10 ₪ ושלושה מטבעות של 1 ₪. כמה ₪ ביחד?', 13, 'coins'), I('mn-post2', 'קנינו ב־16 ₪ ושילמנו 20 ₪. כמה ₪ עודף?', 4, 'change'), I('mn-post3', 'כמה אגורות יש ב־5 ₪?', 500, 'agorot')]
    },
    'data-1': {
      pre: [I('dt-pre1', 'בטבלה: כדורגל — 6 ילדים, כדורסל — 9 ילדים. בכמה ילדים יותר בחרו בכדורסל?', 3, 'table'), I('dt-pre2', 'סימני ספירה: |||| |||. כמה סימנים?', 8, 'collect'), I('dt-pre3', 'בפיקטוגרם כל ⭐ שווה 2 ילדים: ⭐⭐⭐⭐. כמה ילדים?', 8, 'picto')],
      post: [I('dt-post1', 'בטבלה: תפוח — 8 ילדים, בננה — 3 ילדים. בכמה ילדים יותר בחרו בתפוח?', 5, 'table'), I('dt-post2', 'סימני ספירה: |||| |||| ||. כמה סימנים?', 12, 'collect'), I('dt-post3', 'בפיקטוגרם כל ⭐ שווה 2 ילדים: ⭐⭐⭐. כמה ילדים?', 6, 'picto')]
    },
    'order-1': {
      pre: [I('or-pre1', 'איזה מספר בא אחרי 29?', 30, 'compare'), I('or-pre2', 'סופרים בקפיצות של 2: 12, 14, 16, ?', 18, 'skip'), I('or-pre3', '9 − 9 = ?', 0, 'zero')],
      post: [I('or-post1', 'איזה מספר בא אחרי 49?', 50, 'compare'), I('or-post2', 'סופרים אחורה בקפיצות של 5: 40, 35, 30, ?', 25, 'skip'), I('or-post3', '6 − 6 = ?', 0, 'zero')]
    },
    'attr-1': {
      pre: [I('at-pre1', 'מקל של 9 קוביות ומקל של 4 קוביות. בכמה קוביות הראשון ארוך יותר?', 5, 'mediator'), I('at-pre2', 'מנגינה של 5 צלילים עולה, ואז חוזרת כמו במראה עם אותם 5. כמה צלילים בסך הכול?', 10, 'mirror'), I('at-pre3', 'הולכים 4 צעדים ימינה ו־3 שמאלה. כמה צעדים ימינה מהמקום שיצאנו ממנו?', 1, 'where')],
      post: [I('at-post1', 'סרט של 10 ס״מ וסרט של 6 ס״מ. בכמה ס״מ הראשון ארוך יותר?', 4, 'mediator'), I('at-post2', 'מנגינה של 7 צלילים עולה, ואז חוזרת כמו במראה עם אותם 7. כמה צלילים בסך הכול?', 14, 'mirror'), I('at-post3', 'הולכים 5 צעדים ימינה ו־2 שמאלה. כמה צעדים ימינה מהמקום שיצאנו ממנו?', 3, 'where')]
    },
    'laws-1': {
      pre: [I('lw-pre1', '8 + 3 ו־3 + 8 נותנים אותו סכום. מהו?', 11, 'commute'), I('lw-pre2', 'סופרים בקפיצות של 20: 20, 40, 60, ?', 80, 'skip'), I('lw-pre3', 'מכפילים 4 ב־1 ואז מוסיפים 3. כמה?', 7, 'onezero')],
      post: [I('lw-post1', '2 × 7 ו־7 × 2 נותנים אותה מכפלה. מהי?', 14, 'commute'), I('lw-post2', 'סופרים בקפיצות של 100: 100, 200, 300, ?', 400, 'skip'), I('lw-post3', 'מכפילים 6 ב־1 ואז מוסיפים 2. כמה?', 8, 'onezero')]
    },
    'solids-1': {
      pre: [I('sd-pre1', 'כמה פאות יש לקובייה?', 6, 'solid'), I('sd-pre2', 'משולש שכל צלעותיו 5 ס״מ. מה ההיקף?', 15, 'tri'), I('sd-pre3', 'קו שבור מקטעים של 4, 4 ו־3 ס״מ. מה אורכו?', 11, 'broken')],
      post: [I('sd-post1', 'כמה קודקודים יש לקובייה?', 8, 'solid'), I('sd-post2', 'משולש שכל צלעותיו 6 ס״מ. מה ההיקף?', 18, 'tri'), I('sd-post3', 'קו שבור מקטעים של 2, 6 ו־5 ס״מ. מה אורכו?', 13, 'broken')]
    },
    'rules-1': {
      pre: [I('rl-pre1', 'איזה מספר בין 21 ל־29 מתחלק ב־5?', 25, 'divis'), I('rl-pre2', 'עגלו את 63 לעשרות הקרובות.', 60, 'round'), I('rl-pre3', 'כפולות של 3: 3, 6, 9, 12, ?', 15, 'products')],
      post: [I('rl-post1', 'איזה מספר בין 51 ל־59 מתחלק ב־5?', 55, 'divis'), I('rl-post2', 'עגלו את 86 לעשרות הקרובות.', 90, 'round'), I('rl-post3', 'כפולות של 6: 6, 12, 18, 24, ?', 30, 'products')]
    },
    'ops-1': {
      pre: [I('op-pre1', '5 + 2 × 3 = ?', 11, 'order'), I('op-pre2', '(5 + 2) × 3 = ?', 21, 'order'), I('op-pre3', '? + 12 = 30', 18, 'equation')],
      post: [I('op-post1', '4 + 5 × 2 = ?', 14, 'order'), I('op-post2', '(4 + 5) × 2 = ?', 18, 'order'), I('op-post3', '? + 15 = 40', 25, 'equation')]
    },
    'frac-4': {
      pre: [I('fr-pre1', 'כמה רבעים יש בשלם אחד?', 4, 'whole'), I('fr-pre2', '1/2 = ?/8. מה המונה החסר?', 4, 'equiv'), I('fr-pre3', '1/8 + 1/8 + 1/8 = ?/8. מה המונה החסר?', 3, 'addfrac')],
      post: [I('fr-post1', 'כמה שמיניות יש בשלם אחד?', 8, 'whole'), I('fr-post2', '3/4 = ?/8. מה המונה החסר?', 6, 'equiv'), I('fr-post3', '1/2 + 1/8 = ?/8. מה המונה החסר?', 5, 'addfrac')]
    },
    'mult-9-strategy': {
      pre: [I('m9-pre1', '4 × 9 = ?', 36, 'strat9'), I('m9-pre2', '7 × 9 = ?', 63, 'strat9')],
      post: [I('m9-post1', '3 × 9 = ?', 27, 'strat9'), I('m9-post2', '8 × 9 = ?', 72, 'strat9')]
    },
    'mult-5-strategy': {
      pre: [I('m5-pre1', '3 × 5 = ?', 15, 'strat5'), I('m5-pre2', '7 × 5 = ?', 35, 'strat5')],
      post: [I('m5-post1', '5 × 5 = ?', 25, 'strat5'), I('m5-post2', '9 × 5 = ?', 45, 'strat5')]
    },
    'parity-rhythm': {
      pre: [I('pr-pre1', 'כמה זוגות של 2 יש במספר 8?', 4, 'parity'), I('pr-pre2', 'כמה זוגות של 2 יש במספר 14?', 7, 'parity')],
      post: [I('pr-post1', 'כמה זוגות של 2 יש במספר 6?', 3, 'parity'), I('pr-post2', 'כמה זוגות של 2 יש במספר 12?', 6, 'parity')]
    }
  });

  // A week after the check "after", the same items come back as the follow-up
  // check ("later"): same questions, so the score shows what stayed.
  const LATER_DAYS = 7;
  const DAY_MS = 24 * 60 * 60 * 1000;
  function laterDue(p, now) {
    return !!(p && p.post && Number.isFinite(p.post.at) && !p.later && (now == null ? Date.now() : now) - p.post.at >= LATER_DAYS * DAY_MS);
  }

  function checkFor(unitId, phase) {
    const c = CHECKS[unitId];
    if (phase === 'later') return c ? c.post : [];
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

  // How much did the class improve on the checks without music? rows: one per
  // student and unit, { student, unit, pre, post } (pre/post as from score()).
  // Only pairs with both checks count. Scores are in percent of the items, so
  // units with 2 or 3 items can be pooled. d = mean gain / SD of the gains (a
  // paired effect size); reported only from 2 pairs and when the gains vary.
  // This is change from before to after the unit in this app, not a comparison
  // with children who practised the same math without music.
  function pct(s) { return s && s.total ? s.score / s.total * 100 : null; }
  function stats(pairs) {
    const n = pairs.length;
    if (!n) return { n: 0 };
    const pre = pairs.map(function (r) { return pct(r.pre); });
    const post = pairs.map(function (r) { return pct(r.post); });
    const gain = post.map(function (v, i) { return v - pre[i]; });
    const mean = function (a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; };
    const g = mean(gain);
    const sd = n > 1 ? Math.sqrt(gain.reduce(function (x, v) { return x + (v - g) * (v - g); }, 0) / (n - 1)) : null;
    const r1 = function (v) { return Math.round(v * 10) / 10; };
    return {
      n: n, children: pairs.map(function (r) { return r.student; }).filter(function (v, i, a) { return a.indexOf(v) === i; }).length,
      pre: r1(mean(pre)), post: r1(mean(post)), gain: r1(g),
      improved: gain.filter(function (v) { return v > 0; }).length,
      same: gain.filter(function (v) { return v === 0; }).length,
      declined: gain.filter(function (v) { return v < 0; }).length,
      ceiling: pre.filter(function (v) { return v === 100; }).length,
      d: sd ? Math.round(g / sd * 100) / 100 : null,
      // the follow-up a week later, only for the pairs that already did it
      laterN: pairs.filter(function (r) { return r.later && r.later.total; }).length,
      later: (function () {
        const l = pairs.filter(function (r) { return r.later && r.later.total; });
        return l.length ? r1(mean(l.map(function (r) { return pct(r.later); }))) : null;
      })(),
      laterPost: (function () {
        const l = pairs.filter(function (r) { return r.later && r.later.total; });
        return l.length ? r1(mean(l.map(function (r) { return pct(r.post); }))) : null;
      })()
    };
  }
  function classSummary(rows) {
    const all = (rows || []).filter(Boolean);
    const pairs = all.filter(function (r) { return r.pre && r.post && r.pre.total && r.post.total; });
    const units = [];
    pairs.forEach(function (r) { if (units.indexOf(r.unit) < 0) units.push(r.unit); });
    return {
      started: all.filter(function (r) { return r.pre; }).length,
      all: stats(pairs),
      byUnit: units.map(function (u) { const s = stats(pairs.filter(function (r) { return r.unit === u; })); s.unit = u; return s; })
    };
  }
  // One line per student and unit, for a spreadsheet.
  function toCsv(rows) {
    const cell = function (v) { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const head = ['student', 'unit', 'pre_score', 'pre_total', 'post_score', 'post_total', 'change', 'pre_at', 'post_at', 'later_score', 'later_total', 'later_at'];
    const iso = function (t) { return t ? new Date(t).toISOString() : ''; };
    return [head.join(',')].concat((rows || []).filter(function (r) { return r && r.pre; }).map(function (r) {
      return [r.student, r.unit, r.pre.score, r.pre.total, r.post ? r.post.score : '', r.post ? r.post.total : '',
        r.post ? r.post.score - r.pre.score : '', iso(r.pre.at), r.post ? iso(r.post.at) : '',
        r.later ? r.later.score : '', r.later ? r.later.total : '', r.later ? iso(r.later.at) : ''].map(cell).join(',');
    })).join('\n') + '\n';
  }

  return { CHECKS: CHECKS, checkFor: checkFor, isRight: isRight, score: score, compare: compare, classSummary: classSummary, toCsv: toCsv, LATER_DAYS: LATER_DAYS, laterDue: laterDue };
});
