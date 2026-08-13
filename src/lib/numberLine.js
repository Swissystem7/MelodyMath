// MelodyMath — interactive number line used as the foundation for
// addition and subtraction (כיתה א׳, ישר המספרים).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function clampInt(n, min, max) {
    const v = Math.round(Number(n));
    if (!Number.isFinite(v)) return min;
    return Math.min(max, Math.max(min, v));
  }

  function normalizeLine(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    let min = Math.round(Number(src.min));
    let max = Math.round(Number(src.max));
    if (!Number.isFinite(min)) min = 0;
    if (!Number.isFinite(max)) max = 20;
    if (max <= min) max = min + 10;
    const step = Math.max(1, Math.round(Number(src.step)) || 1);
    const start = src.start == null ? null : clampInt(src.start, min, max);
    const mark = src.mark == null ? null : clampInt(src.mark, min, max);
    return { min: min, max: max, step: step, start: start, mark: mark };
  }

  function ticksOf(line) {
    const L = normalizeLine(line);
    const ticks = [];
    for (let n = L.min; n <= L.max; n += L.step) ticks.push(n);
    if (ticks[ticks.length - 1] !== L.max) ticks.push(L.max);
    return ticks;
  }

  function jumpOnLine(start, delta, line) {
    const L = normalizeLine(line);
    const from = clampInt(start == null ? L.min : start, L.min, L.max);
    const d = Math.round(Number(delta));
    if (!Number.isFinite(d)) return from;
    return clampInt(from + d, L.min, L.max);
  }

  function placeOnLine(value, line) {
    const L = normalizeLine(line);
    return clampInt(value, L.min, L.max);
  }

  function percentOnLine(value, line) {
    const L = normalizeLine(line);
    const v = clampInt(value, L.min, L.max);
    if (L.max === L.min) return 0;
    return ((v - L.min) / (L.max - L.min)) * 100;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function renderNumberLineHtml(line, selected) {
    const L = normalizeLine(line);
    const ticks = ticksOf(L);
    const dense = ticks.length > 25;
    const sel = selected == null ? L.start : clampInt(selected, L.min, L.max);
    const marks = ticks.map(function (n) {
      const left = percentOnLine(n, L);
      const on = sel != null && n === sel;
      const show = !dense || n === L.min || n === L.max || n % 10 === 0 || on;
      return '<button type="button" class="nline-tick' + (on ? ' on' : '') + '"'
        + ' data-n="' + n + '" style="inset-inline-start:' + left + '%"'
        + ' aria-pressed="' + (on ? 'true' : 'false') + '"'
        + ' aria-label="מספר ' + n + '">'
        + (show ? '<span>' + n + '</span>' : '<span class="sr-only">' + n + '</span>')
        + '</button>';
    }).join('');
    const startNote = L.start != null
      ? '<p class="nline-start">מתחילים ב־<b>' + L.start + '</b></p>'
      : '';
    return '<div class="nline" dir="ltr" data-min="' + L.min + '" data-max="' + L.max + '">'
      + startNote
      + '<div class="nline-rail" role="group" aria-label="ישר מספרים מ־'
      + L.min + ' עד ' + L.max + '">' + marks + '</div>'
      + '<p class="nline-read" aria-live="polite">'
      + (sel == null ? 'בחרו מספר על הישר' : 'נבחר: ' + sel)
      + '</p></div>';
  }

  function bindNumberLine(root, line, onPick) {
    if (!root) return null;
    const L = normalizeLine(line);
    let current = L.start;
    function paint() {
      root.innerHTML = renderNumberLineHtml(L, current);
      root.querySelectorAll('.nline-tick').forEach(function (btn) {
        btn.addEventListener('click', function () {
          current = Number(btn.getAttribute('data-n'));
          paint();
          if (typeof onPick === 'function') onPick(current);
        });
      });
    }
    paint();
    return {
      value: function () { return current; },
      set: function (n) { current = placeOnLine(n, L); paint(); },
    };
  }

  return {
    normalizeLine: normalizeLine,
    ticksOf: ticksOf,
    jumpOnLine: jumpOnLine,
    placeOnLine: placeOnLine,
    percentOnLine: percentOnLine,
    renderNumberLineHtml: renderNumberLineHtml,
    bindNumberLine: bindNumberLine,
    escapeHtml: escapeHtml,
  };
});
