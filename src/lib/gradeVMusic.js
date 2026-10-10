// MelodyMath — grade ו׳ music × math (issue #107, plan §5).
// Pure logic first; DOM binding only in bindGradeVMusic / mountGradeVMusicPage.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const M = (typeof module === 'object' && module.exports)
    ? require('./musicEngine')
    : (typeof globalThis !== 'undefined' ? globalThis : {});

  const CIRCLE_WIDTH = 320;
  const TAP_MIN = 44;
  const FIFTHS = 12;
  const DEG_PER_FIFTH = 30;

  function dottedNoteFraction(note) {
    const f = M.durationToFraction(note);
    return f ? M.fractionText(f) : '';
  }

  // How many divisor-length notes fit in a dividend (e.g. 1/2 ÷ 1/8 → 4).
  function durationDivisionCount(dividend, divisor) {
    const a = M.toFraction(dividend);
    const b = M.toFraction(divisor);
    if (!a || !b || b.n <= 0) return null;
    const q = M.makeFraction(a.n * b.d, a.d * b.n);
    if (!q || q.d !== 1 || q.n < 0) return null;
    return q.n;
  }

  function hzDecimalRatio(baseHz, ratio) {
    if (typeof baseHz !== 'number' || !Number.isFinite(baseHz) || baseHz <= 0) return null;
    if (typeof ratio !== 'number' || !Number.isFinite(ratio) || ratio <= 0) return null;
    return Math.round(baseHz * ratio * 100) / 100;
  }

  function tempoAfterPercent(bpm, pct) {
    return M.tempoChange(bpm, pct);
  }

  function meanBpm(samples) {
    if (!Array.isArray(samples) || samples.length < 1) return null;
    let sum = 0;
    let n = 0;
    samples.forEach(function (v) {
      const x = Number(v);
      if (Number.isFinite(x) && x > 0) { sum += x; n += 1; }
    });
    if (!n) return null;
    return Math.round(sum / n);
  }

  function bpmFromTapIntervals(msBetween) {
    if (!Array.isArray(msBetween) || !msBetween.length) return null;
    const bpms = [];
    msBetween.forEach(function (gap) {
      const g = Number(gap);
      if (Number.isFinite(g) && g > 0) bpms.push(60000 / g);
    });
    return meanBpm(bpms);
  }

  function circleFifthsLayout(width) {
    const w = typeof width === 'number' && width >= CIRCLE_WIDTH ? width : CIRCLE_WIDTH;
    const cx = w / 2;
    const cy = w / 2;
    const r = (w - TAP_MIN) / 2 - 8;
    const points = [];
    for (let i = 0; i < FIFTHS; i++) {
      const deg = -90 + i * DEG_PER_FIFTH;
      const rad = deg * Math.PI / 180;
      points.push({
        i: i,
        angle: i * DEG_PER_FIFTH,
        x: Math.round((cx + r * Math.cos(rad)) * 10) / 10,
        y: Math.round((cy + r * Math.sin(rad)) * 10) / 10,
      });
    }
    return { width: w, height: w, cx: cx, cy: cy, radius: r, points: points, tapMin: TAP_MIN };
  }

  function renderCircleOfFifthsHtml(layout) {
    const L = layout || circleFifthsLayout();
    const labels = ['דו', 'רה', 'מי', 'פה', 'סול', 'לה', 'סי', 'דו²', 'רה²', 'מי²', 'פה²', 'סול²'];
    let buttons = '';
    L.points.forEach(function (p) {
      const left = p.x - TAP_MIN / 2;
      const top = p.y - TAP_MIN / 2;
      buttons += '<button type="button" class="gv-fifth" data-i="' + p.i + '"'
        + ' style="left:' + left + 'px;top:' + top + 'px;width:' + TAP_MIN + 'px;height:' + TAP_MIN + 'px;"'
        + ' aria-label="קווינטה ' + (p.i + 1) + ' · ' + p.angle + '°">'
        + '<span dir="ltr">' + labels[p.i] + '</span></button>';
    });
    return '<div class="gv-circle-wrap" dir="ltr">'
      + '<svg class="gv-circle-svg" width="' + L.width + '" height="' + L.height + '" viewBox="0 0 ' + L.width + ' ' + L.height + '" role="img" aria-label="מעגל קווינטות, 12 נקודות, 30 מעלות בין נקודות">'
      + '<circle cx="' + L.cx + '" cy="' + L.cy + '" r="' + L.radius + '" fill="none" stroke="currentColor" stroke-width="2"/>'
      + '<text x="' + L.cx + '" y="' + (L.cy + 4) + '" text-anchor="middle" font-size="12">360° ÷ 12 = <tspan dir="ltr">30°</tspan></text>'
      + '</svg>'
      + '<div class="gv-fifths-layer" style="width:' + L.width + 'px;height:' + L.height + 'px;">' + buttons + '</div>'
      + '</div>';
  }

  function mathBdi(expr) {
    return '<bdi dir="ltr" class="math-isolate">' + expr + '</bdi>';
  }

  function renderGradeVMusicWidget(music) {
    const m = music && typeof music === 'object' ? music : {};
    if (m.kind === 'tempo') {
      const base = m.base || 80;
      const pct = m.pct != null ? m.pct : 25;
      const after = tempoAfterPercent(base, pct);
      return '<div class="gv-widget" data-gv="tempo" data-base="' + base + '" data-pct="' + pct + '">'
        + '<p>לפני: <bdi dir="ltr">' + base + ' BPM</bdi> · אחרי <bdi dir="ltr">+' + pct + '%</bdi>: '
        + '<bdi dir="ltr">' + after + ' BPM</bdi></p>'
        + '<button type="button" class="gv-play-before secondary">השמע לפני</button>'
        + '<button type="button" class="gv-play-after secondary">השמע אחרי</button>'
        + '<button type="button" class="gv-play-again secondary">השמע שוב</button>'
        + '<p class="gv-muted-note note hidden" aria-live="polite">אין צליל — הפעילו שמע במכשיר או נגעו במסך קודם.</p>'
        + '</div>';
    }
    if (m.kind === 'hz') {
      const base = m.base || 440;
      const ratio = m.ratio || 1.5;
      const hz = hzDecimalRatio(base, ratio);
      return '<div class="gv-widget" data-gv="hz" data-base="' + base + '" data-ratio="' + ratio + '">'
        + '<p>' + mathBdi(base + ' × ' + ratio + ' = ' + hz + ' Hz') + '</p>'
        + '<button type="button" class="gv-play-hz secondary">השמע ' + hz + ' Hz</button>'
        + '<button type="button" class="gv-play-again secondary">השמע שוב</button>'
        + '<p class="gv-muted-note note hidden" aria-live="polite">אין צליל — נגיעה במסך קודם.</p>'
        + '</div>';
    }
    return '';
  }

  let unlocked = false;

  function unlockAudio() {
    if (typeof window === 'undefined') return false;
    const play = typeof playFreq === 'function' ? playFreq : null;
    const ctxFn = typeof getAudioContext === 'function' ? getAudioContext : null;
    if (!ctxFn) return false;
    const ac = ctxFn();
    if (ac && ac.state === 'suspended') {
      try { ac.resume(); } catch (e) { /* autoplay */ }
    }
    unlocked = !!ac;
    return unlocked;
  }

  function showMutedNote(root) {
    if (!root) return;
    const note = root.querySelector('.gv-muted-note');
    if (note && !unlocked) note.classList.remove('hidden');
  }

  function playTempoDemo(root, bpm) {
    if (!unlockAudio()) { showMutedNote(root); return; }
    if (typeof playRhythmClicks !== 'function') return;
    playRhythmClicks([0.25, 0.25, 0.25, 0.25], bpm);
  }

  function playHzDemo(root, hz) {
    if (!unlockAudio()) { showMutedNote(root); return; }
    if (typeof playFreq === 'function') playFreq(hz);
  }

  function bindGradeVMusic(root, music) {
    if (!root) return null;
    root.innerHTML = renderGradeVMusicWidget(music);
    const wrap = root.querySelector('.gv-widget');
    if (!wrap) return {};
    wrap.addEventListener('pointerdown', function () { unlockAudio(); }, { once: true });
    const again = wrap.querySelector('.gv-play-again');
    if (again) {
      again.onclick = function () {
        if (wrap.dataset.gv === 'tempo') playTempoDemo(wrap, Number(wrap.dataset.base));
        if (wrap.dataset.gv === 'hz') {
          const hz = hzDecimalRatio(Number(wrap.dataset.base), Number(wrap.dataset.ratio));
          if (hz) playHzDemo(wrap, hz);
        }
      };
    }
    const before = wrap.querySelector('.gv-play-before');
    const after = wrap.querySelector('.gv-play-after');
    if (before) before.onclick = function () { playTempoDemo(wrap, Number(wrap.dataset.base)); };
    if (after) {
      after.onclick = function () {
        const b = Number(wrap.dataset.base);
        const p = Number(wrap.dataset.pct);
        const t = tempoAfterPercent(b, p);
        if (t) playTempoDemo(wrap, t);
      };
    }
    const hzBtn = wrap.querySelector('.gv-play-hz');
    if (hzBtn) {
      hzBtn.onclick = function () {
        const hz = hzDecimalRatio(Number(wrap.dataset.base), Number(wrap.dataset.ratio));
        if (hz) playHzDemo(wrap, hz);
      };
    }
    return {};
  }

  function mountGradeVMusicPage(root) {
    if (!root) return;
    root.querySelectorAll('[data-gv-panel]').forEach(function (panel) {
      panel.addEventListener('pointerdown', function () { unlockAudio(); }, { once: true });
    });
    const circleHost = root.querySelector('#gvCircle');
    if (circleHost) {
      circleHost.innerHTML = renderCircleOfFifthsHtml();
      circleHost.querySelectorAll('.gv-fifth').forEach(function (btn) {
      btn.onclick = function () {
        if (!unlockAudio()) return;
        if (typeof playFreq === 'function') playFreq(220 * Math.pow(2, Number(btn.dataset.i) / 12));
      };
      });
    }
    const tapBtn = root.querySelector('#gvTapTempo');
    const tapOut = root.querySelector('#gvTapOut');
    let taps = [];
    if (tapBtn && tapOut) {
      tapBtn.onclick = function () {
        unlockAudio();
        const now = Date.now();
        if (taps.length && now - taps[taps.length - 1] > 3000) taps = [];
        taps.push(now);
        if (taps.length > 5) taps.shift();
        if (taps.length < 2) {
          tapOut.textContent = 'נגעו עוד ' + (5 - taps.length) + ' פעמים לקצב קבוע…';
          if (typeof playClick === 'function') playClick(330);
          return;
        }
        const gaps = [];
        for (let i = 1; i < taps.length; i++) gaps.push(taps[i] - taps[i - 1]);
        if (taps.length >= 5) {
          const avg = bpmFromTapIntervals(gaps.slice(-4));
          tapOut.innerHTML = 'ארבעה מרווחים · ממוצע: <bdi dir="ltr">' + avg + ' BPM</bdi>';
          taps = [];
        } else {
          tapOut.textContent = 'נגעו עוד ' + (5 - taps.length) + ' פעמים…';
        }
        if (typeof playClick === 'function') playClick(330);
      };
    }
    root.querySelectorAll('.gv-demo-tempo').forEach(function (btn) {
      btn.onclick = function () {
        playTempoDemo(btn.closest('.gv-activity') || root, Number(btn.dataset.bpm));
      };
    });
  }

  return {
    CIRCLE_WIDTH: CIRCLE_WIDTH,
    TAP_MIN: TAP_MIN,
    FIFTHS: FIFTHS,
    DEG_PER_FIFTH: DEG_PER_FIFTH,
    dottedNoteFraction: dottedNoteFraction,
    durationDivisionCount: durationDivisionCount,
    hzDecimalRatio: hzDecimalRatio,
    tempoAfterPercent: tempoAfterPercent,
    meanBpm: meanBpm,
    bpmFromTapIntervals: bpmFromTapIntervals,
    circleFifthsLayout: circleFifthsLayout,
    renderCircleOfFifthsHtml: renderCircleOfFifthsHtml,
    renderGradeVMusicWidget: renderGradeVMusicWidget,
    unlockAudio: unlockAudio,
    bindGradeVMusic: bindGradeVMusic,
    mountGradeVMusicPage: mountGradeVMusicPage,
  };
});
