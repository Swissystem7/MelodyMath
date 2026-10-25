// MelodyMath — Grade 6 Tempo Percents Module (Issue #690, Refs #665).
// Links percentage calculation to musical tempo (BPM) changes (+/-10%, 25%, 50%).
// Includes interactive "circles per sound" visual scaffolding and an unassisted
// no-music check at the end of the topic.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TEMPO_PERCENT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // 8+ items covering base tempo and +/- 10%, 25%, 50%
  // Both question styles: "מה הקצב החדש?" (new tempo) and "בכמה אחוזים?" (by what percent)
  const TEMPO_PERCENT_ITEMS = [
    {
      id: 'g6-tp-10-up',
      grade: 'ו',
      strand: 'decimals',
      standard: 'PERCENT',
      skill: 'percent',
      baseBpm: 100,
      percentChange: 10,
      kind: 'new_tempo',
      prompt: 'קצב בסיס של 100 BPM עלה ב־10%. מה הקצב החדש ב־BPM?',
      answer: 110,
      hint: '10% מ־100 הם 10. 100 + 10 = 110 BPM',
      level: 1,
      music: 'tempoPercent',
      musicSrc: 'wnetMathInMusic',
      musicEv: 'A',
      circles: { baseSounds: 4, changedSounds: 4 }
    },
    {
      id: 'g6-tp-10-down',
      grade: 'ו',
      strand: 'decimals',
      standard: 'PERCENT',
      skill: 'percent',
      baseBpm: 100,
      percentChange: -10,
      kind: 'new_tempo',
      prompt: 'קצב בסיס של 100 BPM ירד ב־10%. מה הקצב החדש ב־BPM?',
      answer: 90,
      hint: '10% מ־100 הם 10. 100 − 10 = 90 BPM',
      level: 1,
      music: 'tempoPercent',
      musicSrc: 'wnetMathInMusic',
      musicEv: 'A',
      circles: { baseSounds: 4, changedSounds: 4 }
    },
    {
      id: 'g6-tp-25-up',
      grade: 'ו',
      strand: 'decimals',
      standard: 'PERCENT',
      skill: 'percent',
      baseBpm: 80,
      percentChange: 25,
      kind: 'new_tempo',
      prompt: 'קצב בסיס של 80 BPM עלה ב־25%. מה הקצב החדש ב־BPM?',
      answer: 100,
      hint: '25% מ־80 הם 20 (רבע מ־80). 80 + 20 = 100 BPM',
      level: 2,
      music: 'tempoPercent',
      musicSrc: 'wnetMathInMusic',
      musicEv: 'A',
      circles: { baseSounds: 4, changedSounds: 4 }
    },
    {
      id: 'g6-tp-25-down',
      grade: 'ו',
      strand: 'decimals',
      standard: 'PERCENT',
      skill: 'percent',
      baseBpm: 120,
      percentChange: -25,
      kind: 'new_tempo',
      prompt: 'קצב בסיס של 120 BPM ירד ב־25%. מה הקצב החדש ב־BPM?',
      answer: 90,
      hint: '25% מ־120 הם 30 (רבע מ־120). 120 − 30 = 90 BPM',
      level: 2,
      music: 'tempoPercent',
      musicSrc: 'wnetMathInMusic',
      musicEv: 'A',
      circles: { baseSounds: 4, changedSounds: 4 }
    },
    {
      id: 'g6-tp-50-up',
      grade: 'ו',
      strand: 'decimals',
      standard: 'PERCENT',
      skill: 'percent',
      baseBpm: 80,
      percentChange: 50,
      kind: 'new_tempo',
      prompt: 'קצב בסיס של 80 BPM עלה ב־50%. מה הקצב החדש ב־BPM?',
      answer: 120,
      hint: '50% מ־80 הם 40 (חצי מ־80). 80 + 40 = 120 BPM',
      level: 2,
      music: 'tempoPercent',
      musicSrc: 'wnetMathInMusic',
      musicEv: 'A',
      circles: { baseSounds: 4, changedSounds: 4 }
    },
    {
      id: 'g6-tp-50-down',
      grade: 'ו',
      strand: 'decimals',
      standard: 'PERCENT',
      skill: 'percent',
      baseBpm: 120,
      percentChange: -50,
      kind: 'new_tempo',
      prompt: 'קצב בסיס של 120 BPM ירד ב־50%. מה הקצב החדש ב־BPM?',
      answer: 60,
      hint: '50% מ־120 הם 60 (חצי מ־120). 120 − 60 = 60 BPM',
      level: 2,
      music: 'tempoPercent',
      musicSrc: 'wnetMathInMusic',
      musicEv: 'A',
      circles: { baseSounds: 4, changedSounds: 4 }
    },
    {
      id: 'g6-tp-pct-up-50',
      grade: 'ו',
      strand: 'decimals',
      standard: 'PERCENT',
      skill: 'percent',
      baseBpm: 60,
      newBpm: 90,
      percentChange: 50,
      kind: 'by_percent',
      prompt: 'הקצב עלה מ־60 ל־90 BPM. בכמה אחוזים עלה הקצב? (מספר בלבד)',
      answer: 50,
      hint: 'העלייה היא 30 מתוך 60, כלומר 50%',
      level: 3,
      music: 'tempoPercent',
      musicSrc: 'wnetMathInMusic',
      musicEv: 'A',
      circles: { baseSounds: 4, changedSounds: 4 }
    },
    {
      id: 'g6-tp-pct-down-25',
      grade: 'ו',
      strand: 'decimals',
      standard: 'PERCENT',
      skill: 'percent',
      baseBpm: 80,
      newBpm: 60,
      percentChange: -25,
      kind: 'by_percent',
      prompt: 'הקצב ירד מ־80 ל־60 BPM. בכמה אחוזים ירד הקצב? (מספר בלבד)',
      answer: 25,
      hint: 'הירידה היא 20 מתוך 80 (20/80 = 1/4), כלומר 25%',
      level: 3,
      music: 'tempoPercent',
      musicSrc: 'wnetMathInMusic',
      musicEv: 'A',
      circles: { baseSounds: 4, changedSounds: 4 }
    },
    {
      id: 'g6-tp-pct-down-10',
      grade: 'ו',
      strand: 'decimals',
      standard: 'PERCENT',
      skill: 'percent',
      baseBpm: 100,
      newBpm: 90,
      percentChange: -10,
      kind: 'by_percent',
      prompt: 'הקצב ירד מ־100 ל־90 BPM. בכמה אחוזים ירד הקצב? (מספר בלבד)',
      answer: 10,
      hint: 'הירידה היא 10 מתוך 100, כלומר 10%',
      level: 2,
      music: 'tempoPercent',
      musicSrc: 'wnetMathInMusic',
      musicEv: 'A',
      circles: { baseSounds: 4, changedSounds: 4 }
    }
  ];

  // End-of-topic no-music check item per #665 requirement
  const NO_MUSIC_CHECK_ITEM = {
    id: 'g6-tp-nomusic-check',
    grade: 'ו',
    strand: 'decimals',
    standard: 'PERCENT',
    skill: 'percent',
    prompt: 'קצב של 120 פעימות בדקה הואט ב־25%. מה הקצב החדש ב־BPM?',
    answer: 90,
    hint: '25% מ־120 הם 30. 120 פחות 30 הם 90.',
    level: 2,
    noMusic: true,
    plain: true,
    musicStage: 'no_music_check'
  };

  function renderTempoCirclesHtml(item) {
    if (!item) return '';
    const base = item.baseBpm || 100;
    const changed = item.kind === 'new_tempo' ? item.answer : (item.newBpm || Math.round(item.baseBpm * (1 + (item.percentChange || 0) / 100)));
    const count = (item.circles && item.circles.baseSounds) || 4;
    let baseDots = '', changedDots = '';
    for (let i = 0; i < count; i++) {
      baseDots += '<span class="tp-dot base-dot" data-beat="' + (i + 1) + '" title="פעמת בסיס"></span>';
      changedDots += '<span class="tp-dot changed-dot" data-beat="' + (i + 1) + '" title="פעמת שינוי"></span>';
    }
    return '<div class="tempo-circles-widget" dir="rtl" role="region" aria-label="המחשת קצב בעיגולים">'
      + '<div class="tp-row tp-base-row" aria-label="קצב בסיס ' + base + ' BPM">'
      + '<span class="tp-tag">בסיס (' + base + ' BPM):</span><div class="tp-dots">' + baseDots + '</div></div>'
      + '<div class="tp-row tp-changed-row" aria-label="קצב חדש ' + changed + ' BPM">'
      + '<span class="tp-tag">קצב חדש (' + changed + ' BPM):</span><div class="tp-dots">' + changedDots + '</div></div>'
      + '</div>';
  }

  function getTempoPercentItems() {
    return TEMPO_PERCENT_ITEMS.slice();
  }

  function getNoMusicCheck() {
    return Object.assign({}, NO_MUSIC_CHECK_ITEM);
  }

  return {
    TEMPO_PERCENT_ITEMS,
    NO_MUSIC_CHECK_ITEM,
    renderTempoCirclesHtml,
    getTempoPercentItems,
    getNoMusicCheck
  };
});
