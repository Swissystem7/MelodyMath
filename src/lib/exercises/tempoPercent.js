// MelodyMath — Grade 6 Tempo Percents Module (Issue #690, Refs #665).
// Links percentage calculation to musical tempo (BPM) changes (+/-10%, 25%, 50%).
// Circles per sound: a fixed time window holds baseSounds beats at the base
// tempo and changedSounds at the new one (base 4, +25% gives 5), and the play
// button sounds both so the child hears it faster or slower. Ends with an
// unassisted no-music check. Tempo is mechanism M8, which has no supporting
// research (banks.MUSIC_MECHANISMS), so every item is optional extra practice
// with weak evidence, never the main way to learn percent.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TEMPO_PERCENT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const WEAK = Object.freeze({ optional: true, evidence: 'weak' });

  // T(id, base BPM, percent change, kind, level, beats in the window at base tempo)
  function T(id, base, pct, kind, level, n) {
    const d = Math.abs(base * pct / 100), nb = base + Math.sign(pct) * d, up = pct > 0;
    const verb = up ? 'עלה' : 'ירד', abs = Math.abs(pct);
    const it = { id: 'g6-tp-' + id, grade: 'ו', strand: 'decimals', standard: 'PERCENT', skill: 'percent',
      baseBpm: base, percentChange: pct, kind: kind, level: level, widget: 'tempoPercent',
      music: 'tempoPercent', musicEv: 'weak', optional: WEAK.optional, evidence: WEAK.evidence,
      circles: { baseSounds: n, changedSounds: n * nb / base } };
    if (kind === 'new_tempo') {
      it.prompt = 'קצב בסיס של ' + base + ' BPM ' + verb + ' ב־' + abs + '%. מה הקצב החדש ב־BPM?';
      it.answer = nb;
      it.hint = abs + '% מ־' + base + ' הם ' + d + '. ' + base + (up ? ' + ' : ' − ') + d + ' = ' + nb + ' BPM';
    } else {
      it.newBpm = nb;
      it.prompt = 'הקצב ' + verb + ' מ־' + base + ' ל־' + nb + ' BPM. בכמה אחוזים ' + verb + ' הקצב? (מספר בלבד)';
      it.answer = abs;
      it.hint = (up ? 'העלייה' : 'הירידה') + ' היא ' + d + ' מתוך ' + base + ', כלומר ' + abs + '%';
    }
    return it;
  }

  // 9 items covering +/-10%, 25%, 50%, both "מה הקצב החדש?" and "בכמה אחוזים?".
  const TEMPO_PERCENT_ITEMS = [
    T('10-up', 100, 10, 'new_tempo', 1, 10), T('10-down', 100, -10, 'new_tempo', 1, 10),
    T('25-up', 80, 25, 'new_tempo', 2, 4), T('25-down', 120, -25, 'new_tempo', 2, 4),
    T('50-up', 80, 50, 'new_tempo', 2, 4), T('50-down', 120, -50, 'new_tempo', 2, 4),
    T('pct-up-50', 60, 50, 'by_percent', 3, 4), T('pct-down-25', 80, -25, 'by_percent', 3, 4),
    T('pct-down-10', 100, -10, 'by_percent', 2, 10)
  ];

  // End-of-topic no-music check item per #665 requirement
  const NO_MUSIC_CHECK_ITEM = { id: 'g6-tp-nomusic-check', grade: 'ו', strand: 'decimals', standard: 'PERCENT',
    skill: 'percent', prompt: 'קצב של 120 פעימות בדקה הואט ב־25%. מה הקצב החדש ב־BPM?', answer: 90,
    hint: '25% מ־120 הם 30. 120 פחות 30 הם 90.', level: 2, noMusic: true, plain: true, musicStage: 'no_music_check' };

  function changedBpm(item) { return item.kind === 'new_tempo' ? item.answer : item.newBpm; }

  // The child's instrument from the one shared store (#762) when it is loaded,
  // otherwise the families rotate per item: drum, string, wind, keyboard.
  function instrumentFor(item, data) {
    data = data || (typeof root.instrumentById === 'function' ? root : null);
    if (!data) return null;
    if (typeof MM_MY_INSTRUMENT !== 'undefined' && MM_MY_INSTRUMENT && typeof MM_MY_INSTRUMENT.getMyInstrument === 'function') {
      const mine = MM_MY_INSTRUMENT.getMyInstrument();
      const x = mine && data.instrumentById(mine.id || mine);
      if (x) return x;
    }
    const i = Math.max(0, TEMPO_PERCENT_ITEMS.findIndex(function (t) { return t.id === item.id; }));
    return data.byFamily(data.FAMILIES[i % data.FAMILIES.length])[0];
  }

  // Base row, then changed row, one note per circle at the real tempo.
  function tempoNotes(item, voice) {
    const notes = [], gap = 60 / item.baseBpm, gap2 = 60 / changedBpm(item), n = item.circles.baseSounds;
    for (let i = 0; i < n; i++) notes.push({ at: i * gap, voice: voice, hz: 392, row: 'base', beat: i });
    for (let i = 0; i < item.circles.changedSounds; i++) notes.push({ at: (n + 1) * gap + i * gap2, voice: voice, hz: 392, row: 'changed', beat: i });
    return notes;
  }

  function dots(kind, count) {
    let s = '';
    for (let i = 0; i < count; i++) s += '<span class="tp-dot ' + kind + '-dot" data-beat="' + (i + 1) + '" style="display:inline-block;width:16px;height:16px;margin:2px;border-radius:50%;background:#cfd8e3"></span>';
    return s;
  }

  function renderTempoCirclesHtml(item) {
    if (!item) return '';
    const base = item.baseBpm, changed = changedBpm(item), c = item.circles;
    return '<div class="tempo-circles-widget" dir="rtl" role="region" aria-label="המחשת קצב בעיגולים">'
      + '<button type="button" class="secondary tp-play">▶ השמיעו: בסיס ואז הקצב החדש</button> <span class="note">תרגול נוסף (רשות)</span>'
      + '<div class="tp-row tp-base-row" aria-label="קצב בסיס ' + base + ' BPM"><span class="tp-tag">בסיס (' + base + ' BPM):</span> ' + dots('base', c.baseSounds) + '</div>'
      + '<div class="tp-row tp-changed-row" aria-label="קצב חדש באותו זמן"><span class="tp-tag">קצב חדש, באותו זמן:</span> ' + dots('changed', c.changedSounds) + '</div>'
      + '</div>';
  }

  // Exercise-flow widget (index.html renderWidget): circles light up as each beat sounds.
  function bindTempoPercent(host, item) {
    host.innerHTML = renderTempoCirclesHtml(item);
    const btn = host.querySelector('.tp-play');
    if (!btn) return;
    btn.onclick = function () {
      const jam = root.MM_JAM, x = instrumentFor(item);
      if (!jam || !jam.playNotes) return;
      jam.playNotes(tempoNotes(item, x ? x.voice : 'woodClick'), function (n) {
        const d = host.querySelectorAll('.' + n.row + '-dot')[n.beat];
        if (!d) return;
        d.style.background = '#f5a623';
        setTimeout(function () { d.style.background = '#cfd8e3'; }, 150);
      });
    };
  }

  function getTempoPercentItems() { return TEMPO_PERCENT_ITEMS.slice(); }
  function getNoMusicCheck() { return Object.assign({}, NO_MUSIC_CHECK_ITEM); }
  // Optional extra items for the grade 6 percent practice pool, check last.
  function extraItems() { return getTempoPercentItems().concat([getNoMusicCheck()]); }

  return { TEMPO_PERCENT_ITEMS, NO_MUSIC_CHECK_ITEM, WEAK, renderTempoCirclesHtml, bindTempoPercent,
    instrumentFor, tempoNotes, getTempoPercentItems, getNoMusicCheck, extraItems };
});
