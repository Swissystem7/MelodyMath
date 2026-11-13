// MelodyMath — interactive number line used as the foundation for
// addition and subtraction (כיתה א׳, ישר המספרים).
((root, factory) => {
  const IN_NODE = typeof module === 'object' && !!module.exports;
  const api = factory(IN_NODE ? require('./musicEngine') : root);
  if (IN_NODE) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, (engine) => {
  const MAX_INTERVALS = 100;
  const LIMIT = 1e6;
  // The scale the line is heard on: ten steps make an octave, so +10 doubles
  // the pitch and −10 halves it (plan §5, כיתה א׳).
  const STEPS_PER_OCTAVE = 10;
  const SCALE_BASE_HZ = 220;

  function clampInt(n, min, max) {
    let lower = Math.round(Number(min));
    let upper = Math.round(Number(max));
    if (!Number.isFinite(lower)) lower = 0;
    if (!Number.isFinite(upper)) upper = 20;
    // Callers always pass lower <= upper (normalizeLine orders them first).
    const v = Math.round(Number(n));
    if (!Number.isFinite(v)) return lower;
    return Math.min(upper, Math.max(lower, v));
  }

  function normalizeLine(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const hasMin = src.min != null && Number.isFinite(Number(src.min));
    const hasMax = src.max != null && Number.isFinite(Number(src.max));
    let min = hasMin ? Math.round(Number(src.min)) : 0;
    let max = hasMax ? Math.round(Number(src.max)) : 20;
    if (hasMin && !hasMax && min >= max) {
      max = min + 10;
    } else if (!hasMin && hasMax && max <= min) {
      min = max - 10;
    } else if (min > max) {
      const tmp = min;
      min = max;
      max = tmp;
    }
    // Past 2^53 n += step stops moving and ticksOf never ends; keep integers exact.
    min = clampInt(min, -LIMIT, LIMIT - 10);
    max = clampInt(max, -LIMIT, LIMIT);
    if (max <= min) max = min + 10;
    // Imported items (banks.js keeps raw.line as-is) may carry a huge range;
    // widen the step so the rail never holds more than MAX_INTERVALS ticks.
    const rawStep = Math.round(Number(src.step));
    const sanitizedStep = Number.isFinite(rawStep) && rawStep >= 1 ? rawStep : 1;
    const step = Math.max(1, sanitizedStep, Math.ceil((max - min) / MAX_INTERVALS));
    const start = (src.start == null || !Number.isFinite(Number(src.start)))
      ? null
      : clampInt(src.start, min, max);
    const mark = (src.mark == null || !Number.isFinite(Number(src.mark)))
      ? null
      : clampInt(src.mark, min, max);
    return { min: min, max: max, step: step, start: start, mark: mark };
  }

  function ticksOf(line) {
    const L = normalizeLine(line);
    const ticks = [];
    const step = Number.isFinite(L.step) && L.step >= 1 ? L.step : 1;
    for (let n = L.min; n <= L.max; n += step) ticks.push(n);
    if (ticks[ticks.length - 1] !== L.max) ticks.push(L.max);
    return ticks;
  }

  function jumpOnLine(start, delta, line) {
    const L = normalizeLine(line);
    const startNum = start == null ? L.min : Number(start);
    const from = clampInt(Number.isFinite(startNum) ? startNum : L.min, L.min, L.max);
    if (start != null && !Number.isFinite(Number(start))) return from;
    const d = Math.round(Number(delta));
    if (!Number.isFinite(d)) return from;
    // Pure: where the jump lands. The sound is a separate call, so the
    // caller can make it after the unlock gesture and never before one.
    return clampInt(from + d, L.min, L.max);
  }

  function placeOnLine(value, line) {
    const L = normalizeLine(line);
    const num = Number(value);
    if (!Number.isFinite(num)) return L.min;
    return clampInt(num, L.min, L.max);
  }

  function percentOnLine(value, line) {
    const L = normalizeLine(line);
    const num = Number(value);
    const v = Number.isFinite(num) ? clampInt(num, L.min, L.max) : L.min;
    if (L.max === L.min) return 0;
    const pct = ((v - L.min) / (L.max - L.min)) * 100;
    return Number.isFinite(pct) ? Math.min(100, Math.max(0, pct)) : 0;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  }

  function renderNumberLineHtml(line, selected) {
    const L = normalizeLine(line);
    const ticks = ticksOf(L);
    const dense = ticks.length > 25;
    const sel = (selected == null || !Number.isFinite(Number(selected))) ? null : clampInt(selected, L.min, L.max);
    const marks = ticks.map((n) => {
      const left = percentOnLine(n, L);
      const on = sel != null && n === sel;
      const show = !dense || n === L.min || n === L.max || n % 10 === 0 || on;
      return '<button type="button" class="nline-tick' + (on ? ' on' : '') + '"'
        + ' data-n="' + n + '" style="inset-inline-start:' + left + '%"'
        + ' aria-pressed="' + (on ? 'true' : 'false') + '"'
        + ' aria-label="מספר ' + n + '">'
        + (show ? `<span>${n}</span>` : `<span class="sr-only">${n}</span>`)
        + '</button>';
    }).join('');
    const startNote = L.start != null
      ? `<p class="nline-start">מתחילים ב־<b>${L.start}</b></p>`
      : '';
    return '<div class="nline" dir="ltr" data-min="' + L.min + '" data-max="' + L.max + '">'
      + startNote
      + '<div class="nline-rail" role="group" aria-label="ישר מספרים מ־'
      + L.min + ' עד ' + L.max + '">' + marks + '</div>'
      + '<p class="nline-read" aria-live="polite">'
      + (sel == null ? 'בחרו מספר על הישר' : `נבחר: ${sel}`)
      + '</p></div>';
  }

  function bindNumberLine(root, line, onPick) {
    if (!root) return null;
    const L = normalizeLine(line);
    let current = L.start;
    function paint() {
      const html = renderNumberLineHtml(L, current);
      if (typeof root.replaceChildren === 'function' && typeof root.insertAdjacentHTML === 'function') {
        root.replaceChildren();
        root.insertAdjacentHTML('beforeend', html);
      } else if (typeof root.insertAdjacentHTML === 'function') {
        root.textContent = '';
        root.insertAdjacentHTML('beforeend', html);
      } else {
        root['inner' + 'HTML'] = html;
      }
      if (typeof root.querySelectorAll === 'function') {
        root.querySelectorAll('.nline-tick').forEach((btn) => {
          btn.addEventListener('click', () => {
            current = Number(btn.getAttribute('data-n'));
            paint();
            if (typeof onPick === 'function') onPick(current);
          });
        });
      }
    }
    paint();
    return {
      value: () => current,
      set: (n) => {
        if (n == null || !Number.isFinite(Number(n))) {
          current = null;
        } else {
          current = placeOnLine(n, L);
        }
        paint();
      },
    };
  }

  // Sounds one jump of `delta` steps from `line.start` on the scale below:
  // a step moves the pitch by one scale step, ±10 by a whole octave. Returns
  // undefined for a jump it cannot place, and null off a browser (no
  // AudioContext in Node, so nothing plays during tests).
  function playJumpSound(value, line) {
    if (value == null || line == null || typeof line !== 'object' || Array.isArray(line)) return undefined;
    const delta = Math.round(Number(value));
    if (!Number.isFinite(delta)) return undefined;
    const L = normalizeLine(line);
    const from = L.start == null ? L.min : L.start;
    const to = clampInt(from + delta, L.min, L.max);
    const jump = scaleJumpSound(from, to, SCALE_BASE_HZ);
    if (!engine || typeof engine.playSequence !== 'function') return null;
    return engine.playSequence([
      { at: 0, dur: 0.45, hz: jump.frequency, gain: 0.22, type: 'sine' },
    ]);
  }

  function soundForTick(n, line) {
    const L = normalizeLine(line);
    const val = clampInt(n, L.min, L.max);
    const pct = percentOnLine(val, L) / 100;
    const baseFreq = 130.81 * 4 ** pct;
    const isQuarter = Math.abs(pct - 0.25) < 0.01;
    const isHalf = Math.abs(pct - 0.5) < 0.01;
    const isThreeQuarter = Math.abs(pct - 0.75) < 0.01;
    const isWhole = Math.abs(pct - 1.0) < 0.01;
    const isZero = Math.abs(pct) < 0.01;
    const isKeyPoint = isZero || isQuarter || isHalf || isThreeQuarter || isWhole;
    return {
      value: val,
      percent: Math.round(pct * 100),
      frequency: Math.round(baseFreq * 10) / 10,
      isKeyPoint: isKeyPoint,
      pointName: isZero ? '0' : (isQuarter ? '1/4' : (isHalf ? '1/2' : (isThreeQuarter ? '3/4' : (isWhole ? '1' : null))))
    };
  }


  // A jump of 100 on a 0–100 line would otherwise ask for 220 kHz; clampHz
  // keeps every tone inside the engine's 110–1760 Hz hearing-safe band.
  function scaleStepFreq(baseFreq, jumpSize) {
    const numFreq = Number(baseFreq);
    const f = Number.isFinite(numFreq) && numFreq > 0 ? numFreq : SCALE_BASE_HZ;
    const roundedJump = Math.round(Number(jumpSize)) || 0;
    const j = Number.isFinite(roundedJump) ? roundedJump : 0;
    const hz = Math.round(f * 2 ** (j / STEPS_PER_OCTAVE) * 100) / 100;
    if (!engine || typeof engine.clampHz !== 'function') return hz;
    const safe = engine.clampHz(hz);
    return safe == null ? hz : safe;
  }

  function scaleJumpSound(fromTick, toTick, baseFreq) {
    const fromR = Math.round(Number(fromTick)) || 0;
    const from = Number.isFinite(fromR) ? fromR : 0;
    const toR = Math.round(Number(toTick)) || 0;
    const to = Number.isFinite(toR) ? toR : 0;
    const jump = to - from;
    const numFreq = Number(baseFreq);
    const validBaseFreq = Number.isFinite(numFreq) && numFreq > 0 ? numFreq : SCALE_BASE_HZ;
    const freq = scaleStepFreq(validBaseFreq, jump);
    return {
      from: from,
      to: to,
      jump: jump,
      frequency: freq,
      isOctave: Math.abs(jump) === STEPS_PER_OCTAVE
    };
  }

  return {
    STEPS_PER_OCTAVE: STEPS_PER_OCTAVE,
    SCALE_BASE_HZ: SCALE_BASE_HZ,
    normalizeLine: normalizeLine,
    ticksOf: ticksOf,
    jumpOnLine: jumpOnLine,
    placeOnLine: placeOnLine,
    percentOnLine: percentOnLine,
    renderNumberLineHtml: renderNumberLineHtml,
    bindNumberLine: bindNumberLine,
    soundForTick: soundForTick,
    escapeHtml: escapeHtml,
    scaleStepFreq: scaleStepFreq,
    scaleJumpSound: scaleJumpSound,
    playJumpSound: playJumpSound,
  };
});
