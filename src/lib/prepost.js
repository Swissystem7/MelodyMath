// MelodyMath — a short pre/post check per unit, counted on this device only.
//
// §0 of docs/CURRICULUM-MUSIC-PLAN.md: the evidence for music-math
// integration is moderate and topic-specific, so the product measures instead
// of claiming. Each unit owns 6-8 slots. A slot fixes one item shape, one
// difficulty level and one step count; form A (the pre-check) and form B (the
// post-check) fill that slot with different numbers. formsBalanced() is what
// test/prepost.test.js asserts, so a new item cannot quietly make the
// post-check the easier of the two.
//
// The check is silent on purpose. §10 R4 step 7 and R10.3 ask for the same
// mathematics without music; a sound that cues the answer would stop the
// check from measuring what the child can do without one.
//
// Results go into the roster teacherStore.js already writes: one session per
// check, kind "pre:<unit>" / "post:<unit>". No new storage backend, nothing
// leaves the device, and the report says in words that this is not a
// controlled study.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const barApi = (typeof module === 'object' && module.exports)
    ? require('./bar44')
    : (typeof globalThis !== 'undefined' ? globalThis : {});

  const PHASES = ['pre', 'post'];
  const FORM_OF = { pre: 'A', post: 'B' };
  const PHASE_HE = { pre: 'בדיקת פתיחה', post: 'בדיקת סיום' };
  const DISCLAIMER = 'זו ספירה מקומית בטאבלט הזה ולא ניסוי מבוקר: אין קבוצת ביקורת, אין הקצאה אקראית והמדגם קטן, ולכן אי אפשר להסיק מהמספרים האלה שהתרגול הוא שגרם לשינוי.';

  const UNITS = {
    frac4: {
      id: 'frac4',
      grade: 'ד',
      skill: 'basic_fractions',
      title: 'שברים בתיבה 4/4',
      goal: 'אחרי היחידה הילד/ה יודע/ת ש־1/2 = 2/4, כי שני תווי רבע ממלאים בדיוק את המשך של תו חצי.',
    },
  };

  // [slot, shape, level, steps, formA, formB] where a form is
  // [prompt, answer, choices, eighths-to-draw-or-null].
  const SLOTS = {
    frac4: [
      ['s1', 'name-shaded', 1, 1,
        ['בתיבה של 4/4 צבועות 4 שמיניות מתוך 8. איזה חלק מהתיבה צבוע?', '1/2', ['1/4', '1/2', '3/4', '1/8'], 4],
        ['בתיבה של 4/4 צבועות 2 שמיניות מתוך 8. איזה חלק מהתיבה צבוע?', '1/4', ['1/2', '1/8', '1/4', '1'], 2]],
      ['s2', 'count-in-bar', 1, 1,
        ['כמה תווי רבע ממלאים תיבה אחת של 4/4?', '4', ['2', '4', '8', '3'], null],
        ['כמה תווי שמינית ממלאים תיבה אחת של 4/4?', '8', ['4', '6', '8', '16'], null]],
      ['s3', 'equivalent', 2, 1,
        ['איזה שבר שווה לחלק הצבוע, 2/8?', '1/4', ['1/2', '1/4', '2/4', '1/8'], 2],
        ['איזה שבר שווה לחלק הצבוע, 4/8?', '1/2', ['1/4', '3/4', '1/2', '1/8'], 4]],
      ['s4', 'compare', 2, 1,
        ['איזה שבר גדול יותר: 1/4 או 1/8?', '1/4', ['1/8', '1/4', '1/2', '1'], null],
        ['איזה שבר גדול יותר: 1/2 או 1/4?', '1/2', ['1/4', '1/2', '1/8', '1'], null]],
      ['s5', 'complete-whole', 2, 1,
        ['תיבה מלאה היא 1. השלימו: 1/4 + ? = 1', '3/4', ['1/4', '3/4', '1/2', '5/8'], 2],
        ['תיבה מלאה היא 1. השלימו: 1/8 + ? = 1', '7/8', ['3/4', '7/8', '1/8', '5/8'], 1]],
      ['s6', 'add', 3, 2,
        ['כמה יוצא: 1/4 + 1/8 = ?', '3/8', ['2/8', '3/8', '1/2', '5/8'], null],
        ['כמה יוצא: 1/2 + 1/8 = ?', '5/8', ['3/8', '5/8', '3/4', '2/8'], null]],
      ['s7', 'part-of-quantity', 2, 1,
        ['בתיבה יש 8 שמיניות. כמה שמיניות הן 1/4 מהתיבה?', '2', ['1', '2', '4', '8'], null],
        ['בתיבה יש 8 שמיניות. כמה שמיניות הן 1/2 מהתיבה?', '4', ['2', '3', '4', '8'], null]],
      // Step 7 of §10 R4: the same fraction in a new context, with no sound
      // and no colour that hints at the answer.
      ['s8', 'transfer-no-music', 3, 2,
        ['עוגה חולקה ל־8 חלקים שווים ונאכלו 3 חלקים. איזה חלק מהעוגה נאכל?', '3/8', ['3/8', '5/8', '1/3', '3/4'], null],
        ['סרט חולק ל־8 חלקים שווים ונלקחו 5 חלקים. איזה חלק מהסרט נלקח?', '5/8', ['5/8', '3/8', '1/5', '5/4'], null]],
    ],
  };

  function own(map, key) {
    return Object.prototype.hasOwnProperty.call(map, String(key)) ? map[String(key)] : null;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function unitIds() {
    return Object.keys(UNITS);
  }

  function unitById(id) {
    return own(UNITS, id);
  }

  function formFor(phase) {
    return own(FORM_OF, phase) || '';
  }

  function phaseLabel(phase) {
    return own(PHASE_HE, phase) || '';
  }

  // The kind string a check session is stored under. teacherStore keeps `kind`
  // verbatim, so "pre:frac4" needs no change there.
  function checkKind(unitId, phase) {
    const unit = unitById(unitId);
    return unit && formFor(phase) ? phase + ':' + unit.id : '';
  }

  function parseCheckKind(kind) {
    const m = /^(pre|post):([A-Za-z0-9_-]+)$/.exec(String(kind == null ? '' : kind));
    if (!m || !unitById(m[2])) return null;
    return { phase: m[1], unit: m[2] };
  }

  // Hebrew labels for the session journal, which prints KIND_HE[kind] || kind.
  function kindLabels() {
    const out = {};
    unitIds().forEach(function (id) {
      PHASES.forEach(function (phase) {
        out[checkKind(id, phase)] = phaseLabel(phase) + ' · ' + UNITS[id].title;
      });
    });
    return out;
  }

  function formItems(unitId, form) {
    const unit = unitById(unitId);
    const f = String(form == null ? '' : form).toUpperCase();
    if (!unit || (f !== 'A' && f !== 'B')) return [];
    const at = f === 'A' ? 4 : 5;
    return (own(SLOTS, unit.id) || []).map(function (row) {
      const d = row[at];
      return {
        id: unit.id + ':' + row[0] + ':' + f,
        unit: unit.id,
        slot: row[0],
        shape: row[1],
        level: row[2],
        steps: row[3],
        form: f,
        skill: unit.skill,
        prompt: d[0],
        answer: d[1],
        choices: d[2].slice(),
        eighths: d[3] == null ? null : d[3],
      };
    });
  }

  function itemsForPhase(unitId, phase) {
    return formItems(unitId, formFor(phase));
  }

  // What "identical difficulty" means here, in one object the test can compare.
  function difficultyProfile(items) {
    const list = Array.isArray(items) ? items : [];
    const byLevel = { 1: 0, 2: 0, 3: 0 };
    list.forEach(function (it) {
      if (own(byLevel, it.level) != null) byLevel[it.level] += 1;
    });
    return {
      total: list.length,
      byLevel: byLevel,
      levelSum: list.reduce(function (a, it) { return a + Number(it.level || 0); }, 0),
      stepSum: list.reduce(function (a, it) { return a + Number(it.steps || 0); }, 0),
      signature: list.map(function (it) {
        return [it.slot, it.shape, it.level, it.steps, (it.choices || []).length].join('|');
      }),
    };
  }

  function balanceProblems(a, b) {
    const left = Array.isArray(a) ? a : [];
    const right = Array.isArray(b) ? b : [];
    const problems = [];
    if (left.length < 6 || left.length > 8) problems.push('ביחידה צריכים להיות 6–8 פריטים בכל טופס');
    if (left.length !== right.length) problems.push('לשני הטפסים אין אותו מספר פריטים');
    const sigA = difficultyProfile(left).signature;
    const sigB = difficultyProfile(right).signature;
    left.forEach(function (it, i) {
      const other = right[i];
      const slot = 'סלוט ' + it.slot + ': ';
      if (!other) return;
      if (sigA[i] !== sigB[i]) problems.push(slot + 'רמת הקושי אינה זהה בין הטפסים');
      if (it.prompt === other.prompt) problems.push(slot + 'אותו פריט בשני הטפסים');
      if ((it.choices || []).indexOf(it.answer) === -1) problems.push(slot + 'התשובה בטופס א׳ אינה בין האפשרויות');
      if ((other.choices || []).indexOf(other.answer) === -1) problems.push(slot + 'התשובה בטופס ב׳ אינה בין האפשרויות');
    });
    return problems;
  }

  function formsBalanced(unitId) {
    const problems = unitById(unitId)
      ? balanceProblems(formItems(unitId, 'A'), formItems(unitId, 'B'))
      : ['אין יחידה כזו'];
    return { ok: problems.length === 0, problems: problems };
  }

  // An equivalent fraction is a right answer: 2/8 and 1/4 are the same length.
  // Named for the check, not `isCorrect`: core.js and adaptive.js both put an
  // `isCorrect` on the page already, and core.js loads last.
  function checkItemCorrect(item, given) {
    if (!item) return false;
    const want = String(item.answer == null ? '' : item.answer).trim();
    const got = String(given == null ? '' : given).trim();
    if (!want || !got) return false;
    if (want === got) return true;
    if (typeof barApi.sameFraction === 'function' && want.indexOf('/') > 0 && got.indexOf('/') > 0) {
      return barApi.sameFraction(want, got);
    }
    const wn = Number(want);
    const gn = Number(got);
    return Number.isFinite(wn) && Number.isFinite(gn) && wn === gn;
  }

  function sessionScore(session) {
    const items = (session && Array.isArray(session.items))
      ? session.items.filter(function (it) { return it && typeof it === 'object'; })
      : [];
    return {
      total: items.length,
      correct: items.filter(function (it) { return !!it.correct; }).length,
      at: session && session.started != null ? session.started : null,
    };
  }

  // A teacher who restarts a check mid-way leaves a short session behind, so
  // the newest run of each phase is the one the report reads.
  function latestCheck(student, unitId, phase) {
    const want = checkKind(unitId, phase);
    let best = null;
    if (!want) return null;
    ((student && student.sessions) || []).forEach(function (s) {
      if (!s || typeof s !== 'object' || s.kind !== want) return;
      if (!best || Number(s.started || 0) >= Number(best.started || 0)) best = s;
    });
    return best;
  }

  function studentPrePost(student, unitId) {
    const pre = latestCheck(student, unitId, 'pre');
    const post = latestCheck(student, unitId, 'post');
    const p = pre ? sessionScore(pre) : null;
    const q = post ? sessionScore(post) : null;
    const both = !!(p && q && p.total && q.total);
    return {
      name: student && student.name ? String(student.name) : '',
      pre: p,
      post: q,
      both: both,
      delta: both ? (q.correct / q.total) - (p.correct / p.total) : null,
    };
  }

  // Same rule as teacherStore.loadRoster: a row that is not a plain object
  // holds no sessions, and a prototype key is never a student.
  function studentRows(source) {
    if (Array.isArray(source)) {
      return source.filter(function (s) { return s && typeof s === 'object' && !Array.isArray(s); });
    }
    const map = source && typeof source === 'object' && source.students;
    if (!map || typeof map !== 'object') return [];
    return Object.keys(map)
      .filter(function (k) { return !(k in Object.prototype); })
      .map(function (k) { return map[k]; })
      .filter(function (s) { return s && typeof s === 'object' && !Array.isArray(s); });
  }

  function classPrePost(source, unitId) {
    const unit = unitById(unitId);
    const rows = studentRows(source)
      .map(function (st) { return studentPrePost(st, unitId); })
      .filter(function (r) { return r.pre || r.post; })
      .sort(function (a, b) { return a.name.localeCompare(b.name, 'he'); });
    const both = rows.filter(function (r) { return r.both; });
    function sum(key, field) {
      return both.reduce(function (a, r) { return a + (r[key] ? r[key][field] : 0); }, 0);
    }
    const pre = { correct: sum('pre', 'correct'), total: sum('pre', 'total') };
    const post = { correct: sum('post', 'correct'), total: sum('post', 'total') };
    return {
      unit: unit ? unit.id : '',
      title: unit ? unit.title : '',
      grade: unit ? unit.grade : '',
      students: rows,
      n: both.length,
      pre: pre,
      post: post,
      delta: (pre.total && post.total) ? (post.correct / post.total) - (pre.correct / pre.total) : null,
      disclaimer: DISCLAIMER,
    };
  }

  function ltr(text) {
    return '<bdi dir="ltr">' + escapeHtml(text) + '</bdi>';
  }

  function scoreCell(score) {
    return score && score.total ? ltr(score.correct + '/' + score.total) : '—';
  }

  function pctCell(score) {
    return score && score.total ? ltr(Math.round(100 * score.correct / score.total) + '%') : '—';
  }

  function deltaCell(delta) {
    if (delta == null || !Number.isFinite(Number(delta))) return '—';
    const v = Math.round(Number(delta) * 100);
    return ltr((v > 0 ? '+' : '') + v + '%');
  }

  // Four narrow columns so the table still reads at 360px without a sideways
  // scroll, and `n` plus the "not a controlled study" line are always shown.
  function renderPrePostHtml(report) {
    const r = report && typeof report === 'object' ? report : classPrePost(null, '');
    const n = Number(r.n) || 0;
    const rows = (r.students || []).map(function (s) {
      return '<tr><td>' + escapeHtml(s.name) + '</td>'
        + '<td>' + scoreCell(s.pre) + '</td>'
        + '<td>' + scoreCell(s.post) + '</td>'
        + '<td>' + deltaCell(s.delta) + '</td></tr>';
    }).join('');
    return '<div class="pp-report">'
      + '<p class="pp-kicker">' + (r.title ? escapeHtml(r.title) + ' · ' : '')
      + 'n = ' + ltr(n) + ' תלמידים עם שתי הבדיקות בטאבלט הזה</p>'
      + '<div class="session">'
      + '<div class="stat"><strong>' + pctCell(r.pre) + '</strong>לפני · כיתה</div>'
      + '<div class="stat"><strong>' + pctCell(r.post) + '</strong>אחרי · כיתה</div>'
      + '<div class="stat"><strong>' + deltaCell(r.delta) + '</strong>שינוי בנקודות אחוז</div>'
      + '<div class="stat"><strong>' + ltr(n) + '</strong>n</div>'
      + '</div>'
      + (rows
        ? '<table class="report-table"><caption class="sr-only">לפני ואחרי לכל תלמיד/ה בטאבלט הזה</caption>'
          + '<thead><tr><th scope="col">שם</th><th scope="col">לפני</th><th scope="col">אחרי</th><th scope="col">שינוי</th></tr></thead>'
          + '<tbody>' + rows + '</tbody></table>'
        : '<p class="note">עוד לא נרשמה בדיקה ביחידה הזו בטאבלט הזה.</p>')
      + '<p class="sheet-note">' + escapeHtml(r.disclaimer || DISCLAIMER) + '</p>'
      + '</div>';
  }

  // A silent, non-interactive eighths bar for the item that needs a picture.
  // bar44.renderBar44Html prints "מלא: 1/2 מהתיבה" under its bar, which is the
  // answer to the first check item, and its cells are 44px tap targets that
  // overflow a 360px phone. These segments are not targets, so they shrink.
  function renderCheckBarHtml(eighths) {
    // An item with no picture passes eighths === null, and Number(null) is 0,
    // so an empty bar would otherwise be drawn for every text-only item.
    if (eighths == null || eighths === '') return '';
    const n = Math.round(Number(eighths));
    if (!Number.isFinite(n) || n < 0 || n > 8) return '';
    let cells = '';
    for (let i = 0; i < 8; i++) cells += '<span class="pp-cell' + (i < n ? ' on' : '') + '"></span>';
    return '<div class="pp-bar" dir="ltr" role="img"'
      + ' aria-label="תיבה של 4/4 מחולקת ל־8 שמיניות, ' + n + ' מהן צבועות">' + cells + '</div>';
  }

  return {
    PHASES, DISCLAIMER,
    unitIds, unitById, formFor, phaseLabel, checkKind, parseCheckKind, kindLabels,
    formItems, itemsForPhase, difficultyProfile, balanceProblems, formsBalanced,
    checkItemCorrect, sessionScore, latestCheck, studentPrePost, studentRows, classPrePost,
    renderPrePostHtml, renderCheckBarHtml,
  };
});
