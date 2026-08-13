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
    const icon = src.icon || '●';
    const rows = (Array.isArray(src.rows) ? src.rows : []).map(function (r) {
      return { label: String(r.label || ''), count: Math.max(0, Math.round(Number(r.count)) || 0) };
    });
    return { key: key, icon: icon, rows: rows };
  }

  function renderPictogramHtml(spec) {
    const P = normalizePictogram(spec);
    const rows = P.rows.map(function (r) {
      const symbols = Math.ceil(r.count / P.key);
      const icons = new Array(symbols).fill(P.icon).join(' ');
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
    const bars = (Array.isArray(src.bars) ? src.bars : []).map(function (b) {
      return { label: String(b.label || ''), value: Math.max(0, Math.round(Number(b.value)) || 0) };
    });
    const max = Math.max(1, Math.round(Number(src.max)) || Math.max.apply(null, bars.map(function (b) { return b.value; }).concat([1])));
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
