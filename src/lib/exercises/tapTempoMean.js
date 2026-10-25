// MelodyMath — Grade 6 Tap Tempo Mean Module (Issue #690, Refs #665).
// Bridge step from levelNotes (note lengths) to steady tempo (BPM):
// child taps 4–6 times, views interval lengths between taps,
// and calculates the mean interval length (mean = sum/count exactly)
// which determines the steady BPM tempo.
// Stage 2 provides a ready list for pure calculation without sound.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TAP_TEMPO_MEAN = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

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

  function tapsToIntervals(taps) {
    if (!Array.isArray(taps) || taps.length < 2) return [];
    const out = [];
    for (let i = 1; i < taps.length; i++) {
      const dt = Number(taps[i]) - Number(taps[i - 1]);
      if (!Number.isFinite(dt) || dt <= 0) return [];
      out.push(Math.round(dt / 100) / 10); // in tenths of a second
    }
    return out;
  }

  function meanOf(values) {
    if (!Array.isArray(values) || !values.length) return null;
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      const v = Number(values[i]);
      if (!Number.isFinite(v)) return null;
      sum += v;
    }
    return Math.round((sum / values.length) * 100) / 100;
  }

  function trueAverageBpm(taps) {
    if (!Array.isArray(taps) || taps.length < 2) return null;
    const totalDt = Number(taps[taps.length - 1]) - Number(taps[0]);
    if (!Number.isFinite(totalDt) || totalDt <= 0) return null;
    return Math.round(((taps.length - 1) * 60000 / totalDt) * 100) / 100;
  }

  function meanIntervalToBpm(meanTenths) {
    const v = Number(meanTenths);
    if (!Number.isFinite(v) || v <= 0) return null;
    return Math.round(600 / v * 10) / 10;
  }

  const TAP_TEMPO_MEAN_ITEMS = [
    { id: 'g6-mean-tap-4t-80', grade: 'ו', strand: 'data', standard: 'G6_MEAN', skill: 'mean',
      tapCount: 4, intervals: [8, 8, 8], bpms: [8, 8, 8], answer: 8, level: 1,
      prompt: 'הקשתם 4 פעמים ויצרתם 3 מרווחי זמן: 8, 8 ו־8 עשיריות שנייה. מה אורך המרווח הממוצע בעשיריות שנייה?',
      hint: 'הסכום 24, חלקי 3 מרווחי זמן = 8 עשיריות שנייה (קצב אחיד של 75 BPM)',
      music: 'tapTempo', musicSrc: 'azaryahu2020', musicEv: 'A', stage: 'tap_active' },
    { id: 'g6-mean-tap-4t-100', grade: 'ו', strand: 'data', standard: 'G6_MEAN', skill: 'mean',
      tapCount: 4, intervals: [5, 6, 7], bpms: [5, 6, 7], answer: 6, level: 1,
      prompt: 'הקשתם 4 פעמים ויצרתם 3 מרווחי זמן: 5, 6 ו־7 עשיריות שנייה. מה אורך המרווח הממוצע בעשיריות שנייה?',
      hint: 'הסכום 18, חלקי 3 מרווחי זמן = 6 עשיריות שנייה (קצב אחיד של 100 BPM)',
      music: 'tapTempo', musicSrc: 'azaryahu2020', musicEv: 'A', stage: 'tap_active' },
    { id: 'g6-mean-tap-5t-80', grade: 'ו', strand: 'data', standard: 'G6_MEAN', skill: 'mean',
      tapCount: 5, intervals: [7, 8, 8, 9], bpms: [7, 8, 8, 9], answer: 8, level: 2,
      prompt: 'הקשתם 5 פעמים ויצרתם 4 מרווחי זמן: 7, 8, 8 ו־9 עשיריות שנייה. מה אורך המרווח הממוצע בעשיריות שנייה?',
      hint: 'הסכום 32, חלקי 4 מרווחי זמן = 8 עשיריות שנייה (קצב אחיד של 75 BPM)',
      music: 'tapTempo', musicSrc: 'azaryahu2020', musicEv: 'A', stage: 'tap_active' },
    { id: 'g6-mean-tap-5t-90', grade: 'ו', strand: 'data', standard: 'G6_MEAN', skill: 'mean',
      tapCount: 5, intervals: [7, 8, 10, 11], bpms: [7, 8, 10, 11], answer: 9, level: 2,
      prompt: 'הקשתם 5 פעמים ויצרתם 4 מרווחי זמן: 7, 8, 10 ו־11 עשיריות שנייה. מה אורך המרווח הממוצע בעשיריות שנייה?',
      hint: 'הסכום 36, חלקי 4 מרווחי זמן = 9 עשיריות שנייה (קצב אחיד של כ־67 BPM)',
      music: 'tapTempo', musicSrc: 'azaryahu2020', musicEv: 'A', stage: 'tap_active' },
    { id: 'g6-mean-tap-5t-81', grade: 'ו', strand: 'data', standard: 'G6_MEAN', skill: 'mean',
      tapCount: 5, intervals: [6, 7, 7, 8], bpms: [6, 7, 7, 8], answer: 7, level: 2,
      prompt: 'הקשתם 5 פעמים ויצרתם 4 מרווחי זמן: 6, 7, 7 ו־8 עשיריות שנייה. מה אורך המרווח הממוצע בעשיריות שנייה?',
      hint: 'הסכום 28, חלקי 4 מרווחי זמן = 7 עשיריות שנייה (קצב אחיד של כ־86 BPM)',
      music: 'tapTempo', musicSrc: 'azaryahu2020', musicEv: 'A', stage: 'tap_active' },
    { id: 'g6-mean-tap-5t-dec', grade: 'ו', strand: 'data', standard: 'G6_MEAN', skill: 'mean',
      tapCount: 5, intervals: [7, 8, 8, 10], bpms: [7, 8, 8, 10], answer: 8.25, level: 3,
      prompt: 'הקשתם 5 פעמים ויצרתם 4 מרווחי זמן: 7, 8, 8 ו־10 עשיריות שנייה. מה אורך המרווח הממוצע בעשיריות שנייה?',
      hint: 'הסכום 33, חלקי 4 מרווחי זמן = 8.25 עשיריות שנייה',
      music: 'tapTempo', musicSrc: 'azaryahu2020', musicEv: 'A', stage: 'tap_active' },
    { id: 'g6-mean-tap-6t-80', grade: 'ו', strand: 'data', standard: 'G6_MEAN', skill: 'mean',
      tapCount: 6, intervals: [6, 7, 8, 9, 10], bpms: [6, 7, 8, 9, 10], answer: 8, level: 2,
      prompt: 'הקשתם 6 פעמים ויצרתם 5 מרווחי זמן: 6, 7, 8, 9 ו־10 עשיריות שנייה. מה אורך המרווח הממוצע בעשיריות שנייה?',
      hint: 'הסכום 40, חלקי 5 מרווחי זמן = 8 עשיריות שנייה (קצב אחיד של 75 BPM)',
      music: 'tapTempo', musicSrc: 'azaryahu2020', musicEv: 'A', stage: 'tap_active' },
    { id: 'g6-mean-tap-6t-75', grade: 'ו', strand: 'data', standard: 'G6_MEAN', skill: 'mean',
      tapCount: 6, intervals: [5, 6, 7, 8, 9], bpms: [5, 6, 7, 8, 9], answer: 7, level: 3,
      prompt: 'הקשתם 6 פעמים ויצרתם 5 מרווחי זמן: 5, 6, 7, 8 ו־9 עשיריות שנייה. מה אורך המרווח הממוצע בעשיריות שנייה?',
      hint: 'הסכום 35, חלקי 5 מרווחי זמן = 7 עשיריות שנייה (קצב אחיד של כ־86 BPM)',
      music: 'tapTempo', musicSrc: 'azaryahu2020', musicEv: 'A', stage: 'tap_active' },
    { id: 'g6-mean-nomusic-check', grade: 'ו', strand: 'data', standard: 'G6_MEAN', skill: 'mean',
      tapCount: 0, intervals: [6, 7, 8, 11], bpms: [6, 7, 8, 11], answer: 8, level: 2,
      prompt: 'רשימת מדידות של מרווחי זמן ללא צליל: 6, 7, 8 ו־11 עשיריות שנייה. מה הממוצע?',
      hint: 'חישוב טהור ללא צליל: הסכום 32, 32 חלקי 4 = 8',
      noMusic: true, plain: true, musicStage: 'no_music_check' }
  ];

  function renderTapTempoWidgetHtml(item) {
    if (!item) return '';
    if (item.noMusic) {
      return '<div class="tap-mean-plain" style="padding:10px;text-align:center;font-weight:600;">שלב בדיקה: חשבו את הממוצע ללא ליווי מוזיקלי.</div>';
    }
    const list = item.intervals || item.bpms || [];
    const pills = list.map(function (v) {
      const bpm = Math.round(600 / v);
      return '<span class="bpm-pill" style="display:inline-block;padding:4px 10px;margin:2px 4px;background:var(--accent-subtle,#eef);border-radius:12px;font-weight:700;">' + v + ' עש׳ (' + bpm + ' BPM)</span>';
    }).join('');
    const intervalsCount = item.tapCount ? item.tapCount - 1 : list.length;
    return '<div class="tap-mean-widget" style="background:var(--card,#fff);border:1px solid var(--line,#ddd);border-radius:12px;padding:14px;text-align:center;margin:10px 0;">' +
      '<div style="font-size:0.95rem;margin-bottom:8px;color:var(--text,#222);">' + (item.tapCount || 0) + ' הקשות יוצרות ' + intervalsCount + ' מרווחי זמן:</div>' +
      '<div class="bpm-pills-row" style="margin-bottom:10px;">' + pills + '</div>' +
      '<button type="button" class="btn-tap-cue" style="padding:8px 18px;border-radius:8px;border:1px solid var(--primary,#4a6fa5);background:var(--surface,#f5f8ff);cursor:pointer;">🎵 הקשה לקצב</button>' +
      '</div>';
  }

  function getItems() {
    return TAP_TEMPO_MEAN_ITEMS.slice();
  }

  return {
    TAP_TEMPO_MEAN_ITEMS: TAP_TEMPO_MEAN_ITEMS,
    getItems: getItems,
    tapsToBpm: tapsToBpm,
    tapsToIntervals: tapsToIntervals,
    meanOf: meanOf,
    trueAverageBpm: trueAverageBpm,
    meanIntervalToBpm: meanIntervalToBpm,
    renderTapTempoWidgetHtml: renderTapTempoWidgetHtml
  };
});
