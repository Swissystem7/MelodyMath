// MelodyMath — circle of fifths as a 12-gon, and the mean of tapped tempi
// (plan §5, grade ו׳, #107).
//
// The circle has 12 points, 30° apart; a step clockwise goes up a fifth.
// fifthsLayout() places the points for a given usable width so each point is
// a tap target of at least 44px with at least 8px between neighbours, down to
// a 320px phone column. The SVG is drawn 1:1 (no viewBox scaling), so 44px
// in the layout is 44 CSS px on the screen. Letter names stay LTR.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FIFTHS = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];
  const FIFTHS_HE = ['דו', 'סול', 'רה', 'לה', 'מי', 'סי', 'פה דיאז', 'רה במול', 'לה במול', 'מי במול', 'סי במול', 'פה'];
  const STEP_DEG = 30;
  const MIN_WIDTH = 320;
  const TARGET = 44;
  const MARGIN = 4;

  // Clockwise degrees from point a to point b (0..330).
  function fifthsAngle(a, b) {
    const i = Math.round(Number(a));
    const j = Math.round(Number(b));
    if (!Number.isFinite(i) || !Number.isFinite(j)) return null;
    return ((((j - i) % 12) + 12) % 12) * STEP_DEG;
  }

  function fifthsLayout(width) {
    const w = Number(width);
    const size = Math.max(MIN_WIDTH, Number.isFinite(w) ? Math.floor(w) : MIN_WIDTH);
    const c = size / 2;
    const radius = c - TARGET / 2 - MARGIN;
    const points = FIFTHS.map(function (name, i) {
      const rad = (i * STEP_DEG) * Math.PI / 180;
      return {
        index: i,
        name: name,
        he: FIFTHS_HE[i],
        angle: i * STEP_DEG,
        x: Math.round((c + radius * Math.sin(rad)) * 100) / 100,
        y: Math.round((c - radius * Math.cos(rad)) * 100) / 100,
      };
    });
    return { size: size, center: c, radius: radius, target: TARGET, points: points };
  }

  // Free space between two neighbouring tap targets: the chord between their
  // centres minus one target.
  function fifthsGap(layout) {
    return 2 * layout.radius * Math.sin(Math.PI / 12) - layout.target;
  }

  function renderFifthsSvg(width) {
    const l = fifthsLayout(width);
    const r = l.target / 2;
    const poly = l.points.map(function (p) { return p.x + ',' + p.y; }).join(' ');
    const dots = l.points.map(function (p) {
      return '<g class="cof-point" role="button" tabindex="0" data-index="' + p.index + '"' +
        ' aria-label="' + p.he + ', ' + p.angle + ' מעלות מדו">' +
        '<circle cx="' + p.x + '" cy="' + p.y + '" r="' + r + '"></circle>' +
        '<text x="' + p.x + '" y="' + p.y + '" text-anchor="middle" dominant-baseline="central">' + p.name + '</text>' +
        '</g>';
    }).join('');
    return '<svg class="cof" dir="ltr" width="' + l.size + '" height="' + l.size + '"' +
      ' role="group" aria-label="מעגל הקווינטות: 12 נקודות, 30 מעלות בין שכנות">' +
      '<polygon points="' + poly + '" fill="none"></polygon>' + dots + '</svg>';
  }

  // Tap times in ms → the BPM of each gap between taps. Four taps give three.
  function tapsToBpm(taps) {
    if (!Array.isArray(taps) || taps.length < 2) return [];
    const out = [];
    for (let i = 1; i < taps.length; i++) {
      const dt = Number(taps[i]) - Number(taps[i - 1]);
      if (!Number.isFinite(dt) || dt <= 0) return [];
      out.push(Math.round(60000 / dt * 10) / 10);
    }
    return out;
  }

  // Plain mean, rounded to 2 decimals so 81.75 stays 81.75 and not 81.7499…
  function meanOf(values) {
    if (!Array.isArray(values) || !values.length) return null;
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      const v = Number(values[i]);
      if (!Number.isFinite(v)) return null;
      sum += v;
    }
    return Math.round(sum / values.length * 100) / 100;
  }

  return {
    FIFTHS, FIFTHS_HE,
    fifthsAngle, fifthsLayout, fifthsGap, renderFifthsSvg, tapsToBpm, meanOf,
  };
});
