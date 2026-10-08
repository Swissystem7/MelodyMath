// MelodyMath — length in non-standard units then cm, and a whole-hour clock
// face (כיתה א׳–ב׳, יחידת מדידה); unit changes, area and perimeter facts
// that the ב׳–ד׳ measurement items are checked against. Display widgets: the child reads the
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
    // Imported items (banks.js keeps raw.ruler as-is) may carry a custom
    // label; keep it a plain non-empty string so the renderer can escape it.
    const custom = typeof src.label === 'string' || typeof src.label === 'number' ? String(src.label).trim() : '';
    const label = custom || (unit === 'cm' ? 'ס״מ' : 'יחידות');
    return { unit: unit, length: length, label: label };
  }

  function renderRulerHtml(ruler) {
    const R = normalizeRuler(ruler);
    const label = escapeHtml(R.label);
    const cells = [];
    for (let i = 0; i < R.length; i++) {
      cells.push('<span class="ruler-cell" aria-hidden="true">' + (R.unit === 'cm' ? '▮' : '🟫') + '</span>');
    }
    return '<div class="ruler" dir="ltr" role="img" aria-label="עצם שאורכו ' + R.length + ' ' + label + '">'
      + '<div class="ruler-track">' + cells.join('') + '</div>'
      + '<p class="ruler-read">' + R.length + ' ' + label + '</p>'
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

  // כיתה ב׳–ד׳: unit changes a prompt names in Hebrew. Each unit is a count
  // of the smallest unit of its kind; length, weight, volume and time never
  // convert into each other, so a mixed pair is null rather than a number.
  const UNIT_HE = {
    'מ״מ': ['len', 1], 'ס״מ': ['len', 10], 'מטר': ['len', 1000], 'מטרים': ['len', 1000], 'ק״מ': ['len', 1000000],
    'גרם': ['mass', 1], 'ק״ג': ['mass', 1000],
    'מ״ל': ['vol', 1], 'ליטר': ['vol', 1000],
    'דקות': ['time', 1], 'שעה': ['time', 60], 'שעות': ['time', 60], 'יממה': ['time', 1440], 'יממות': ['time', 1440],
    'ימים': ['time', 1440], 'שבוע': ['time', 10080], 'שבועות': ['time', 10080],
  };

  function convertUnits(value, from, to) {
    const a = UNIT_HE[from];
    const b = UNIT_HE[to];
    const v = Number(value);
    if (!a || !b || a[0] !== b[0] || !Number.isFinite(v)) return null;
    return v * a[1] / b[1];
  }

  function rectArea(length, width) {
    const l = Number(length);
    const w = Number(width);
    if (!(l > 0) || !(w > 0)) return null;
    return l * w;
  }

  function perimeter(sides) {
    if (!Array.isArray(sides) || sides.length < 3) return null;
    const n = sides.map(Number);
    if (n.some(function (x) { return !(x > 0); })) return null;
    return n.reduce(function (s, x) { return s + x; }, 0);
  }

  return {
    normalizeRuler: normalizeRuler,
    renderRulerHtml: renderRulerHtml,
    bindRuler: bindRuler,
    normalizeClock: normalizeClock,
    clockHandAngle: clockHandAngle,
    renderClockHtml: renderClockHtml,
    bindClock: bindClock,
    convertUnits: convertUnits,
    rectArea: rectArea,
    perimeter: perimeter,
    escapeHtml: escapeHtml,
    clampInt: clampInt,
  };
});
