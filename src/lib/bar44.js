// MelodyMath — a 4/4 bar as a fraction of a whole.
//
// This is the one narrow fraction claim the evidence supports: 1/2, 1/4
// and 1/8 against a musical bar. A numeric "half of 8 = 4" is not a fraction.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const UNIT_FRACTIONS = ['1/2', '1/4', '1/8'];
  const BAR_EIGHTHS = 8;

  function parseFraction(raw) {
    const s = String(raw == null ? '' : raw).trim().replace(/\s/g, '');
    if (s === '½') return { n: 1, d: 2 };
    if (s === '¼') return { n: 1, d: 4 };
    if (s === '⅛') return { n: 1, d: 8 };
    if (s === '1') return { n: 1, d: 1 };
    const m = /^(-?\d+)\/(-?\d+)$/.exec(s);
    if (!m) return null;
    const n = Number(m[1]);
    const d = Number(m[2]);
    if (!Number.isFinite(n) || !Number.isFinite(d) || d === 0) return null;
    return { n: n, d: d };
  }

  function formatFraction(n, d) {
    return n + '/' + d;
  }

  function eighthsOf(raw) {
    const f = parseFraction(raw);
    if (!f) return null;
    if (BAR_EIGHTHS % f.d !== 0) return null;
    return (BAR_EIGHTHS / f.d) * f.n;
  }

  function fractionFromEighths(count) {
    const c = Math.round(Number(count));
    if (!Number.isFinite(c) || c < 0 || c > BAR_EIGHTHS) return null;
    if (c === 0) return '0';
    if (c === 8) return '1';
    if (c === 4) return '1/2';
    if (c === 2) return '1/4';
    if (c === 1) return '1/8';
    if (c === 6) return '3/4';
    if (c === 3) return '3/8';
    if (c % 2 === 0) return formatFraction(c / 2, 4);
    return formatFraction(c, 8);
  }

  function sameFraction(a, b) {
    const pa = parseFraction(a);
    const pb = parseFraction(b);
    if (!pa || !pb) return false;
    return pa.n * pb.d === pb.n * pa.d;
  }

  function isUnitFraction(raw) {
    return UNIT_FRACTIONS.indexOf(String(raw == null ? '' : raw).trim()) !== -1
      || sameFraction(raw, '1/2') || sameFraction(raw, '1/4') || sameFraction(raw, '1/8');
  }

  function normalizeBar(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    let filled = Math.round(Number(src.filled));
    if (!Number.isFinite(filled)) {
      const fromFrac = eighthsOf(src.fraction);
      filled = fromFrac == null ? 0 : fromFrac;
    }
    filled = Math.min(BAR_EIGHTHS, Math.max(0, filled));
    return { filled: filled, total: BAR_EIGHTHS };
  }

  function renderBar44Html(bar, interactive) {
    const B = normalizeBar(bar);
    const cells = [];
    for (let i = 0; i < BAR_EIGHTHS; i++) {
      const on = i < B.filled;
      const beat = Math.floor(i / 2) + 1;
      cells.push(
        '<button type="button" class="bar44-cell' + (on ? ' on' : '') + '"'
        + (interactive ? '' : ' disabled')
        + ' data-i="' + i + '"'
        + ' aria-pressed="' + (on ? 'true' : 'false') + '"'
        + ' aria-label="שמינית ' + (i + 1) + ' · פעימה ' + beat + '">'
        + (i % 2 === 0 ? '<span class="bar44-beat">' + beat + '</span>' : '')
        + '</button>'
      );
    }
    const frac = fractionFromEighths(B.filled) || '0';
    return '<div class="bar44" dir="ltr" data-filled="' + B.filled + '">'
      + '<p class="bar44-label">תיבה 4/4 · 8 שמיניות</p>'
      + '<div class="bar44-track" role="group" aria-label="תיבה מוזיקלית 4/4">'
      + cells.join('') + '</div>'
      + '<p class="bar44-read" aria-live="polite">מלא: ' + frac + ' מהתיבה</p>'
      + '</div>';
  }

  function bindBar44(root, bar, onPick) {
    if (!root) return null;
    const B = normalizeBar(bar);
    let filled = B.filled;
    function paint() {
      root.innerHTML = renderBar44Html({ filled: filled }, true);
      root.querySelectorAll('.bar44-cell').forEach(function (btn) {
        btn.addEventListener('click', function () {
          filled = Number(btn.getAttribute('data-i')) + 1;
          paint();
          if (typeof onPick === 'function') onPick(fractionFromEighths(filled), filled);
        });
      });
    }
    paint();
    return {
      fraction: function () { return fractionFromEighths(filled); },
      eighths: function () { return filled; },
    };
  }

  return {
    UNIT_FRACTIONS: UNIT_FRACTIONS,
    BAR_EIGHTHS: BAR_EIGHTHS,
    parseFraction: parseFraction,
    formatFraction: formatFraction,
    eighthsOf: eighthsOf,
    fractionFromEighths: fractionFromEighths,
    sameFraction: sameFraction,
    isUnitFraction: isUnitFraction,
    normalizeBar: normalizeBar,
    renderBar44Html: renderBar44Html,
    bindBar44: bindBar44,
  };
});
