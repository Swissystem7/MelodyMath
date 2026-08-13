// MelodyMath — printable sheets from the same bank the tablet uses.
//
// A 4-week trial on one tablet still leaves other kids waiting. Paper that
// matches the on-screen prompts is the fallback, not a second curriculum.
// No mastery language. The answer key is a second page the teacher can omit.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const BANKS = (typeof module === 'object' && module.exports)
    ? require('./banks')
    : (typeof globalThis !== 'undefined' ? globalThis : {});

  function clampCount(n) {
    const v = Math.round(Number(n));
    if (!Number.isFinite(v)) return 8;
    return Math.min(24, Math.max(4, v));
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function shuffle(list, rand) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function poolFor(opts) {
    const pack = (opts && opts.pack) || 'class';
    const grade = opts && opts.grade;
    if (pack === 'diag') return BANKS.diagnosticItems(grade);
    if (pack === 'practice') return BANKS.practiceItems(opts.skills, grade);
    if (pack === 'grade' && grade) return BANKS.itemsForGrade(grade);
    return BANKS.classItems();
  }

  function buildWorksheet(opts) {
    const o = opts || {};
    const count = o.pack === 'diag' ? Math.max(4, poolFor(o).length) : clampCount(o.count);
    const seed = (Number(o.seed) || 1) >>> 0;
    const rand = mulberry32(seed || 1);
    const pool = poolFor(o);
    if (!pool.length) {
      return {
        title: 'MelodyMath — דף עבודה',
        note: 'אין פריטים בחבילה שנבחרה.',
        pack: o.pack || 'class',
        seed: seed,
        withAnswers: !!o.withAnswers,
        studentName: String(o.studentName || '').trim(),
        classCode: String(o.classCode || '').trim(),
        items: [],
      };
    }
    const shuffled = shuffle(pool, rand);
    const items = [];
    for (let i = 0; i < count; i++) items.push(shuffled[i % shuffled.length]);
    const packHe = o.pack === 'diag'
      ? ('אבחון כיתה ' + (o.grade || 'א') + '׳')
      : o.pack === 'practice'
        ? 'תרגול אישי'
        : o.pack === 'grade'
          ? ('בנק כיתה ' + (o.grade || '') + '׳')
          : 'מצב כיתה (א׳ · מנייה · חיבור · חיסור · ישר)';
    return {
      title: 'MelodyMath — דף עבודה',
      note: 'אותם תרגילים כמו במסך (' + packHe + '). זה דף עבודה, לא מבחן ולא הוכחת יעילות.',
      pack: o.pack || 'class',
      seed: seed,
      withAnswers: !!o.withAnswers,
      studentName: String(o.studentName || '').trim(),
      classCode: String(o.classCode || '').trim(),
      items: items,
    };
  }

  function renderWorksheetHtml(sheet) {
    const s = sheet || buildWorksheet({});
    const who = [s.studentName, s.classCode].filter(Boolean).join(' · ');
    const head = '<p class="sheet-kicker">' + escapeHtml(s.title) + (who ? ' — ' + escapeHtml(who) : '') + '</p>'
      + '<p class="sheet-note">' + escapeHtml(s.note) + '</p>';
    const blanks = s.items.map(function (it, i) {
      return '<div class="sheet-item"><span class="n">' + (i + 1) + '.</span> '
        + '<span class="tag">' + escapeHtml(it.he || it.skill || '') + '</span> '
        + '<p class="prompt">' + escapeHtml(it.prompt) + '</p>'
        + '<div class="sheet-blank">תשובה: ________________</div></div>';
    }).join('');
    let html = '<div class="sheet-page">' + head + '<div class="sheet-grid">' + blanks + '</div></div>';
    if (s.withAnswers) {
      const key = s.items.map(function (it, i) {
        return '<li>' + (i + 1) + '. ' + escapeHtml(String(it.answer))
          + (it.hint ? ' <span class="sheet-hint">(' + escapeHtml(it.hint) + ')</span>' : '')
          + '</li>';
      }).join('');
      html += '<div class="sheet-key"><h3>מחוון למורה — לא לחלק לתלמידים</h3><ol>' + key + '</ol></div>';
    }
    return html;
  }

  return {
    clampCount: clampCount,
    mulberry32: mulberry32,
    shuffle: shuffle,
    escapeHtml: escapeHtml,
    buildWorksheet: buildWorksheet,
    renderWorksheetHtml: renderWorksheetHtml,
  };
});
