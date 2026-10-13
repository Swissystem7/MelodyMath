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
    if (c === 0) return '0/8';
    if (c === 8) return '1';
    if (c === 4) return '1/2';
    if (c === 2) return '1/4';
    if (c === 1) return '1/8';
    if (c === 6) return '3/4';
    if (c === 3) return '1/3';
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

  function isProperFraction(n, d) {
    if (d === undefined) {
      if (n && typeof n === 'object' && 'n' in n && 'd' in n) {
        d = n.d;
        n = n.n;
      } else {
        const f = parseFraction(n);
        if (!f) return false;
        n = f.n;
        d = f.d;
      }
    }
    const num = Number(n);
    const den = Number(d);
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return false;
    return Math.abs(num) < Math.abs(den);
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
        + (interactive === true ? '' : ' disabled')
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

  function fractionOfQuantity(fraction, total) {
    if (total == null || typeof total === 'boolean') return null;
    const f = parseFraction(fraction);
    const tot = Number(total);
    if (!f || !Number.isFinite(tot) || f.d === 0) return null;
    return (f.n / f.d) * tot;
  }

  function areFractionsEquivalent(a, b) {
    return sameFraction(a, b);
  }

  function getEquivalentFractions(raw) {
    const f = parseFraction(raw);
    if (!f) return [];
    const val = f.n / f.d;
    const candidates = ['1/8', '2/8', '3/8', '4/8', '5/8', '6/8', '7/8', '8/8', '1/4', '2/4', '3/4', '4/4', '1/2', '2/2', '1'];
    const res = [];
    candidates.forEach(function (c) {
      const pc = parseFraction(c);
      if (pc && Math.abs((pc.n / pc.d) - val) < 0.0001 && res.indexOf(c) === -1) {
        res.push(c);
      }
    });
    return res;
  }

  function compareFractions(a, b) {
    const pa = parseFraction(a);
    const pb = parseFraction(b);
    if (!pa || !pb) return null;
    const diff = (pa.n * pb.d) - (pb.n * pa.d);
    if (diff > 0) return 1;
    if (diff < 0) return -1;
    return 0;
  }

  function measureFill(notes, maxEighths) {
    const cap = Number.isFinite(maxEighths) ? Number(maxEighths) : BAR_EIGHTHS;
    const arr = Array.isArray(notes) ? notes : [];
    let filled = 0;
    arr.forEach(function (n) {
      const e = eighthsOf(n);
      if (e != null) filled += e;
    });
    return {
      filled: filled,
      remaining: Math.max(0, cap - filled),
      isFull: filled === cap,
      isOverflow: filled > cap,
      fraction: fractionFromEighths(filled),
    };
  }

  function retrograde(seq) {
    if (!Array.isArray(seq)) return [];
    return seq.slice().reverse();
  }

  function invertPitch(pitches, center) {
    if (!Array.isArray(pitches)) return [];
    const c = Number.isFinite(center) ? Number(center) : (pitches[0] || 0);
    return pitches.map(function (p) {
      const val = Number(p);
      if (!Number.isFinite(val)) return p;
      return c - (val - c);
    });
  }

  function isMeter34(eighths) {
    const val = Number(eighths);
    return Number.isFinite(val) && val === 6;
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
    isProperFraction: isProperFraction,
    normalizeBar: normalizeBar,
    renderBar44Html: renderBar44Html,
    bindBar44: bindBar44,
    fractionOfQuantity: fractionOfQuantity,
    areFractionsEquivalent: areFractionsEquivalent,
    getEquivalentFractions: getEquivalentFractions,
    compareFractions: compareFractions,
    measureFill: measureFill,
    retrograde: retrograde,
    invertPitch: invertPitch,
    isMeter34: isMeter34,
  };
});
