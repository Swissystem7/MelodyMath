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

  // ---- unit tables for the measurement bank (כיתות א׳–ד׳) ----
  // One row per family, every unit written as a count of the family's base
  // unit, so convert() stays a single rule instead of a pair per conversion.
  // כסף is here because the programme files it under מדידות, and אגורות are
  // its base unit. `year` is a plain non-leap year — the only one the bank
  // asks about; months are not a fixed length, so there is no month unit.
  const UNITS = {
    length: { mm: 1, cm: 10, m: 1000, km: 1000000 },
    mass: { g: 1, kg: 1000 },
    volume: { ml: 1, l: 1000 },
    time: { min: 1, hour: 60, day: 1440, week: 10080, year: 525600 },
    money: { agora: 1, shekel: 100 },
  };

  function familyOf(unit) {
    const names = Object.keys(UNITS);
    for (let i = 0; i < names.length; i++) {
      if (Object.prototype.hasOwnProperty.call(UNITS[names[i]], unit)) return names[i];
    }
    return null;
  }

  // null, never a number, when the units are unknown or belong to different
  // families: 3 ק״ג is not 3 ליטר, and a bank answer must not pretend it is.
  function convert(value, from, to) {
    const n = Number(value);
    if (!Number.isFinite(n)) return null;
    const family = familyOf(from);
    if (!family || familyOf(to) !== family) return null;
    return (n * UNITS[family][from]) / UNITS[family][to];
  }

  // coins: [[value, count], ...] in one unit; the total comes back in it.
  function coinsTotal(coins) {
    if (!Array.isArray(coins) || !coins.length) return null;
    let sum = 0;
    for (let i = 0; i < coins.length; i++) {
      const pair = Array.isArray(coins[i]) ? coins[i] : [];
      const value = Number(pair[0]);
      const count = Number(pair[1]);
      if (!Number.isFinite(value) || !Number.isFinite(count)) return null;
      if (value < 0 || count < 0) return null;
      sum += value * count;
    }
    return sum;
  }

  // Change is only change when the payment covers the price.
  function change(paid, cost) {
    const p = Number(paid);
    const c = Number(cost);
    if (!Number.isFinite(p) || !Number.isFinite(c) || c > p) return null;
    return p - c;
  }

  return {
    UNITS: UNITS,
    familyOf: familyOf,
    convert: convert,
    coinsTotal: coinsTotal,
    change: change,
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
