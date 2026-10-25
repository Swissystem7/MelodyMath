// MelodyMath — Grade 6 Tempo Percents Module (Refs #690, Refs #665).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TEMPO_PERCENT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const INSTRUMENTS = [
    { id: 'darbuka', he: 'דרבוקה', family: 'percussion', voice: 'drumLow' },
    { id: 'marimba', he: 'מרימבה', family: 'keys', voice: 'woodBar' },
    { id: 'recorder', he: 'חליל', family: 'winds', voice: 'breathy' },
    { id: 'guitar', he: 'גיטרה', family: 'strings', voice: 'pluck' }
  ];
  function it(id, baseBpm, pct, ans, kind, prompt, hint, lvl, newBpm) {
    const o = { id, grade: 'ו', strand: 'decimals', standard: 'PERCENT', skill: 'percent', baseBpm, percentChange: pct,
      kind, prompt, answer: ans, hint, level: lvl, music: 'tempoPercent', musicSrc: 'wnetMathInMusic', musicEv: 'A',
      circles: { baseSounds: 4, changedSounds: 4 } };
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
  const NO_MUSIC_CHECK_ITEM = { id: 'g6-tp-nomusic-check', grade: 'ו', strand: 'decimals', standard: 'PERCENT', skill: 'percent',
    prompt: 'קצב של 120 פעימות בדקה הואט ב־25%. מה הקצב החדש ב־BPM?', answer: 90, hint: '25% מ־120 הם 30. 120 פחות 30 הם 90.',
    level: 2, noMusic: true, plain: true, musicStage: 'no_music_check' };

  function renderTempoCirclesHtml(item, opts) {
    if (!item) return '';
    const base = item.baseBpm || 100, chg = item.kind === 'new_tempo' ? item.answer : (item.newBpm || Math.round(base * (1 + (item.percentChange || 0) / 100)));
    const inst = (opts && opts.instrument) || 'darbuka', cur = INSTRUMENTS.find(x => x.id === inst) || INSTRUMENTS[0];
    const n = (item.circles && item.circles.baseSounds) || 4;
    let bDots = '', cDots = '';
    for (let i = 0; i < n; i++) {
      bDots += `<span class="tp-dot base-dot" data-beat="${i + 1}" data-tap="${cur.voice}" title="פעמת בסיס"></span>`;
      cDots += `<span class="tp-dot changed-dot" data-beat="${i + 1}" data-tap="${cur.voice}" title="פעמת שינוי"></span>`;
    }
    const pills = INSTRUMENTS.map(x => `<button type="button" class="tp-inst-pill${x.id === cur.id ? ' active' : ''}" data-act="choose-instrument" data-instrument="${x.id}" data-tap="${x.voice}">${x.he}</button>`).join(' ');
    return `<div class="tempo-circles-widget" dir="rtl" role="region" aria-label="המחשת קצב בעיגולים" data-instrument="${cur.id}" data-voice="${cur.voice}">` +
      `<div class="tp-inst-picker" style="margin-bottom:8px;">כלי נגינה: ${pills}</div>` +
      `<div class="tp-row tp-base-row" aria-label="קצב בסיס ${base} BPM"><span class="tp-tag">בסיס (${base} BPM):</span><div class="tp-dots">${bDots}</div></div>` +
      `<div class="tp-row tp-changed-row" aria-label="קצב חדש ${chg} BPM"><span class="tp-tag">קצב חדש (${chg} BPM):</span><div class="tp-dots">${cDots}</div></div>` +
      `<button type="button" class="tp-play-btn" data-tap="${cur.voice}" data-instrument="${cur.id}" style="margin-top:8px;">🎵 נגן צליל כלי (${cur.he})</button></div>`;
  }

  function mount(container, item, opts) {
    if (!container) return null;
    let currentInst = (opts && opts.instrument) || 'darbuka';
    function update() {
      container.innerHTML = renderTempoCirclesHtml(item, { instrument: currentInst });
      if (container.classList) container.classList.remove('hidden');
    }
    update();
    function triggerSound(instId) {
      const target = INSTRUMENTS.find(x => x.id === (instId || currentInst)) || INSTRUMENTS[0];
      if (typeof globalThis.playInstrumentNote === 'function') globalThis.playInstrumentNote(target.id);
      else if (typeof globalThis.playTap === 'function') globalThis.playTap(target.voice);
      return { played: true, instrument: target.id, voice: target.voice };
    }
    return {
      container, item,
      getInstrument: () => currentInst,
      setInstrument: (id) => { currentInst = id; update(); return currentInst; },
      tap: (id) => triggerSound(id || currentInst)
    };
  }

  return { INSTRUMENTS, TEMPO_PERCENT_ITEMS, NO_MUSIC_CHECK_ITEM, renderTempoCirclesHtml, mount,
    getTempoPercentItems: () => TEMPO_PERCENT_ITEMS.slice(), getNoMusicCheck: () => Object.assign({}, NO_MUSIC_CHECK_ITEM) };
});
