// MelodyMath — Grade 6 Tempo Percents Module (Refs #690, Refs #665).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TEMPO_PERCENT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  // Tempo percent is a WEAK, optional EXTRA way (M8 has no evaluated study).
  // wnetMathInMusic (WNET "Get the Math") is where the activity comes from:
  // teaching material, not research, so no evidence is claimed for it.
  function it(id, baseBpm, pct, ans, kind, prompt, hint, lvl, newBpm) {
    const o = { id, grade: 'ו', strand: 'decimals', standard: 'PERCENT', skill: 'percent', baseBpm, percentChange: pct,
      kind, prompt, answer: ans, hint, level: lvl, music: 'tempoPercent', musicSrc: 'wnetMathInMusic', musicEv: 'A',
      musicOptional: true, musicEvidence: 'weak', circles: { baseSounds: 4, changedSounds: 4 } };
    if (newBpm != null) o.newBpm = newBpm;
    return o;
  }
  const TEMPO_PERCENT_ITEMS = [
    it('g6-tp-10-up', 100, 10, 110, 'new_tempo', 'קצב בסיס של 100 BPM עלה ב־10%. מה הקצב החדש ב־BPM?', '10% מ־100 הם 10. 100 + 10 = 110 BPM', 1),
    it('g6-tp-10-down', 100, -10, 90, 'new_tempo', 'קצב בסיס של 100 BPM ירד ב־10%. מה הקצב החדש ב־BPM?', '10% מ־100 הם 10. 100 − 10 = 90 BPM', 1),
    it('g6-tp-25-up', 80, 25, 100, 'new_tempo', 'קצב בסיס של 80 BPM עלה ב־25%. מה הקצב החדש ב־BPM?', '25% מ־80 הם 20 (רבע מ־80). 80 + 20 = 100 BPM', 2),
    it('g6-tp-25-down', 120, -25, 90, 'new_tempo', 'קצב בסיס של 120 BPM ירד ב־25%. מה הקצב החדש ב־BPM?', '25% מ־120 הם 30 (רבע מ־120). 120 − 30 = 90 BPM', 2),
    it('g6-tp-50-up', 80, 50, 120, 'new_tempo', 'קצב בסיס של 80 BPM עלה ב־50%. מה הקצב החדש ב־BPM?', '50% מ־80 הם 40 (חצי מ־80). 80 + 40 = 120 BPM', 2),
    it('g6-tp-50-down', 120, -50, 60, 'new_tempo', 'קצב בסיס של 120 BPM ירד ב־50%. מה הקצב החדש ב־BPM?', '50% מ־120 הם 60 (חצי מ־120). 120 − 60 = 60 BPM', 2),
    it('g6-tp-pct-up-50', 60, 50, 50, 'by_percent', 'הקצב עלה מ־60 ל־90 BPM. בכמה אחוזים עלה הקצב? (מספר בלבד)', 'העלייה היא 30 מתוך 60, כלומר 50%', 3, 90),
    it('g6-tp-pct-down-25', 80, -25, 25, 'by_percent', 'הקצב ירד מ־80 ל־60 BPM. בכמה אחוזים ירד הקצב? (מספר בלבד)', 'הירידה היא 20 מתוך 80 (20/80 = 1/4), כלומר 25%', 3, 60),
    it('g6-tp-pct-down-10', 100, -10, 10, 'by_percent', 'הקצב ירד מ־100 ל־90 BPM. בכמה אחוזים ירד הקצב? (מספר בלבד)', 'הירידה היא 10 מתוך 100, כלומר 10%', 2, 90)
  ];
  // Bridge from the main PERCENT way (M3, note lengths) to tempo: a shorter
  // note is a faster tempo.
  const BRIDGE_ITEM = { id: 'g6-tp-bridge-note', grade: 'ו', strand: 'decimals', standard: 'PERCENT', skill: 'percent',
    prompt: 'תו נמשך 10 עשיריות שנייה. מקצרים אותו ב־10%. כמה עשיריות שנייה הוא נמשך עכשיו?', answer: 9,
    hint: '10% מ־10 הם 1, ו־10 − 1 = 9. תו קצר יותר = קצב מהיר יותר; עכשיו עוברים לקצב ב־BPM.',
    level: 1, music: 'shortenByPercent', musicSrc: 'azaryahu2020', musicEv: 'A', stage: 'bridge' };
  const NO_MUSIC_CHECK_ITEM = { id: 'g6-tp-nomusic-check', grade: 'ו', strand: 'decimals', standard: 'PERCENT', skill: 'percent',
    prompt: 'קצב של 120 פעימות בדקה הואט ב־25%. מה הקצב החדש ב־BPM?', answer: 90, hint: '25% מ־120 הם 30. 120 פחות 30 הם 90.',
    level: 2, noMusic: true, plain: true, musicStage: 'no_music_check' };

  // The instrument is the child's pick from the shared picker in index.html
  // (an instruments.js id); its voice comes from the tap module, so the app
  // has one instrument list and one picker.
  function voiceFor(instrument) {
    let tm = globalThis.MM_TAP_TEMPO_MEAN;
    if (!tm) { try { tm = require('./tapTempoMean.js'); } catch (e) { tm = null; } }
    return tm ? tm.tapVoiceFor(instrument) : 'woodClick';
  }
  function changedBpm(item) {
    const base = item.baseBpm || 100;
    return item.kind === 'new_tempo' ? item.answer : (item.newBpm || Math.round(base * (1 + (item.percentChange || 0) / 100)));
  }

  // Sound times for a row. The circles play twice so even a 10% change drifts
  // far enough to hear, and the changed row sounds a fifth higher so the two
  // tempos stay apart when played together.
  const ROUNDS = 2, CHANGED_PITCH = 1.5;
  function tempoSchedule(item, row) {
    const n = ((item.circles && item.circles.baseSounds) || 4) * ROUNDS;
    const out = [];
    (row === 'both' ? ['base', 'changed'] : [row]).forEach(function (r) {
      const bpm = r === 'base' ? (item.baseBpm || 100) : changedBpm(item);
      for (let i = 0; i < n; i++) out.push({ row: r, t: i * 60 / bpm, pitch: r === 'base' ? 1 : CHANGED_PITCH });
    });
    return out;
  }

  function renderTempoCirclesHtml(item) {
    if (!item) return '';
    const base = item.baseBpm || 100, chg = changedBpm(item);
    const n = (item.circles && item.circles.baseSounds) || 4;
    let bDots = '', cDots = '';
    for (let i = 0; i < n; i++) {
      bDots += `<span class="tp-dot base-dot" data-beat="${i + 1}" title="פעמת בסיס"></span>`;
      cDots += `<span class="tp-dot changed-dot" data-beat="${i + 1}" title="פעמת שינוי"></span>`;
    }
    const btn = (act, label) => `<button type="button" class="choice tp-play-btn" data-act="${act}">${label}</button>`;
    return `<div class="tempo-circles-widget" dir="rtl" role="region" aria-label="המחשת קצב בעיגולים">` +
      `<div class="tp-row tp-base-row" aria-label="קצב בסיס ${base} BPM"><span class="tp-tag">בסיס (${base} BPM):</span><div class="tp-dots">${bDots}</div></div>` +
      `<div class="tp-row tp-changed-row" aria-label="קצב חדש ${chg} BPM"><span class="tp-tag">קצב חדש (${chg} BPM):</span><div class="tp-dots">${cDots}</div></div>` +
      `<div class="tp-play-row" style="margin-top:8px;">${btn('play-base', '🎵 בסיס')} ${btn('play-changed', '🎵 קצב חדש')} ${btn('play-both', '🎵 שניהם יחד')}</div></div>`;
  }

  // Default sound: instrumentVoices.playVoice on the page's shared AudioContext.
  function playOnPage(voice, pitch, when) {
    const g = globalThis, ac = typeof g.getSharedAudioContext === 'function' ? g.getSharedAudioContext() : null;
    if (!ac || typeof g.playVoice !== 'function') return null;
    const hz = g.VOICES && g.VOICES[voice] ? g.VOICES[voice].hz * pitch : undefined;
    return g.playVoice(ac, voice, hz, ac.currentTime + 0.05 + when);
  }

  // opts.instrument: the picked instrument id, or a function read on every
  // play. opts.play(voice, pitch, when) lets tests capture the sound.
  function mount(container, item, opts) {
    if (!container) return null;
    const o = opts || {}, play = o.play || playOnPage;
    container.innerHTML = renderTempoCirclesHtml(item);
    if (container.classList) container.classList.remove('hidden');
    const pick = () => (typeof o.instrument === 'function' ? o.instrument() : o.instrument) || null;
    function playRow(row) {
      const voice = voiceFor(pick()), plan = tempoSchedule(item, row);
      plan.forEach(function (s) { play(voice, s.pitch, s.t); });
      return { instrument: pick(), voice, plan };
    }
    const rows = { 'play-base': 'base', 'play-changed': 'changed', 'play-both': 'both' };
    if (container.querySelectorAll) {
      container.querySelectorAll('[data-act]').forEach(function (b) {
        const row = rows[b.getAttribute('data-act')];
        if (row) b.addEventListener('click', function () { playRow(row); });
      });
    }
    return { container, item, getInstrument: pick, play: playRow };
  }

  const getBridgeItem = () => Object.assign({}, BRIDGE_ITEM), getNoMusicCheck = () => Object.assign({}, NO_MUSIC_CHECK_ITEM);
  return { TEMPO_PERCENT_ITEMS, BRIDGE_ITEM, NO_MUSIC_CHECK_ITEM, renderTempoCirclesHtml, tempoSchedule, mount,
    getTempoPercentItems: () => TEMPO_PERCENT_ITEMS.slice(), getBridgeItem, getNoMusicCheck,
    getTempoPercentPath: () => [getBridgeItem()].concat(TEMPO_PERCENT_ITEMS, [getNoMusicCheck()]) };
});
