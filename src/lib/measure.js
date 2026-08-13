// MelodyMath — length in non-standard units then cm, and a whole-hour clock
// face (כיתה א׳–ב׳, יחידת מדידה). Display widgets: the child reads the
// picture and types the answer in the normal answer box, same pattern as
// numberLine and bar44.
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

  function clampInt(n, min, max) {
    const v = Math.round(Number(n));
    if (!Number.isFinite(v)) return min;
    return Math.min(max, Math.max(min, v));
  }

  function normalizeRuler(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const unit = src.unit === 'cm' ? 'cm' : 'unit';
    let length = Math.round(Number(src.length));
    if (!Number.isFinite(length) || length < 1) length = 1;
    length = Math.min(20, length);
    return { unit: unit, length: length, label: src.label || (unit === 'cm' ? 'ס״מ' : 'יחידות') };
  }

  function renderRulerHtml(ruler) {
    const R = normalizeRuler(ruler);
    const cells = [];
    for (let i = 0; i < R.length; i++) {
      cells.push('<span class="ruler-cell" aria-hidden="true">' + (R.unit === 'cm' ? '▮' : '🟫') + '</span>');
    }
    return '<div class="ruler" dir="ltr" role="img" aria-label="עצם שאורכו ' + R.length + ' ' + R.label + '">'
      + '<div class="ruler-track">' + cells.join('') + '</div>'
      + '<p class="ruler-read">' + R.length + ' ' + R.label + '</p>'
      + '</div>';
  }

  function bindRuler(root, ruler) {
    if (!root) return null;
    root.innerHTML = renderRulerHtml(ruler);
    return {};
  }

  function normalizeClock(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    let hour = Math.round(Number(src.hour));
    if (!Number.isFinite(hour) || hour < 1 || hour > 12) hour = 12;
    return { hour: hour };
  }

  function clockHandAngle(hour) {
    // Whole hours only: minute hand always at 12 (0°). Hour hand at 30° per hour.
    return (hour % 12) * 30;
  }

  function renderClockHtml(clock) {
    const C = normalizeClock(clock);
    const angle = clockHandAngle(C.hour);
    const numbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (n) {
      const a = (n % 12) * 30;
      return '<span class="clock-num" style="transform:rotate(' + a + 'deg) translateY(-42%) rotate(-' + a + 'deg)">' + n + '</span>';
    }).join('');
    return '<div class="clock" role="img" aria-label="שעון מראה השעה ' + C.hour + ':00">'
      + '<div class="clock-face">' + numbers
      + '<div class="clock-hand clock-hour" style="transform:rotate(' + angle + 'deg)"></div>'
      + '<div class="clock-hand clock-min" style="transform:rotate(0deg)"></div>'
      + '<div class="clock-center"></div>'
      + '</div>'
      + '<p class="clock-read">' + C.hour + ':00</p>'
      + '</div>';
  }

  function bindClock(root, clock) {
    if (!root) return null;
    root.innerHTML = renderClockHtml(clock);
    return {};
  }

  return {
    normalizeRuler: normalizeRuler,
    renderRulerHtml: renderRulerHtml,
    bindRuler: bindRuler,
    normalizeClock: normalizeClock,
    clockHandAngle: clockHandAngle,
    renderClockHtml: renderClockHtml,
    bindClock: bindClock,
    escapeHtml: escapeHtml,
    clampInt: clampInt,
  };
});
