// MelodyMath — frequency lab items and feedback (plan §10).
//
// Goal of the unit (R1): multiply a quantity by a ratio p/q and say "how many
// times" one quantity is of another — 220 × 3/2 = 330, 440 ÷ 220 = 2.
//
// The same maths is asked five ways (R4/R10): a pre-check without sound, the
// lab checks (post), near transfer on another musical model (the string),
// far transfer in a new context with no sound and no colour cue, and a
// parallel far form for the 14-day retention check. Every miss gets a reason
// (R5): the common slips are dividing instead of multiplying, multiplying by
// p only, adding instead of multiplying, and a difference for "how many times".
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const UNIT_ID = 'freq-lab';

  function scale(id, base, p, q, textHe, unitHe) {
    return { id: id, kind: 'scale', base: base, p: p, q: q, answer: base * p / q, textHe: textHe, unitHe: unitHe || '' };
  }
  function times(id, a, b, textHe) {
    return { id: id, kind: 'times', a: a, b: b, answer: a / b, textHe: textHe, unitHe: '' };
  }

  const ITEMS = {
    pre: [
      scale('pre-1', 100, 3, 2, 'כמה זה פי 3/2 מ־100?'),
      times('pre-2', 300, 150, '300 הוא פי כמה מ־150?'),
    ],
    near: [
      scale('near-1', 300, 3, 2, 'מיתר נותן 300 Hz. מקצרים אותו ל־2/3 מאורכו, והתדר גדל פי 3/2. מה התדר החדש?', 'Hz'),
    ],
    far: [
      scale('far-1', 40, 3, 2, 'גלגל שיניים גדול מסתובב 40 פעמים בדקה. הגלגל הקטן מסתובב מהר פי 3/2. כמה פעמים בדקה מסתובב הקטן?', 'פעמים'),
      scale('far-2', 200, 3, 2, 'מתכון ל־4 אנשים צריך 200 גרם קמח. ל־6 אנשים צריך פי 3/2. כמה גרם?', 'גרם'),
      times('far-3', 90, 45, 'מכונית א׳ נסעה 90 ק״מ ומכונית ב׳ נסעה 45 ק״מ. מכונית א׳ נסעה פי כמה?'),
    ],
    retention: [
      scale('ret-1', 80, 3, 2, 'משאבה ממלאת 80 ליטר בשעה. משאבה חזקה ממלאת פי 3/2. כמה ליטר בשעה?', 'ליטר'),
      scale('ret-2', 30, 3, 2, 'ל־2 ילדים יש 30 עוגיות. ל־3 ילדים צריך פי 3/2. כמה עוגיות?', 'עוגיות'),
      times('ret-3', 100, 50, 'חבל אחד באורך 100 מטר והשני 50 מטר. הארוך הוא פי כמה?'),
    ],
  };

  function readNumber(raw) {
    const s = String(raw == null ? '' : raw).trim().replace(/\s/g, '').replace(',', '.');
    if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(s)) return NaN;
    return Number(s);
  }

  function near(a, b) {
    return Math.abs(a - b) < 0.01;
  }

  // Keep each expression left-to-right inside the Hebrew sentence (#93).
  function ltr(t) {
    return '⁦' + t + '⁩';
  }

  function fmt(x) {
    return String(Math.round(x * 100) / 100);
  }

  // Returns { ok, why }. `why` is Hebrew and always names the calculation.
  function explain(item, raw) {
    const v = readNumber(raw);
    if (!Number.isFinite(v)) return { ok: false, why: 'כתבו מספר, למשל 330 או 1.5.' };
    if (near(v, item.answer)) {
      const how = item.kind === 'scale'
        ? item.base + ' × ' + item.p + '/' + item.q + ' = ' + item.base + ' ÷ ' + item.q + ' × ' + item.p + ' = ' + fmt(item.answer)
        : item.a + ' ÷ ' + item.b + ' = ' + fmt(item.answer);
      return { ok: true, why: 'נכון: ' + ltr(how) };
    }
    if (item.kind === 'times') {
      if (near(v, item.a - item.b)) {
        return { ok: false, why: 'חישבתם הפרש: ' + ltr(item.a + ' − ' + item.b + ' = ' + fmt(v)) + '. "פי כמה" שואל כמה פעמים ' + item.b + ' נכנס ב־' + item.a + ': ' + ltr(item.a + ' ÷ ' + item.b) + '.' };
      }
      if (near(v, item.b / item.a)) {
        return { ok: false, why: 'חילקתם הפוך. הגדול חלקי הקטן: ' + ltr(item.a + ' ÷ ' + item.b) + '.' };
      }
      return { ok: false, why: 'פי כמה = הגדול ÷ הקטן: ' + ltr(item.a + ' ÷ ' + item.b) + '.' };
    }
    const b = item.base;
    const steps = ltr(b + ' ÷ ' + item.q + ' × ' + item.p);
    if (near(v, b * item.q / item.p)) {
      return { ok: false, why: 'חילקתם ב־' + item.p + '/' + item.q + ' במקום לכפול, ולכן יצא פחות מ־' + b + '. פי ' + item.p + '/' + item.q + ' זה ' + steps + '.' };
    }
    if (near(v, b * item.p)) {
      return { ok: false, why: 'כפלתם רק ב־' + item.p + '. צריך גם לחלק ב־' + item.q + ': ' + steps + '.' };
    }
    if (near(v, b * 2) && item.p / item.q !== 2) {
      return { ok: false, why: 'כפלתם ב־2. פי ' + item.p + '/' + item.q + ' זה פחות מפי 2: ' + steps + '.' };
    }
    if (near(v, b + item.p / item.q) || near(v, b + item.p) || near(v, b + item.q)) {
      return { ok: false, why: 'הוספתם במקום לכפול. "פי" אומר כפל: ' + steps + '.' };
    }
    return { ok: false, why: 'פי ' + item.p + '/' + item.q + ': קודם מחלקים ב־' + item.q + ' ואז כופלים ב־' + item.p + ': ' + steps + '.' };
  }

  function harmonicExplain(n, f, raw) {
    const v = readNumber(raw);
    if (Number.isFinite(v) && near(v, n * f)) return { ok: true, why: 'נכון: הצליל ה־' + n + ' הוא ' + ltr(n + ' × ' + f + ' = ' + n * f) + '.' };
    if (Number.isFinite(v) && (near(v, (n - 1) * f) || near(v, (n + 1) * f))) {
      return { ok: false, why: 'זה הצליל השכן. הצליל ה־' + n + ' בטור הוא ' + ltr(n + ' × ' + f) + '.' };
    }
    if (Number.isFinite(v) && near(v, f + n)) return { ok: false, why: 'הוספתם ' + n + '. בטור כופלים: ' + ltr(n + ' × ' + f) + '.' };
    return { ok: false, why: 'בטור ההרמוני הצליל ה־n הוא ' + ltr('n × f') + '. כאן: ' + ltr(n + ' × ' + f) + '.' };
  }

  return { UNIT_ID, ITEMS, readNumber, explain, harmonicExplain };
});
