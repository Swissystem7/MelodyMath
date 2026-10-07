// MelodyMath — vertical (מאונך) column format for two-digit addition and
// subtraction (כיתה ב׳). Display only: the child still types the answer
// in the normal answer box, same pattern as numberLine and bar44.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function normalizeVertical(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    let a = Math.round(Number(src.a));
    let b = Math.round(Number(src.b));
    if (!Number.isFinite(a)) a = 0;
    if (!Number.isFinite(b)) b = 0;
    if (a < 0) a = 0;
    if (b < 0) b = 0;
    const op = src.op === '-' ? '-' : '+';
    return { a: a, b: b, op: op };
  }

  function padDigits(n, width) {
    const s = String(Math.abs(Math.round(Number(n))));
    if (s.length >= width) return s;
    return new Array(width - s.length + 1).join('\u00a0') + s;
  }

  function renderVerticalHtml(vert) {
    const V = normalizeVertical(vert);
    const width = Math.max(String(V.a).length, String(V.b).length + 1);
    const opWord = V.op === '+' ? 'ועוד' : 'פחות';
    return '<div class="vert" dir="ltr" role="img" aria-label="חישוב מאונך: '
      + V.a + ' ' + opWord + ' ' + V.b + '">'
      + '<div class="vert-row vert-a">' + padDigits(V.a, width) + '</div>'
      + '<div class="vert-row vert-b"><span class="vert-op" aria-hidden="true">' + V.op + '</span>'
      + padDigits(V.b, width - 1) + '</div>'
      + '<div class="vert-line" aria-hidden="true"></div>'
      + '</div>';
  }

  function bindVertical(root, vert) {
    if (!root) return null;
    root.innerHTML = renderVerticalHtml(vert);
    return {};
  }

  function detectEvenOddBeat(rhythm) {
    // Assuming rhythm is an array of beat durations (in beats)
    const totalBeats = rhythm.reduce((sum, beat) => sum + beat, 0);
    return totalBeats % 2 === 0 ? 'even' : 'odd';
  }

  function mapVerticalToInstruments(vert) {
    // Map vertical operation to instruments: ones on drum, tens on bass
    const V = normalizeVertical(vert);
    const onesA = V.a % 10;
    const tensA = Math.floor(V.a / 10);
    const onesB = V.b % 10;
    const tensB = Math.floor(V.b / 10);
    
    if (V.op === '+') {
      return {
        drum: onesA + onesB,
        bass: tensA + tensB
      };
    } else {
      return {
        drum: onesA - onesB,
        bass: tensA - tensB
      };
    }
  }

  function mapHalfHourToNote(hour) {
    // Map half-hour to half note (assuming hour is in 24-hour format)
    const minutes = hour % 100;
    const hours = Math.floor(hour / 100);
    
    if (minutes === 30) {
      return 'half-note';
    }
    return 'full-note';
  }

  return {
    normalizeVertical: normalizeVertical,
    renderVerticalHtml: renderVerticalHtml,
    bindVertical: bindVertical,
    detectEvenOddBeat: detectEvenOddBeat,
    mapVerticalToInstruments: mapVerticalToInstruments,
    mapHalfHourToNote: mapHalfHourToNote
  };
});
