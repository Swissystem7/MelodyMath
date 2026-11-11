// MelodyMath — length in non-standard units then cm, and a whole-hour clock
// face (כיתה א׳–ב׳, יחידת מדידה), plus the unit-change, area and perimeter
// facts the ב׳–ד׳ measurement items are checked against. Display widgets: the
// child reads the picture and types the answer in the normal answer box, same
// pattern as numberLine and bar44.
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

  // opts.hideRead (the practice widget, bindRuler): the printed length is the
  // answer of a "read the ruler" item, so it waits in data-reveal until
  // index.html's revealWidget runs after the child answers, and the aria-label
  // does not name it either. Without opts the full read-out is kept (answer
  // keys and older callers).
  function renderRulerHtml(ruler, opts) {
    const R = normalizeRuler(ruler);
    const hide = !!(opts && opts.hideRead);
    const label = escapeHtml(R.label);
    const cells = [];
    for (let i = 0; i < R.length; i++) {
      cells.push('<span class="ruler-cell" aria-hidden="true">' + (R.unit === 'cm' ? '▮' : '🟫') + '</span>');
    }
    const read = R.length + ' ' + label;
    return '<div class="ruler" dir="ltr" role="img" aria-label="' + (hide ? 'עצם על סרגל — ספרו את היחידות' : 'עצם שאורכו ' + read) + '">'
      + '<div class="ruler-track">' + cells.join('') + '</div>'
      + (hide ? '<p class="ruler-read" data-reveal="' + read + '">? ' + label + '</p>' : '<p class="ruler-read">' + read + '</p>')
      + '</div>';
  }

  function bindRuler(root, ruler) {
    if (!root) return null;
    root.innerHTML = renderRulerHtml(ruler, { hideRead: true });
    return {};
  }

  // `minutes` (MM-738, grade ג׳): 0-59, default 0, so whole-hour items of
  // grades א׳-ב׳ draw exactly as before.
  function normalizeClock(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    let hour = Math.round(Number(src.hour));
    if (!Number.isFinite(hour) || hour < 1 || hour > 12) hour = 12;
    let minutes = Math.round(Number(src.minutes));
    if (!Number.isFinite(minutes) || minutes < 0 || minutes > 59) minutes = 0;
    return { hour: hour, minutes: minutes };
  }

  // Hour hand: 30° per hour plus 0.5° per minute (it creeps toward the next
  // hour). Minute hand: 6° per minute; at a whole hour it points at 12 (0°).
  function clockHandAngle(hour, minutes) {
    return (hour % 12) * 30 + (Number(minutes) || 0) / 2;
  }
  function minuteHandAngle(minutes) {
    return (Number(minutes) || 0) * 6;
  }
  function clockText(C) {
    return C.hour + ':' + (C.minutes < 10 ? '0' : '') + C.minutes;
  }

  // opts.hideRead (the practice widget, bindClock): the printed time is the
  // answer of a "read the clock" item, so it waits in data-reveal until
  // revealWidget runs, and the aria-label does not name it.
  function renderClockHtml(clock, opts) {
    const C = normalizeClock(clock);
    const hide = !!(opts && opts.hideRead);
    const angle = clockHandAngle(C.hour, C.minutes);
    const minAngle = minuteHandAngle(C.minutes);
    const text = clockText(C);
    const numbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (n) {
      const a = (n % 12) * 30;
      return '<span class="clock-num" style="transform:rotate(' + a + 'deg) translateY(-42%) rotate(-' + a + 'deg)">' + n + '</span>';
    }).join('');
    return '<div class="clock" role="img" aria-label="' + (hide ? 'שעון מחוגים — קראו את השעה' : 'שעון מראה השעה ' + text) + '">'
      + '<div class="clock-face">' + numbers
      + '<div class="clock-hand clock-hour" style="transform:rotate(' + angle + 'deg)"></div>'
      + '<div class="clock-hand clock-min" style="transform:rotate(' + minAngle + 'deg)"></div>'
      + '<div class="clock-center"></div>'
      + '</div>'
      + (hide ? '<p class="clock-read" data-reveal="' + text + '">?</p>' : '<p class="clock-read">' + text + '</p>')
      + '</div>';
  }

  function bindClock(root, clock) {
    if (!root) return null;
    root.innerHTML = renderClockHtml(clock, { hideRead: true });
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

  // כיתה ב׳–ד׳: the unit changes a prompt names in Hebrew. Each unit is a
  // count of the smallest unit of its kind; length, weight, volume and time
  // never convert into each other, so a mixed pair is null, not a number.
  const UNIT_HE = {
    'מ״מ': ['len', 1], 'ס״מ': ['len', 10], 'מטר': ['len', 1000], 'מטרים': ['len', 1000], 'ק״מ': ['len', 1000000],
    'גרם': ['mass', 1], 'ק״ג': ['mass', 1000],
    'מ״ל': ['vol', 1], 'ליטר': ['vol', 1000],
    'דקות': ['time', 1], 'שעה': ['time', 60], 'שעות': ['time', 60],
    'יממה': ['time', 1440], 'יממות': ['time', 1440], 'ימים': ['time', 1440],
    'שבוע': ['time', 10080], 'שבועות': ['time', 10080],
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

  // A polygon, so three sides at least; a missing or non-positive side is a
  // broken prompt rather than a perimeter of zero.
  function perimeter(sides) {
    if (!Array.isArray(sides) || sides.length < 3) return null;
    const n = sides.map(Number);
    if (n.some(function (x) { return !(x > 0); })) return null;
    return n.reduce(function (s, x) { return s + x; }, 0);
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
    minuteHandAngle: minuteHandAngle,
    renderClockHtml: renderClockHtml,
    bindClock: bindClock,
    convertUnits: convertUnits,
    rectArea: rectArea,
    perimeter: perimeter,
    escapeHtml: escapeHtml,
    clampInt: clampInt,
  };
});
