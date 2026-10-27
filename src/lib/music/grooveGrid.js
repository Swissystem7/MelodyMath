// MelodyMath — GrooveGrid, grade ה׳ areaScore (mm-cur-47). Refs #591 #665.
// Up to 12: one sound per square, row by row. Above 12 a product is one held
// note per row plus a wood click per column (4×6 ≠ 3×8). Perimeter is EXTRA.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_GROOVE_GRID = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const WAY = 'areaScore', STEP = 0.22, TEN_DUR = 0.45, ONE_VOICE = 'woodClick';
  const ROW_HZ = [262, 330, 392, 523, 659, 784], MIN_HZ = 220, CLICK = 0.16, ROW_GAP = 0.36;
  const SCREEN_FOR = { 'mm-cur-47': 'ggCard' };

  function voiceDefs() {
    if (root && root.VOICES) return root.VOICES;
    try { return require('../instrumentVoices.js').VOICES; } catch (e) { return {}; }
  }

  // Octaves into the voice filter, never below MIN_HZ (110 Hz on drumHigh was silent).
  function audibleHz(voice, hz) {
    const f = voiceDefs()[voice] && voiceDefs()[voice].filter;
    let out = Number(hz) > 0 ? Number(hz) : 262;
    let lo = MIN_HZ, hi = Infinity;
    if (f && f[0] === 'bandpass') { lo = Math.max(lo, f[1] / 2); hi = f[1] * 2; }
    if (f && f[0] === 'lowpass') hi = f[1];
    if (f && f[0] === 'highpass') lo = Math.max(lo, f[1]);
    while (out < lo) out *= 2;
    while (out > hi && out / 2 >= lo) out /= 2;
    return Math.round(out);
  }

  function side(n) { const v = Number(n); return Number.isInteger(v) && v >= 1 && v <= 12 ? v : null; }

  function gridArea(rows, cols) {
    const r = side(rows), c = side(cols);
    return r && c ? r * c : null;
  }

  // One step per unit of edge, clockwise, on the edge square it walks along;
  // a corner square sounds once per side, so 4×6 is 20 steps.
  function perimeterPath(rows, cols) {
    const r = side(rows), c = side(cols);
    if (!r || !c) return [];
    const path = [];
    for (let x = 0; x < c; x++) path.push({ r: 0, c: x, edge: 'top' });
    for (let y = 0; y < r; y++) path.push({ r: y, c: c - 1, edge: 'right' });
    for (let x = c - 1; x >= 0; x--) path.push({ r: r - 1, c: x, edge: 'bottom' });
    for (let y = r - 1; y >= 0; y--) path.push({ r: y, c: 0, edge: 'left' });
    return path;
  }

  // Two rectangles side by side on one floor: an L. The shared edge is inside
  // the shape, so it is counted in neither perimeter.
  function composeL(rectA, rectB) {
    const a = rectA || {}, b = rectB || {};
    const areaA = gridArea(a.rows, a.cols), areaB = gridArea(b.rows, b.cols);
    if (!areaA || !areaB) return null;
    const rows = Math.max(a.rows, b.rows), cells = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < a.cols + b.cols; x++) {
        const h = x < a.cols ? a.rows : b.rows;
        if (y >= rows - h) cells.push({ r: y, c: x });
      }
    }
    const shared = Math.min(a.rows, b.rows);
    return { rows: rows, cols: a.cols + b.cols, cells: cells, area: areaA + areaB,
      perimeter: 2 * (a.rows + a.cols) + 2 * (b.rows + b.cols) - 2 * shared };
  }

  // Up to 12: one sound per step. Above 12 (perimeter): one held ten, then woodClick ones.
  function stepNotes(steps, trackVoice) {
    const notes = [];
    if (steps.length <= 12) {
      steps.forEach(function (s, i) {
        notes.push({ at: i * STEP, voice: trackVoice(s.r), hz: ROW_HZ[s.r % ROW_HZ.length], steps: [i], accent: i === 0 || s.r !== steps[i - 1].r, held: false });
      });
      return notes;
    }
    const tens = Math.floor(steps.length / 10);
    for (let t = 0; t < tens; t++) {
      const idx = Array.from({ length: 10 }, function (_, k) { return t * 10 + k; });
      const last = steps[t * 10 + 9], v = trackVoice(last.r);
      notes.push({ at: t * 2 * STEP, voice: v, hz: audibleHz(v, ROW_HZ[last.r % ROW_HZ.length]), steps: idx, held: true, dur: TEN_DUR, gain: 0.28 });
    }
    for (let i = tens * 10; i < steps.length; i++) {
      notes.push({ at: (tens * 2 + i - tens * 10) * STEP, voice: ONE_VOICE, hz: audibleHz(ONE_VOICE, 1800), steps: [i], held: false });
    }
    return notes;
  }

  function rowNotes(rows, cols, trackVoice) {
    const notes = [];
    let at = 0;
    for (let y = 0; y < rows; y++) {
      const v = trackVoice(y), ids = [];
      for (let x = 0; x < cols; x++) ids.push(y * cols + x);
      notes.push({ at: at, voice: v, hz: audibleHz(v, ROW_HZ[y % ROW_HZ.length]), steps: ids, accent: true, held: true, dur: cols * CLICK, gain: 0.28, row: y });
      for (let x = 0; x < cols; x++) notes.push({ at: at + x * CLICK, voice: ONE_VOICE, hz: audibleHz(ONE_VOICE, 1800), steps: [ids[x]], held: false, row: y });
      at += cols * CLICK + ROW_GAP;
    }
    return notes;
  }

  function areaPlan(rows, cols, trackVoice) {
    if (!gridArea(rows, cols)) return null;
    if (rows * cols > 12) return rowNotes(rows, cols, trackVoice);
    const steps = [];
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) steps.push({ r: y, c: x });
    return stepNotes(steps, trackVoice);
  }
  function perimeterPlan(rows, cols, trackVoice) {
    if (!gridArea(rows, cols)) return null;
    return stepNotes(perimeterPath(rows, cols), trackVoice);
  }
  function partnerFor(family) { return family === 'percussion' ? 'guitar' : 'djembe'; }

  const TARGETS = [[3, 4, 'area'], [4, 6, 'area'], [3, 8, 'area'], [4, 6, 'perimeter'], [3, 8, 'perimeter']]
    .map(function (t) { return { rows: t[0], cols: t[1], ask: t[2] }; });
  const L = composeL({ rows: 2, cols: 3 }, { rows: 4, cols: 2 });
  const NO_MUSIC_CHECK_ITEMS = [
    { id: 'gg-nm-1', prompt: 'מלבן 5 על 7. מה השטח (משבצות)?', answer: gridArea(5, 7) },
    { id: 'gg-nm-2', prompt: 'מלבן 5 על 7. מה ההיקף?', answer: perimeterPath(5, 7).length },
    { id: 'gg-nm-3', prompt: 'צורת L: מלבן 2 על 3 וצמוד אליו מלבן 4 על 2. מה השטח?', answer: L.area },
    { id: 'gg-nm-4', prompt: 'ומה ההיקף של צורת ה־L?', answer: L.perimeter },
  ];

  return { WAY, ONE_VOICE, MIN_HZ, SCREEN_FOR, TARGETS, NO_MUSIC_CHECK_ITEMS, audibleHz, gridArea, perimeterPath, composeL, areaPlan, perimeterPlan, partnerFor };
});
