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
  const BIDI = (typeof module === 'object' && module.exports)
    ? require('./mathBidi')
    : (typeof globalThis !== 'undefined' ? globalThis : {});
  const DATA_WORLDS = (typeof module === 'object' && module.exports)
    ? (function () { try { return require('./music/dataWorlds'); } catch (_e) { return null; } })()
    : (typeof globalThis !== 'undefined' ? (globalThis.MM_DATA_WORLDS || null) : null);

  function clampCount(n) {
    const v = Math.round(Number(n));
    if (!Number.isFinite(v)) return 4;
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
    return String(s == null ? '' : s).replace(/[&<>"'©®™]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '©': '&copy;', '®': '&reg;', '™': '&trade;' })[c];
    });
  }

  function poolFor(opts) {
    const pack = (opts && opts.pack) || 'class';
    const grade = opts && opts.grade;
    if (pack === 'diag') return BANKS.diagnosticItems(grade);
    if (pack === 'practice') return BANKS.practiceItems(opts.skills, grade);
    if (pack === 'grade' && grade) return BANKS.itemsForGrade(grade);
    if (pack === 'gapTargeted' || pack === 'gaps' || pack === 'dataTimeGaps' || pack === 'classGaps') {
      return BANKS.gapTargetedItems(opts);
    }
    return BANKS.classItems();
  }

  function buildWorksheet(opts) {
    const o = opts || {};
    const isGapPack = o.pack === 'gapTargeted' || o.pack === 'gaps' || o.pack === 'dataTimeGaps' || o.pack === 'classGaps';
    const count = o.pack === 'diag' ? Math.max(4, poolFor(o).length) : clampCount(o.count);
    const seed = (Number(o.seed) || 1) >>> 0;
    const rand = mulberry32(seed || 1);
    const pool = poolFor(o);

    // No PII for gap-targeted sheets: nickname and classCode only, no real names
    const isAnon = isGapPack || !!o.noPii || !!o.anonymous;
    const candidateNick = String(o.nickname || o.studentNick || '').trim();
    const nickname = candidateNick || (isAnon && o.studentName && /^[#א-תA-Za-z0-9_-]{1,16}$/.test(String(o.studentName).trim()) ? String(o.studentName).trim() : '');
    const studentName = isAnon ? '' : String(o.studentName || '').trim();
    const classCode = String(o.classCode || '').trim();

    if (!pool.length) {
      return {
        title: 'MelodyMath — דף עבודה',
        note: 'אין פריטים בחבילה שנבחרה.',
        pack: o.pack || 'class',
        seed: seed,
        withAnswers: !!o.withAnswers,
        studentName: studentName,
        nickname: nickname,
        classCode: classCode,
        noPii: isAnon,
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
          : isGapPack
            ? ('חבילה ממוקדת פערים — עולמות נתונים וזמן' + (o.grade ? ' · כיתה ' + o.grade + '׳' : ''))
            : 'מצב כיתה (א׳ · מנייה · חיבור · חיסור · ישר)';
    return {
      title: 'MelodyMath — דף עבודה',
      note: 'אותם תרגילים כמו במסך (' + packHe + '). זה דף עבודה, לא מבחן ולא הוכחת יעילות.',
      pack: o.pack || 'class',
      seed: seed,
      withAnswers: !!o.withAnswers,
      studentName: studentName,
      nickname: nickname,
      classCode: classCode,
      noPii: isAnon,
      items: items,
    };
  }

  function printableWidget(it) {
    if (it && it.chart && it.widget === 'pictogram') {
      const chart = it.chart;
      const key = Number(chart.key);
      const unit = Number.isFinite(key) && key > 0 ? key : 1;
      const icon = escapeHtml(chart.icon);
      const rows = (Array.isArray(chart.rows) ? chart.rows : []).map(function (row) {
        const count = Number(row.count);
        const copies = Number.isFinite(count) ? Math.max(0, Math.ceil(count / unit)) : 0;
        return '<div class="sheet-widget-row">' + escapeHtml(row.label) + ' ' + Array(copies + 1).join(icon) + '</div>';
      }).join('');
      return rows ? '<div class="sheet-widget sheet-pictogram">' + rows + '</div>' : '';
    }
    if (it && it.chart && it.widget === 'barchart') {
      const bars = (Array.isArray(it.chart.bars) ? it.chart.bars : []).map(function (bar) {
        return '<div class="sheet-widget-row">' + escapeHtml(bar.label) + ' ' + escapeHtml(bar.value) + '</div>';
      }).join('');
      return bars ? '<div class="sheet-widget sheet-barchart">' + bars + '</div>' : '';
    }
    if (it && it.ruler) {
      const length = Number(it.ruler.length);
      const copies = Number.isFinite(length) ? Math.max(0, Math.ceil(length)) : 0;
      return '<div class="sheet-widget sheet-ruler">' + Array(copies + 1).join('🟫') + '</div>';
    }
    if (it && (it.widget === 'clock' || it.clock)) {
      const h = Math.round(Number(it.clock && it.clock.hour)) || 12;
      // the clock face can show minutes too (2:50), so the print must not round it to 2:00
      const mi = Math.round(Number(it.clock && it.clock.minute)) || 0;
      const t = h + ':' + (mi < 10 ? '0' : '') + mi;
      return '<div class="sheet-widget sheet-clock" role="img" aria-label="שעון: שעה ' + t + '">'
        + '<div class="sheet-clock-box" style="display:inline-flex;align-items:center;gap:6px;border:1px solid #777;border-radius:8px;padding:4px 8px;font-size:0.9rem">'
        + '<span>🕒 שעה במחוגים: <b>' + t + '</b></span>'
        + '</div>'
        + '</div>';
    }
    const dw = DATA_WORLDS || (typeof globalThis !== 'undefined' ? globalThis.MM_DATA_WORLDS : null);
    if (dw && typeof dw.printableWidget === 'function') {
      const w = dw.printableWidget(it);
      if (w) return w;
    }
    return '';
  }

  function renderWorksheetHtml(sheet) {
    const s = sheet || buildWorksheet({});
    const nick = s.nickname || '';
    const displayName = s.noPii ? (nick ? 'כינוי: ' + nick : '') : (nick || s.studentName);
    const whoParts = [];
    if (displayName) whoParts.push(displayName);
    if (s.classCode) whoParts.push('קוד כיתה: ' + s.classCode);
    const who = whoParts.join(' · ');

    const nickFields = '<p class="sheet-nick-fields" dir="rtl">הכינוי שלי: '
      + (nick ? escapeHtml(nick) : '___________')
      + ' | קוד כיתה: '
      + (s.classCode ? escapeHtml(s.classCode) : '___________')
      + '</p>'
      + '<p class="sheet-nick-hint" dir="rtl">כתבו כינוי, לא שם אמיתי</p>';
    const head = '<p class="sheet-kicker">' + escapeHtml(s.title) + (who ? ' — ' + escapeHtml(who) : '') + '</p>'
      + nickFields
      + '<p class="sheet-note">' + escapeHtml(s.note) + '</p>';
    const blanks = s.items.map(function (it, i) {
      return '<div class="sheet-item"><span class="n">' + (i + 1) + '.</span> '
        + '<span class="tag">' + escapeHtml(it.he || it.skill || '') + '</span> '
        + '<p class="prompt">' + BIDI.mathHtml(it.prompt) + '</p>'
        + printableWidget(it)
        + '<div class="sheet-blank">תשובה: ________________</div></div>';
    }).join('');
    let html = '<div class="sheet-page" dir="rtl">' + head + '<div class="sheet-grid">' + blanks + '</div></div>';
    if (s.withAnswers) {
      const key = s.items.map(function (it, i) {
        return '<li>' + (i + 1) + '. ' + BIDI.mathHtml(String(it.answer))
          + (it.hint ? ' <span class="sheet-hint">(' + BIDI.mathHtml(it.hint) + ')</span>' : '')
          + '</li>';
      }).join('');
      html += '<div class="sheet-key"><h3>מחוון למורה — לא לחלק לתלמידים</h3><ol>' + key + '</ol></div>';
    }
    return html;
  }

  function buildGapTargetedWorksheet(opts) {
    const o = Object.assign({}, opts || {}, { pack: 'gapTargeted' });
    return buildWorksheet(o);
  }

  return {
    clampCount: clampCount,
    mulberry32: mulberry32,
    shuffle: shuffle,
    escapeHtml: escapeHtml,
    buildWorksheet: buildWorksheet,
    buildGapTargetedWorksheet: buildGapTargetedWorksheet,
    printableWidget: printableWidget,
    renderWorksheetHtml: renderWorksheetHtml,
  };
});
