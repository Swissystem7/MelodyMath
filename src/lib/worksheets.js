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

  function rulerLength(ruler) {
    if (typeof ruler === 'number') return ruler;
    if (!ruler) return 0;
    if (typeof ruler === 'object') {
      if (typeof ruler.length === 'number') return ruler.length;
      if (typeof ruler.count === 'number') return ruler.count;
      if (typeof ruler.value === 'number') return ruler.value;
      if (typeof ruler.units === 'number') return ruler.units;
      if (typeof ruler.len === 'number') return ruler.len;
      const n = Number(ruler.length || ruler.count || ruler.value || ruler.units || ruler.len);
      if (Number.isFinite(n)) return n;
    }
    const n = Number(ruler);
    return Number.isFinite(n) ? n : 0;
  }

  function renderItemWidget(it) {
    if (!it) return '';
    const parts = [];
    if (it.chart) {
      const chart = it.chart;
      const widget = chart.widget || chart.type || (chart.icon ? 'pictogram' : (chart.bars ? 'barchart' : ''));
      if (widget === 'pictogram') {
        const rawRows = chart.rows || chart.data || chart.bars || chart.items || [];
        const rows = Array.isArray(rawRows)
          ? rawRows
          : (rawRows && typeof rawRows === 'object'
            ? Object.keys(rawRows).map(function (k) { return { label: k, count: rawRows[k] }; })
            : []);
        const key = Math.max(1, Number(chart.key) || 1);
        const lines = rows.map(function (r) {
          const label = Array.isArray(r) ? r[0] : (r.label || r.name || r.text || r.category || '');
          const countVal = Array.isArray(r) ? r[1] : (r.count != null ? r.count : (r.value != null ? r.value : r.val));
          const count = Number(countVal) || 0;
          const icon = (r && r.icon) || chart.icon || '🍎';
          const copies = Math.max(0, Math.ceil(count / key));
          const icons = icon.repeat(copies);
          const sep = label ? (String(label).endsWith(':') ? ' ' : ': ') : '';
          return '<div class="sheet-widget-row">' + (label ? escapeHtml(label) + sep : '') + icons + '</div>';
        });
        if (lines.length) {
          parts.push('<div class="sheet-widget sheet-pictogram">' + lines.join('') + '</div>');
        }
      } else if (widget === 'barchart' || widget === 'bar') {
        const rawBars = chart.bars || chart.rows || chart.data || chart.items || [];
        const bars = Array.isArray(rawBars)
          ? rawBars
          : (rawBars && typeof rawBars === 'object'
            ? Object.keys(rawBars).map(function (k) { return { label: k, value: rawBars[k] }; })
            : []);
        const lines = bars.map(function (b) {
          const label = Array.isArray(b) ? b[0] : (b.label || b.name || b.text || b.category || '');
          const val = Array.isArray(b) ? b[1] : (b.value != null ? b.value : (b.count != null ? b.count : b.val));
          const valStr = val != null ? escapeHtml(String(val)) : '';
          const sep = label ? (String(label).endsWith(':') ? ' ' : ': ') : '';
          return '<div class="sheet-widget-row">' + (label ? escapeHtml(label) + sep : '') + valStr + '</div>';
        });
        if (lines.length) {
          parts.push('<div class="sheet-widget sheet-barchart">' + lines.join('') + '</div>');
        }
      }
    }
    if (it.ruler) {
      const len = Math.max(0, Math.round(rulerLength(it.ruler)));
      if (len > 0) {
        parts.push('<div class="sheet-widget sheet-ruler"><div class="sheet-widget-row">' + '🟫'.repeat(len) + '</div></div>');
      }
    }
    return parts.join('');
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
        + renderItemWidget(it)
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
