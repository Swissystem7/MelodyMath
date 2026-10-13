// MelodyMath — a short check before and after a music unit (#110).
//
// The evidence for music-math integration is moderate and topic-specific, so
// the app measures instead of claiming. Each unit has two parallel forms: the
// same skill and level in the same slot, different numbers. The check itself
// has no music (plan §10 R4: transfer without music). Results are ordinary
// teacherStore sessions of kind 'check-pre:<unit>' / 'check-post:<unit>', so
// they stay on this device and travel with the roster export like any session.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SKILL_HE = {
    equivalence: 'שברים שקולים',
    compare: 'השוואת שברים',
    addsub: 'חיבור וחיסור שברים',
    whole: 'שלם כשברים',
  };

  // Slot i of 'pre' and slot i of 'post' are a pair: same skill, same level,
  // same number of choices, different numbers. unitCheck.test.js pins this.
  const UNITS = {
    'frac-dur-4': {
      he: 'שברים עם משכי צלילים · כיתה ד׳',
      grade: 'ד',
      forms: {
        pre: [
          { skill: 'equivalence', level: 1, prompt: 'כמה רבעים שווים ל־1/2?', answer: '2', choices: ['1', '2', '3', '4'] },
          { skill: 'equivalence', level: 2, prompt: 'כמה שמיניות שוות ל־3/4?', answer: '6', choices: ['3', '4', '6', '8'] },
          { skill: 'compare', level: 1, prompt: 'מה גדול יותר: 3/8 או 5/8?', answer: '5/8', choices: ['3/8', '5/8', 'שווים'] },
          { skill: 'compare', level: 2, prompt: 'מה גדול יותר: 1/3 או 1/5?', answer: '1/3', choices: ['1/3', '1/5', 'שווים'] },
          { skill: 'addsub', level: 1, prompt: '1/8 + 3/8 = ?', answer: '4/8', choices: ['4/8', '4/16', '3/8', '2/8'] },
          { skill: 'addsub', level: 2, prompt: '7/8 − 3/8 = ?', answer: '4/8', choices: ['4/8', '4/16', '10/8', '3/8'] },
          { skill: 'whole', level: 3, prompt: 'כמה רבעים יש ב־2 שלמים?', answer: '8', choices: ['2', '4', '6', '8'] },
          { skill: 'addsub', level: 3, prompt: '1/2 + 1/4 = ?', answer: '3/4', choices: ['3/4', '2/6', '2/4', '1/6'] },
        ],
        post: [
          { skill: 'equivalence', level: 1, prompt: 'כמה שישיות שוות ל־1/3?', answer: '2', choices: ['1', '2', '3', '4'] },
          { skill: 'equivalence', level: 2, prompt: 'כמה תשיעיות שוות ל־2/3?', answer: '6', choices: ['2', '3', '6', '9'] },
          { skill: 'compare', level: 1, prompt: 'מה גדול יותר: 5/6 או 2/6?', answer: '5/6', choices: ['5/6', '2/6', 'שווים'] },
          { skill: 'compare', level: 2, prompt: 'מה גדול יותר: 1/6 או 1/4?', answer: '1/4', choices: ['1/6', '1/4', 'שווים'] },
          { skill: 'addsub', level: 1, prompt: '2/6 + 3/6 = ?', answer: '5/6', choices: ['5/6', '5/12', '4/6', '1/6'] },
          { skill: 'addsub', level: 2, prompt: '5/6 − 1/6 = ?', answer: '4/6', choices: ['4/6', '4/12', '6/6', '1/6'] },
          { skill: 'whole', level: 3, prompt: 'כמה שלישים יש ב־3 שלמים?', answer: '9', choices: ['3', '6', '9', '12'] },
          { skill: 'addsub', level: 3, prompt: '1/3 + 1/6 = ?', answer: '3/6', choices: ['3/6', '2/9', '2/6', '1/9'] },
        ],
      },
    },
  };

  const FORMS = ['pre', 'post'];

  const DISCLAIMER = 'השוואה מקומית לפני/אחרי בכיתה אחת, בלי קבוצת השוואה. '
    + 'זה לא מחקר מבוקר, ולא מראה שהיחידה היא שגרמה לשינוי.';

  function listUnits() {
    return Object.keys(UNITS).map(function (id) {
      return { id: id, he: UNITS[id].he, grade: UNITS[id].grade, length: UNITS[id].forms.pre.length };
    });
  }

  function formItems(unitId, form) {
    const unit = Object.prototype.hasOwnProperty.call(UNITS, unitId) ? UNITS[unitId] : null;
    if (!unit || FORMS.indexOf(form) === -1) return [];
    return unit.forms[form].map(function (it, i) {
      return Object.assign({ id: unitId + ':' + form + ':' + (i + 1), pair: i + 1, form: form }, it, {
        choices: it.choices.slice(),
      });
    });
  }

  function kindFor(unitId, form) {
    return 'check-' + form + ':' + unitId;
  }

  function parseKind(kind) {
    const m = /^check-(pre|post):(.+)$/.exec(String(kind == null ? '' : kind));
    if (!m || !Object.prototype.hasOwnProperty.call(UNITS, m[2])) return null;
    return { form: m[1], unitId: m[2] };
  }

  function isCorrect(item, given) {
    if (!item) return false;
    return String(given == null ? '' : given).trim() === String(item.answer);
  }

  function shuffled(list, rng) {
    const roll = typeof rng === 'function' ? rng : Math.random;
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(roll() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  // The latest finished session of this kind. An abandoned check (no `ended`)
  // is not a score; unanswered slots of a finished one count as not correct.
  function latestCheck(student, unitId, form) {
    const kind = kindFor(unitId, form);
    const total = formItems(unitId, form).length;
    let best = null;
    ((student && Array.isArray(student.sessions)) ? student.sessions : []).forEach(function (s) {
      if (!s || s.kind !== kind || !s.ended) return;
      if (!best || Number(s.ended) >= Number(best.ended)) best = s;
    });
    if (!best || !total) return null;
    const items = Array.isArray(best.items) ? best.items : [];
    const correct = Math.min(total, items.filter(function (it) { return it && it.correct; }).length);
    return { correct: correct, total: total, at: best.ended };
  }

  function mean(list) {
    if (!list.length) return null;
    return list.reduce(function (a, b) { return a + b; }, 0) / list.length;
  }

  // students: the roster's students map (or an array of rows). Returns one row
  // per student who took either form, and class means over the n students
  // who took both. Nothing here is a claim; DISCLAIMER goes with every view.
  function checkReport(students, unitId) {
    const rows = (Array.isArray(students) ? students : Object.keys(students || {}).map(function (k) {
      return students[k];
    })).filter(function (s) { return s && typeof s === 'object'; }).map(function (s) {
      const pre = latestCheck(s, unitId, 'pre');
      const post = latestCheck(s, unitId, 'post');
      return {
        name: String(s.name || ''),
        pre: pre,
        post: post,
        change: pre && post ? post.correct - pre.correct : null,
      };
    }).filter(function (r) { return r.pre || r.post; }).sort(function (a, b) {
      return a.name.localeCompare(b.name, 'he');
    });
    const both = rows.filter(function (r) { return r.change != null; });
    return {
      unitId: unitId,
      total: formItems(unitId, 'pre').length,
      rows: rows,
      n: both.length,
      preOnly: rows.filter(function (r) { return r.pre && !r.post; }).length,
      postOnly: rows.filter(function (r) { return r.post && !r.pre; }).length,
      meanPre: mean(both.map(function (r) { return r.pre.correct; })),
      meanPost: mean(both.map(function (r) { return r.post.correct; })),
      disclaimer: DISCLAIMER,
    };
  }

  return {
    UNIT_CHECK_SKILL_HE: SKILL_HE,
    UNIT_CHECK_DISCLAIMER: DISCLAIMER,
    listUnits: listUnits,
    formItems: formItems,
    checkKind: kindFor,
    parseCheckKind: parseKind,
    isCheckCorrect: isCorrect,
    shuffledChoices: shuffled,
    latestCheck: latestCheck,
    checkReport: checkReport,
  };
});
