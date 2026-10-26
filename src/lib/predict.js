// MelodyMath — PredictThenPlay, "נחש ואז שמע" (#591, feature 26.10 1/5).
//
// Before the music reveals a result, the child commits to one of 3
// predictions. Brod 2020 (doi:10.1007/s10648-020-09571-9): prediction helps
// already in the lower primary grades; Brod, Hasselhorn & Bunge 2018
// (doi:10.1016/j.learninstruc.2018.01.013): the gain comes with the surprise
// of a wrong prediction. No new music method: the prediction is asked in the
// words of the item's own primary way (M1 count, M2 accents, M3 bar, M6
// pattern) and the reveal is that way, played by maybeHear. Weak or
// unevidenced ways get no prediction step.
//
// At most one item in 3 gets a prediction (a rule of thumb against fatigue,
// not a research finding). A wrong prediction costs nothing: the score is
// untouched and predictionAccuracy is kept apart, per topic.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_PREDICT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const EVERY = 3;
  const STORAGE_KEY = 'mm.predict.v1';
  const OPTION_HZ = [392.0, 493.88, 587.33];
  const HIT_MOTIF = [523.25, 659.25, 783.99];
  const SURPRISE = [440.0, 466.16];
  const ASK = {
    M1: 'לפני שמקשיבים: בערך איפה תיעצר הספירה?',
    M2: 'לפני שמקשיבים: בערך על איזו פעמה מודגשת ננחת?',
    M3: 'לפני שמקשיבים: בערך כמה תמלא התיבה?',
    M6: 'לפני שמקשיבים: בערך מה יבוא הבא בדגם?',
  };
  const FILL_ASK = 'לפני שמקשיבים: התיבה תתמלא בדיוק, יחסר בה, או תעלה על גדותיה?';
  const FILL = [['short', 'יחסר'], ['exact', 'בדיוק'], ['over', 'תעלה על גדותיה']];

  // Items 3, 6, 9… of a run: never more than 1 in 3.
  function shouldPredict(index) { return Number(index) % EVERY === EVERY - 1; }

  function toNumber(a) {
    if (typeof a === 'number') return a;
    const s = String(a == null ? '' : a).trim();
    const f = s.match(/^(-?\d+)\/(\d+)$/);
    if (f) return Number(f[2]) ? Number(f[1]) / Number(f[2]) : NaN;
    return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
  }
  const fmt = function (n) { return String(+n.toFixed(6)); };
  function hash(s) { let h = 0; String(s).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) | 0; }); return Math.abs(h); }

  // The prediction for an item, or null. `mechanismOf` is banks.mechanismOf.
  function build(item, mechanismOf) {
    if (!item || item.noMusic || !item.music || typeof mechanismOf !== 'function') return null;
    const mech = mechanismOf(item.music);
    if (!ASK[mech]) return null;
    const v = toNumber(item.answer);
    if (!isFinite(v)) return null;
    if (mech === 'M3' && !Number.isInteger(v) && v > 0 && v <= 2) {
      const truth = v < 1 ? 'short' : v > 1 ? 'over' : 'exact';
      return { mechanism: mech, ask: FILL_ASK, truth: truth, options: FILL.map(function (o) { return { id: o[0], label: o[1] }; }) };
    }
    const r = ranges(v, hash(item.id || item.prompt));
    return { mechanism: mech, ask: ASK[mech], truth: r.truth, options: r.options };
  }

  // Three ranges (lower / between / higher) on a round grid. A bound is
  // always at least 2 steps from the answer, so no option names the exact
  // answer or pins it down. Which range holds the answer varies by item.
  function ranges(v, h) {
    const s = Math.max(1, Math.round(Math.abs(v) / 10));
    const up = function (k) { return Math.ceil((v + k * s) / s) * s; };
    const down = function (k) { return Math.floor((v - k * s) / s) * s; };
    const k = 2 + (h % 2), far = k + 3;
    const sets = {
      low: [up(k), up(far)],
      mid: [down(k), up(2 + ((h >> 1) % 2))],
      high: [down(far), down(k)],
    };
    // For a non-negative answer, "less than 0" is no real option.
    const ok = function (t) { return v < 0 || sets[t][0] >= 1; };
    const pref = ['low', 'mid', 'high'][h % 3];
    const truth = ok(pref) ? pref : ok('mid') ? 'mid' : 'low';
    const b = sets[truth].map(fmt);
    return {
      truth: truth,
      options: [
        { id: 'low', label: 'פחות מ-' + b[0] },
        { id: 'mid', label: 'בין ' + b[0] + ' ל-' + b[1] },
        { id: 'high', label: 'יותר מ-' + b[1] },
      ],
    };
  }

  // Lock first, play after. A locked prediction can never change.
  function start(item, mechanismOf) {
    const p = build(item, mechanismOf);
    return p ? { prediction: p, choice: null, locked: false, played: false, hit: null } : null;
  }
  function lock(state, optionId) {
    if (!state || state.locked) return false;
    if (!state.prediction.options.some(function (o) { return o.id === optionId; })) return false;
    state.choice = optionId;
    state.hit = optionId === state.prediction.truth;
    state.locked = true;
    return true;
  }
  // Runs `play` (the item's own way) only once the prediction is locked.
  function reveal(state, topic, play) {
    if (!state || !state.locked || state.played) return null;
    state.played = true;
    record(topic, state.hit);
    if (typeof play === 'function') play();
    return { hit: state.hit, truth: state.prediction.truth };
  }

  // predictionAccuracy per topic, apart from the score.
  let storageRef = null;
  function storage() {
    if (storageRef) return storageRef;
    try { if (typeof localStorage !== 'undefined') return localStorage; } catch (e) { /* private */ }
    return null;
  }
  function load() {
    const s = storage();
    try { const p = s && JSON.parse(s.getItem(STORAGE_KEY) || '{}'); return p && typeof p === 'object' ? p : {}; } catch (e) { return {}; }
  }
  function record(topic, hit) {
    const all = load(), k = String(topic || 'default');
    const t = all[k] || { n: 0, hits: 0 };
    t.n += 1; if (hit) t.hits += 1;
    all[k] = t;
    const s = storage();
    if (s) { try { s.setItem(STORAGE_KEY, JSON.stringify(all)); } catch (e) { /* full */ } }
    return t;
  }
  function predictionAccuracy(topic) {
    const t = load()[String(topic || 'default')] || { n: 0, hits: 0 };
    return { n: t.n, hits: t.hits, rate: t.n ? t.hits / t.n : null };
  }
  function setStorage(s) { storageRef = s; }
  function resetAll() { const s = storage(); if (s) { try { s.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ } } }

  // Plays notes on the child's instrument, the first one right now (well
  // under 50 ms from the tap). Silent when the quiet setting is on.
  function tones(notes, topic, ac) {
    const g = globalThis;
    if (g.audioState && g.audioState.muted) return null;
    if (typeof g.prefsNow === 'function' && g.prefsNow().quiet) return null;
    const ctx = ac || (typeof g.getSharedAudioContext === 'function' ? g.getSharedAudioContext() : null);
    if (!ctx || typeof g.playVoice !== 'function') return null;
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) { /* autoplay policy */ } }
    const st = g.MM_MASTERY_STREAK;
    const voice = st ? st.voiceFor(st.instrumentFor(topic)) : 'keys';
    const at = ctx.currentTime;
    notes.forEach(function (hz, i) { g.playVoice(ctx, voice, hz, at + i * 0.16); });
    return { at: at, voice: voice };
  }

  // The step cannot be skipped: until a prediction is locked, `gate.lock`
  // (answer box, check button) is disabled and `gate.hide` (the way's own
  // play button) is hidden. Both come back on lock.
  function hold(gate, on) {
    ((gate && gate.lock) || []).forEach(function (el) { if (el) el.disabled = on; });
    ((gate && gate.hide) || []).forEach(function (el) { if (el) el.classList.toggle('hidden', on); });
  }

  // Panel in `host` for item number `index`. Returns true when this item
  // gets a prediction (the caller then does not play the way itself);
  // `play` is the item's own way.
  function mount(host, item, topic, index, play, mechanismOf, gate) {
    if (!host) return false;
    const g = globalThis;
    const mo = mechanismOf || g.mechanismOf; // banks.js puts its api on the page
    const state = shouldPredict(index) ? start(item, mo) : null;
    host.classList.toggle('hidden', !state);
    host.innerHTML = state ? '<p></p><div class="choices" role="group" aria-label="ניבוי"></div><p role="status" aria-live="polite"></p>' : '';
    if (!state) return false;
    hold(gate, true);
    const doc = host.ownerDocument, q = host.firstChild, row = q.nextSibling, msg = row.nextSibling;
    q.textContent = state.prediction.ask;
    const btns = state.prediction.options.map(function (o, i) {
      const b = doc.createElement('button');
      b.type = 'button';
      b.textContent = o.label;
      b.addEventListener('pointerdown', function () { if (!state.locked) tones([OPTION_HZ[i]], topic); });
      b.addEventListener('click', function () {
        if (!lock(state, o.id)) return;
        btns.forEach(function (x, j) {
          x.disabled = true;
          if (state.prediction.options[j].id === state.prediction.truth) x.classList.add('picked-good');
        });
        if (!state.hit) b.classList.add('picked-bad');
        hold(gate, false);
        const first = gate && gate.lock && gate.lock[0];
        if (first && typeof first.focus === 'function') first.focus();
        msg.textContent = state.hit ? 'צדקתם! 🎵 עכשיו כתבו את התשובה.' : 'הפתעה! 🎵 הקשיבו, ואז פתרו כרגיל.';
        // Short cue first, then the way itself, so the two never overlap.
        tones(state.hit ? HIT_MOTIF : SURPRISE, topic);
        setTimeout(function () { reveal(state, topic, play); }, 600);
      });
      row.appendChild(b);
      return b;
    });
    if (typeof btns[0].focus === 'function') setTimeout(function () { btns[0].focus(); }, 0);
    return true;
  }

  return {
    EVERY: EVERY, OPTION_HZ: OPTION_HZ, shouldPredict: shouldPredict, build: build, start: start, lock: lock,
    ranges: ranges, reveal: reveal, record: record, predictionAccuracy: predictionAccuracy, setStorage: setStorage,
    resetAll: resetAll, tones: tones, mount: mount,
  };
});
