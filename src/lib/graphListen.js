// MelodyMath — listen to a sampled graph, in Hebrew, from the keyboard.
//
// This is the original asset: not "the sound of the function", a description
// of THIS sampling. Landmarks are sign-changes, extrema, gaps, and jumps.
// Nothing here claims a student will learn algebra by listening.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function fmt(n) {
    if (typeof n !== 'number' || !isFinite(n)) return null;
    const r = Math.round(n * 10) / 10;
    return Object.is(r, -0) ? 0 : r;
  }

  function sampleCurve(fn, xmin, xmax, n) {
    const steps = Math.max(4, Math.min(800, Math.round(Number(n) || 200)));
    const a = Number(xmin);
    const b = Number(xmax);
    if (typeof fn !== 'function' || !isFinite(a) || !isFinite(b) || a === b) return [];
    const out = [];
    for (let i = 0; i <= steps; i++) {
      const x = a + (b - a) * (i / steps);
      let y = NaN;
      try { y = fn(x); } catch (e) { y = NaN; }
      out.push({ i: i, x: x, y: typeof y === 'number' ? y : NaN });
    }
    return out;
  }

  function finiteOf(samples) {
    return (Array.isArray(samples) ? samples : []).filter(function (s) {
      return s && typeof s.y === 'number' && isFinite(s.y);
    });
  }

  function dedupeByX(list, minSep) {
    const sep = minSep > 0 ? minSep : 0.08;
    const out = [];
    list.forEach(function (item) {
      const last = out[out.length - 1];
      if (last && Math.abs(last.x - item.x) < sep && last.kind === item.kind) return;
      out.push(item);
    });
    return out;
  }

  function findRoots(samples, eps) {
    const e = typeof eps === 'number' ? eps : 1e-6;
    const list = Array.isArray(samples) ? samples : [];
    const roots = [];
    const minSep = list.length > 1 ? Math.abs(list[1].x - list[0].x) * 1.2 : 0.08;
    for (let i = 1; i < list.length; i++) {
      const a = list[i - 1];
      const b = list[i];
      if (!a || !b || !isFinite(a.y) || !isFinite(b.y)) continue;
      if (Math.abs(a.y) <= e) {
        if (!roots.length || Math.abs(roots[roots.length - 1].x - a.x) > minSep) {
          roots.push({ kind: 'root', x: a.x, y: 0 });
        }
        continue;
      }
      if (a.y * b.y < 0) {
        const t = a.y / (a.y - b.y);
        const x = a.x + t * (b.x - a.x);
        roots.push({ kind: 'root', x: x, y: 0 });
      } else if (i === list.length - 1 && Math.abs(b.y) <= e) {
        roots.push({ kind: 'root', x: b.x, y: 0 });
      }
    }
    return dedupeByX(roots, minSep);
  }

  function findExtrema(samples) {
    const list = Array.isArray(samples) ? samples : [];
    const ext = [];
    for (let i = 1; i < list.length - 1; i++) {
      const a = list[i - 1];
      const b = list[i];
      const c = list[i + 1];
      if (!isFinite(a.y) || !isFinite(b.y) || !isFinite(c.y)) continue;
      if (b.y > a.y && b.y > c.y) ext.push({ kind: 'max', x: b.x, y: b.y });
      if (b.y < a.y && b.y < c.y) ext.push({ kind: 'min', x: b.x, y: b.y });
    }
    return ext;
  }

  function findUndefinedSpans(samples) {
    const list = Array.isArray(samples) ? samples : [];
    const spans = [];
    let start = null;
    let startI = -1;
    for (let i = 0; i < list.length; i++) {
      const undef = !list[i] || !isFinite(list[i].y);
      if (undef && start == null) {
        start = list[i].x;
        startI = i;
      } else if (!undef && start != null) {
        spans.push({ kind: 'undefined', from: start, to: list[i - 1].x, i0: startI, i1: i - 1 });
        start = null;
      }
    }
    if (start != null && list.length) {
      spans.push({
        kind: 'undefined',
        from: start,
        to: list[list.length - 1].x,
        i0: startI,
        i1: list.length - 1,
      });
    }
    return spans;
  }

  function findAsymptotes(samples) {
    const list = Array.isArray(samples) ? samples : [];
    const ys = finiteOf(list).map(function (s) { return s.y; });
    const yRange = ys.length ? Math.max.apply(null, ys) - Math.min.apply(null, ys) : 0;
    const thresh = Math.max(8, yRange * 0.85);
    const marks = [];
    for (let i = 1; i < list.length; i++) {
      const a = list[i - 1];
      const b = list[i];
      if (isFinite(a.y) && isFinite(b.y) && Math.abs(b.y - a.y) > thresh) {
        marks.push({ kind: 'asymptote', x: (a.x + b.x) / 2, y: NaN });
      } else if (isFinite(a.y) && !isFinite(b.y) && Math.abs(a.y) > thresh * 0.4) {
        marks.push({ kind: 'asymptote', x: a.x, y: a.y });
      } else if (!isFinite(a.y) && isFinite(b.y) && Math.abs(b.y) > thresh * 0.4) {
        marks.push({ kind: 'asymptote', x: b.x, y: b.y });
      }
    }
    return dedupeByX(marks, 0.25);
  }

  function findYIntercept(samples) {
    const list = Array.isArray(samples) ? samples : [];
    for (let i = 1; i < list.length; i++) {
      const a = list[i - 1];
      const b = list[i];
      if (!isFinite(a.y) || !isFinite(b.y)) continue;
      if (a.x === 0) return { kind: 'y-intercept', x: 0, y: a.y };
      if (a.x < 0 && b.x >= 0) {
        const t = (0 - a.x) / (b.x - a.x);
        return { kind: 'y-intercept', x: 0, y: a.y + t * (b.y - a.y) };
      }
    }
    return null;
  }

  function trendOf(finite) {
    if (!finite || finite.length < 4) return 'flat';
    const first = finite[0].y;
    const last = finite[finite.length - 1].y;
    const mid = finite[Math.floor(finite.length / 2)].y;
    const ys = finite.map(function (s) { return s.y; });
    const lo = Math.min.apply(null, ys);
    const hi = Math.max.apply(null, ys);
    const span = Math.max(1e-9, hi - lo);
    const dy = last - first;
    if (mid > first && mid > last && (mid - Math.max(first, last)) > span * 0.18) return 'up-then-down';
    if (mid < first && mid < last && (Math.min(first, last) - mid) > span * 0.18) return 'down-then-up';
    if (Math.abs(dy) < span * 0.12) return 'flat';
    return dy > 0 ? 'up' : 'down';
  }

  function summarizeCurve(samples) {
    const list = Array.isArray(samples) ? samples : [];
    const finite = finiteOf(list);
    return {
      samples: list,
      finite: finite,
      roots: findRoots(list),
      extrema: findExtrema(list),
      undefinedSpans: findUndefinedSpans(list),
      asymptotes: findAsymptotes(list),
      yIntercept: findYIntercept(list),
      trend: trendOf(finite),
    };
  }

  function landmarksOf(summary) {
    const s = summary || summarizeCurve([]);
    const list = [];
    if (s.finite && s.finite.length) {
      list.push({ kind: 'start', x: s.finite[0].x, y: s.finite[0].y });
    }
    if (s.yIntercept) list.push(s.yIntercept);
    (s.roots || []).forEach(function (r) { list.push(r); });
    (s.extrema || []).forEach(function (e) { list.push(e); });
    (s.asymptotes || []).forEach(function (a) { list.push(a); });
    (s.undefinedSpans || []).forEach(function (u) {
      list.push({ kind: 'undefined', x: u.from, y: NaN });
    });
    if (s.finite && s.finite.length) {
      const last = s.finite[s.finite.length - 1];
      list.push({ kind: 'end', x: last.x, y: last.y });
    }
    list.sort(function (a, b) { return a.x - b.x; });
    return dedupeByX(list, 0.05);
  }

  const KIND_HE = {
    start: 'התחלה',
    end: 'סיום',
    root: 'שורש',
    max: 'שיא',
    min: 'שפל',
    asymptote: 'אסימפטוטה',
    undefined: 'מחוץ לתחום',
    'y-intercept': 'חיתוך עם ציר וואי',
  };

  const TREND_HE = {
    up: 'הגרף עולה.',
    down: 'הגרף יורד.',
    'up-then-down': 'הגרף עולה ואז יורד.',
    'down-then-up': 'הגרף יורד ואז עולה.',
    flat: 'הגובה כמעט קבוע.',
  };

  function describeLandmarkHe(lm) {
    if (!lm || !lm.kind) return '';
    const name = KIND_HE[lm.kind] || lm.kind;
    const xs = fmt(lm.x);
    const ys = fmt(lm.y);
    let s = name;
    if (xs != null) s += ', איקס ' + xs;
    if (ys != null) s += ', וואי ' + ys;
    return s;
  }

  function describeGraphHe(summary) {
    const s = summary || summarizeCurve([]);
    const bits = ['משמאל לימין.'];
    bits.push(TREND_HE[s.trend] || TREND_HE.flat);
    if (s.roots && s.roots.length) {
      bits.push('שורש באיקס ' + s.roots.map(function (r) { return fmt(r.x); }).join(', ') + '.');
    } else {
      bits.push('לא נמצא שורש בדגימה הזו.');
    }
    (s.extrema || []).forEach(function (e) {
      bits.push(describeLandmarkHe(e) + '.');
    });
    if (s.undefinedSpans && s.undefinedSpans.length) bits.push('יש קטע מחוץ לתחום.');
    if (s.asymptotes && s.asymptotes.length) bits.push('יש קפיצה חדה — ייתכן אסימפטוטה.');
    bits.push('זה תיאור של הדגימה על המסך, לא הוכחה ולא «קול הפונקציה».');
    return bits.filter(Boolean).join(' ');
  }

  function stepIndex(i, dir, n) {
    const len = Math.max(0, Math.round(Number(n) || 0));
    if (len <= 0) return 0;
    const cur = Math.round(Number(i) || 0);
    const step = dir < 0 ? -1 : 1;
    return Math.max(0, Math.min(len - 1, cur + step));
  }

  function indexNearX(samples, x) {
    const list = Array.isArray(samples) ? samples : [];
    if (!list.length || !isFinite(x)) return 0;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < list.length; i++) {
      const d = Math.abs(list[i].x - x);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  function nextLandmarkIndex(marks, x, dir) {
    const list = Array.isArray(marks) ? marks : [];
    if (!list.length) return -1;
    if (dir < 0) {
      for (let i = list.length - 1; i >= 0; i--) {
        if (list[i].x < x - 1e-9) return i;
      }
      return 0;
    }
    for (let i = 0; i < list.length; i++) {
      if (list[i].x > x + 1e-9) return i;
    }
    return list.length - 1;
  }

  function expValue(M0, q, t) {
    const a = Number(M0);
    const r = Number(q);
    const k = Number(t);
    if (!isFinite(a) || !isFinite(r) || !isFinite(k) || r <= 0) return null;
    return a * Math.pow(r, k);
  }

  function expSeries(M0, q, t, steps) {
    const n = Math.max(4, Math.min(128, Math.round(Number(steps) || 64)));
    const T = Number(t);
    if (!isFinite(T) || T < 0) return [];
    const out = [];
    for (let i = 0; i <= n; i++) {
      const ti = T * (i / n);
      const v = expValue(M0, q, ti);
      if (v == null) return [];
      out.push(v);
    }
    return out;
  }

  function describeExpHe(p) {
    const o = p || {};
    const M0 = fmt(o.M0);
    const q = fmt(o.q);
    const t = fmt(o.t);
    const M = fmt(o.M != null ? o.M : expValue(o.M0, o.q, o.t));
    if (M0 == null || q == null || t == null || M == null) return '';
    const grow = Number(o.q) > 1;
    const head = grow
      ? 'גדילה: מתחילים ב־' + M0 + ', כל תקופה כופלים ב־' + q + '.'
      : 'דעיכה: מתחילים ב־' + M0 + ', כל תקופה כופלים ב־' + q + '.';
    return head
      + ' אחרי ' + t + ' תקופות: בערך ' + M + '.'
      + ' במצב לוג זה נשמע כגליסנדו '
      + (grow ? 'עולה' : 'יורד')
      + ' אחיד — ייצוג, לא «קול הפונקציה».';
  }

  return {
    fmt: fmt,
    sampleCurve: sampleCurve,
    findRoots: findRoots,
    findExtrema: findExtrema,
    findUndefinedSpans: findUndefinedSpans,
    findAsymptotes: findAsymptotes,
    findYIntercept: findYIntercept,
    summarizeCurve: summarizeCurve,
    landmarksOf: landmarksOf,
    describeLandmarkHe: describeLandmarkHe,
    describeGraphHe: describeGraphHe,
    stepIndex: stepIndex,
    indexNearX: indexNearX,
    nextLandmarkIndex: nextLandmarkIndex,
    expValue: expValue,
    expSeries: expSeries,
    describeExpHe: describeExpHe,
    KIND_HE: KIND_HE,
  };
});
