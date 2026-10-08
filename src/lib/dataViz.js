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
    normalizeTable: normalizeTable,
    renderTableHtml: renderTableHtml,
    escapeHtml: escapeHtml,
  };
});
