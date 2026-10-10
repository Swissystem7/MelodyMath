// MelodyMath — כיתה ג׳: מוזיקה ומתמטיקה (issue #104, plan §5).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const M = (typeof module === 'object' && module.exports)
    ? require('./musicEngine')
    : (typeof musicEngine !== 'undefined' ? musicEngine : null);
  const adaptive = (typeof module === 'object' && module.exports)
    ? require('./adaptive')
    : null;

  const MIN_CELL = 44;
  const GAP = 8;
  const PAD = 16;

  function divideBeats(total, perBar) {
    const t = Math.round(Number(total));
    const b = Math.round(Number(perBar));
    if (!Number.isFinite(t) || !Number.isFinite(b) || b <= 0 || t < 0) return null;
    return { quotient: Math.floor(t / b), remainder: t % b };
  }

  function formatRemainderAnswer(quotient, remainder) {
    const q = Math.round(Number(quotient));
    const r = Math.round(Number(remainder));
    if (!Number.isFinite(q) || !Number.isFinite(r) || r < 0) return '';
    return q + ' שארית ' + r;
  }

  function parseRemainderTokens(raw) {
    const s = String(raw == null ? '' : raw).trim();
    const m = s.match(/^(\d+)\s+שארית\s+(\d+)$/i);
    if (!m) return null;
    return { quotient: Number(m[1]), remainder: Number(m[2]) };
  }

  function matchRemainderAnswer(given, expected) {
    const g = parseRemainderTokens(given);
    const e = parseRemainderTokens(expected);
    if (!g || !e) return false;
    return g.quotient === e.quotient && g.remainder === e.remainder;
  }

  function rectangleArea(rows, cols) {
    const r = Math.round(Number(rows));
    const c = Math.round(Number(cols));
    if (!Number.isFinite(r) || !Number.isFinite(c) || r <= 0 || c <= 0) return null;
    return r * c;
  }

  // At narrow widths, wrap step columns into multiple rows so cells stay ≥ minPx.
  function sequencerLayout(viewportWidth, stepCols, audioRows, gap, pad, minPx) {
    const vw = Math.round(Number(viewportWidth));
    const cols = Math.round(Number(stepCols));
    const rows = Math.round(Number(audioRows));
    const g = gap == null ? GAP : Number(gap);
    const p = pad == null ? PAD : Number(pad);
    const min = minPx == null ? MIN_CELL : Number(minPx);
    if (!Number.isFinite(vw) || !Number.isFinite(cols) || cols <= 0) return null;
    const inner = vw - 2 * p;
    for (let colsPerRow = cols; colsPerRow >= 1; colsPerRow--) {
      const cell = (inner - (colsPerRow - 1) * g) / colsPerRow;
      if (cell >= min) {
        const gridRows = Math.ceil(cols / colsPerRow) * (rows || 1);
        return { colsPerRow: colsPerRow, cellPx: cell, gridRows: gridRows };
      }
    }
    return null;
  }

  function tuneToSeconds(minutes, seconds) {
    const m = Math.round(Number(minutes));
    const s = Math.round(Number(seconds));
    if (!Number.isFinite(m) || !Number.isFinite(s) || m < 0 || s < 0 || s >= 60) return null;
    return m * 60 + s;
  }

  function higherHz(a, b) {
    const x = Number(a);
    const y = Number(b);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    if (x === y) return null;
    return x > y ? x : y;
  }

  function itemAnswerCorrect(item, given) {
    if (!item) return false;
    if (item.widget === 'g3remainder') return matchRemainderAnswer(given, item.answer);
    if (adaptive && typeof adaptive.isCorrect === 'function') return adaptive.isCorrect(given, item.answer);
    const g = String(given == null ? '' : given).trim().replace(/\s/g, '');
    const e = String(item.answer == null ? '' : item.answer).trim().replace(/\s/g, '');
    return g === e;
  }

  function quietMode() {
    if (typeof loadAccess !== 'function') return false;
    try { return !!loadAccess().quiet; } catch (err) { return false; }
  }

  function playAgainLabel() {
    return 'השמע שוב';
  }

  function bindAudioUnlock(root) {
    if (!root || root.__g3Unlock) return;
    root.__g3Unlock = true;
    root.addEventListener('pointerdown', function () {
      if (M && typeof M.unlockAudio === 'function') M.unlockAudio();
    }, { once: false });
  }

  function mutedFallbackHtml(desc) {
    return '<p class="g3-muted">' + (desc || 'המכשיר במצב שקט — קראו את התיאור למטה.') + '</p>';
  }

  function playTableMeter(cfg) {
    if (!M || quietMode()) return;
    const table = Math.round(Number(cfg.table)) || 3;
    const meter = cfg.meter === '6/8' ? '6/8' : '3/4';
    const highlight = Math.round(Number(cfg.highlight)) || table * 3;
    const bpm = 96;
    const beat = M.bpmToSeconds(bpm);
    const beatsPerBar = meter === '6/8' ? 6 : 3;
    const bars = 4;
    const events = [];
    let at = 0;
    for (let bar = 0; bar < bars; bar++) {
      for (let i = 0; i < beatsPerBar; i++) {
        const n = bar * beatsPerBar + i + 1;
        const accent = n % table === 0;
        const hz = accent ? 440 : 220;
        events.push({ at: at, dur: beat * 0.85, hz: hz, gain: accent ? 0.28 : 0.16 });
        at += beat;
      }
    }
    M.playPlanned(events);
    return highlight;
  }

  function playDivisionRemainder(cfg) {
    if (!M || quietMode()) return;
    const total = Math.round(Number(cfg.total)) || 14;
    const bar = Math.round(Number(cfg.bar)) || 4;
    const div = divideBeats(total, bar);
    if (!div) return;
    const bpm = 88;
    const beat = M.bpmToSeconds(bpm);
    let at = 0;
    const events = [];
    for (let i = 0; i < total; i++) {
      const inRemainder = i >= div.quotient * bar;
      events.push({
        at: at,
        dur: beat * 0.8,
        hz: inRemainder ? 330 : 220,
        gain: inRemainder ? 0.26 : 0.18,
        type: inRemainder ? 'triangle' : 'sine',
      });
      at += beat;
      if (!inRemainder && (i + 1) % bar === 0 && i < total - 1) at += beat * 0.35;
    }
    M.playPlanned(events);
  }

  function playTimesCompare(cfg) {
    if (!M || quietMode()) return;
    const kind = cfg.kind === 'tempo' ? 'tempo' : 'pitch';
    const factor = Math.round(Number(cfg.factor)) || 2;
    const base = Number(cfg.base) || 220;
    if (kind === 'pitch') {
      M.playPlanned([
        { at: 0, dur: 0.55, hz: base, gain: 0.22 },
        { at: 0.75, dur: 0.55, hz: base * factor, gain: 0.22 },
      ]);
    } else {
      const slow = M.bpmToSeconds(70);
      const fast = M.bpmToSeconds(70 * factor);
      const events = [];
      for (let i = 0; i < 4; i++) {
        events.push({ at: i * slow, dur: slow * 0.7, hz: 196, gain: 0.2 });
      }
      const t0 = 4 * slow + 0.2;
      for (let i = 0; i < 4; i++) {
        events.push({ at: t0 + i * fast, dur: fast * 0.7, hz: 262, gain: 0.2 });
      }
      M.playPlanned(events);
    }
  }

  function playSequencerGrid(cfg) {
    if (!M || quietMode()) return;
    const rows = Math.round(Number(cfg.rows)) || 4;
    const cols = Math.round(Number(cfg.cols)) || 8;
    const pattern = Array.isArray(cfg.on) ? cfg.on : null;
    const bpm = 100;
    const beat = M.bpmToSeconds(bpm) / 2;
    const events = [];
    let at = 0;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const on = pattern ? pattern[r * cols + c] : (r + c) % 3 === 0;
        if (on) {
          const hz = 220 + r * 55;
          events.push({ at: at, dur: beat * 0.75, hz: hz, gain: 0.2 });
        }
      }
      at += beat;
    }
    M.playPlanned(events);
  }

  function playTuneDuration(cfg) {
    if (!M || quietMode()) return;
    const sec = tuneToSeconds(cfg.min, cfg.sec);
    if (sec == null) return;
    const bpm = 120;
    const beat = M.bpmToSeconds(bpm);
    const events = [];
    let at = 0;
    const clicks = Math.min(24, Math.max(4, Math.round(sec / beat)));
    for (let i = 0; i < clicks; i++) {
      events.push({ at: at, dur: beat * 0.6, hz: i % 4 === 0 ? 262 : 196, gain: 0.18 });
      at += beat;
    }
    M.playPlanned(events);
  }

  function playHzPair(cfg) {
    if (!M || quietMode()) return;
    const a = Number(cfg.a);
    const b = Number(cfg.b);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return;
    M.playPlanned([
      { at: 0, dur: 0.6, hz: M.clampHz(a), gain: 0.22 },
      { at: 0.85, dur: 0.6, hz: M.clampHz(b), gain: 0.22 },
    ]);
  }

  function renderWidgetHtml(item) {
    const g = item && item.g3;
    if (!g) return '';
    const quiet = quietMode();
    const again = playAgainLabel();
    if (item.widget === 'g3table') {
      return '<div class="g3-widget g3-table" dir="ltr">'
        + '<p class="g3-read">משקל <bdi dir="ltr">' + (g.meter || '3/4') + '</bdi>'
        + ' · לוח <bdi dir="ltr">' + g.table + '</bdi> — הדגשה על כפולות.</p>'
        + (quiet ? mutedFallbackHtml('מקצב: כל ' + g.table + ' פעמות צליל גבוה יותר.') : '')
        + '<button type="button" class="g3-play">' + again + '</button>'
        + '<p class="g3-sr">' + (g.a11y || '') + '</p></div>';
    }
    if (item.widget === 'g3remainder') {
      const div = divideBeats(g.total, g.bar);
      const a11y = div
        ? (g.total + ' פעמות, קבוצות של ' + g.bar + ': ' + div.quotient + ' קבוצות ו-' + div.remainder + ' נשארו בצליל אחר.')
        : '';
      return '<div class="g3-widget g3-remainder" dir="ltr">'
        + '<p class="g3-read"><bdi dir="ltr">' + g.total + '</bdi> פעמות בתיבות של <bdi dir="ltr">' + g.bar + '</bdi></p>'
        + (quiet ? mutedFallbackHtml(a11y) : '')
        + '<button type="button" class="g3-play">' + again + '</button>'
        + '<p class="g3-sr">' + a11y + '</p></div>';
    }
    if (item.widget === 'g3times') {
      return '<div class="g3-widget g3-times" dir="ltr">'
        + '<p class="g3-read">' + (g.kind === 'tempo' ? 'שני טמפו — כמה פעמים מהיר השני?' : 'שני תדרים — כמה פעמים גבוה השני?') + '</p>'
        + (quiet ? mutedFallbackHtml('השוו בין שני הקטעים לפי התיאור.') : '')
        + '<button type="button" class="g3-play">' + again + '</button></div>';
    }
    if (item.widget === 'g3sequencer') {
      const lay = sequencerLayout(360, g.cols, g.rows);
      const cell = lay ? Math.floor(lay.cellPx) : MIN_CELL;
      const cpr = lay ? lay.colsPerRow : g.cols;
      let cells = '';
      const total = g.rows * g.cols;
      for (let i = 0; i < total; i++) {
        const on = i % 3 === 0;
        cells += '<button type="button" class="g3-cell' + (on ? ' on' : '') + '" data-i="' + i + '" style="width:' + cell + 'px;height:' + cell + 'px" aria-pressed="' + (on ? 'true' : 'false') + '" aria-label="תא ' + (i + 1) + '"></button>';
      }
      return '<div class="g3-widget g3-sequencer" dir="ltr" data-cols-per-row="' + cpr + '">'
        + '<p class="g3-read"><bdi dir="ltr">' + g.rows + '×' + g.cols + '</bdi> = שטח (מספר תאים)</p>'
        + '<div class="g3-grid" style="--g3-cell:' + cell + 'px;--g3-gap:' + GAP + 'px">' + cells + '</div>'
        + (quiet ? mutedFallbackHtml('רשת ' + g.rows + ' שורות על ' + g.cols + ' צעדים.') : '')
        + '<button type="button" class="g3-play">' + again + '</button></div>';
    }
    if (item.widget === 'g3tune') {
      return '<div class="g3-widget g3-tune" dir="ltr">'
        + '<p class="g3-read">מנגינה: <bdi dir="ltr">' + g.min + ':' + String(g.sec).padStart(2, '0') + '</bdi> — כמה שניות?</p>'
        + (quiet ? mutedFallbackHtml('המרו דקות ושניות לסך שניות.') : '')
        + '<button type="button" class="g3-play">' + again + '</button></div>';
    }
    if (item.widget === 'g3hz') {
      return '<div class="g3-widget g3-hz" dir="ltr">'
        + '<p class="g3-read">שמעו שני תדרים (Hz). איזה גבוה יותר?</p>'
        + (quiet ? mutedFallbackHtml('תדר א: ' + g.a + ' Hz, תדר ב: ' + g.b + ' Hz.') : '')
        + '<button type="button" class="g3-play">' + again + '</button></div>';
    }
    return '';
  }

  function bindGrade3Widget(host, item, fill) {
    if (!host || !item || !item.g3) return;
    bindAudioUnlock(host);
    host.classList.remove('hidden');
    host.innerHTML = renderWidgetHtml(item);
    const play = function () {
      if (M && typeof M.unlockAudio === 'function') M.unlockAudio();
      const g = item.g3;
      if (item.widget === 'g3table') playTableMeter(g);
      else if (item.widget === 'g3remainder') playDivisionRemainder(g);
      else if (item.widget === 'g3times') playTimesCompare(g);
      else if (item.widget === 'g3sequencer') playSequencerGrid(g);
      else if (item.widget === 'g3tune') playTuneDuration(g);
      else if (item.widget === 'g3hz') playHzPair(g);
    };
    host.querySelectorAll('.g3-play').forEach(function (btn) {
      btn.addEventListener('click', play);
    });
    if (item.widget === 'g3sequencer' && typeof fill === 'function') {
      const area = rectangleArea(item.g3.rows, item.g3.cols);
      if (area != null) fill(String(area));
    }
  }

  return {
    MIN_CELL, GAP, PAD,
    divideBeats, formatRemainderAnswer, parseRemainderTokens, matchRemainderAnswer,
    rectangleArea, sequencerLayout, tuneToSeconds, higherHz,
    itemAnswerCorrect, bindGrade3Widget, renderWidgetHtml,
    playTableMeter, playDivisionRemainder, playTimesCompare, playSequencerGrid,
    playTuneDuration, playHzPair,
  };
});
