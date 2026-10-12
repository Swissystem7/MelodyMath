// MelodyMath — short pre/post checks per music unit (parallel forms, local only).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const PARALLEL_TAG = 'grade-d-frac-bar44-v1';
  const UNIT_ID = 'grade-d-fractions-bar44';

  function item(phase, formId, level, prompt, answer, hint, bar) {
    return {
      unitId: UNIT_ID,
      parallelForm: PARALLEL_TAG,
      formPhase: phase,
      formId: formId,
      level: level,
      widget: 'bar44',
      bar: bar || null,
      prompt: prompt,
      answer: answer,
      hint: hint,
      skill: 'שברים — תיבה 4/4',
    };
  }

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
      item('pre', 'pre-a', 3, 'שלושה רבעים בתיבה — כמה שמיניות זה?', 6, 'כל רבע = 2 שמיניות', { filled: 6 }),
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
      item('post', 'post-b', 2, 'חצי תיבה ועוד רבע — כמה שמיניות בסך הכל?', 6, '4 + 2 שמיניות', { filled: 6 }),
      item('post', 'post-b', 3, 'שני חצאי תיבה — כמה תיבות שלמות?', 1, '1/2 + 1/2 = 1', { filled: 8 }),
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

  function listMusicUnits() {
    return Object.keys(UNITS).map(function (k) {
      const u = UNITS[k];
      return { id: u.id, titleHe: u.titleHe, grade: u.grade, skill: u.skill, lessonId: u.lessonId };
    });
  }

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
    }).sort();
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if ((a[k] || 0) !== (b[k] || 0)) return false;
    }
    return true;
  }

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
    return { ok: true, n: pre.length, parallelForm: u.pre.parallelForm };
  }

  function scoreForm(form, answers) {
    const items = (form && form.items) || [];
    let correct = 0;
    items.forEach(function (it, idx) {
      const given = answers && answers[idx] != null ? answers[idx] : '';
      if (normalizeAnswer(given) === normalizeAnswer(it.answer)) correct += 1;
    });
    return { correct: correct, total: items.length };
  }

  function normalizeAnswer(v) {
    const s = String(v == null ? '' : v).trim().replace(/\s+/g, ' ');
    if (s === '½') return '1/2';
    if (s === '¼') return '1/4';
    if (s === '⅛') return '1/8';
    if (/^\d+\/\d+$/.test(s)) {
      const parts = s.split('/');
      const n = Number(parts[0]);
      const d = Number(parts[1]);
      if (d && Number.isFinite(n) && Number.isFinite(d)) return n + '/' + d;
    }
    const n = Number(s);
    if (Number.isFinite(n) && String(n) === s.replace(/^0+(\d)/, '$1')) return String(n);
    return s;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function pct(correct, total) {
    return total ? Math.round((100 * correct) / total) : 0;
  }

  function renderStudentUnitMeasureHtml(report) {
    const r = report || {};
    const pre = r.pre || { correct: 0, total: 0, n: 0 };
    const post = r.post || { correct: 0, total: 0, n: 0 };
    const preLine = pre.n
      ? '<bdi dir="ltr">' + pre.correct + '/' + pre.total + '</bdi> (' + pct(pre.correct, pre.total) + '%) · n=' + pre.n
      : '—';
    const postLine = post.n
      ? '<bdi dir="ltr">' + post.correct + '/' + post.total + '</bdi> (' + pct(post.correct, post.total) + '%) · n=' + post.n
      : '—';
    return '<section class="unit-measure-block" aria-labelledby="unitMeasureStudentHead">'
      + '<h3 id="unitMeasureStudentHead">' + escapeHtml(r.titleHe || 'בדיקה לפני־אחרי') + '</h3>'
      + '<div class="unit-measure-stats session">'
      + '<div class="stat"><strong>לפני</strong>' + preLine + '</div>'
      + '<div class="stat"><strong>אחרי</strong>' + postLine + '</div>'
      + '</div>'
      + '<p class="sheet-note unit-measure-note">' + escapeHtml(r.disclaimer || DISCLAIMER) + '</p>'
      + '</section>';
  }

  function renderClassUnitMeasureHtml(overview) {
    const o = overview || {};
    const rows = o.students || [];
    const body = rows.length
      ? rows.map(function (row) {
        const pre = row.pre && row.pre.n ? row.pre.correct + '/' + row.pre.total : '—';
        const post = row.post && row.post.n ? row.post.correct + '/' + row.post.total : '—';
        return '<tr><td>' + escapeHtml(row.name) + '</td>'
          + '<td><bdi dir="ltr">' + pre + '</bdi></td>'
          + '<td><bdi dir="ltr">' + post + '</bdi></td></tr>';
      }).join('')
      : '<tr><td colspan="3">אין עדיין תלמידים בקוד הכיתה.</td></tr>';
    const agg = o.classTotals || {};
    const aggPre = agg.preN
      ? 'ממוצע ' + pct(agg.preCorrect, agg.preTotal) + '% · n=' + agg.preN + ' תלמידים'
      : '—';
    const aggPost = agg.postN
      ? 'ממוצע ' + pct(agg.postCorrect, agg.postTotal) + '% · n=' + agg.postN + ' תלמידים'
      : '—';
    return '<section class="unit-measure-block" aria-labelledby="unitMeasureClassHead">'
      + '<h3 id="unitMeasureClassHead">' + escapeHtml(o.titleHe || '') + ' — כיתה</h3>'
      + '<div class="unit-measure-stats session">'
      + '<div class="stat"><strong>לפני (כיתה)</strong>' + escapeHtml(aggPre) + '</div>'
      + '<div class="stat"><strong>אחרי (כיתה)</strong>' + escapeHtml(aggPost) + '</div>'
      + '</div>'
      + '<table class="report-table unit-measure-table"><caption class="sr-only">לפני ואחרי לפי תלמיד</caption>'
      + '<thead><tr><th scope="col">שם</th><th scope="col">לפני</th><th scope="col">אחרי</th></tr></thead><tbody>'
      + body + '</tbody></table>'
      + '<p class="sheet-note unit-measure-note">' + escapeHtml(o.disclaimer || DISCLAIMER) + '</p>'
      + '</section>';
  }

  return {
    UNIT_ID,
    PARALLEL_TAG,
    DISCLAIMER,
    listMusicUnits,
    getUnit,
    getUnitForm,
    levelHistogram,
    parallelDifficultyMatch,
    validateUnitParallelForms,
    scoreForm,
    normalizeAnswer,
    renderStudentUnitMeasureHtml,
    renderClassUnitMeasureHtml,
  };
});
