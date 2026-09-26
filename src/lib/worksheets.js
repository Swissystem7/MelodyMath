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

  function renderWidgetHtml(it) {
    if (!it) return '';
    if (it.chart) {
      const ch = it.chart;
      const w = ch.widget || it.widget || ch.type || it.type || (ch.rows ? 'pictogram' : (ch.bars ? 'barchart' : ''));
      if (w === 'pictogram' || (!w && (ch.icon || it.icon))) {
        let rawRows = ch.rows || ch.data || ch.items || (Array.isArray(ch) ? ch : null);
        if (!rawRows && typeof ch === 'object') {
          rawRows = [];
          const reserved = { widget: 1, type: 1, icon: 1, key: 1, title: 1, prompt: 1 };
          for (const k in ch) {
            if (!reserved[k] && Object.prototype.hasOwnProperty.call(ch, k)) {
              rawRows.push({ label: k, count: ch[k] });
            }
          }
        }
        const rows = Array.isArray(rawRows) ? rawRows : Object.keys(rawRows || {}).map(function (k) {
          const v = rawRows[k];
          return (v && typeof v === 'object') ? Object.assign({ label: k }, v) : { label: k, count: v };
        });
        const icon = ch.icon || it.icon || '🍎';
        const key = Number(ch.key || it.key) || 1;
        const lines = rows.map(function (r) {
          const label = r.label != null ? r.label : (r.name != null ? r.name : '');
          const count = Number(r.count != null ? r.count : (r.value != null ? r.value : 0)) || 0;
          const rIcon = r.icon || icon;
          const copies = Math.ceil(count / key);
          let icons = '';
          for (let j = 0; j < copies; j++) icons += rIcon;
          return '<div class="widget-row">' + escapeHtml(label) + (label && icons ? ' ' : '') + icons + '</div>';
        }).join('');
        if (lines) return '<div class="sheet-widget">' + lines + '</div>';
      } else if (w === 'barchart' || (!w && ch.bars)) {
        let rawBars = ch.bars || ch.rows || ch.data || ch.items || (Array.isArray(ch) ? ch : null);
        if (!rawBars && typeof ch === 'object') {
          rawBars = [];
          const reserved = { widget: 1, type: 1, icon: 1, key: 1, title: 1, prompt: 1 };
          for (const k in ch) {
            if (!reserved[k] && Object.prototype.hasOwnProperty.call(ch, k)) {
              rawBars.push({ label: k, value: ch[k] });
            }
          }
        }
        const bars = Array.isArray(rawBars) ? rawBars : Object.keys(rawBars || {}).map(function (k) {
          const v = rawBars[k];
          return (v && typeof v === 'object') ? Object.assign({ label: k }, v) : { label: k, value: v };
        });
        const lines = bars.map(function (b) {
          const label = b.label != null ? b.label : (b.name != null ? b.name : '');
          const val = b.value != null ? b.value : (b.count != null ? b.count : '');
          return '<div class="widget-row">' + escapeHtml(label) + (label && val !== '' ? ' ' : '') + escapeHtml(val) + '</div>';
        }).join('');
        if (lines) return '<div class="sheet-widget">' + lines + '</div>';
      }
    } else if (it.ruler != null) {
      const len = typeof it.ruler === 'number'
        ? it.ruler
        : (it.ruler.length != null ? it.ruler.length : (it.ruler.value != null ? it.ruler.value : 0));
      let blocks = '';
      for (let j = 0; j < len; j++) blocks += '🟫';
      if (blocks) return '<div class="sheet-widget">' + blocks + '</div>';
    }
    return '';
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
        + renderWidgetHtml(it)
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
