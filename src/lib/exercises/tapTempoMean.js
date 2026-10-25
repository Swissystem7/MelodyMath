// MelodyMath — Grade 6 Tap Tempo Mean Module (Issue #690, Refs #665).
// Child taps 4–6 times, views BPM of each interval, and calculates the mean BPM.
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

  const TAP_TEMPO_MEAN_ITEMS = [
    {
      id: 'g6-mean-tap-4t-80',
      grade: 'ו',
      strand: 'data',
      standard: 'G6_MEAN',
      skill: 'mean',
      tapCount: 4,
      bpms: [80, 80, 80],
      prompt: 'הקשתם 4 פעמים: 80, 80 ו־80 BPM. מה הקצב הממוצע ב־BPM?',
      answer: 80,
      hint: 'הסכום 240, חלקי 3 מרווחי קצב = 80 BPM',
      level: 1,
      music: 'tapTempo',
      musicSrc: 'circleOfFifths',
      musicEv: 'A',
      stage: 'tap_active'
    },
    {
      id: 'g6-mean-tap-4t-100',
      grade: 'ו',
      strand: 'data',
      standard: 'G6_MEAN',
      skill: 'mean',
      tapCount: 4,
      bpms: [90, 100, 110],
      prompt: 'הקשתם 4 פעמים: 90, 100 ו־110 BPM. מה הקצב הממוצע ב־BPM?',
      answer: 100,
      hint: 'הסכום 300, חלקי 3 = 100 BPM',
      level: 1,
      music: 'tapTempo',
      musicSrc: 'circleOfFifths',
      musicEv: 'A',
      stage: 'tap_active'
    },
    {
      id: 'g6-mean-tap-5t-80',
      grade: 'ו',
      strand: 'data',
      standard: 'G6_MEAN',
      skill: 'mean',
      tapCount: 5,
      bpms: [70, 80, 80, 90],
      prompt: 'הקשתם 5 פעמים: 70, 80, 80 ו־90 BPM. מה הקצב הממוצע ב־BPM?',
      answer: 80,
      hint: 'הסכום 320, חלקי 4 = 80 BPM',
      level: 2,
      music: 'tapTempo',
      musicSrc: 'circleOfFifths',
      musicEv: 'A',
      stage: 'tap_active'
    },
    {
      id: 'g6-mean-tap-5t-90',
      grade: 'ו',
      strand: 'data',
      standard: 'G6_MEAN',
      skill: 'mean',
      tapCount: 5,
      bpms: [80, 85, 95, 100],
      prompt: 'הקשתם 5 פעמים: 80, 85, 95 ו־100 BPM. מה הקצב הממוצע ב־BPM?',
      answer: 90,
      hint: 'הסכום 360, חלקי 4 = 90 BPM',
      level: 2,
      music: 'tapTempo',
      musicSrc: 'circleOfFifths',
      musicEv: 'A',
      stage: 'tap_active'
    },
    {
      id: 'g6-mean-tap-5t-81',
      grade: 'ו',
      strand: 'data',
      standard: 'G6_MEAN',
      skill: 'mean',
      tapCount: 5,
      bpms: [78, 82, 80, 84],
      prompt: 'הקשתם 5 פעמים: 78, 82, 80 ו־84 BPM. מה הקצב הממוצע ב־BPM?',
      answer: 81,
      hint: 'הסכום 324, חלקי 4 = 81 BPM',
      level: 2,
      music: 'tapTempo',
      musicSrc: 'circleOfFifths',
      musicEv: 'A',
      stage: 'tap_active'
    },
    {
      id: 'g6-mean-tap-5t-dec',
      grade: 'ו',
      strand: 'data',
      standard: 'G6_MEAN',
      skill: 'mean',
      tapCount: 5,
      bpms: [80, 81, 82, 84],
      prompt: 'הקשתם 5 פעמים: 80, 81, 82 ו־84 BPM. מה הקצב הממוצע ב־BPM?',
      answer: 81.75,
      hint: 'הסכום 327, חלקי 4 = 81.75 BPM',
      level: 3,
      music: 'tapTempo',
      musicSrc: 'circleOfFifths',
      musicEv: 'A',
      stage: 'tap_active'
    },
    {
      id: 'g6-mean-tap-6t-80',
      grade: 'ו',
      strand: 'data',
      standard: 'G6_MEAN',
      skill: 'mean',
      tapCount: 6,
      bpms: [60, 70, 80, 90, 100],
      prompt: 'הקשתם 6 פעמים: 60, 70, 80, 90 ו־100 BPM. מה הקצב הממוצע ב־BPM?',
      answer: 80,
      hint: 'הסכום 400, חלקי 5 = 80 BPM',
      level: 2,
      music: 'tapTempo',
      musicSrc: 'circleOfFifths',
      musicEv: 'A',
      stage: 'tap_active'
    },
    {
      id: 'g6-mean-tap-6t-75',
      grade: 'ו',
      strand: 'data',
      standard: 'G6_MEAN',
      skill: 'mean',
      tapCount: 6,
      bpms: [65, 75, 70, 80, 85],
      prompt: 'הקשתם 6 פעמים: 65, 75, 70, 80 ו־85 BPM. מה הקצב הממוצע ב־BPM?',
      answer: 75,
      hint: 'הסכום 375, חלקי 5 = 75 BPM',
      level: 3,
      music: 'tapTempo',
      musicSrc: 'circleOfFifths',
      musicEv: 'A',
      stage: 'tap_active'
    },
    {
      id: 'g6-mean-nomusic-check',
      grade: 'ו',
      strand: 'data',
      standard: 'G6_MEAN',
      skill: 'mean',
      tapCount: 0,
      bpms: [70, 85, 95, 110],
      prompt: 'רשימת מדידות קצב ללא צליל: 70, 85, 95 ו־110. מה הממוצע?',
      answer: 90,
      hint: 'חישוב טהור ללא צליל: הסכום 360, 360 חלקי 4 = 90',
      level: 2,
      noMusic: true,
      plain: true,
      musicStage: 'no_music_check'
    }
  ];

  function renderTapTempoWidgetHtml(item) {
    if (!item) return '';
    if (item.noMusic) {
      return '<div class="tap-mean-plain" style="padding:10px;text-align:center;font-weight:600;">' +
        'שלב בדיקה: חשבו את הממוצע ללא ליווי מוזיקלי.' +
        '</div>';
    }
    const pills = (item.bpms || []).map(function (b) {
      return '<span class="bpm-pill" style="display:inline-block;padding:4px 10px;margin:2px 4px;' +
        'background:var(--accent-subtle,#eef);border-radius:12px;font-weight:700;">' + b + ' BPM</span>';
    }).join('');

    return '<div class="tap-mean-widget" style="background:var(--card,#fff);border:1px solid var(--line,#ddd);' +
      'border-radius:12px;padding:14px;text-align:center;margin:10px 0;">' +
      '<div style="font-size:0.95rem;margin-bottom:8px;color:var(--text,#222);">' +
      'הקשות שנמדדו (' + (item.tapCount || 0) + ' הקשות):' +
      '</div>' +
      '<div class="bpm-pills-row" style="margin-bottom:10px;">' + pills + '</div>' +
      '<button type="button" class="btn-tap-cue" style="padding:8px 18px;border-radius:8px;' +
      'border:1px solid var(--primary,#4a6fa5);background:var(--surface,#f5f8ff);cursor:pointer;">' +
      '🎵 הקשה לקצב' +
      '</button>' +
      '</div>';
  }

  function getItems() {
    return TAP_TEMPO_MEAN_ITEMS.slice();
  }

  return {
    TAP_TEMPO_MEAN_ITEMS: TAP_TEMPO_MEAN_ITEMS,
    getItems: getItems,
    tapsToBpm: tapsToBpm,
    meanOf: meanOf,
    renderTapTempoWidgetHtml: renderTapTempoWidgetHtml
  };
});
