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

  // ------------------------------------------------------------------
  // Noise-tolerant landmark detection.
  //
  // findRoots/findExtrema above are literal readings of the sampling: every
  // sign change is a root, every three-sample dip is an extremum. On a curve
  // with even a little noise that produces dozens of "extrema" that are not
  // features of the curve at all. findLandmarks is the robust reading of the
  // SAME sampling, and it changes nothing about the functions above.
  //
  //   prominence   an extremum is reported only once the curve has retraced by
  //                more than `epsilon` of the sampled y-range away from it —
  //                textbook peak detection with a minimum-prominence delta.
  //                Its x is then the weighted centroid of the plateau around
  //                it rather than the raw argmax: on a flat-topped peak the
  //                argmax jumps several samples under tiny noise (near a peak
  //                the curve is quadratic, so a few samples out the drop is
  //                smaller than the noise), while the centroid does not move.
  //   merging      crossings closer together than one sample step are one
  //                crossing. Noise around a zero can produce a cluster of sign
  //                changes inside a single step; the curve crossed once.
  //
  // ENDPOINT POLICY — deliberate, and the sine test depends on it:
  //   * The first and last samples are never extrema. A turning point has to
  //     be confirmed by a retrace and outside the window there is nothing to
  //     retrace into. (findExtrema already skips them, for the same reason.)
  //   * The first and last samples DO count as roots when |y| is within the
  //     same epsilon-of-range tolerance AND within a sample or two of the axis
  //     at the local slope, because a sign change cannot be observed past the
  //     edge of the window. Interior roots still need a real sign change (or
  //     an exact zero).
  //   So sin(x) sampled on [0, 2*pi] gives 2 extrema (pi/2 and 3*pi/2) and 3
  //   roots (0, pi and 2*pi) — both endpoint zeros are counted.
  //   * A turning point needs a retrace on BOTH sides. One that sits within
  //     delta of the window edge on its near side is not reported at all,
  //     and one whose retrace is only just over delta flickers under noise of
  //     the same size (a maximum 0.47 before the end of a sine window, with a
  //     retrace of 0.108 against a threshold of 0.100, disappears in 2 of
  //     2400 noisy trials measured 2026-09-10). Inherent to any minimum-
  //     prominence detector; not a defect this module can remove.
  //
  // A constant sampling has zero range, so there is no scale to measure
  // prominence against and nothing to point at: findLandmarks returns []. A
  // caller who knows its own noise floor can widen that with `flatTol`.
  // ------------------------------------------------------------------
  const LANDMARK_EPSILON = 0.05;

  function landmarkOptions(opts) {
    const o = opts || {};
    const eps = Number(o.epsilon);
    const flat = Number(o.flatTol);
    return {
      epsilon: (isFinite(eps) && eps > 0) ? eps : LANDMARK_EPSILON,
      flatTol: (isFinite(flat) && flat >= 0) ? flat : 0,
    };
  }

  function sampleStep(list) {
    let step = Infinity;
    for (let i = 1; i < list.length; i++) {
      const d = Math.abs(list[i].x - list[i - 1].x);
      if (d > 0 && d < step) step = d;
    }
    return isFinite(step) ? step : 0;
  }

  // A single sign change localises a zero only to about (noise / slope): with
  // amplitude-1 noise of 0.01 on a curve crossing at slope 1, the interpolated
  // x is off by ~0.01, which is enough to move a root that sits near a
  // rounding boundary into the next bucket when it is read out to one decimal.
  // When several samples sit inside the same epsilon-of-range band around the
  // axis, a least-squares line through all of them averages that noise down
  // instead of trusting the one bracketing pair.
  function refineCrossing(list, i, delta, fallback) {
    let lo = i;
    let hi = i + 1;
    const near = function (k) {
      const s = list[k];
      return s && isFinite(s.y) && Math.abs(s.y) <= delta;
    };
    while (lo - 1 >= 0 && near(lo - 1)) lo--;
    while (hi + 1 < list.length && near(hi + 1)) hi++;
    let n = 0;
    let sx = 0;
    let sy = 0;
    let sxx = 0;
    let sxy = 0;
    for (let k = lo; k <= hi; k++) {
      if (!near(k)) continue;
      const s = list[k];
      n++;
      sx += s.x;
      sy += s.y;
      sxx += s.x * s.x;
      sxy += s.x * s.y;
    }
    if (n < 3) return fallback;
    const den = n * sxx - sx * sx;
    if (!(Math.abs(den) > 0)) return fallback;
    const slope = (n * sxy - sx * sy) / den;
    if (!(Math.abs(slope) > 0)) return fallback;
    const intercept = (sy - slope * sx) / n;
    const x = -intercept / slope;
    // A fit that wanders outside the band it was fitted on is not a better
    // answer than the bracketing pair.
    if (!isFinite(x) || Math.abs(x - fallback) > Math.abs(list[hi].x - list[lo].x)) {
      return fallback;
    }
    return x;
  }

  // How much y moves per sample near an end of the window, averaged over a few
  // samples so noise does not dominate the estimate.
  function edgeSlope(list, i, inward) {
    const span = 5;
    const a = list[i];
    let far = null;
    let used = 0;
    for (let k = 1; k <= span; k++) {
      const s = list[i + inward * k];
      if (!s || !isFinite(s.y)) break;
      far = s;
      used = k;
    }
    if (!far || !used) return 0;
    return Math.abs(far.y - a.y) / used;
  }

  // An end sample counts as a crossing only if it is BOTH inside the noise
  // tolerance AND within about a sample or two of the axis at the local slope.
  // The tolerance alone is scaled to the whole sampled range, which on a curve
  // with an asymptote is enormous: 1/x on [-4, 4] spans 20, so a fifth of a
  // unit would look like "on the axis" at x = -4 where y is -0.25 and the
  // curve is nowhere near crossing. The slope test rejects that.
  function edgeIsCrossing(list, i, inward, delta) {
    const y = Math.abs(list[i].y);
    if (y > delta) return false;
    const per = edgeSlope(list, i, inward);
    if (!(per > 0)) return y === 0;
    return y <= Math.min(delta, per * 2);
  }

  function robustRoots(list, delta, step) {
    const n = list.length;
    const raw = [];
    for (let i = 0; i < n; i++) {
      const a = list[i];
      if (!a || !isFinite(a.y)) continue;
      if (i === 0 || i === n - 1) {
        // Edge: no sign change is observable past it, so a sample sitting on
        // the axis within tolerance is the crossing.
        if (edgeIsCrossing(list, i, i === 0 ? 1 : -1, delta)) {
          raw.push({ x: a.x, edge: true });
        }
        continue;
      }
      if (a.y === 0) { raw.push({ x: a.x, edge: false }); continue; }
      const b = list[i + 1];
      if (!b || !isFinite(b.y)) continue;
      if (a.y * b.y < 0) {
        const t = a.y / (a.y - b.y);
        const bracket = a.x + t * (b.x - a.x);
        raw.push({ x: refineCrossing(list, i, delta, bracket), edge: false });
      }
    }
    raw.sort(function (p, q) { return p.x - q.x; });
    const out = [];
    let cluster = [];
    function flush() {
      if (!cluster.length) return;
      // An edge crossing sits on a real sample position; prefer it to the
      // interpolated noise around it. Otherwise average the cluster.
      let anchor = null;
      cluster.forEach(function (c) { if (!anchor && c.edge) anchor = c; });
      const x = anchor ? anchor.x : cluster.reduce(function (s, c) { return s + c.x; }, 0) / cluster.length;
      out.push({ kind: 'root', x: x, y: 0 });
      cluster = [];
    }
    raw.forEach(function (r) {
      if (cluster.length && Math.abs(r.x - cluster[cluster.length - 1].x) >= step) flush();
      cluster.push(r);
    });
    flush();
    return out;
  }

  // (y - threshold)-weighted centroid of the plateau around a confirmed
  // extremum. The plateau is walked OUTWARD from the extreme sample in both
  // directions while the curve stays within delta of it. It is deliberately
  // not clipped to the swing that confirmed the extremum: that swing starts
  // where the curve first moved delta away from the previous extreme, which
  // can sit inside the plateau when the previous extreme was close (the first
  // swing after the window edge, typically). Integrating only from there cut
  // the plateau on one side and pulled the centroid inward by up to a whole
  // one-decimal bucket — measured 2026-09-10: a minimum at x = 0.472 was read
  // as 0.566. The walk stops on its own at the window edges.
  function centroidOf(list, kind, idx, extremeY, delta) {
    const sign = kind === 'max' ? 1 : -1;
    const cut = extremeY - sign * delta;
    const weight = function (i) {
      const s = list[i];
      if (!s || !isFinite(s.y)) return 0;
      return sign * (s.y - cut);
    };
    let wsum = 0;
    let xsum = 0;
    let lo = idx;
    let hi = idx;
    while (lo - 1 >= 0 && weight(lo - 1) > 0) lo--;
    while (hi + 1 < list.length && weight(hi + 1) > 0) hi++;
    for (let i = lo; i <= hi; i++) {
      const w = weight(i);
      if (w <= 0) continue;
      wsum += w;
      xsum += w * list[i].x;
    }
    const x = wsum > 0 ? xsum / wsum : list[idx].x;
    return { kind: kind, x: x, y: extremeY };
  }

  function robustExtrema(list, delta) {
    const n = list.length;
    const out = [];
    let mn = Infinity;
    let mx = -Infinity;
    let mnI = -1;
    let mxI = -1;
    let lookForMax = null;
    for (let i = 0; i < n; i++) {
      const s = list[i];
      if (!s || !isFinite(s.y)) continue;
      if (s.y > mx) { mx = s.y; mxI = i; }
      if (s.y < mn) { mn = s.y; mnI = i; }
      if (lookForMax === null) {
        // The first swing only fixes which way the curve is going. Whatever
        // extreme it passed sits against the edge of the window, and an edge
        // is not a turning point.
        if (s.y < mx - delta) { lookForMax = false; mn = s.y; mnI = i; }
        else if (s.y > mn + delta) { lookForMax = true; mx = s.y; mxI = i; }
        continue;
      }
      if (lookForMax === true && s.y < mx - delta) {
        out.push(centroidOf(list, 'max', mxI, mx, delta));
        mn = s.y; mnI = i; lookForMax = false;
      } else if (lookForMax === false && s.y > mn + delta) {
        out.push(centroidOf(list, 'min', mnI, mn, delta));
        mx = s.y; mxI = i; lookForMax = true;
      }
    }
    return out;
  }

  function findLandmarks(samples, opts) {
    const list = Array.isArray(samples) ? samples : [];
    const o = landmarkOptions(opts);
    const finite = finiteOf(list);
    if (!finite.length) return [];
    const ys = finite.map(function (s) { return s.y; });
    const span = Math.max.apply(null, ys) - Math.min.apply(null, ys);
    if (!(span > o.flatTol)) return [];
    const delta = o.epsilon * span;
    const step = sampleStep(list);
    const marks = robustRoots(list, delta, step).concat(robustExtrema(list, delta));
    findUndefinedSpans(list).forEach(function (u) {
      marks.push({ kind: 'gap', x: u.from, y: NaN, to: u.to });
    });
    findAsymptotes(list).forEach(function (a) {
      marks.push({ kind: 'jump', x: a.x, y: NaN });
    });
    marks.sort(function (a, b) { return a.x - b.x; });
    return marks;
  }

  const LANDMARK_HE = {
    root: 'חיתוך עם ציר איקס',
    max: 'שיא',
    min: 'שפל',
    gap: 'קטע מחוץ לתחום',
    jump: 'קפיצה חדה',
  };

  const NO_LANDMARKS_HE = 'לא נמצאו נקודות ציון בדגימה הזו.';
  const FLAT_HE = 'הגרף שטוח: הגובה קבוע לאורך כל הקטע, ואין נקודות ציון.';
  const SAMPLE_ONLY_HE = 'זה תיאור של הדגימה על המסך, לא הוכחה ולא «קול הפונקציה».';

  // Landmarks in x order, one decimal each. `samples` is optional and only
  // used to tell "flat" apart from "no landmarks here": y = x + 1 on [0, 2]
  // has no landmarks either, and calling that curve flat would be a lie.
  function describeLandmarksHe(marks, samples) {
    const list = (Array.isArray(marks) ? marks : []).slice().sort(function (a, b) {
      return a.x - b.x;
    });
    if (!list.length) {
      const finite = finiteOf(Array.isArray(samples) ? samples : []);
      const ys = finite.map(function (s) { return s.y; });
      const flat = ys.length > 0 && Math.max.apply(null, ys) === Math.min.apply(null, ys);
      return (flat ? FLAT_HE : NO_LANDMARKS_HE) + ' ' + SAMPLE_ONLY_HE;
    }
    const parts = list.map(function (m) {
      const name = LANDMARK_HE[m.kind] || m.kind;
      const xs = fmt(m.x);
      const ys = fmt(m.y);
      let s = name + ' באיקס ' + (xs == null ? '?' : xs);
      if (ys != null && m.kind !== 'root') s += ', וואי ' + ys;
      return s;
    });
    return 'משמאל לימין: ' + parts.join('; ') + '. ' + SAMPLE_ONLY_HE;
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
    findLandmarks: findLandmarks,
    describeLandmarksHe: describeLandmarksHe,
    LANDMARK_HE: LANDMARK_HE,
    FLAT_HE: FLAT_HE,
    NO_LANDMARKS_HE: NO_LANDMARKS_HE,
    LANDMARK_EPSILON: LANDMARK_EPSILON,
    KIND_HE: KIND_HE,
  };
});
