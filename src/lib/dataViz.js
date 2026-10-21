// MelodyMath — reading a pictogram, a bar chart, and a simple data table
// (כיתה א׳–ג׳, יחידת נתונים). Every widget here is read-only: the child
// reads the picture and types the answer in the normal answer box.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function normalizePictogram(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const key = Math.max(1, Math.round(Number(src.key)) || 1);
    // The icon is interpolated into every row, so keep it a plain non-empty
    // string here and escape it once in the renderer like the key line does.
    const rawIcon = typeof src.icon === 'string' || typeof src.icon === 'number' ? String(src.icon).trim() : '';
    const icon = rawIcon || '●';
    // A row that is not an object (null from a hand-edited spec, a bare
    // number) has no label or count to read; skip it instead of throwing.
    const rows = (Array.isArray(src.rows) ? src.rows : []).filter(isRow).map(function (r) {
      return { label: String(r.label == null ? '' : r.label), count: Math.max(0, Math.round(Number(r.count)) || 0) };
    });
    return { key: key, icon: icon, rows: rows };
  }

  function isRow(r) {
    return !!r && typeof r === 'object' && !Array.isArray(r);
  }

  function renderPictogramHtml(spec) {
    const P = normalizePictogram(spec);
    const icon = escapeHtml(P.icon);
    const rows = P.rows.map(function (r) {
      const symbols = Math.ceil(r.count / P.key);
      const icons = new Array(symbols).fill(icon).join(' ');
      return '<tr><th scope="row">' + escapeHtml(r.label) + '</th>'
        + '<td aria-label="' + r.count + '">' + icons + '</td></tr>';
    }).join('');
    return '<div class="pictogram" role="img" aria-label="פיקטוגרם, כל סמל שווה ' + P.key + '">'
      + '<p class="pictogram-key">כל ' + escapeHtml(P.icon) + ' = ' + P.key + '</p>'
      + '<table class="pictogram-table"><caption class="sr-only">פיקטוגרם</caption><tbody>' + rows + '</tbody></table>'
      + '</div>';
  }

  function normalizeBars(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const bars = (Array.isArray(src.bars) ? src.bars : []).filter(isRow).map(function (b) {
      return { label: String(b.label == null ? '' : b.label), value: Math.max(0, Math.round(Number(b.value)) || 0) };
    });
    // The tallest bar fills the track; an explicit max only raises the scale.
    // A max below the tallest bar would draw that bar past the top of the track.
    const tallest = Math.max.apply(null, bars.map(function (b) { return b.value; }).concat([1]));
    const max = Math.max(tallest, Math.round(Number(src.max)) || 1);
    return { bars: bars, max: max };
  }

  function renderBarChartHtml(spec) {
    const B = normalizeBars(spec);
    const bars = B.bars.map(function (b) {
      const pct = Math.round((b.value / B.max) * 100);
      return '<div class="barchart-col">'
        + '<div class="barchart-bar" style="height:' + pct + '%" aria-hidden="true"></div>'
        + '<span class="barchart-val">' + b.value + '</span>'
        + '<span class="barchart-label">' + escapeHtml(b.label) + '</span>'
        + '</div>';
    }).join('');
    return '<div class="barchart" role="img" aria-label="דיאגרמת עמודות">'
      + '<div class="barchart-track">' + bars + '</div>'
      + '</div>';
  }

  // A pie of `parts` equal wedges (כיתה ד׳): each slice colours a run of
  // wedges, and the thin borders let the child count parts of the whole. The
  // legend names the slices only, so a "what part" question is still read
  // off the picture.
  const PIE_COLORS = ['#4e79a7', '#f28e2b', '#59a14f', '#e15759', '#b07aa1', '#76b7b2'];

  function normalizePie(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const slices = (Array.isArray(src.slices) ? src.slices : []).filter(isRow).map(function (s) {
      return { label: String(s.label == null ? '' : s.label), parts: Math.max(0, Math.round(Number(s.parts)) || 0) };
    }).filter(function (s) { return s.parts > 0; });
    const used = slices.reduce(function (n, s) { return n + s.parts; }, 0);
    const parts = Math.min(24, Math.max(used, 1, Math.round(Number(src.parts)) || 1));
    return { parts: parts, slices: slices };
  }

  function renderPieChartHtml(spec) {
    const P = normalizePie(spec);
    const pt = function (k) {
      const a = 2 * Math.PI * k / P.parts - Math.PI / 2;
      return (50 + 45 * Math.cos(a)).toFixed(2) + ' ' + (50 + 45 * Math.sin(a)).toFixed(2);
    };
    const fill = [];
    P.slices.forEach(function (s, i) { for (let j = 0; j < s.parts; j++) fill.push(PIE_COLORS[i % PIE_COLORS.length]); });
    let wedges = '';
    for (let k = 0; k < P.parts; k++) {
      const color = fill[k] || '#ffffff';
      wedges += P.parts === 1
        ? '<circle cx="50" cy="50" r="45" fill="' + color + '" stroke="#333"/>'
        : '<path d="M50 50 L' + pt(k) + ' A45 45 0 0 1 ' + pt(k + 1) + ' Z" fill="' + color + '" stroke="#333" stroke-width="0.8"/>';
    }
    const legend = P.slices.map(function (s, i) {
      return '<li><span aria-hidden="true" style="display:inline-block;width:1em;height:1em;background:'
        + PIE_COLORS[i % PIE_COLORS.length] + '"></span> ' + escapeHtml(s.label) + '</li>';
    }).join('');
    return '<div class="piechart" role="img" aria-label="דיאגרמת עוגה מחולקת ל־' + P.parts + ' חלקים שווים">'
      + '<svg viewBox="0 0 100 100" width="160" height="160" aria-hidden="true">' + wedges + '</svg>'
      + '<ul class="piechart-legend" style="list-style:none;padding:0">' + legend + '</ul>'
      + '</div>';
  }

  function normalizeTable(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const headers = (Array.isArray(src.headers) ? src.headers : []).map(String);
    const rows = (Array.isArray(src.rows) ? src.rows : []).map(function (r) {
      return (Array.isArray(r) ? r : []).map(String);
    });
    return { headers: headers, rows: rows };
  }

  function renderTableHtml(spec) {
    const T = normalizeTable(spec);
    const head = T.headers.map(function (h) { return '<th scope="col">' + escapeHtml(h) + '</th>'; }).join('');
    const body = T.rows.map(function (r) {
      return '<tr>' + r.map(function (c) { return '<td>' + escapeHtml(c) + '</td>'; }).join('') + '</tr>';
    }).join('');
    return '<table class="data-table"><caption class="sr-only">טבלת נתונים</caption>'
      + '<thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>';
  }

  return {
    normalizePictogram: normalizePictogram,
    renderPictogramHtml: renderPictogramHtml,
    normalizeBars: normalizeBars,
    renderBarChartHtml: renderBarChartHtml,
    normalizePie: normalizePie,
    renderPieChartHtml: renderPieChartHtml,
    normalizeTable: normalizeTable,
    renderTableHtml: renderTableHtml,
    escapeHtml: escapeHtml,
  };
});
