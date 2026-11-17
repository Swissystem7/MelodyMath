// MelodyMath — vertical (מאונך) column format for two-digit addition and
// subtraction (כיתה ב׳). Display only: the child still types the answer
// in the normal answer box, same pattern as numberLine and bar44.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // Imported items (banks.js keeps raw.vert as-is) may carry any number; a
  // huge one prints in exponent form (1e+21) and the column stops lining up,
  // so operands are capped. Six digits: grade ג׳ subtracts from 10,000 (#411)
  // and grade ד׳ works up to a million.
  const MAX_OPERAND = 999999;

  function decomposeMultiplication(a, b) {
    const na = Math.abs(Math.round(Number(a) || 0));
    const nb = Math.abs(Math.round(Number(b) || 0));
    const parts = [];
    const placeNames = ['אחדות', 'עשרות', 'מאות', 'אלפים', 'עשרות אלפים', 'מאות אלפים'];
    if (nb < 10) {
      const digits = String(na).split('').reverse().map(Number);
      digits.forEach(function (d, place) {
        if (d !== 0 || digits.length === 1) {
          const val = d * Math.pow(10, place);
          parts.push({
            digit: d,
            place: place,
            placeName: placeNames[place] || ('מקום ' + place),
            val: val,
            multiplier: nb,
            expr: val + ' × ' + nb,
            product: val * nb
          });
        }
      });
    } else {
      const digits = String(nb).split('').reverse().map(Number);
      digits.forEach(function (d, place) {
        if (d !== 0 || digits.length === 1) {
          const val = d * Math.pow(10, place);
          parts.push({
            digit: d,
            place: place,
            placeName: placeNames[place] || ('מקום ' + place),
            val: val,
            multiplier: na,
            expr: na + ' × ' + val,
            product: na * val
          });
        }
      });
    }
    return parts;
  }

  function explainMultiplicationError(given, a, b) {
    const g = Number(given);
    const na = Number(a) || 0;
    const nb = Number(b) || 0;
    const parts = decomposeMultiplication(na, nb);
    const total = na * nb;

    if (!Number.isFinite(g)) return 'יש להזין מספר כתשובה.';
    if (g === total) return 'נכון מאוד!';

    const onesPart = parts.find(function (p) { return p.place === 0; });
    if (onesPart && g === onesPart.product) {
      const otherParts = parts.filter(function (p) { return p.place !== 0; });
      const otherDesc = otherParts.map(function (p) { return p.expr + ' = ' + p.product; }).join(', ');
      return 'ולמה: התשובה ' + g + ' היא רק מכפלת האחדות (' + onesPart.expr + '). שכחתם להוסיף את המכפלה בעשרות (' + otherDesc + '). סה״כ: ' + total + '.';
    }

    const tensPart = parts.find(function (p) { return p.place === 1; });
    if (tensPart && g === tensPart.product) {
      const onesDesc = onesPart ? (onesPart.expr + ' = ' + onesPart.product) : '';
      return 'ולמה: התשובה ' + g + ' היא רק המכפלה בעשרות (' + tensPart.expr + '). שכחתם להוסיף את מכפלת האחדות (' + onesDesc + '). סה״כ: ' + total + '.';
    }

    if (nb < 10 && na >= 10) {
      const d0 = na % 10;
      const d1 = Math.floor(na / 10);
      const unshifted = (d0 * nb) + (d1 * nb);
      if (g === unshifted) {
        return 'ולמה: הספרה ' + d1 + ' ב-' + na + ' היא ' + d1 + ' עשרות (' + (d1 * 10) + ') ולא יחידות. ' + (d1 * 10) + ' × ' + nb + ' = ' + (d1 * 10 * nb) + ', ולכן ' + (d0 * nb) + ' + ' + (d1 * 10 * nb) + ' = ' + total + '.';
      }
    }

    if (g === na + nb) {
      return 'ולמה: חישבתם חיבור (' + na + ' + ' + nb + ' = ' + g + ') במקום כפל. לפי חוק הפילוג: כופלים בעשרות ובאחדות ואז מחברים: ' + total + '.';
    }

    return 'ולמה: לפי חוק הפילוג בכפל במאונך, מפרקים לעשרות ואחדות ומחברים את המכפלות החלקיות: '
      + parts.map(function (p) { return p.expr + ' = ' + p.product; }).join(' ו-') + ', סה״כ ' + total + '.';
  }

  function normalizeVertical(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    let a = Math.round(Number(src.a));
    let b = Math.round(Number(src.b));
    if (!Number.isFinite(a)) a = 0;
    if (!Number.isFinite(b)) b = 0;
    if (a < 0) a = 0;
    if (b < 0) b = 0;
    a = Math.min(MAX_OPERAND, a);
    b = Math.min(MAX_OPERAND, b);
    let op = '+';
    if (src.op === '-') op = '-';
    else if (src.op === '×' || src.op === '*' || src.op === 'x') op = '×';
    const out = { a: a, b: b, op: op };
    if (op === '×' || src.partials) {
      out.partials = decomposeMultiplication(a, b);
    }
    return out;
  }

  function padDigits(n, width) {
    const s = String(Math.abs(Math.round(Number(n))));
    if (s.length >= width) return s;
    return new Array(width - s.length + 1).join('\u00a0') + s;
  }

  function renderVerticalHtml(vert, opts) {
    const V = normalizeVertical(vert);
    const width = Math.max(String(V.a).length, String(V.b).length + 1);
    const opWord = V.op === '+' ? 'ועוד' : (V.op === '-' ? 'פחות' : 'כפול');
    let html = '<div class="vert' + (V.op === '×' ? ' vert-mult' : '') + '" dir="ltr" role="img" aria-label="חישוב מאונך: '
      + V.a + ' ' + opWord + ' ' + V.b + '">'
      + '<div class="vert-row vert-a">' + padDigits(V.a, width) + '</div>'
      + '<div class="vert-row vert-b"><span class="vert-op" aria-hidden="true">' + V.op + '</span>'
      + padDigits(V.b, width - 1) + '</div>'
      + '<div class="vert-line" aria-hidden="true"></div>';

    if (V.op === '×' && V.partials && V.partials.length) {
      const showAll = Boolean(opts && opts.revealed) || Boolean(vert && (vert.revealed || vert.showPartials));
      const pMax = Math.max.apply(null, [width].concat(V.partials.map(function (p) { return String(p.product).length; })).concat([String(V.a * V.b).length]));
      html += '<div class="vert-partials" role="group" aria-label="מכפלות חלקיות">';
      V.partials.forEach(function (part, idx) {
        html += '<div class="vert-row vert-partial-row' + (showAll ? ' revealed' : '') + '" data-part-index="' + idx + '" data-part-product="' + part.product + '" data-place="' + part.placeName + '">'
          + '<span class="vert-part-note" aria-hidden="true">' + part.expr + ' = </span>'
          + '<span class="vert-part-val">' + padDigits(part.product, pMax) + '</span>'
          + '</div>';
      });
      html += '</div>';
      if (showAll) {
        const total = V.a * V.b;
        html += '<div class="vert-line vert-total-line" aria-hidden="true"></div>'
          + '<div class="vert-row vert-total" aria-label="סה״כ: ' + total + '">' + padDigits(total, pMax) + '</div>';
      }
    }
    html += '</div>';
    return html;
  }

  function setContent(root, html) {
    if (!root) return;
    if (typeof document !== 'undefined' && typeof document.createRange === 'function') {
      const range = document.createRange();
      range.selectNodeContents(root);
      const frag = range.createContextualFragment(html);
      while (root.firstChild) root.removeChild(root.firstChild);
      root.appendChild(frag);
    } else {
      root['innerHTML'] = html;
    }
  }

  function bindVertical(root, vert, opts) {
    if (!root) return null;
    setContent(root, renderVerticalHtml(vert, opts));
    const V = normalizeVertical(vert);
    return {
      spec: V,
      partials: V.partials || [],
      reveal: function () {
        setContent(root, renderVerticalHtml(vert, Object.assign({}, opts, { revealed: true })));
      }
    };
  }

  normalizeVertical.decompose = decomposeMultiplication;
  normalizeVertical.explainError = explainMultiplicationError;
  renderVerticalHtml.explainError = explainMultiplicationError;
  bindVertical.decompose = decomposeMultiplication;

  // The grade-ב music activities (even/odd by ear, the drum+bass columns and
  // half-hour ↔ half note) live in grade2Music.js, which reuses the column
  // drawn here. This module stays display-only.
  return {
    normalizeVertical: normalizeVertical,
    renderVerticalHtml: renderVerticalHtml,
    bindVertical: bindVertical,
    MAX_OPERAND: MAX_OPERAND,
  };
});
